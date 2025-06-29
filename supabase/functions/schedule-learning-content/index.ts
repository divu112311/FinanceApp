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
    console.log('=== SCHEDULE LEARNING CONTENT FUNCTION START ===')
    console.log('Edge function called with method:', req.method)
    
    // This function can be triggered by a cron job or manually
    const { manualTrigger, specificUserId } = await req.json()
    
    console.log('📥 REQUEST:', {
      manualTrigger: manualTrigger || false,
      specificUserId: specificUserId || 'ALL_USERS'
    })

    // Initialize Supabase client with service role key for full data access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for admin access
    )

    // Find users who need new learning content
    console.log('🔍 FINDING USERS WHO NEED NEW CONTENT...')
    
    let usersQuery = supabaseClient
      .from('users')
      .select('id, email, first_name, full_name')
      .eq('is_active', true)
    
    if (specificUserId) {
      usersQuery = usersQuery.eq('id', specificUserId)
    }
    
    const { data: users, error: usersError } = await usersQuery
    
    if (usersError) {
      console.error('Error fetching users:', usersError)
      throw new Error(`Failed to fetch users: ${usersError.message}`)
    }
    
    console.log(`Found ${users.length} active users`)
    
    // Process each user
    const results = []
    
    for (const user of users) {
      console.log(`Processing user: ${user.id} (${user.email})`)
      
      try {
        // Check if user needs new content
        const needsNewContent = await checkIfUserNeedsNewContent(supabaseClient, user.id)
        
        if (needsNewContent || manualTrigger) {
          console.log(`Generating new content for user: ${user.id}`)
          
          // Call the generate-learning-content function
          const { data: generationResult, error: generationError } = await supabaseClient.functions.invoke('generate-learning-path', {
            body: { userId: user.id }
          })
          
          if (generationError) {
            console.error(`Error generating content for user ${user.id}:`, generationError)
            results.push({
              userId: user.id,
              success: false,
              error: generationError.message
            })
          } else {
            console.log(`Successfully generated content for user ${user.id}`)
            results.push({
              userId: user.id,
              success: true,
              modules: generationResult.modules.length,
              pathId: generationResult.path.path_id
            })
          }
        } else {
          console.log(`User ${user.id} does not need new content yet`)
          results.push({
            userId: user.id,
            success: true,
            skipped: true,
            reason: 'User has sufficient content'
          })
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        results.push({
          userId: user.id,
          success: false,
          error: error.message
        })
      }
    }
    
    console.log('=== SCHEDULE LEARNING CONTENT FUNCTION COMPLETE ===')
    console.log(`Processed ${users.length} users with ${results.filter(r => r.success && !r.skipped).length} content generations`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: users.length,
        generated: results.filter(r => r.success && !r.skipped).length,
        skipped: results.filter(r => r.skipped).length,
        failed: results.filter(r => !r.success).length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('=== SCHEDULE LEARNING CONTENT FUNCTION FAILED ===')
    console.error('❌ ERROR DETAILS:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        debug: 'Failed to schedule learning content',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Check if a user needs new learning content
async function checkIfUserNeedsNewContent(supabaseClient, userId) {
  // Check when the user last received new content
  const { data: latestPath, error: pathError } = await supabaseClient
    .from('learning_paths_new')
    .select('path_id, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (pathError) {
    console.error(`Error checking latest path for user ${userId}:`, pathError)
    return true // Generate content if we can't determine
  }
  
  // If no paths exist, user needs content
  if (!latestPath || latestPath.length === 0) {
    return true
  }
  
  // Check if the latest path is older than 7 days
  const latestPathDate = new Date(latestPath[0].created_at)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  if (latestPathDate < sevenDaysAgo) {
    return true
  }
  
  // Check if user has completed all modules in their current path
  const { data: pathModules, error: modulesError } = await supabaseClient
    .from('learning_path_modules')
    .select('module_id')
    .eq('path_id', latestPath[0].path_id)
  
  if (modulesError) {
    console.error(`Error fetching path modules for user ${userId}:`, modulesError)
    return false // Don't generate content if we can't determine
  }
  
  if (!pathModules || pathModules.length === 0) {
    return true // Generate content if path has no modules
  }
  
  const moduleIds = pathModules.map(pm => pm.module_id)
  
  // Check user progress on these modules
  const { data: progress, error: progressError } = await supabaseClient
    .from('user_learning_progress')
    .select('module_id, status')
    .eq('user_id', userId)
    .in('module_id', moduleIds)
  
  if (progressError) {
    console.error(`Error fetching learning progress for user ${userId}:`, progressError)
    return false
  }
  
  // If user has completed all modules, they need new content
  if (progress && progress.length === moduleIds.length) {
    const allCompleted = progress.every(p => p.status === 'completed')
    return allCompleted
  }
  
  // If user has started less than 75% of modules, they don't need new content yet
  if (progress) {
    const completionRate = progress.length / moduleIds.length
    return completionRate >= 0.75
  }
  
  return false
}