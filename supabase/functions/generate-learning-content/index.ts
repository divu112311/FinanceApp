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
    
    const { userId } = await req.json()
    console.log('📥 REQUEST:', {
      userId: userId || 'MISSING'
    })

    if (!userId) {
      throw new Error('Missing required parameter: userId')
    }

    // Initialize Supabase client with service role key for full data access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for admin access
    )

    console.log('🔍 FETCHING USER DATA...')

    // Get comprehensive user data from database
    const [userResult, goalsResult, accountsResult, transactionsResult, profileResult, progressResult] = await Promise.all([
      supabaseClient.from('users').select('*').eq('id', userId).single(),
      supabaseClient.from('goals').select('*').eq('user_id', userId),
      supabaseClient.from('bank_accounts').select('*').eq('user_id', userId),
      supabaseClient.from('transactions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false }),
      supabaseClient.from('user_profiles').select('*').eq('user_id', userId).single(),
      supabaseClient.from('user_learning_progress')
        .select('*, module:module_id(*)')
        .eq('user_id', userId)
        .order('last_accessed_at', { ascending: false })
    ])

    const userData = userResult.data
    const goalsData = goalsResult.data || []
    const accountsData = accountsResult.data || []
    const transactionsData = transactionsResult.data || []
    const profileData = profileResult.data
    const progressData = progressResult.data || []

    console.log('📊 USER DATA FETCHED:', {
      user: userData?.first_name || userData?.full_name || 'Unknown',
      goals: goalsData.length,
      accounts: accountsData.length,
      transactions: transactionsData.length,
      experience: profileData?.financial_experience || 'Unknown',
      learning_progress: progressData.length
    })

    // Analyze user's financial situation
    const financialSituation = analyzeFinancialSituation(accountsData, goalsData, transactionsData, profileData)
    console.log('Financial situation analysis:', financialSituation)

    // Determine learning needs based on financial situation and learning history
    const learningNeeds = determineLearningNeeds(financialSituation, progressData, profileData)
    console.log('Learning needs:', learningNeeds)

    // Generate learning modules based on needs
    const modules = generateLearningModules(learningNeeds, financialSituation, profileData)
    console.log(`Generated ${modules.length} learning modules`)

    // Store modules in database
    console.log('💾 STORING MODULES IN DATABASE...')
    
    const storedModules = []
    for (const module of modules) {
      try {
        const { data, error } = await supabaseClient
          .from('learning_modules')
          .insert({
            title: module.title,
            description: module.description,
            content_type: module.content_type,
            difficulty: module.difficulty,
            category: module.category,
            duration_minutes: module.duration_minutes,
            xp_reward: module.xp_reward,
            required_level: 1,
            content_data: {
              ...module.content_data,
              generated_by: 'ai',
              generated_at: new Date().toISOString()
            },
            is_active: true
          })
          .select()
          .single()
        
        if (error) {
          console.error('Error storing module:', error)
          continue
        }
        
        storedModules.push(data)
      } catch (error) {
        console.error('Error storing module:', error)
      }
    }
    
    console.log(`✅ Successfully stored ${storedModules.length} modules`)

    // Generate a learning path if needed
    if (storedModules.length >= 3) {
      try {
        console.log('Generating learning path...')
        
        const pathName = `${financialSituation.focus} Mastery Path`
        const pathDescription = `A personalized learning path focused on ${financialSituation.focus.toLowerCase()} for ${profileData?.financial_experience || 'beginner'} level users.`
        
        // Create the learning path
        const { data: pathData, error: pathError } = await supabaseClient
          .from('learning_paths_new')
          .insert({
            name: pathName,
            description: pathDescription,
            target_audience: profileData?.financial_experience || 'beginner',
            estimated_duration: storedModules.reduce((sum, module) => sum + module.duration_minutes, 0),
            is_featured: true
          })
          .select()
          .single()
        
        if (pathError) {
          console.error('Error creating learning path:', pathError)
        } else {
          console.log('Learning path created:', pathData)
          
          // Add modules to the path
          for (let i = 0; i < storedModules.length; i++) {
            await supabaseClient
              .from('learning_path_modules')
              .insert({
                path_id: pathData.path_id,
                module_id: storedModules[i].id,
                sequence_order: i + 1,
                is_required: i < 2 // First two modules are required
              })
          }
          
          console.log('Added modules to learning path')
        }
      } catch (pathError) {
        console.error('Error with learning path:', pathError)
      }
    }

    console.log('=== GENERATE LEARNING CONTENT FUNCTION SUCCESS ===')

    return new Response(
      JSON.stringify({ 
        success: true, 
        modules: storedModules,
        generated: true,
        count: storedModules.length
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

// Analyze the user's financial situation to determine learning needs
function analyzeFinancialSituation(accounts, goals, transactions, profile) {
  const situation = {
    hasAccounts: accounts.length > 0,
    hasGoals: goals.length > 0,
    hasTransactions: transactions.length > 0,
    experience: profile?.financial_experience || 'Beginner',
    focus: 'Budgeting', // Default focus
    strengths: [],
    weaknesses: []
  }
  
  // Calculate total balance
  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
  situation.totalBalance = totalBalance
  
  // Calculate goal progress
  if (situation.hasGoals) {
    const totalGoalAmount = goals.reduce((sum, goal) => sum + (goal.target_amount || 0), 0)
    const totalSavedAmount = goals.reduce((sum, goal) => sum + (goal.saved_amount || goal.current_amount || 0), 0)
    situation.goalProgress = totalGoalAmount > 0 ? (totalSavedAmount / totalGoalAmount) * 100 : 0
    
    // Check if any goals are emergency funds
    situation.hasEmergencyFund = goals.some(goal => 
      goal.name?.toLowerCase().includes('emergency') || 
      goal.category === 'emergency' || 
      goal.goal_type === 'emergency'
    )
  }
  
  // Analyze transactions if available
  if (situation.hasTransactions) {
    // Calculate income and spending
    const income = transactions
      .filter(t => t.amount < 0) // Negative amount means income in Plaid
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    
    const spending = transactions
      .filter(t => t.amount > 0) // Positive amount means spending in Plaid
      .reduce((sum, t) => sum + t.amount, 0)
    
    situation.income = income
    situation.spending = spending
    situation.savingsRate = income > 0 ? ((income - spending) / income) * 100 : 0
    
    // Analyze spending by category
    const spendingByCategory = {}
    transactions.forEach(transaction => {
      if (transaction.amount > 0) { // Spending only
        const category = transaction.category || 'Uncategorized'
        spendingByCategory[category] = (spendingByCategory[category] || 0) + transaction.amount
      }
    })
    situation.spendingByCategory = spendingByCategory
    
    // Find top spending category
    let topCategory = 'Uncategorized'
    let topAmount = 0
    for (const [category, amount] of Object.entries(spendingByCategory)) {
      if (amount > topAmount) {
        topCategory = category
        topAmount = amount
      }
    }
    situation.topSpendingCategory = topCategory
    situation.topSpendingAmount = topAmount
  }
  
  // Determine strengths and weaknesses
  
  // Check for emergency fund
  if (situation.hasEmergencyFund) {
    situation.strengths.push('emergency_fund')
  } else {
    situation.weaknesses.push('emergency_fund')
  }
  
  // Check savings rate
  if (situation.savingsRate >= 20) {
    situation.strengths.push('savings_rate')
  } else if (situation.savingsRate < 10) {
    situation.weaknesses.push('savings_rate')
  }
  
  // Check account diversity
  const accountTypes = new Set(accounts.map(acc => acc.type))
  if (accountTypes.size >= 2) {
    situation.strengths.push('account_diversity')
  } else {
    situation.weaknesses.push('account_diversity')
  }
  
  // Check goal setting
  if (situation.hasGoals) {
    situation.strengths.push('goal_setting')
  } else {
    situation.weaknesses.push('goal_setting')
  }
  
  // Determine focus area based on weaknesses
  if (situation.weaknesses.includes('emergency_fund')) {
    situation.focus = 'Emergency Fund'
  } else if (situation.weaknesses.includes('savings_rate')) {
    situation.focus = 'Saving'
  } else if (situation.weaknesses.includes('account_diversity')) {
    situation.focus = 'Banking'
  } else if (situation.weaknesses.includes('goal_setting')) {
    situation.focus = 'Goal Setting'
  } else if (situation.savingsRate >= 20 && totalBalance > 10000) {
    situation.focus = 'Investing'
  } else {
    situation.focus = 'Budgeting'
  }
  
  return situation
}

// Determine learning needs based on financial situation and learning history
function determineLearningNeeds(financialSituation, learningProgress, profile) {
  const needs = {
    topics: [],
    difficulty: financialSituation.experience,
    contentTypes: []
  }
  
  // Add focus area as primary topic
  needs.topics.push(financialSituation.focus)
  
  // Add topics based on weaknesses
  if (financialSituation.weaknesses.includes('emergency_fund')) {
    needs.topics.push('Emergency Fund')
  }
  if (financialSituation.weaknesses.includes('savings_rate')) {
    needs.topics.push('Saving Strategies')
  }
  if (financialSituation.weaknesses.includes('account_diversity')) {
    needs.topics.push('Banking Optimization')
  }
  if (financialSituation.weaknesses.includes('goal_setting')) {
    needs.topics.push('Financial Goal Setting')
  }
  
  // Add topics based on strengths to reinforce
  if (financialSituation.strengths.includes('savings_rate') && !needs.topics.includes('Investing')) {
    needs.topics.push('Investing')
  }
  
  // Determine preferred content types based on learning style
  const learningStyle = profile?.learning_style || 'Visual'
  if (learningStyle === 'Visual') {
    needs.contentTypes = ['video', 'interactive', 'article']
  } else if (learningStyle === 'Auditory') {
    needs.contentTypes = ['video', 'article', 'interactive']
  } else if (learningStyle === 'Reading') {
    needs.contentTypes = ['article', 'interactive', 'video']
  } else if (learningStyle === 'Kinesthetic') {
    needs.contentTypes = ['interactive', 'video', 'article']
  } else {
    needs.contentTypes = ['article', 'video', 'interactive']
  }
  
  // Always include quiz for assessment
  needs.contentTypes.push('quiz')
  
  // Check what content types the user has already engaged with
  const completedContentTypes = new Set()
  learningProgress.forEach(progress => {
    if (progress.status === 'completed' && progress.module?.content_type) {
      completedContentTypes.add(progress.module.content_type)
    }
  })
  
  // Prioritize content types the user hasn't completed yet
  needs.contentTypes.sort((a, b) => {
    const aCompleted = completedContentTypes.has(a)
    const bCompleted = completedContentTypes.has(b)
    if (aCompleted && !bCompleted) return 1
    if (!aCompleted && bCompleted) return -1
    return 0
  })
  
  return needs
}

// Generate learning modules based on needs
function generateLearningModules(learningNeeds, financialSituation, profile) {
  const modules = []
  const now = new Date().toISOString()
  
  // Generate a module for each topic, using different content types
  learningNeeds.topics.forEach((topic, index) => {
    // Use a different content type for each topic if possible
    const contentType = learningNeeds.contentTypes[index % learningNeeds.contentTypes.length]
    
    // Determine difficulty based on user experience and topic
    let difficulty = financialSituation.experience
    if (difficulty === 'Advanced' && (topic === 'Budgeting' || topic === 'Emergency Fund')) {
      difficulty = 'Intermediate' // Even advanced users might need refreshers on basics
    }
    if (difficulty === 'Beginner' && topic === 'Investing') {
      difficulty = 'Intermediate' // Investing is rarely a true beginner topic
    }
    
    // Generate module
    const module = {
      title: generateModuleTitle(topic, contentType),
      description: generateModuleDescription(topic, difficulty),
      content_type: contentType,
      difficulty: difficulty,
      category: topic,
      duration_minutes: generateDuration(contentType),
      xp_reward: generateXPReward(contentType, difficulty),
      content_data: generateContentData(topic, contentType, difficulty, financialSituation),
      created_at: now
    }
    
    modules.push(module)
  })
  
  // Always include a quiz module
  if (!modules.some(m => m.content_type === 'quiz')) {
    modules.push({
      title: `${financialSituation.focus} Mastery Quiz`,
      description: `Test your knowledge of ${financialSituation.focus.toLowerCase()} concepts and identify areas for further learning.`,
      content_type: 'quiz',
      difficulty: financialSituation.experience,
      category: financialSituation.focus,
      duration_minutes: 10,
      xp_reward: 50,
      content_data: {
        generated_by: 'ai',
        generated_at: now,
        questions: generateQuizQuestions(financialSituation.focus, financialSituation.experience)
      },
      created_at: now
    })
  }
  
  return modules
}

// Helper functions for module generation

function generateModuleTitle(topic, contentType) {
  const titles = {
    Budgeting: {
      article: "Smart Budgeting Strategies for Real Life",
      video: "Visual Guide to Effective Budgeting",
      interactive: "Interactive Budget Builder Workshop",
      quiz: "Budgeting Mastery Quiz"
    },
    "Emergency Fund": {
      article: "Building Your Financial Safety Net",
      video: "Emergency Fund Essentials: Visual Guide",
      interactive: "Emergency Fund Planning Workshop",
      quiz: "Emergency Fund Knowledge Check"
    },
    Saving: {
      article: "Saving Strategies That Actually Work",
      video: "Visual Guide to Accelerating Your Savings",
      interactive: "Interactive Savings Rate Optimizer",
      quiz: "Savings Strategy Mastery Quiz"
    },
    "Saving Strategies": {
      article: "Advanced Saving Techniques for Financial Freedom",
      video: "Visual Guide to Optimizing Your Savings Rate",
      interactive: "Interactive Savings Accelerator",
      quiz: "Savings Strategy Mastery Quiz"
    },
    Banking: {
      article: "Optimizing Your Banking Setup",
      video: "Visual Guide to Smart Banking",
      interactive: "Bank Account Optimizer Workshop",
      quiz: "Banking Optimization Quiz"
    },
    "Banking Optimization": {
      article: "Maximizing Your Banking Relationships",
      video: "Visual Guide to Advanced Banking Strategies",
      interactive: "Banking Efficiency Workshop",
      quiz: "Banking Mastery Quiz"
    },
    "Goal Setting": {
      article: "Setting SMART Financial Goals",
      video: "Visual Guide to Effective Goal Setting",
      interactive: "Interactive Goal Planning Workshop",
      quiz: "Financial Goal Setting Quiz"
    },
    "Financial Goal Setting": {
      article: "The Art and Science of Financial Goal Setting",
      video: "Visual Framework for Powerful Financial Goals",
      interactive: "Goal Achievement Accelerator Workshop",
      quiz: "Goal Setting Mastery Quiz"
    },
    Investing: {
      article: "Investment Fundamentals for Building Wealth",
      video: "Visual Guide to Smart Investing",
      interactive: "Interactive Investment Strategy Builder",
      quiz: "Investment Knowledge Assessment"
    }
  }
  
  // Return title if available, otherwise generate a generic one
  if (titles[topic] && titles[topic][contentType]) {
    return titles[topic][contentType]
  }
  
  // Generate generic title
  const contentTypeNames = {
    article: "Guide to",
    video: "Visual Guide to",
    interactive: "Interactive Workshop on",
    quiz: "Mastery Quiz on"
  }
  
  return `${contentTypeNames[contentType] || "Guide to"} ${topic}`
}

function generateModuleDescription(topic, difficulty) {
  const descriptions = {
    Budgeting: {
      Beginner: "Learn practical budgeting methods that fit real life, including the 50/30/20 rule and zero-based budgeting techniques.",
      Intermediate: "Take your budgeting to the next level with advanced strategies for variable income, irregular expenses, and long-term planning.",
      Advanced: "Master sophisticated budgeting approaches for complex financial situations, including multiple income streams and investment properties."
    },
    "Emergency Fund": {
      Beginner: "Learn why emergency funds are crucial and how to build one that fits your lifestyle, even on a tight budget.",
      Intermediate: "Optimize your emergency fund strategy with tiered approaches and proper allocation across different account types.",
      Advanced: "Fine-tune your emergency reserves with advanced strategies for self-employed individuals and those with variable income."
    },
    Saving: {
      Beginner: "Discover practical saving strategies that work even when money is tight, with actionable steps to build your first $1,000.",
      Intermediate: "Learn how to optimize your saving rate and automate your finances to accelerate progress toward your goals.",
      Advanced: "Master advanced saving techniques to maximize your savings rate while maintaining lifestyle balance."
    },
    "Saving Strategies": {
      Beginner: "Learn effective techniques to save more money without feeling deprived, focusing on high-impact changes.",
      Intermediate: "Discover strategic approaches to increase your savings rate to 20% or more through automation and optimization.",
      Advanced: "Master sophisticated saving strategies used by those who achieve 40%+ savings rates while maintaining quality of life."
    },
    Banking: {
      Beginner: "Learn how to choose the right bank accounts for your needs and avoid unnecessary fees and charges.",
      Intermediate: "Optimize your banking setup to maximize interest, minimize fees, and streamline your financial system.",
      Advanced: "Master advanced banking strategies including relationship banking, negotiation techniques, and optimal account structures."
    },
    "Banking Optimization": {
      Beginner: "Learn how to set up an efficient banking system that works for your specific needs and financial goals.",
      Intermediate: "Discover strategies to maximize the benefits from your banking relationships while minimizing costs and hassle.",
      Advanced: "Master sophisticated banking optimization techniques used by financial experts to extract maximum value."
    },
    "Goal Setting": {
      Beginner: "Learn how to create SMART financial goals that motivate you and track your progress effectively.",
      Intermediate: "Develop a comprehensive goal framework that balances short, medium, and long-term financial objectives.",
      Advanced: "Master advanced goal-setting techniques including cascading goals, progress acceleration, and adaptive planning."
    },
    "Financial Goal Setting": {
      Beginner: "Learn the fundamentals of creating meaningful financial goals that drive action and lead to success.",
      Intermediate: "Develop a strategic approach to goal setting that aligns your financial objectives with your life values.",
      Advanced: "Master sophisticated goal frameworks that maximize achievement rates and optimize resource allocation."
    },
    Investing: {
      Beginner: "Learn the fundamentals of investing, including key terminology, account types, and basic asset allocation.",
      Intermediate: "Develop a comprehensive investment strategy based on your risk tolerance, time horizon, and financial goals.",
      Advanced: "Master advanced investment techniques including tax optimization, factor investing, and portfolio rebalancing strategies."
    }
  }
  
  // Return description if available, otherwise generate a generic one
  if (descriptions[topic] && descriptions[topic][difficulty]) {
    return descriptions[topic][difficulty]
  }
  
  // Generate generic description
  const difficultyDescriptions = {
    Beginner: `Learn the essential concepts of ${topic.toLowerCase()} with practical steps for getting started.`,
    Intermediate: `Expand your knowledge of ${topic.toLowerCase()} with more advanced strategies and techniques.`,
    Advanced: `Master sophisticated ${topic.toLowerCase()} approaches used by financial experts and wealth builders.`
  }
  
  return difficultyDescriptions[difficulty] || `Learn about ${topic.toLowerCase()} with content tailored to your experience level.`
}

function generateDuration(contentType) {
  // Generate realistic duration based on content type
  switch (contentType) {
    case 'article':
      return Math.floor(Math.random() * 10) + 10; // 10-20 minutes
    case 'video':
      return Math.floor(Math.random() * 15) + 15; // 15-30 minutes
    case 'interactive':
      return Math.floor(Math.random() * 20) + 20; // 20-40 minutes
    case 'quiz':
      return Math.floor(Math.random() * 5) + 5; // 5-10 minutes
    default:
      return Math.floor(Math.random() * 15) + 15; // 15-30 minutes
  }
}

function generateXPReward(contentType, difficulty) {
  // Base XP by content type
  let baseXP = 0
  switch (contentType) {
    case 'article':
      baseXP = 20
      break
    case 'video':
      baseXP = 25
      break
    case 'interactive':
      baseXP = 35
      break
    case 'quiz':
      baseXP = 50
      break
    default:
      baseXP = 30
  }
  
  // Multiplier by difficulty
  const multiplier = difficulty === 'Beginner' ? 1 :
                    difficulty === 'Intermediate' ? 1.5 :
                    2 // Advanced
  
  return Math.round(baseXP * multiplier)
}

function generateContentData(topic, contentType, difficulty, financialSituation) {
  const now = new Date().toISOString()
  
  // Generate content based on type
  switch (contentType) {
    case 'quiz':
      return {
        generated_by: 'ai',
        generated_at: now,
        questions: generateQuizQuestions(topic, difficulty)
      }
    case 'article':
      return {
        generated_by: 'ai',
        generated_at: now,
        sections: generateArticleSections(topic, difficulty, financialSituation)
      }
    case 'video':
      return {
        generated_by: 'ai',
        generated_at: now,
        video_url: null, // Would be filled by a real video generation service
        transcript: generateArticleSections(topic, difficulty, financialSituation)
          .map(section => `${section.title}: ${section.content}`)
          .join('\n\n')
      }
    case 'interactive':
      return {
        generated_by: 'ai',
        generated_at: now,
        sections: generateArticleSections(topic, difficulty, financialSituation),
        exercises: generateInteractiveExercises(topic, difficulty)
      }
    default:
      return {
        generated_by: 'ai',
        generated_at: now,
        content: `Generated content for ${topic} (${difficulty})`
      }
  }
}

function generateQuizQuestions(topic, difficulty) {
  // Default questions based on topic
  const defaultQuestions = {
    Budgeting: [
      {
        question_text: "What does the 50/30/20 budgeting rule recommend for needs?",
        options: ["30% of income", "50% of income", "20% of income", "70% of income"],
        correct_answer: "50% of income",
        explanation: "The 50/30/20 rule suggests allocating 50% of your after-tax income to needs, 30% to wants, and 20% to savings and debt repayment."
      },
      {
        question_text: "Which of these is typically considered a 'need' in budgeting?",
        options: ["Netflix subscription", "Housing costs", "Dining out", "New clothes"],
        correct_answer: "Housing costs",
        explanation: "Needs are expenses that are essential for living, such as housing, utilities, groceries, and basic transportation."
      },
      {
        question_text: "What is zero-based budgeting?",
        options: [
          "Spending zero money each month", 
          "Assigning every dollar of income to a specific purpose", 
          "Having zero debt", 
          "Saving zero money"
        ],
        correct_answer: "Assigning every dollar of income to a specific purpose",
        explanation: "Zero-based budgeting means giving every dollar a job so your income minus your expenses equals zero. This doesn't mean spending everything, but rather allocating all income to categories including savings and investments."
      },
      {
        question_text: "Which budgeting method is best for variable income?",
        options: [
          "Envelope system", 
          "Pay yourself first", 
          "Zero-based budgeting", 
          "Priority-based budgeting"
        ],
        correct_answer: "Priority-based budgeting",
        explanation: "Priority-based budgeting works well for variable income because it focuses on covering essential expenses first, then moving down your priority list as more income becomes available."
      },
      {
        question_text: "What is the envelope budgeting system?",
        options: [
          "Putting your budget in an envelope and mailing it to yourself", 
          "Allocating cash to different envelopes for different spending categories", 
          "Saving money in envelopes", 
          "Paying bills with envelopes"
        ],
        correct_answer: "Allocating cash to different envelopes for different spending categories",
        explanation: "The envelope system involves putting cash into physical or digital envelopes labeled for different spending categories. When an envelope is empty, you stop spending in that category until the next budget period."
      }
    ],
    "Emergency Fund": [
      {
        question_text: "How many months of expenses should an emergency fund typically cover?",
        options: ["1-2 months", "3-6 months", "12 months", "24 months"],
        correct_answer: "3-6 months",
        explanation: "Financial experts generally recommend having 3-6 months of living expenses saved in an emergency fund to cover unexpected situations."
      },
      {
        question_text: "Where should you keep your emergency fund?",
        options: ["Stock market", "High-yield savings account", "Under your mattress", "Cryptocurrency"],
        correct_answer: "High-yield savings account",
        explanation: "Emergency funds should be easily accessible and safe, making high-yield savings accounts ideal due to their liquidity and FDIC protection."
      },
      {
        question_text: "What is the first step in building an emergency fund?",
        options: [
          "Save 6 months of expenses immediately", 
          "Start with a mini emergency fund of $1,000", 
          "Take out a loan", 
          "Invest in stocks"
        ],
        correct_answer: "Start with a mini emergency fund of $1,000",
        explanation: "Many financial experts recommend starting with a small 'starter' emergency fund of $1,000 before focusing on other financial goals like debt repayment."
      },
      {
        question_text: "Which of these would NOT typically be considered an emergency?",
        options: [
          "Unexpected medical bill", 
          "Car repair", 
          "Job loss", 
          "Annual holiday gifts"
        ],
        correct_answer: "Annual holiday gifts",
        explanation: "Emergency funds are for unexpected expenses. Predictable annual expenses like holiday gifts should be planned for separately, perhaps using a sinking fund."
      },
      {
        question_text: "What should you do after using money from your emergency fund?",
        options: [
          "Close the account", 
          "Replenish it as soon as possible", 
          "Reduce the target amount", 
          "Switch to investing instead"
        ],
        correct_answer: "Replenish it as soon as possible",
        explanation: "After using your emergency fund, you should make it a priority to replenish it as soon as possible to ensure you're protected for the next unexpected expense."
      }
    ],
    Investing: [
      {
        question_text: "What is diversification in investing?",
        options: ["Buying only one stock", "Spreading investments across different assets", "Investing only in bonds", "Day trading"],
        correct_answer: "Spreading investments across different assets",
        explanation: "Diversification means spreading your investments across different asset classes, sectors, and securities to reduce risk."
      },
      {
        question_text: "Which investment typically has higher risk but potentially higher returns?",
        options: ["Savings account", "Government bonds", "Stocks", "CDs"],
        correct_answer: "Stocks",
        explanation: "Stocks generally offer higher potential returns than bonds or savings accounts, but they also come with higher volatility and risk."
      },
      {
        question_text: "What is dollar-cost averaging?",
        options: ["Buying stocks at the lowest price", "Investing the same amount regularly", "Selling when prices are high", "Only investing in expensive stocks"],
        correct_answer: "Investing the same amount regularly",
        explanation: "Dollar-cost averaging involves investing a fixed amount of money at regular intervals, regardless of market conditions, which can help reduce the impact of market volatility."
      },
      {
        question_text: "What does 'risk tolerance' mean in investing?",
        options: ["How much money you can invest", "How much volatility you can handle", "How long you plan to invest", "How many stocks you own"],
        correct_answer: "How much volatility you can handle",
        explanation: "Risk tolerance refers to your ability and willingness to handle fluctuations in the value of your investments without making emotional decisions."
      },
      {
        question_text: "Which of these is generally considered the safest investment?",
        options: ["Cryptocurrency", "Individual stocks", "Real estate", "U.S. Treasury bonds"],
        correct_answer: "U.S. Treasury bonds",
        explanation: "U.S. Treasury bonds are backed by the full faith and credit of the U.S. government and are considered among the safest investments available."
      }
    ],
    Saving: [
      {
        question_text: "What is the recommended minimum savings rate for financial health?",
        options: ["5% of income", "10% of income", "15% of income", "20% of income"],
        correct_answer: "20% of income",
        explanation: "Financial experts typically recommend saving at least 20% of your income, which includes both emergency savings and retirement contributions."
      },
      {
        question_text: "Which saving strategy is most effective for most people?",
        options: ["Saving whatever is left at the end of the month", "Cutting all discretionary spending", "Paying yourself first", "Keeping all savings in cash"],
        correct_answer: "Paying yourself first",
        explanation: "Paying yourself first means automatically transferring money to savings as soon as you get paid, before you have a chance to spend it on other things."
      },
      {
        question_text: "What is a sinking fund?",
        options: ["An emergency fund", "A retirement account", "Money set aside for a specific planned expense", "A type of investment"],
        correct_answer: "Money set aside for a specific planned expense",
        explanation: "A sinking fund is money you set aside regularly for a specific planned expense, like holiday gifts, car repairs, or annual insurance premiums."
      },
      {
        question_text: "Which account typically offers the highest interest rate for savings?",
        options: ["Traditional bank savings account", "Checking account", "High-yield online savings account", "Money market account at a traditional bank"],
        correct_answer: "High-yield online savings account",
        explanation: "High-yield online savings accounts typically offer much higher interest rates than traditional bank accounts, often 10-20 times higher."
      },
      {
        question_text: "What is the 'save more tomorrow' technique?",
        options: [
          "Putting off saving until the future", 
          "Committing in advance to save more when you get a raise", 
          "Saving only for long-term goals", 
          "Investing instead of saving"
        ],
        correct_answer: "Committing in advance to save more when you get a raise",
        explanation: "The 'save more tomorrow' technique involves committing in advance to allocate a portion of your future raises to savings, making it easier to increase your savings rate without feeling like you're cutting back."
      }
    ],
    Banking: [
      {
        question_text: "Which of these account features is typically most important for a checking account?",
        options: ["High interest rate", "No monthly fees", "Reward points", "Minimum balance requirements"],
        correct_answer: "No monthly fees",
        explanation: "For checking accounts, avoiding monthly maintenance fees is usually more important than earning interest, since these accounts are primarily for transactions rather than growing money."
      },
      {
        question_text: "What is the main advantage of online banks over traditional banks?",
        options: ["More branch locations", "Better customer service", "Higher interest rates", "More account options"],
        correct_answer: "Higher interest rates",
        explanation: "Online banks typically offer much higher interest rates on savings accounts because they have lower overhead costs than traditional brick-and-mortar banks."
      },
      {
        question_text: "What does FDIC insurance cover?",
        options: [
          "Investment losses", 
          "Bank deposits up to $250,000 per depositor, per bank", 
          "Credit card fraud", 
          "Identity theft"
        ],
        correct_answer: "Bank deposits up to $250,000 per depositor, per bank",
        explanation: "The Federal Deposit Insurance Corporation (FDIC) insures deposits up to $250,000 per depositor, per bank, per ownership category, protecting your money if the bank fails."
      },
      {
        question_text: "What is a money market account?",
        options: [
          "A type of investment account", 
          "A savings account with check-writing privileges", 
          "A retirement account", 
          "A business checking account"
        ],
        correct_answer: "A savings account with check-writing privileges",
        explanation: "A money market account is a type of savings account that typically offers higher interest rates than regular savings accounts and includes limited check-writing privileges."
      },
      {
        question_text: "What is the main purpose of a checking account?",
        options: [
          "Earning interest", 
          "Long-term savings", 
          "Day-to-day transactions", 
          "Building credit"
        ],
        correct_answer: "Day-to-day transactions",
        explanation: "Checking accounts are designed primarily for frequent transactions like paying bills, making purchases, and withdrawing cash, rather than for earning interest or long-term savings."
      }
    ],
    "Goal Setting": [
      {
        question_text: "What does the 'M' in SMART goals stand for?",
        options: ["Manageable", "Meaningful", "Measurable", "Motivational"],
        correct_answer: "Measurable",
        explanation: "In SMART goals, 'M' stands for Measurable, meaning you can track your progress and know when you've achieved the goal."
      },
      {
        question_text: "Which of these is an example of a SMART financial goal?",
        options: [
          "Save more money", 
          "Build wealth", 
          "Save $10,000 for a house down payment by December 31st next year", 
          "Improve my finances"
        ],
        correct_answer: "Save $10,000 for a house down payment by December 31st next year",
        explanation: "This goal is Specific (house down payment), Measurable ($10,000), Achievable (presumably), Relevant (to buying a house), and Time-bound (by December 31st next year)."
      },
      {
        question_text: "What is the recommended approach for managing multiple financial goals?",
        options: [
          "Focus on one goal at a time", 
          "Prioritize goals and work on them simultaneously", 
          "Always prioritize debt repayment over savings", 
          "Always prioritize savings over debt repayment"
        ],
        correct_answer: "Prioritize goals and work on them simultaneously",
        explanation: "Most financial experts recommend prioritizing your goals based on importance and urgency, then working on multiple goals simultaneously with different allocation percentages."
      },
      {
        question_text: "Which of these should typically be your first financial goal?",
        options: [
          "Saving for retirement", 
          "Building an emergency fund", 
          "Buying a house", 
          "Investing in stocks"
        ],
        correct_answer: "Building an emergency fund",
        explanation: "Most financial experts recommend building at least a small emergency fund (e.g., $1,000) before focusing on other financial goals, as this provides a buffer against unexpected expenses."
      },
      {
        question_text: "What is a 'stretch goal' in financial planning?",
        options: [
          "A goal related to physical fitness", 
          "A goal that's easily achievable", 
          "A challenging goal that pushes you beyond your comfort zone", 
          "A goal with no deadline"
        ],
        correct_answer: "A challenging goal that pushes you beyond your comfort zone",
        explanation: "A stretch goal is ambitious and pushes you beyond your comfort zone, encouraging growth and higher achievement than you might initially think possible."
      }
    ]
  }
  
  // Select questions based on topic
  let questions = defaultQuestions.Budgeting // Default to budgeting
  
  // Match topic to available question sets
  for (const [key, value] of Object.entries(defaultQuestions)) {
    if (topic.includes(key)) {
      questions = value
      break
    }
  }
  
  // Adjust difficulty if needed
  if (difficulty === 'Intermediate' || difficulty === 'Advanced') {
    // For higher difficulties, we would ideally have more complex questions
    // For this implementation, we'll just use what we have
  }
  
  return questions
}

function generateArticleSections(topic, difficulty, financialSituation) {
  // Default sections based on topic
  const defaultSections = {
    Budgeting: [
      {
        title: "Understanding Your Cash Flow",
        content: "The foundation of any budget is understanding your cash flow - how much money comes in and goes out each month. Start by tracking all income sources and categorizing your expenses for at least 30 days. This baseline will reveal your actual spending patterns rather than what you think they are."
      },
      {
        title: "The 50/30/20 Framework",
        content: "A simple but effective budgeting framework is the 50/30/20 rule. Allocate 50% of your after-tax income to needs (housing, utilities, groceries, transportation), 30% to wants (dining out, entertainment, hobbies), and 20% to savings and debt repayment. This balanced approach ensures you're covering essentials while still enjoying life and building financial security."
      },
      {
        title: "Zero-Based Budgeting",
        content: "In zero-based budgeting, you assign every dollar of income to a specific category until your income minus your expenses equals zero. This doesn't mean spending everything - savings and investments are categories too. The key benefit is intentionality: every dollar has a purpose."
      },
      {
        title: "Practical Implementation",
        content: "Choose a budgeting method that fits your personality. Tech-savvy individuals might prefer apps like YNAB or Mint, while others might prefer spreadsheets or the envelope system. The best budget is one you'll actually use consistently."
      }
    ],
    "Emergency Fund": [
      {
        title: "Why You Need an Emergency Fund",
        content: "An emergency fund is your financial buffer against life's unexpected events - job loss, medical emergencies, car repairs, or home maintenance. Without this safety net, you're forced to rely on credit cards or loans, potentially creating a cycle of debt."
      },
      {
        title: "How Much to Save",
        content: "The general recommendation is 3-6 months of essential expenses. Start with a mini emergency fund of $1,000 while paying off high-interest debt, then build toward your full target. Self-employed individuals or those with variable income should aim for the higher end (6+ months)."
      },
      {
        title: "Where to Keep Your Emergency Fund",
        content: "Your emergency fund should be liquid (easily accessible) but not too accessible (to avoid temptation). High-yield savings accounts are ideal - they offer better returns than traditional savings accounts while maintaining FDIC insurance and liquidity."
      },
      {
        title: "Building Your Fund Strategically",
        content: "Treat your emergency fund contribution like a bill - automate it on payday before you can spend the money elsewhere. Start with whatever you can afford, even if it's just $25 per paycheck. Remember, small consistent contributions add up over time."
      }
    ],
    Saving: [
      {
        title: "The Savings Rate Imperative",
        content: "Your savings rate - the percentage of income you save - is the most important factor in building wealth. Even small increases in your savings rate can dramatically accelerate your progress toward financial independence."
      },
      {
        title: "Automating Your Savings",
        content: "Set up automatic transfers to your savings accounts on payday. This 'pay yourself first' approach ensures saving happens before discretionary spending and removes the willpower element from the equation."
      },
      {
        title: "Finding Money to Save",
        content: "If you're struggling to save, conduct a spending audit to identify 'money leaks' - small recurring expenses that add up over time. Consider the 'pain-to-gain ratio' when cutting expenses: focus first on expenses that provide little value relative to their cost."
      },
      {
        title: "Strategic Savings Buckets",
        content: "Beyond your emergency fund, create separate savings 'buckets' for different goals with different time horizons. Short-term goals (under 3 years) should stay in cash equivalents, while medium-term goals (3-7 years) might include some conservative investments."
      }
    ],
    "Saving Strategies": [
      {
        title: "The Power of Automation",
        content: "Set up automatic transfers to your savings accounts on payday. What happens first with your money tends to stick, while what happens last often falls by the wayside. Even small automatic transfers add up significantly over time."
      },
      {
        title: "The 24-Hour Rule",
        content: "For non-essential purchases over a certain amount (say $100), implement a 24-hour waiting period. This cooling-off period helps distinguish between impulse wants and genuine needs, often resulting in significant savings."
      },
      {
        title: "Expense Auditing",
        content: "Conduct a thorough audit of subscriptions, memberships, and recurring services. Many people discover they're paying for services they rarely use or have forgotten about entirely. This 'found money' can be redirected to savings."
      },
      {
        title: "Strategic Windfalls",
        content: "Create a plan for how you'll allocate unexpected money like tax refunds, bonuses, or gifts. Consider the 50/30/20 rule for windfalls: 50% toward goals, 30% to savings, and 20% for enjoyment."
      }
    ],
    Banking: [
      {
        title: "Choosing the Right Accounts",
        content: "The foundation of your financial system is your banking setup. For most people, this means a checking account for daily expenses and bill payments, and a high-yield savings account for emergency funds and short-term savings goals."
      },
      {
        title: "Avoiding Unnecessary Fees",
        content: "Bank fees can silently erode your wealth. Look for accounts with no monthly maintenance fees, no minimum balance requirements, free ATM access, and no overdraft fees. Online banks typically offer better terms than traditional banks."
      },
      {
        title: "Maximizing Interest",
        content: "For money you don't need immediately, high-yield savings accounts offer significantly better returns than traditional bank accounts. The difference between 0.01% at a traditional bank and 3-4% at an online bank is substantial over time."
      },
      {
        title: "Setting Up Direct Deposit and Automatic Transfers",
        content: "Automate your finances by setting up direct deposit for your paycheck and automatic transfers to your savings accounts. This reduces the friction in your financial system and ensures consistent progress toward your goals."
      }
    ],
    "Banking Optimization": [
      {
        title: "Account Fee Audit",
        content: "Review all your accounts for hidden fees and consider switching to fee-free alternatives. Even small monthly fees add up to hundreds of dollars over time. Common fees to watch for include monthly maintenance fees, ATM fees, overdraft fees, and paper statement fees."
      },
      {
        title: "Interest Rate Optimization",
        content: "Compare your current savings interest rates to the best available rates. Moving your emergency fund to a high-yield savings account could earn you 10-20x more interest. For example, $10,000 at 0.01% earns just $1 per year, while the same amount at 3.5% earns $350."
      },
      {
        title: "Strategic Account Structure",
        content: "Consider using multiple accounts for different purposes: checking for daily expenses, high-yield savings for emergency funds, and separate savings accounts for specific goals. This 'bucket' approach makes it easier to track progress and reduces the temptation to spend money allocated for other purposes."
      },
      {
        title: "Relationship Banking Benefits",
        content: "Some banks offer relationship benefits when you maintain certain balances or use multiple products. These can include higher interest rates, fee waivers, and better loan terms. Evaluate whether these benefits outweigh potentially higher fees or lower interest rates compared to using separate optimized accounts."
      }
    ],
    "Goal Setting": [
      {
        title: "The SMART Goal Framework",
        content: "Effective financial goals are Specific, Measurable, Achievable, Relevant, and Time-bound. Instead of 'save more money,' try 'save $5,000 for an emergency fund by December 31st.' This clarity makes your goal actionable and trackable."
      },
      {
        title: "Prioritizing Your Goals",
        content: "Not all financial goals are equal. Prioritize emergency savings and high-interest debt repayment before other goals like vacation funds or luxury purchases. Within your priority list, balance short-term wins with long-term progress to maintain motivation."
      },
      {
        title: "Breaking Down Big Goals",
        content: "Large financial goals can be overwhelming. Break them down into smaller milestones with their own deadlines and celebrations. For example, if you're saving $20,000 for a down payment, celebrate every $5,000 milestone."
      },
      {
        title: "Tracking Progress and Staying Motivated",
        content: "Visual progress trackers, regular check-ins, and celebrating milestones are key to maintaining momentum toward your financial goals. Consider using a goal-tracking app or creating a visual representation of your progress."
      }
    ],
    "Financial Goal Setting": [
      {
        title: "The SMART Goal Framework",
        content: "Effective financial goals are Specific, Measurable, Achievable, Relevant, and Time-bound. Instead of 'save more money,' try 'save $5,000 for an emergency fund by December 31st.' This clarity makes your goal actionable and trackable."
      },
      {
        title: "Aligning Goals with Values",
        content: "The most powerful financial goals connect directly to your core values and life vision. Take time to reflect on what truly matters to you before setting goals. This alignment creates intrinsic motivation that sustains long-term effort."
      },
      {
        title: "Creating a Goal Hierarchy",
        content: "Organize your goals into a hierarchy: life goals (what you want to experience and achieve), financial goals (the money needed for those experiences), and system goals (the daily and weekly habits that will get you there)."
      },
      {
        title: "Implementation Intentions",
        content: "Research shows that goals with implementation intentions ('I will do X when Y happens') are much more likely to be achieved. For each financial goal, create specific if-then plans that trigger your desired behaviors automatically."
      }
    ],
    Investing: [
      {
        title: "The Power of Compound Interest",
        content: "Albert Einstein allegedly called compound interest the eighth wonder of the world. When you invest, you earn returns not just on your initial investment, but also on the accumulated interest over time. This creates an exponential growth curve that accelerates as time passes."
      },
      {
        title: "Asset Allocation Basics",
        content: "Asset allocation - how you divide your investments among stocks, bonds, and other asset classes - is responsible for about 90% of your portfolio's volatility. Your ideal allocation depends on your time horizon, risk tolerance, and financial goals."
      },
      {
        title: "Index Fund Investing",
        content: "For most investors, low-cost index funds are the most efficient way to invest. Rather than trying to pick winning stocks or time the market (which even professionals struggle to do consistently), index funds give you broad market exposure with minimal fees."
      },
      {
        title: "Dollar-Cost Averaging",
        content: "Investing a fixed amount regularly, regardless of market conditions, is called dollar-cost averaging. This strategy removes the emotional component of investing and prevents the common mistake of buying high and selling low."
      }
    ]
  }
  
  // Select sections based on topic
  let sections = defaultSections.Budgeting // Default to budgeting
  
  // Match topic to available section sets
  for (const [key, value] of Object.entries(defaultSections)) {
    if (topic.includes(key)) {
      sections = value
      break
    }
  }
  
  // Personalize content if possible
  if (financialSituation) {
    // Add personalized examples or recommendations based on financial situation
    // This would be more sophisticated in a real implementation
  }
  
  return sections
}

function generateInteractiveExercises(topic, difficulty) {
  // Generate interactive exercises based on topic and difficulty
  const exercises = []
  
  switch (topic) {
    case 'Budgeting':
      exercises.push(
        {
          title: "Cash Flow Analysis",
          description: "Track all income and expenses for one week to identify spending patterns.",
          steps: [
            "Record every transaction, no matter how small",
            "Categorize each expense as need, want, or saving/debt",
            "Calculate your percentages and compare to the 50/30/20 rule",
            "Identify at least three areas where you could reduce spending"
          ]
        },
        {
          title: "Zero-Based Budget Creation",
          description: "Create a zero-based budget for the upcoming month.",
          steps: [
            "List all expected income sources",
            "List all fixed expenses (rent/mortgage, utilities, etc.)",
            "Allocate remaining funds to variable expenses, savings, and debt repayment",
            "Ensure your income minus all allocations equals zero"
          ]
        }
      )
      break
    case 'Emergency Fund':
      exercises.push(
        {
          title: "Emergency Fund Target Calculation",
          description: "Calculate your personal emergency fund target based on your essential expenses.",
          steps: [
            "List all monthly essential expenses (housing, utilities, food, transportation, insurance, minimum debt payments)",
            "Calculate the total monthly essential expenses",
            "Multiply by your target months of coverage (3-6 months)",
            "Compare to your current emergency savings to find the gap"
          ]
        },
        {
          title: "Emergency Fund Building Plan",
          description: "Create a plan to build your emergency fund within a realistic timeframe.",
          steps: [
            "Determine how much you can save monthly toward your emergency fund",
            "Calculate how long it will take to reach your target at that rate",
            "Identify at least three ways to accelerate your progress",
            "Set up an automatic transfer to your emergency fund account"
          ]
        }
      )
      break
    case 'Saving':
    case 'Saving Strategies':
      exercises.push(
        {
          title: "Savings Rate Calculation",
          description: "Calculate your current savings rate and set a target for improvement.",
          steps: [
            "Add up all income sources for the past month",
            "Add up all savings and investments for the past month",
            "Divide savings by income and multiply by 100 to get your savings rate percentage",
            "Set a target to increase your savings rate by at least 1-2% next month"
          ]
        },
        {
          title: "Expense Audit",
          description: "Conduct a thorough audit of your expenses to find savings opportunities.",
          steps: [
            "Review all subscriptions and recurring charges",
            "Identify services you rarely use or could downgrade",
            "Call service providers to negotiate better rates",
            "Calculate your potential monthly savings and allocate that amount to savings"
          ]
        }
      )
      break
    case 'Banking':
    case 'Banking Optimization':
      exercises.push(
        {
          title: "Bank Fee Audit",
          description: "Review your bank statements to identify and eliminate unnecessary fees.",
          steps: [
            "Gather the last three months of statements for all accounts",
            "Highlight all fees charged during this period",
            "Research fee-free alternatives for each account",
            "Create an action plan to eliminate or reduce each fee"
          ]
        },
        {
          title: "Interest Rate Optimization",
          description: "Compare your current interest rates to the best available rates.",
          steps: [
            "List all your savings and checking accounts with their current interest rates",
            "Research current high-yield savings account rates",
            "Calculate how much additional interest you could earn annually by switching",
            "Create an action plan for moving funds to higher-yield accounts"
          ]
        }
      )
      break
    case 'Goal Setting':
    case 'Financial Goal Setting':
      exercises.push(
        {
          title: "SMART Goal Creation",
          description: "Transform vague financial aspirations into SMART goals.",
          steps: [
            "List 2-3 financial goals you want to achieve",
            "Make each goal Specific (exactly what will be accomplished)",
            "Make each goal Measurable (how will you track progress)",
            "Ensure each goal is Achievable, Relevant, and Time-bound",
            "Rewrite each goal in SMART format"
          ]
        },
        {
          title: "Goal Prioritization Exercise",
          description: "Prioritize your financial goals based on importance and urgency.",
          steps: [
            "List all your financial goals",
            "Rate each goal on importance (1-10) and urgency (1-10)",
            "Multiply the scores to get a priority score",
            "Rank your goals based on priority score",
            "Allocate resources (time, money, attention) accordingly"
          ]
        }
      )
      break
    case 'Investing':
      exercises.push(
        {
          title: "Risk Tolerance Assessment",
          description: "Assess your personal risk tolerance to inform your investment strategy.",
          steps: [
            "Complete the risk tolerance questionnaire",
            "Reflect on how you've reacted to past financial volatility",
            "Consider your investment time horizon for each financial goal",
            "Determine your appropriate stock/bond allocation based on these factors"
          ]
        },
        {
          title: "Investment Fee Audit",
          description: "Review your current investments to identify and reduce unnecessary fees.",
          steps: [
            "List all your investment accounts and their associated fees",
            "Research lower-cost alternatives for each investment",
            "Calculate the long-term impact of these fees on your returns",
            "Create an action plan to reduce investment costs"
          ]
        }
      )
      break
    default:
      exercises.push(
        {
          title: "Financial Health Check",
          description: "Assess your current financial health across key dimensions.",
          steps: [
            "Calculate your savings rate (savings ÷ income × 100)",
            "Calculate your debt-to-income ratio (monthly debt payments ÷ monthly income × 100)",
            "Check if you have adequate emergency savings (3-6 months of expenses)",
            "Review your progress toward financial goals",
            "Identify your biggest area for improvement"
          ]
        }
      )
  }
  
  return exercises
}