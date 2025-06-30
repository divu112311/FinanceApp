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
    console.log('=== GENERATE LEARNING CONTENT FUNCTION START ===')
    console.log('Edge function called with method:', req.method)
    
    const { userId, forceGenerate, queueSize = 15 } = await req.json()
    console.log('📥 REQUEST:', {
      userId: userId || 'MISSING',
      forceGenerate: forceGenerate || false,
      queueSize
    })

    if (!userId) {
      throw new Error('Missing required parameter: userId')
    }

    // Initialize Supabase client with service role key for full data access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      throw new Error('Supabase configuration not found')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    // Check if we should generate new content
    if (!forceGenerate) {
      // Check if user has enough content in queue
      const { data: queueData, error: queueError } = await supabaseClient
        .from('learning_content_queue')
        .select('queue_id')
        .eq('user_id', userId)
        .eq('is_deployed', false)
        .limit(1)
      
      if (!queueError && queueData && queueData.length > 0) {
        // Check if we need to deploy content from queue to modules
        const { data: moduleCount } = await supabaseClient
          .from('learning_modules')
          .select('id', { count: 'exact', head: true })
          .eq('content_data->generated_by', 'ai')
          .not('id', 'in', `(
            SELECT module_id FROM user_learning_progress 
            WHERE user_id = '${userId}' AND status = 'completed'
          )`)
        
        // If fewer than 5 modules available, deploy from queue
        if (moduleCount === 0) {
          console.log('Deploying content from queue to modules...')
          
          // Call the deploy_queued_content function
          const { data: deployResult } = await supabaseClient.rpc('deploy_queued_content', {
            user_id: userId,
            count: 5
          })
          
          console.log(`Deployed ${deployResult} modules from queue`)
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Deployed content from queue',
              deployed: deployResult,
              generated: false
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            },
          )
        }
        
        console.log('User has sufficient content in queue and modules')
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User has sufficient content',
            generated: false
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }

    console.log('🔍 FETCHING USER DATA...')

    // Get comprehensive user data from database
    const [userResult, goalsResult, accountsResult, transactionsResult, profileResult, xpResult, knowledgeResult, conceptsResult] = await Promise.all([
      supabaseClient.from('users').select('*').eq('id', userId).single(),
      supabaseClient.from('goals').select('*').eq('user_id', userId),
      supabaseClient.from('bank_accounts').select('*').eq('user_id', userId),
      supabaseClient.from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(100),
      supabaseClient.from('user_profiles').select('*').eq('user_id', userId).single(),
      supabaseClient.from('xp').select('*').eq('user_id', userId).single(),
      supabaseClient.from('user_knowledge_areas')
        .select('*, concept:concept_id(concept_name, concept_category, difficulty_level)')
        .eq('user_id', userId),
      supabaseClient.from('financial_concepts').select('*')
    ])

    const userData = userResult.data
    const goalsData = goalsResult.data || []
    const accountsData = accountsResult.data || []
    const transactionsData = transactionsResult.data || []
    const profileData = profileResult.data
    const xpData = xpResult.data
    const knowledgeData = knowledgeResult.data || []
    const conceptsData = conceptsResult.data || []

    console.log('📊 USER DATA FETCHED:', {
      user: userData?.first_name || userData?.full_name || 'Unknown',
      goals: goalsData.length,
      accounts: accountsData.length,
      transactions: transactionsData.length,
      experience: profileData?.financial_experience || 'Unknown',
      xp: xpData?.points || 0,
      knowledgeAreas: knowledgeData.length,
      concepts: conceptsData.length
    })

    // Calculate financial metrics
    const totalBalance = accountsData.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalGoalAmount = goalsData.reduce((sum, goal) => sum + (goal.target_amount || 0), 0)
    const totalSavedAmount = goalsData.reduce((sum, goal) => sum + (goal.saved_amount || goal.current_amount || 0), 0)
    const goalProgress = totalGoalAmount > 0 ? (totalSavedAmount / totalGoalAmount) * 100 : 0
    const level = Math.floor((xpData?.points || 0) / 100) + 1

    // Get user's knowledge level
    let userDifficultyLevel = 1
    let masteredConcepts = []
    let strugglingConcepts = []
    
    if (profileData?.learning_progression) {
      userDifficultyLevel = parseInt(profileData.learning_progression.current_difficulty || '1')
      masteredConcepts = profileData.learning_progression.mastered_concepts || []
      strugglingConcepts = profileData.learning_progression.struggling_concepts || []
    }
    
    // Map knowledge areas by concept
    const knowledgeByConceptId = {}
    knowledgeData.forEach(k => {
      knowledgeByConceptId[k.concept_id] = {
        proficiency: k.proficiency_level,
        confidence: k.confidence_score,
        timesEncountered: k.times_encountered,
        lastAssessed: k.last_assessed
      }
    })
    
    // Get concepts user needs to learn
    const conceptsToLearn = conceptsData
      .filter(c => {
        // Skip concepts user has mastered
        if (masteredConcepts.includes(c.concept_id)) return false
        
        // Prioritize struggling concepts
        if (strugglingConcepts.includes(c.concept_id)) return true
        
        // Filter by difficulty level (allow slightly higher than user's level)
        return c.difficulty_level <= userDifficultyLevel + 2
      })
      .sort((a, b) => {
        // Prioritize struggling concepts
        const aIsStruggling = strugglingConcepts.includes(a.concept_id)
        const bIsStruggling = strugglingConcepts.includes(b.concept_id)
        if (aIsStruggling && !bIsStruggling) return -1
        if (!aIsStruggling && bIsStruggling) return 1
        
        // Then sort by difficulty (appropriate for user's level first)
        const aDiffDelta = Math.abs(a.difficulty_level - userDifficultyLevel)
        const bDiffDelta = Math.abs(b.difficulty_level - userDifficultyLevel)
        return aDiffDelta - bDiffDelta
      })
      .slice(0, 10) // Get top 10 concepts to focus on

    // Check for OpenRouter API key to generate personalized content
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
    console.log('🔑 API KEY STATUS:', {
      hasOpenRouterKey: !!openRouterKey,
      keyLength: openRouterKey?.length || 0
    })
    
    // Generate learning modules based on user data
    let modules = []
    
    if (openRouterKey) {
      console.log('🤖 GENERATING AI LEARNING CONTENT...')
      
      // Prepare user context for personalization
      const userContext = {
        name: userData?.first_name || userData?.full_name?.split(' ')[0] || 'User',
        experience: profileData?.financial_experience || 'Beginner',
        level: level,
        xp: xpData?.points || 0,
        difficultyLevel: userDifficultyLevel,
        goals: goalsData.map(g => ({
          name: g.name,
          target: g.target_amount,
          saved: g.saved_amount || g.current_amount || 0,
          progress: g.target_amount ? ((g.saved_amount || g.current_amount || 0) / g.target_amount) * 100 : 0,
          category: g.category || g.goal_type
        })),
        accounts: {
          count: accountsData.length,
          types: [...new Set(accountsData.map(a => a.type))],
          totalBalance: totalBalance
        },
        transactions: {
          count: transactionsData.length,
          categories: [...new Set(transactionsData.map(t => t.category).filter(Boolean))]
        },
        interests: profileData?.interests || [],
        knowledgeAreas: knowledgeData.map(k => ({
          concept: k.concept.concept_name,
          category: k.concept.concept_category,
          proficiency: k.proficiency_level,
          confidence: k.confidence_score
        })),
        conceptsToLearn: conceptsToLearn.map(c => ({
          id: c.concept_id,
          name: c.concept_name,
          category: c.concept_category,
          difficulty: c.difficulty_level,
          currentProficiency: knowledgeByConceptId[c.concept_id]?.proficiency || 0
        })),
        masteredConcepts: masteredConcepts.length,
        strugglingConcepts: strugglingConcepts.map(id => {
          const concept = conceptsData.find(c => c.concept_id === id)
          return concept ? concept.concept_name : id
        })
      }
      
      const prompt = `Generate a personalized learning path for a user with the following financial profile:

USER CONTEXT:
${JSON.stringify(userContext, null, 2)}

Create ${queueSize} learning modules that would be most beneficial for this user based on their financial situation, experience level, goals, and current knowledge level.

Each module should include:
1. Title
2. Description
3. Content type (article, quiz, video, interactive)
4. Difficulty level (Beginner, Intermediate, Advanced)
5. Category (e.g., Budgeting, Investing, Savings, etc.)
6. Duration in minutes
7. XP reward for completion
8. Target concepts (list of concept IDs from conceptsToLearn that this module addresses)
9. For articles: 3-4 sections with titles and content
10. For quizzes: 5 multiple-choice questions with options, correct answers, and explanations

IMPORTANT KNOWLEDGE TRACKING GUIDELINES:
1. Focus on concepts the user needs to learn (from conceptsToLearn)
2. For struggling concepts, create remedial content that explains fundamentals
3. Gradually increase difficulty based on user's current difficulty level (${userDifficultyLevel})
4. For concepts like "Debt-to-Income Ratio" that the user may not understand, include clear explanations
5. Each module should target 1-3 specific concepts from conceptsToLearn
6. Include knowledge prerequisites and expected knowledge gain

FORMAT YOUR RESPONSE AS A JSON ARRAY:
[
  {
    "title": "Module Title",
    "description": "Module description",
    "content_type": "article|quiz|video|interactive",
    "difficulty": "Beginner|Intermediate|Advanced",
    "category": "Category name",
    "duration_minutes": 15,
    "xp_reward": 30,
    "target_concepts": ["concept-id-1", "concept-id-2"],
    "knowledge_requirements": {
      "concept-id-1": 2,  // Minimum proficiency level needed (1-10)
      "concept-id-2": 1
    },
    "knowledge_gain": {
      "concept-id-1": 2,  // Expected proficiency gain
      "concept-id-2": 3
    },
    "content_data": {
      // For articles:
      "sections": [
        {"title": "Section Title", "content": "Section content..."}
      ],
      // For quizzes:
      "questions": [
        {
          "question_text": "Question?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_answer": "Option B",
          "explanation": "Explanation of why B is correct",
          "concept_id": "concept-id-1"  // Which concept this tests
        }
      ]
    }
  }
]

IMPORTANT GUIDELINES:
1. Make content practical and actionable
2. Tailor difficulty to the user's experience level and knowledge
3. Focus on their specific financial situation and goals
4. Include a mix of content types (articles, quizzes)
5. Make sure quiz questions have exactly 4 options
6. For concepts user is struggling with, provide more basic explanations
7. For debt-to-income ratio and other complex concepts, include clear definitions
8. Return ONLY the JSON array with no additional text`

      try {
        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://doughjo.app',
            'X-Title': 'DoughJo Learning Content Generator',
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.1-8b-instruct:free', // Free model with good performance
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 4000,
            temperature: 0.7,
            response_format: { type: "json_object" }
          }),
        })

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          const aiContent = aiData.choices[0]?.message?.content
          
          console.log('✅ AI LEARNING CONTENT GENERATED')
          console.log('AI response preview:', aiContent.substring(0, 200) + '...')
          
          try {
            // Parse the AI response
            let parsedModules
            
            // Handle different response formats
            if (typeof aiContent === 'string') {
              // Try to extract JSON from the string
              const jsonMatch = aiContent.match(/\[[\s\S]*\]/)
              if (jsonMatch) {
                parsedModules = JSON.parse(jsonMatch[0])
              } else {
                throw new Error('Could not extract JSON from AI response')
              }
            } else if (aiContent.modules) {
              // Some models return { modules: [...] }
              parsedModules = aiContent.modules
            } else {
              // Try to use the content directly
              parsedModules = aiContent
            }
            
            if (Array.isArray(parsedModules)) {
              // Add generated_by and generated_at to each module's content_data
              modules = parsedModules.map(module => ({
                ...module,
                content_data: {
                  ...module.content_data,
                  generated_by: 'ai',
                  generated_at: new Date().toISOString()
                }
              }))
            } else {
              throw new Error('AI response is not an array of modules')
            }
          } catch (parseError) {
            console.error('Error parsing AI modules:', parseError)
            console.log('Raw AI response:', aiContent)
            // Fall back to local generation
            modules = generateLocalModules(userContext, conceptsToLearn)
          }
        } else {
          const errorText = await aiResponse.text()
          console.error('Error generating AI modules:', errorText)
          // Fall back to local generation
          modules = generateLocalModules(userContext, conceptsToLearn)
        }
      } catch (aiError) {
        console.error('Error calling AI service:', aiError)
        // Fall back to local generation
        modules = generateLocalModules(userContext, conceptsToLearn)
      }
    } else {
      console.log('No OpenRouter API key, using local module generation')
      modules = generateLocalModules({
        name: userData?.first_name || userData?.full_name?.split(' ')[0] || 'User',
        experience: profileData?.financial_experience || 'Beginner',
        level: level,
        xp: xpData?.points || 0,
        difficultyLevel: userDifficultyLevel,
        goals: goalsData,
        accounts: accountsData,
        transactions: transactionsData,
        conceptsToLearn: conceptsToLearn
      }, conceptsToLearn)
    }

    // Generate content hashes for deduplication
    modules = modules.map(module => {
      // Create a hash based on title and content
      const contentString = module.title + JSON.stringify(module.content_data)
      const contentHash = hashString(contentString)
      
      return {
        ...module,
        content_hash: contentHash
      }
    })

    // Check for new users with no content
    const { data: existingModules } = await supabaseClient
      .from('learning_modules')
      .select('id')
      .eq('content_data->generated_by', 'ai')
      .limit(1)
    
    const isNewUser = !existingModules || existingModules.length === 0
    
    // For new users, initialize with default content
    if (isNewUser) {
      console.log('New user detected, initializing with default content')
      
      // Call the initialize_user_content function
      const { data: initResult } = await supabaseClient.rpc('initialize_user_content', {
        user_id: userId
      })
      
      console.log(`Initialized ${initResult} default modules for new user`)
    }

    // Store modules in content queue
    console.log('💾 STORING MODULES IN CONTENT QUEUE...')
    console.log(`Generated ${modules.length} modules`)
    
    // Check for existing content with same hashes
    const contentHashes = modules.map(m => m.content_hash)
    const { data: existingContent } = await supabaseClient
      .from('learning_content_history')
      .select('content_hash')
      .eq('user_id', userId)
      .in('content_hash', contentHashes)
    
    const existingHashes = new Set(existingContent?.map(c => c.content_hash) || [])
    
    // Filter out content user has already seen
    const newModules = modules.filter(m => !existingHashes.has(m.content_hash))
    console.log(`Filtered to ${newModules.length} new modules after deduplication`)
    
    if (newModules.length === 0) {
      console.log('No new content to add after deduplication')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No new content to add after deduplication',
          generated: true,
          count: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }
    
    const modulesToInsert = newModules.map(module => ({
      user_id: userId,
      title: module.title,
      description: module.description,
      content_type: module.content_type,
      difficulty: module.difficulty,
      category: module.category,
      duration_minutes: module.duration_minutes,
      xp_reward: module.xp_reward,
      content_data: module.content_data,
      content_hash: module.content_hash,
      target_concepts: module.target_concepts || [],
      knowledge_requirements: module.knowledge_requirements || {},
      knowledge_gain: module.knowledge_gain || {},
      priority: calculatePriority(module, userContext)
    }))
    
    const { data: insertedModules, error: insertError } = await supabaseClient
      .from('learning_content_queue')
      .insert(modulesToInsert)
      .select()
    
    if (insertError) {
      console.error('Error storing modules:', insertError)
      throw new Error(`Failed to store modules: ${insertError.message}`)
    }
    
    console.log(`✅ Successfully stored ${insertedModules.length} modules in queue`)
    
    // Update user profile with new refresh timestamp
    await supabaseClient
      .from('user_profiles')
      .update({ content_refresh_trigger: new Date().toISOString() })
      .eq('user_id', userId)
    
    // Deploy some modules from queue to active modules
    console.log('🚀 DEPLOYING MODULES FROM QUEUE...')
    
    const { data: deployResult } = await supabaseClient.rpc('deploy_queued_content', {
      user_id: userId,
      count: 5
    })
    
    console.log(`✅ Deployed ${deployResult} modules from queue`)
    console.log('=== GENERATE LEARNING CONTENT FUNCTION SUCCESS ===')

    return new Response(
      JSON.stringify({ 
        success: true, 
        modules: insertedModules,
        generated: true,
        count: insertedModules.length,
        deployed: deployResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('=== GENERATE LEARNING CONTENT FUNCTION FAILED ===')
    console.error('❌ ERROR DETAILS:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        debug: 'Failed to generate learning content',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Generate modules locally based on user context and concepts
function generateLocalModules(userContext: any, conceptsToLearn: any[]) {
  const modules = []
  const now = new Date().toISOString()
  const experience = userContext.experience || 'Beginner'
  const difficultyLevel = userContext.difficultyLevel || 1
  
  // Map difficulty level to module difficulty
  const mapDifficultyToLevel = (level: number) => {
    if (level <= 3) return 'Beginner'
    if (level <= 7) return 'Intermediate'
    return 'Advanced'
  }
  
  // Generate modules for each concept to learn
  conceptsToLearn.forEach((concept, index) => {
    // Skip after 15 modules
    if (modules.length >= 15) return
    
    const conceptId = concept.concept_id || concept.id
    const conceptName = concept.concept_name || concept.name
    const conceptCategory = concept.concept_category || concept.category
    const conceptDifficulty = concept.difficulty_level || concept.difficulty || 1
    
    // Determine module difficulty based on concept difficulty and user level
    const moduleDifficulty = mapDifficultyToLevel(conceptDifficulty)
    
    // Generate different content types
    const contentType = index % 3 === 0 ? 'quiz' : 'article'
    
    if (contentType === 'article') {
      modules.push({
        title: `Understanding ${conceptName}`,
        description: `Learn about ${conceptName.toLowerCase()} and how it applies to your financial journey.`,
        content_type: 'article',
        difficulty: moduleDifficulty,
        category: conceptCategory,
        duration_minutes: 15 + (conceptDifficulty * 2),
        xp_reward: 25 + (conceptDifficulty * 5),
        target_concepts: [conceptId],
        knowledge_requirements: { [conceptId]: Math.max(1, conceptDifficulty - 2) },
        knowledge_gain: { [conceptId]: 2 },
        content_data: {
          generated_by: 'ai',
          generated_at: now,
          sections: generateArticleSections(conceptName, conceptCategory, conceptDifficulty)
        }
      })
    } else {
      modules.push({
        title: `${conceptName} Quiz`,
        description: `Test your knowledge of ${conceptName.toLowerCase()} with this interactive quiz.`,
        content_type: 'quiz',
        difficulty: moduleDifficulty,
        category: conceptCategory,
        duration_minutes: 10,
        xp_reward: 30 + (conceptDifficulty * 5),
        target_concepts: [conceptId],
        knowledge_requirements: { [conceptId]: Math.max(1, conceptDifficulty - 1) },
        knowledge_gain: { [conceptId]: 3 },
        content_data: {
          generated_by: 'ai',
          generated_at: now,
          questions: generateQuizQuestions(conceptName, conceptCategory, conceptDifficulty, conceptId)
        }
      })
    }
  })
  
  // If we don't have enough modules, add some general ones
  if (modules.length < 5) {
    // Add budgeting module
    modules.push({
      title: "Smart Budgeting Strategies",
      description: "Learn practical budgeting methods that fit your lifestyle, including the 50/30/20 rule and zero-based budgeting techniques.",
      content_type: "article",
      difficulty: "Beginner",
      category: "Budgeting",
      duration_minutes: 15,
      xp_reward: 25,
      target_concepts: [],
      knowledge_requirements: {},
      knowledge_gain: {},
      content_data: {
        generated_by: "ai",
        generated_at: now,
        sections: [
          {
            title: "Understanding the 50/30/20 Rule",
            content: "The 50/30/20 rule is a simple budgeting method that allocates 50% of your income to needs, 30% to wants, and 20% to savings and debt repayment. This balanced approach ensures you're covering essentials while still enjoying life and building financial security."
          },
          {
            title: "Zero-Based Budgeting",
            content: "Zero-based budgeting means giving every dollar a purpose until your income minus expenses equals zero. This doesn't mean spending everything – it means allocating all income to categories including savings and investments."
          },
          {
            title: "Tracking Your Spending",
            content: "The foundation of any budget is tracking your spending. Use categories that make sense for your lifestyle and review your spending weekly to stay on track."
          }
        ]
      }
    })
    
    // Add emergency fund module
    modules.push({
      title: "Building an Emergency Fund",
      description: "Learn why emergency funds are crucial and how to build one that works for your situation.",
      content_type: "article",
      difficulty: "Beginner",
      category: "Savings",
      duration_minutes: 12,
      xp_reward: 20,
      target_concepts: [],
      knowledge_requirements: {},
      knowledge_gain: {},
      content_data: {
        generated_by: "ai",
        generated_at: now,
        sections: [
          {
            title: "Why You Need an Emergency Fund",
            content: "An emergency fund is your financial buffer against unexpected events like job loss, medical emergencies, or car repairs. Without this safety net, you're forced to rely on credit cards or loans, potentially creating a cycle of debt."
          },
          {
            title: "How Much to Save",
            content: "The general recommendation is 3-6 months of essential expenses. Start with a mini emergency fund of $1,000 while paying off high-interest debt, then build toward your full target."
          },
          {
            title: "Where to Keep Your Emergency Fund",
            content: "Your emergency fund should be liquid (easily accessible) but not too accessible (to avoid temptation). High-yield savings accounts are ideal - they offer better returns than traditional savings accounts while maintaining FDIC insurance and liquidity."
          }
        ]
      }
    })
  }
  
  return modules
}

// Generate article sections for a concept
function generateArticleSections(conceptName: string, category: string, difficulty: number) {
  // Default sections for different categories
  const sectionsByCategory = {
    'Budgeting': [
      {
        title: `What is ${conceptName}?`,
        content: `${conceptName} is a key budgeting concept that helps you manage your money more effectively. Understanding and applying this concept can significantly improve your financial health and help you reach your goals faster.`
      },
      {
        title: "How to Apply This to Your Budget",
        content: `To incorporate ${conceptName} into your budget, start by tracking your income and expenses. Then, analyze your spending patterns to identify areas where you can make adjustments. Remember that small changes can add up to significant improvements over time.`
      },
      {
        title: "Common Mistakes to Avoid",
        content: `When implementing ${conceptName}, many people make the mistake of being too restrictive or unrealistic. It's important to create a sustainable approach that you can maintain long-term, rather than an overly ambitious plan that you'll abandon after a few weeks.`
      },
      {
        title: "Next Steps and Implementation",
        content: `Now that you understand ${conceptName}, try implementing it in your own financial plan. Start small, track your progress, and adjust as needed. Remember that financial management is a journey, not a destination.`
      }
    ],
    'Investing': [
      {
        title: `Understanding ${conceptName}`,
        content: `${conceptName} is a fundamental investing concept that can significantly impact your long-term returns. Whether you're a beginner or experienced investor, mastering this concept will help you make more informed investment decisions.`
      },
      {
        title: "How It Affects Your Returns",
        content: `${conceptName} directly influences your investment performance by affecting risk, potential returns, and portfolio stability. Understanding this relationship helps you align your investment strategy with your financial goals and risk tolerance.`
      },
      {
        title: "Implementing This Strategy",
        content: `To apply ${conceptName} to your investment approach, consider your time horizon, risk tolerance, and financial goals. Different investment vehicles offer various ways to leverage this concept, from index funds to individual securities.`
      },
      {
        title: "Monitoring and Adjusting",
        content: `Once you've implemented ${conceptName}, regularly review your strategy to ensure it continues to serve your needs. Market conditions change, and your financial situation evolves, so periodic adjustments are essential for long-term success.`
      }
    ],
    'Debt Management': [
      {
        title: `What is ${conceptName}?`,
        content: `${conceptName} is a crucial concept in debt management that helps you understand and control your debt more effectively. Mastering this concept can save you money on interest and help you become debt-free faster.`
      },
      {
        title: "Calculating and Interpreting",
        content: `To calculate your ${conceptName.toLowerCase()}, you'll need to gather information about your debts and income. Once calculated, you can interpret this number to understand your current financial position and identify areas for improvement.`
      },
      {
        title: "Strategies for Improvement",
        content: `Improving your ${conceptName.toLowerCase()} typically involves either reducing debt, increasing income, or both. Consider debt consolidation, refinancing, or accelerated payment strategies depending on your specific situation.`
      },
      {
        title: "Monitoring Your Progress",
        content: `Track your ${conceptName.toLowerCase()} over time to ensure you're moving in the right direction. Set specific targets and celebrate milestones along the way to stay motivated on your debt reduction journey.`
      }
    ],
    'Credit': [
      {
        title: `Understanding ${conceptName}`,
        content: `${conceptName} is an important aspect of your credit profile that lenders evaluate when determining your creditworthiness. A solid understanding of this concept can help you build and maintain excellent credit.`
      },
      {
        title: "How It Affects Your Credit Score",
        content: `${conceptName} influences your credit score by [specific impact]. Lenders view this factor as an indicator of your financial responsibility and risk level as a borrower.`
      },
      {
        title: "Strategies for Optimization",
        content: `To optimize your ${conceptName.toLowerCase()}, consider implementing strategies such as [specific strategies]. These approaches can help you improve your credit profile over time.`
      },
      {
        title: "Common Misconceptions",
        content: `Many people misunderstand ${conceptName}, believing [common misconception]. In reality, [correct information]. Understanding these nuances can help you make better credit decisions.`
      }
    ],
    'Financial Planning': [
      {
        title: `The Importance of ${conceptName}`,
        content: `${conceptName} plays a vital role in comprehensive financial planning by helping you align your money decisions with your long-term goals. This concept bridges the gap between your current financial situation and your desired future.`
      },
      {
        title: "Incorporating This Into Your Plan",
        content: `To effectively use ${conceptName} in your financial plan, start by clarifying your goals and timeline. Then, evaluate your current position and develop specific strategies to implement this concept in your unique situation.`
      },
      {
        title: "Tools and Resources",
        content: `Several tools can help you apply ${conceptName} more effectively, from specialized calculators to budgeting apps. These resources simplify the process and provide valuable insights for decision-making.`
      },
      {
        title: "Adjusting for Life Changes",
        content: `As your life circumstances change, you'll need to revisit how you apply ${conceptName}. Major events like career changes, marriage, children, or retirement require reassessment and adjustment of your approach.`
      }
    ]
  }
  
  // Default for any category not specifically covered
  const defaultSections = [
    {
      title: `Understanding ${conceptName}`,
      content: `${conceptName} is an important financial concept that can significantly impact your financial health and decision-making. Taking the time to understand this concept will empower you to make better financial choices.`
    },
    {
      title: "Practical Applications",
      content: `There are several ways to apply ${conceptName} in your daily financial life. Consider how this concept relates to your specific situation and goals, and identify concrete steps you can take to implement it.`
    },
    {
      title: "Common Misconceptions",
      content: `Many people misunderstand ${conceptName}, which can lead to suboptimal financial decisions. By clarifying these misconceptions, you can avoid common pitfalls and make more informed choices.`
    },
    {
      title: "Next Steps",
      content: `Now that you understand ${conceptName}, consider how you'll incorporate this knowledge into your financial plan. Set specific, measurable goals related to this concept and track your progress over time.`
    }
  ]
  
  // Return appropriate sections based on category
  return sectionsByCategory[category] || defaultSections
}

// Generate quiz questions for a concept
function generateQuizQuestions(conceptName: string, category: string, difficulty: number, conceptId: string) {
  // Default questions for different categories
  const questionsByCategory = {
    'Budgeting': [
      {
        question_text: `What is the primary purpose of ${conceptName}?`,
        options: [
          "To increase your credit score",
          "To track and plan your spending",
          "To maximize investment returns",
          "To eliminate all debt immediately"
        ],
        correct_answer: "To track and plan your spending",
        explanation: `${conceptName} is primarily designed to help you understand, track, and plan your spending in alignment with your income and financial goals.`,
        concept_id: conceptId
      },
      {
        question_text: `Which of these is a key component of ${conceptName}?`,
        options: [
          "Stock market analysis",
          "Credit score monitoring",
          "Income and expense tracking",
          "Real estate valuation"
        ],
        correct_answer: "Income and expense tracking",
        explanation: `Tracking both income and expenses is essential to ${conceptName}, as it provides the foundation for understanding your cash flow and making informed financial decisions.`,
        concept_id: conceptId
      },
      {
        question_text: `How often should you review your ${conceptName.toLowerCase()}?`,
        options: [
          "Once a year",
          "Every 5 years",
          "Monthly",
          "Only when applying for loans"
        ],
        correct_answer: "Monthly",
        explanation: `Regular monthly reviews of your ${conceptName.toLowerCase()} allow you to track progress, identify issues early, and make necessary adjustments to stay on track with your financial goals.`,
        concept_id: conceptId
      },
      {
        question_text: `What is a common mistake when implementing ${conceptName}?`,
        options: [
          "Being too detailed with categories",
          "Making it too restrictive",
          "Reviewing it too frequently",
          "Focusing too much on saving"
        ],
        correct_answer: "Making it too restrictive",
        explanation: `Many people make their ${conceptName.toLowerCase()} too restrictive, which isn't sustainable long-term. A good approach should be realistic and include some flexibility for quality of life expenses.`,
        concept_id: conceptId
      },
      {
        question_text: `Which tool would be most helpful for ${conceptName}?`,
        options: [
          "Investment portfolio tracker",
          "Credit monitoring service",
          "Expense tracking app",
          "Retirement calculator"
        ],
        correct_answer: "Expense tracking app",
        explanation: `An expense tracking app helps you implement ${conceptName} by automatically categorizing transactions, visualizing spending patterns, and monitoring progress toward your budgeting goals.`,
        concept_id: conceptId
      }
    ],
    'Investing': [
      {
        question_text: `What is ${conceptName} in the context of investing?`,
        options: [
          "A type of retirement account",
          "A strategy for managing investment risk and return",
          "A government bond program",
          "A tax deduction for investors"
        ],
        correct_answer: "A strategy for managing investment risk and return",
        explanation: `${conceptName} refers to a strategy that helps investors manage the relationship between risk and potential returns in their investment portfolios.`,
        concept_id: conceptId
      },
      {
        question_text: `Which of these best demonstrates ${conceptName}?`,
        options: [
          "Putting all your money in a single stock",
          "Keeping all your savings in cash",
          "Spreading investments across different asset classes",
          "Frequently trading based on market news"
        ],
        correct_answer: "Spreading investments across different asset classes",
        explanation: `${conceptName} typically involves spreading investments across different assets to optimize the risk-return profile of your portfolio.`,
        concept_id: conceptId
      },
      {
        question_text: `How does ${conceptName} typically affect long-term investment returns?`,
        options: [
          "It guarantees specific returns",
          "It eliminates all investment risk",
          "It can help optimize the risk-return profile",
          "It focuses exclusively on short-term gains"
        ],
        correct_answer: "It can help optimize the risk-return profile",
        explanation: `${conceptName} doesn't eliminate risk or guarantee returns, but it helps investors optimize their risk-return profile based on their goals and risk tolerance.`,
        concept_id: conceptId
      },
      {
        question_text: `Which investor would likely benefit most from understanding ${conceptName}?`,
        options: [
          "Day traders only",
          "Only very wealthy investors",
          "All investors, regardless of experience level",
          "Only professional financial advisors"
        ],
        correct_answer: "All investors, regardless of experience level",
        explanation: `${conceptName} is a fundamental concept that benefits all investors, from beginners to experienced professionals, as it helps create more resilient investment strategies.`,
        concept_id: conceptId
      },
      {
        question_text: `What factor is most important when applying ${conceptName} to your investments?`,
        options: [
          "Your age",
          "Your income level",
          "Your financial goals and time horizon",
          "The current market conditions"
        ],
        correct_answer: "Your financial goals and time horizon",
        explanation: `When applying ${conceptName}, your specific financial goals and time horizon are most important, as they determine the appropriate level of risk and potential return for your situation.`,
        concept_id: conceptId
      }
    ],
    'Debt Management': [
      {
        question_text: `What is ${conceptName}?`,
        options: [
          "The total amount of debt you owe",
          "A ratio comparing your debt payments to your income",
          "A credit score factor",
          "A debt consolidation method"
        ],
        correct_answer: "A ratio comparing your debt payments to your income",
        explanation: `${conceptName} is a financial metric that compares your total monthly debt payments to your gross monthly income, expressed as a percentage.`,
        concept_id: conceptId
      },
      {
        question_text: `What is generally considered a good ${conceptName.toLowerCase()}?`,
        options: [
          "Below 36%",
          "50-60%",
          "70-80%",
          "Above 80%"
        ],
        correct_answer: "Below 36%",
        explanation: `Most financial experts recommend keeping your ${conceptName.toLowerCase()} below 36%, with housing costs not exceeding 28% of your gross monthly income.`,
        concept_id: conceptId
      },
      {
        question_text: `How can you improve your ${conceptName.toLowerCase()}?`,
        options: [
          "Taking on more debt",
          "Reducing your income",
          "Paying down debt or increasing income",
          "Closing old credit accounts"
        ],
        correct_answer: "Paying down debt or increasing income",
        explanation: `To improve your ${conceptName.toLowerCase()}, you can either reduce your debt (and thus your monthly payments) or increase your income, both of which will lower the ratio.`,
        concept_id: conceptId
      },
      {
        question_text: `Why do lenders care about your ${conceptName.toLowerCase()}?`,
        options: [
          "They don't; it's only important to borrowers",
          "It indicates how much more debt you can take on",
          "It shows your credit history length",
          "It helps predict your ability to repay new debt"
        ],
        correct_answer: "It helps predict your ability to repay new debt",
        explanation: `Lenders use ${conceptName} to assess your ability to take on and repay additional debt. A lower ratio suggests you have sufficient income relative to your existing debt obligations.`,
        concept_id: conceptId
      },
      {
        question_text: `Which debt is typically NOT included when calculating ${conceptName}?`,
        options: [
          "Mortgage payments",
          "Car loans",
          "Utility bills",
          "Credit card minimum payments"
        ],
        correct_answer: "Utility bills",
        explanation: `${conceptName} typically includes debt payments like mortgages, car loans, student loans, and credit card minimums, but not regular expenses like utility bills, groceries, or insurance premiums.`,
        concept_id: conceptId
      }
    ]
  }
  
  // Default questions for any category
  const defaultQuestions = [
    {
      question_text: `What is ${conceptName}?`,
      options: [
        "A type of investment account",
        "A financial planning concept",
        "A tax deduction strategy",
        "A banking regulation"
      ],
      correct_answer: "A financial planning concept",
      explanation: `${conceptName} is a financial planning concept that helps individuals make better decisions about their money and achieve their financial goals.`,
      concept_id: conceptId
    },
    {
      question_text: `Which of these best describes the purpose of ${conceptName}?`,
      options: [
        "To maximize short-term gains",
        "To improve financial decision-making",
        "To eliminate all financial risk",
        "To avoid paying taxes"
      ],
      correct_answer: "To improve financial decision-making",
      explanation: `The primary purpose of ${conceptName} is to help individuals make more informed and effective financial decisions aligned with their goals.`,
      concept_id: conceptId
    },
    {
      question_text: `How often should you review your approach to ${conceptName}?`,
      options: [
        "Never - set it and forget it",
        "Only when facing financial difficulties",
        "Regularly, at least annually",
        "Only when advised by a professional"
      ],
      correct_answer: "Regularly, at least annually",
      explanation: `Regular reviews of your approach to ${conceptName} are important as your financial situation, goals, and market conditions change over time.`,
      concept_id: conceptId
    },
    {
      question_text: `Which of these is NOT typically associated with ${conceptName}?`,
      options: [
        "Financial goal setting",
        "Risk management",
        "Day trading stocks",
        "Long-term planning"
      ],
      correct_answer: "Day trading stocks",
      explanation: `${conceptName} is generally associated with thoughtful financial planning rather than speculative activities like day trading stocks.`,
      concept_id: conceptId
    },
    {
      question_text: `Who can benefit from understanding ${conceptName}?`,
      options: [
        "Only high-income individuals",
        "Only people with investment experience",
        "Only those with financial difficulties",
        "Everyone, regardless of financial situation"
      ],
      correct_answer: "Everyone, regardless of financial situation",
      explanation: `${conceptName} is a universal financial concept that can benefit everyone, regardless of their income level, experience, or current financial situation.`,
      concept_id: conceptId
    }
  ]
  
  // Return appropriate questions based on category
  return questionsByCategory[category] || defaultQuestions
}

// Calculate priority for a module based on user context
function calculatePriority(module: any, userContext: any) {
  let priority = 5 // Default priority
  
  // Increase priority for struggling concepts
  if (module.target_concepts && userContext.strugglingConcepts) {
    const hasStrugglingConcept = module.target_concepts.some(conceptId => 
      userContext.strugglingConcepts.includes(conceptId)
    )
    if (hasStrugglingConcept) {
      priority += 3
    }
  }
  
  // Increase priority for appropriate difficulty level
  const userDifficultyLevel = userContext.difficultyLevel || 1
  const moduleDifficultyMap = {
    'Beginner': 1,
    'Intermediate': 5,
    'Advanced': 9
  }
  const moduleDifficultyLevel = moduleDifficultyMap[module.difficulty] || 1
  
  // Prioritize content that matches user's level
  const diffDelta = Math.abs(moduleDifficultyLevel - userDifficultyLevel)
  if (diffDelta <= 1) {
    priority += 2
  } else if (diffDelta <= 3) {
    priority += 1
  } else {
    priority -= 1
  }
  
  // Increase priority for quiz content (for knowledge assessment)
  if (module.content_type === 'quiz') {
    priority += 1
  }
  
  // Adjust based on user interests if available
  if (userContext.interests && userContext.interests.length > 0) {
    const matchesInterest = userContext.interests.some(interest =>
      module.category.toLowerCase().includes(interest.toLowerCase()) ||
      module.title.toLowerCase().includes(interest.toLowerCase())
    )
    if (matchesInterest) {
      priority += 2
    }
  }
  
  // Adjust based on user goals if available
  if (userContext.goals && userContext.goals.length > 0) {
    const matchesGoal = userContext.goals.some(goal =>
      module.category.toLowerCase().includes(goal.category?.toLowerCase() || '') ||
      module.title.toLowerCase().includes(goal.name?.toLowerCase() || '')
    )
    if (matchesGoal) {
      priority += 2
    }
  }
  
  return Math.max(1, Math.min(10, priority)) // Ensure priority is between 1-10
}

// Simple hash function for content deduplication
function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return hash.toString(16) // Convert to hex string
}