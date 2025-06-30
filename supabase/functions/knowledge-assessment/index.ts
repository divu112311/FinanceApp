import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('=== KNOWLEDGE ASSESSMENT FUNCTION START ===')
    console.log('Edge function called with method:', req.method)
    
    const { userId, quizResults, moduleId } = await req.json()
    console.log('📥 REQUEST:', {
      userId: userId || 'MISSING',
      moduleId: moduleId || 'MISSING',
      resultCount: quizResults?.length || 0
    })

    if (!userId || !quizResults || !moduleId) {
      throw new Error('Missing required parameters: userId, quizResults, moduleId')
    }

    // Initialize Supabase client with service role key for full data access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      throw new Error('Supabase configuration not found')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔍 FETCHING MODULE DATA...')

    // Get module data to access knowledge concepts
    const { data: moduleData, error: moduleError } = await supabaseClient
      .from('learning_modules')
      .select('*')
      .eq('id', moduleId)
      .single()
    
    if (moduleError) {
      throw new Error(`Failed to fetch module: ${moduleError.message}`)
    }
    
    if (!moduleData) {
      throw new Error('Module not found')
    }

    console.log('📊 PROCESSING QUIZ RESULTS...')
    
    // Extract concept IDs from questions
    const conceptResults = {}
    let totalCorrect = 0
    
    quizResults.forEach(result => {
      const { questionId, isCorrect, conceptId } = result
      
      if (conceptId) {
        if (!conceptResults[conceptId]) {
          conceptResults[conceptId] = {
            correct: 0,
            total: 0
          }
        }
        
        conceptResults[conceptId].total++
        if (isCorrect) {
          conceptResults[conceptId].correct++
          totalCorrect++
        }
      }
    })
    
    console.log('Concept results:', conceptResults)
    
    // Update user knowledge for each concept
    for (const [conceptId, results] of Object.entries(conceptResults)) {
      const proficiency = results.correct / results.total
      const isCorrect = proficiency >= 0.7 // Consider concept understood if 70%+ correct
      
      console.log(`Updating knowledge for concept ${conceptId}: ${isCorrect ? 'Correct' : 'Incorrect'} (${proficiency * 100}%)`)
      
      // Call the assess_user_knowledge function
      await supabaseClient.rpc('assess_user_knowledge', {
        user_id: userId,
        concept_id: conceptId,
        correct: isCorrect
      })
    }
    
    // Update user's learning progression
    await supabaseClient.rpc('update_learning_progression', {
      user_id: userId
    })
    
    // Mark module as completed
    const { data: progressData, error: progressError } = await supabaseClient
      .from('user_learning_progress')
      .upsert({
        user_id: userId,
        module_id: moduleId,
        status: 'completed',
        progress_percentage: 100,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (progressError) {
      throw new Error(`Failed to update progress: ${progressError.message}`)
    }
    
    // Add to learning content history
    await supabaseClient
      .from('learning_content_history')
      .insert({
        user_id: userId,
        module_id: moduleId,
        content_hash: moduleData.content_hash || '',
        completed_at: new Date().toISOString(),
        knowledge_gained: conceptResults,
        concepts_mastered: Object.entries(conceptResults)
          .filter(([_, results]) => results.correct / results.total >= 0.8)
          .map(([conceptId, _]) => conceptId)
      })
    
    // Calculate score and XP
    const score = Math.round((totalCorrect / quizResults.length) * 100)
    const baseXP = moduleData.xp_reward || 50
    const earnedXP = Math.round(baseXP * (score / 100))
    
    // Award XP
    await awardXP(supabaseClient, userId, earnedXP)
    
    // Check if user needs more content
    await checkContentQueue(supabaseClient, userId)
    
    console.log('=== KNOWLEDGE ASSESSMENT FUNCTION SUCCESS ===')

    return new Response(
      JSON.stringify({ 
        success: true, 
        score,
        xpEarned: earnedXP,
        conceptResults,
        progress: progressData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('=== KNOWLEDGE ASSESSMENT FUNCTION FAILED ===')
    console.error('❌ ERROR DETAILS:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        debug: 'Failed to process knowledge assessment',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Award XP to user
async function awardXP(supabaseClient, userId, points) {
  // Try to update user_xp table first (new schema)
  try {
    const { data: xpData, error: xpError } = await supabaseClient
      .from('user_xp')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    
    if (xpError) throw xpError
    
    if (xpData) {
      // Update existing XP record
      const newTotalXP = xpData.total_xp + points
      const newLevel = Math.floor(newTotalXP / 100) + 1
      const xpToNextLevel = (newLevel * 100) - newTotalXP
      
      const { error: updateError } = await supabaseClient
        .from('user_xp')
        .update({
          total_xp: newTotalXP,
          current_level: newLevel,
          xp_to_next_level: xpToNextLevel,
          last_xp_earned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
      
      if (updateError) throw updateError
    } else {
      // Create new XP record
      const { error: insertError } = await supabaseClient
        .from('user_xp')
        .insert({
          user_id: userId,
          total_xp: points,
          current_level: Math.floor(points / 100) + 1,
          xp_to_next_level: 100 - (points % 100),
          last_xp_earned_at: new Date().toISOString()
        })
      
      if (insertError) throw insertError
    }
    
    return true
  } catch (error) {
    console.error('Error updating user_xp, falling back to xp table:', error)
    
    // Fallback to original xp table
    try {
      const { data: xpData, error: xpError } = await supabaseClient
        .from('xp')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      
      if (xpError) throw xpError
      
      if (xpData) {
        // Update existing XP record
        const { error: updateError } = await supabaseClient
          .from('xp')
          .update({
            points: (xpData.points || 0) + points
          })
          .eq('user_id', userId)
        
        if (updateError) throw updateError
      } else {
        // Create new XP record
        const { error: insertError } = await supabaseClient
          .from('xp')
          .insert({
            user_id: userId,
            points: points,
            badges: []
          })
        
        if (insertError) throw insertError
      }
      
      return true
    } catch (fallbackError) {
      console.error('Error updating xp table:', fallbackError)
      return false
    }
  }
}

// Check if user needs more content in queue
async function checkContentQueue(supabaseClient, userId) {
  // Get user profile to check settings
  const { data: profileData } = await supabaseClient
    .from('user_profiles')
    .select('content_generation_settings')
    .eq('user_id', userId)
    .single()
  
  const settings = profileData?.content_generation_settings || {}
  const minQueueSize = settings.min_queue_size || 10
  
  // Count items in queue
  const { count: queueCount } = await supabaseClient
    .from('learning_content_queue')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_deployed', false)
  
  console.log(`User has ${queueCount} items in content queue (minimum: ${minQueueSize})`)
  
  // If queue is below minimum, trigger content generation
  if (queueCount < minQueueSize) {
    console.log('Queue below minimum, triggering content generation')
    
    // Call content generation function
    try {
      await supabaseClient.functions.invoke('generate-learning-content', {
        body: { 
          userId,
          forceGenerate: true,
          queueSize: 15
        }
      })
      
      console.log('Successfully triggered content generation')
    } catch (error) {
      console.error('Error triggering content generation:', error)
    }
  }
  
  // Check if we need to deploy more content
  const { count: moduleCount } = await supabaseClient
    .from('learning_modules')
    .select('id', { count: 'exact', head: true })
    .eq('content_data->generated_by', 'ai')
    .not('id', 'in', `(
      SELECT module_id FROM user_learning_progress 
      WHERE user_id = '${userId}' AND status = 'completed'
    )`)
  
  console.log(`User has ${moduleCount} active modules available`)
  
  // If fewer than 5 modules available, deploy from queue
  if (moduleCount < 5) {
    console.log('Fewer than 5 modules available, deploying from queue')
    
    // Call the deploy_queued_content function
    const { data: deployResult } = await supabaseClient.rpc('deploy_queued_content', {
      user_id: userId,
      count: 5
    })
    
    console.log(`Deployed ${deployResult} modules from queue`)
  }
}