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
    console.log('=== LEARNING PROGRESS FUNCTION START ===')
    console.log('Edge function called with method:', req.method)
    
    const { userId, moduleId, action, data } = await req.json()
    console.log('📥 REQUEST:', {
      userId: userId || 'MISSING',
      moduleId: moduleId || 'MISSING',
      action: action || 'MISSING',
      data: data || {}
    })

    if (!userId || !moduleId || !action) {
      throw new Error('Missing required parameters: userId, moduleId, action')
    }

    // Initialize Supabase client with service role key for full data access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for admin access
    )

    // Get module info
    const { data: moduleData, error: moduleError } = await supabaseClient
      .from('learning_modules')
      .select('*')
      .eq('id', moduleId)
      .single()
    
    if (moduleError) {
      throw new Error(`Module not found: ${moduleError.message}`)
    }

    let result = null

    // Handle different actions
    switch (action) {
      case 'start':
        result = await startModule(supabaseClient, userId, moduleId)
        break
      
      case 'update':
        if (!data || !data.progress_percentage) {
          throw new Error('Missing progress_percentage in data')
        }
        result = await updateProgress(supabaseClient, userId, moduleId, data.progress_percentage, data.time_spent_minutes || 0)
        break
      
      case 'complete':
        result = await completeModule(supabaseClient, userId, moduleId, data?.time_spent_minutes || 0)
        break
      
      case 'submit_quiz':
        if (!data || !data.answers || !Array.isArray(data.answers)) {
          throw new Error('Missing or invalid answers in data')
        }
        result = await submitQuiz(supabaseClient, userId, moduleId, moduleData, data.answers)
        break
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    console.log('=== LEARNING PROGRESS FUNCTION SUCCESS ===')
    console.log('Action completed:', action)

    return new Response(
      JSON.stringify({ 
        success: true, 
        result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('=== LEARNING PROGRESS FUNCTION FAILED ===')
    console.error('❌ ERROR DETAILS:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        debug: 'Failed to update learning progress',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Start a module
async function startModule(supabaseClient, userId, moduleId) {
  // Check if progress already exists
  const { data: existingProgress } = await supabaseClient
    .from('user_learning_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .maybeSingle()
  
  if (existingProgress) {
    // Update existing progress
    const { data, error } = await supabaseClient
      .from('user_learning_progress')
      .update({
        status: 'in_progress',
        last_accessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existingProgress.id)
      .select()
      .single()
    
    if (error) throw error
    
    // Record user action
    await recordUserAction(supabaseClient, userId, 'module_started', {
      module_id: moduleId,
      progress_id: data.id
    })
    
    return data
  } else {
    // Create new progress record
    const { data, error } = await supabaseClient
      .from('user_learning_progress')
      .insert({
        user_id: userId,
        module_id: moduleId,
        status: 'in_progress',
        progress_percentage: 0,
        time_spent_minutes: 0,
        started_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Record user action
    await recordUserAction(supabaseClient, userId, 'module_started', {
      module_id: moduleId,
      progress_id: data.id
    })
    
    return data
  }
}

// Update module progress
async function updateProgress(supabaseClient, userId, moduleId, progressPercentage, timeSpentMinutes) {
  // Get existing progress
  const { data: existingProgress } = await supabaseClient
    .from('user_learning_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .maybeSingle()
  
  if (existingProgress) {
    // Update existing progress
    const { data, error } = await supabaseClient
      .from('user_learning_progress')
      .update({
        status: progressPercentage >= 100 ? 'completed' : 'in_progress',
        progress_percentage: progressPercentage,
        time_spent_minutes: existingProgress.time_spent_minutes + timeSpentMinutes,
        completed_at: progressPercentage >= 100 ? new Date().toISOString() : null,
        last_accessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existingProgress.id)
      .select()
      .single()
    
    if (error) throw error
    
    // Record user action
    await recordUserAction(supabaseClient, userId, 'progress_updated', {
      module_id: moduleId,
      progress_id: data.id,
      progress_percentage: progressPercentage
    })
    
    return data
  } else {
    // Create new progress record
    const { data, error } = await supabaseClient
      .from('user_learning_progress')
      .insert({
        user_id: userId,
        module_id: moduleId,
        status: progressPercentage >= 100 ? 'completed' : 'in_progress',
        progress_percentage: progressPercentage,
        time_spent_minutes: timeSpentMinutes,
        started_at: new Date().toISOString(),
        completed_at: progressPercentage >= 100 ? new Date().toISOString() : null,
        last_accessed_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Record user action
    await recordUserAction(supabaseClient, userId, 'progress_updated', {
      module_id: moduleId,
      progress_id: data.id,
      progress_percentage: progressPercentage
    })
    
    return data
  }
}

// Complete a module
async function completeModule(supabaseClient, userId, moduleId, timeSpentMinutes) {
  // Get module info for XP reward
  const { data: module, error: moduleError } = await supabaseClient
    .from('learning_modules')
    .select('*')
    .eq('id', moduleId)
    .single()
  
  if (moduleError) throw moduleError
  
  // Get existing progress
  const { data: existingProgress } = await supabaseClient
    .from('user_learning_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('module_id', moduleId)
    .maybeSingle()
  
  // Update or create progress record
  let progressData
  
  if (existingProgress) {
    const { data, error } = await supabaseClient
      .from('user_learning_progress')
      .update({
        status: 'completed',
        progress_percentage: 100,
        time_spent_minutes: existingProgress.time_spent_minutes + timeSpentMinutes,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', existingProgress.id)
      .select()
      .single()
    
    if (error) throw error
    progressData = data
  } else {
    const { data, error } = await supabaseClient
      .from('user_learning_progress')
      .insert({
        user_id: userId,
        module_id: moduleId,
        status: 'completed',
        progress_percentage: 100,
        time_spent_minutes: timeSpentMinutes,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    progressData = data
  }
  
  // Award XP
  const xpEarned = module.xp_reward || 0
  
  if (xpEarned > 0) {
    await awardXP(supabaseClient, userId, xpEarned, 'module_completion')
  }
  
  // Record user action
  await recordUserAction(supabaseClient, userId, 'module_completed', {
    module_id: moduleId,
    progress_id: progressData.id,
    xp_earned: xpEarned
  })
  
  return {
    progress: progressData,
    xp_earned: xpEarned
  }
}

// Submit quiz answers
async function submitQuiz(supabaseClient, userId, moduleId, module, answers) {
  if (!module.content_data || !module.content_data.questions) {
    throw new Error('Module does not contain quiz questions')
  }
  
  const questions = module.content_data.questions
  
  if (answers.length !== questions.length) {
    throw new Error(`Expected ${questions.length} answers, got ${answers.length}`)
  }
  
  // Calculate score
  let correctCount = 0
  let totalPoints = 0
  
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i]
    const userAnswer = answers[i]
    
    if (userAnswer === question.correct_answer) {
      correctCount++
      totalPoints += question.points || 10
    }
  }
  
  const scorePercentage = Math.round((correctCount / questions.length) * 100)
  
  // Store quiz result
  const { data: quizResult, error: quizError } = await supabaseClient
    .from('quiz_results')
    .insert({
      user_id: userId,
      category: module.category,
      difficulty: module.difficulty,
      score: scorePercentage,
      correct_answers: correctCount,
      total_questions: questions.length,
      xp_earned: totalPoints
    })
    .select()
    .single()
  
  if (quizError) throw quizError
  
  // Complete the module
  const completionResult = await completeModule(supabaseClient, userId, moduleId, 0)
  
  // Award additional XP for quiz completion
  await awardXP(supabaseClient, userId, totalPoints, 'quiz_completion')
  
  return {
    quiz_result: quizResult,
    progress: completionResult.progress,
    xp_earned: totalPoints + completionResult.xp_earned
  }
}

// Award XP to user
async function awardXP(supabaseClient, userId, points, source) {
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

// Record user action
async function recordUserAction(supabaseClient, userId, actionType, actionData) {
  try {
    await supabaseClient
      .from('user_actions')
      .insert({
        user_id: userId,
        action_type: actionType,
        action_data: actionData,
        source: 'learning_progress_function'
      })
    
    return true
  } catch (error) {
    console.error('Error recording user action:', error)
    return false
  }
}