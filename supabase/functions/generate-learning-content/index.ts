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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables')
      throw new Error('Supabase configuration not found')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey)

    console.log('🔍 FETCHING USER DATA...')

    // Get comprehensive user data from database
    const [userResult, goalsResult, accountsResult, transactionsResult, profileResult, xpResult] = await Promise.all([
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
      supabaseClient.from('xp').select('*').eq('user_id', userId).single()
    ])

    const userData = userResult.data
    const goalsData = goalsResult.data || []
    const accountsData = accountsResult.data || []
    const transactionsData = transactionsResult.data || []
    const profileData = profileResult.data
    const xpData = xpResult.data

    console.log('📊 USER DATA FETCHED:', {
      user: userData?.first_name || userData?.full_name || 'Unknown',
      goals: goalsData.length,
      accounts: accountsData.length,
      transactions: transactionsData.length,
      experience: profileData?.financial_experience || 'Unknown',
      xp: xpData?.points || 0
    })

    // Calculate financial metrics
    const totalBalance = accountsData.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalGoalAmount = goalsData.reduce((sum, goal) => sum + (goal.target_amount || 0), 0)
    const totalSavedAmount = goalsData.reduce((sum, goal) => sum + (goal.saved_amount || goal.current_amount || 0), 0)
    const goalProgress = totalGoalAmount > 0 ? (totalSavedAmount / totalGoalAmount) * 100 : 0
    const level = Math.floor((xpData?.points || 0) / 100) + 1

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
        interests: profileData?.interests || []
      }
      
      const prompt = `Generate a personalized learning path for a user with the following financial profile:

USER CONTEXT:
${JSON.stringify(userContext, null, 2)}

Create 5 learning modules that would be most beneficial for this user based on their financial situation, experience level, and goals.

Each module should include:
1. Title
2. Description
3. Content type (article, quiz, video, interactive)
4. Difficulty level (Beginner, Intermediate, Advanced)
5. Category (e.g., Budgeting, Investing, Savings, etc.)
6. Duration in minutes
7. XP reward for completion
8. For articles: 3-4 sections with titles and content
9. For quizzes: 5 multiple-choice questions with options, correct answers, and explanations

The first module should be today's recommended practice, tailored specifically to their most pressing financial need.

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
          "explanation": "Explanation of why B is correct"
        }
      ]
    }
  }
]

IMPORTANT GUIDELINES:
1. Make content practical and actionable
2. Tailor difficulty to the user's experience level
3. Focus on their specific financial situation and goals
4. Include a mix of content types (articles, quizzes)
5. Make sure quiz questions have exactly 4 options
6. Return ONLY the JSON array with no additional text`

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
            max_tokens: 2000,
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
            modules = generateLocalModules(userContext)
          }
        } else {
          const errorText = await aiResponse.text()
          console.error('Error generating AI modules:', errorText)
          // Fall back to local generation
          modules = generateLocalModules(userContext)
        }
      } catch (aiError) {
        console.error('Error calling AI service:', aiError)
        // Fall back to local generation
        modules = generateLocalModules(userContext)
      }
    } else {
      console.log('No OpenRouter API key, using local module generation')
      modules = generateLocalModules({
        name: userData?.first_name || userData?.full_name?.split(' ')[0] || 'User',
        experience: profileData?.financial_experience || 'Beginner',
        level: level,
        xp: xpData?.points || 0,
        goals: goalsData,
        accounts: accountsData,
        transactions: transactionsData
      })
    }

    // Store modules in database
    console.log('💾 STORING MODULES IN DATABASE...')
    console.log(`Generated ${modules.length} modules`)
    
    const modulesToInsert = modules.map(module => ({
      title: module.title,
      description: module.description,
      content_type: module.content_type,
      difficulty: module.difficulty,
      category: module.category,
      duration_minutes: module.duration_minutes,
      xp_reward: module.xp_reward,
      required_level: 1,
      content_data: module.content_data,
      is_active: true,
      tags: [module.category, module.difficulty.toLowerCase(), module.content_type]
    }))
    
    const { data: insertedModules, error: insertError } = await supabaseClient
      .from('learning_modules')
      .insert(modulesToInsert)
      .select()
    
    if (insertError) {
      console.error('Error storing modules:', insertError)
      throw new Error(`Failed to store modules: ${insertError.message}`)
    }
    
    console.log(`✅ Successfully stored ${insertedModules.length} modules`)
    console.log('=== GENERATE LEARNING CONTENT FUNCTION SUCCESS ===')

    return new Response(
      JSON.stringify({ 
        success: true, 
        modules: insertedModules,
        generated: true,
        count: insertedModules.length
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

// Generate modules locally based on user context
function generateLocalModules(userContext: any) {
  const modules = []
  const now = new Date().toISOString()
  const experience = userContext.experience || 'Beginner'
  
  // Determine user's financial situation
  const hasAccounts = userContext.accounts?.length > 0
  const hasGoals = userContext.goals?.length > 0
  
  // 1. Always include a budgeting module
  modules.push({
    title: "Smart Budgeting Strategies",
    description: "Learn practical budgeting methods that fit your lifestyle, including the 50/30/20 rule and zero-based budgeting techniques.",
    content_type: "article",
    difficulty: "Beginner",
    category: "Budgeting",
    duration_minutes: 15,
    xp_reward: 25,
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
  
  // 2. Add a module based on whether they have accounts
  if (!hasAccounts) {
    modules.push({
      title: "Getting Started with Banking",
      description: "Learn how to choose the right bank accounts for your needs and how to use them effectively.",
      content_type: "article",
      difficulty: "Beginner",
      category: "Banking",
      duration_minutes: 12,
      xp_reward: 20,
      content_data: {
        generated_by: "ai",
        generated_at: now,
        sections: [
          {
            title: "Choosing the Right Checking Account",
            content: "Look for accounts with no monthly fees, no minimum balance requirements, and a large ATM network. Online banks often offer better terms than traditional banks."
          },
          {
            title: "High-Yield Savings Accounts",
            content: "Don't settle for the 0.01% interest rate at traditional banks. High-yield savings accounts can offer 10-20x more interest on your savings."
          },
          {
            title: "Setting Up Direct Deposit and Automatic Transfers",
            content: "Automate your finances by setting up direct deposit for your paycheck and automatic transfers to your savings accounts."
          }
        ]
      }
    })
  } else {
    modules.push({
      title: "Optimizing Your Bank Accounts",
      description: "Learn strategies to maximize the benefits of your existing accounts and minimize fees.",
      content_type: "article",
      difficulty: experience === "Beginner" ? "Beginner" : "Intermediate",
      category: "Banking",
      duration_minutes: 18,
      xp_reward: 30,
      content_data: {
        generated_by: "ai",
        generated_at: now,
        sections: [
          {
            title: "Account Fee Audit",
            content: "Review all your accounts for hidden fees and consider switching to fee-free alternatives. Even small monthly fees add up to hundreds of dollars over time."
          },
          {
            title: "Interest Rate Optimization",
            content: "Compare your current savings interest rates to the best available rates. Moving your emergency fund to a high-yield savings account could earn you 10-20x more interest."
          },
          {
            title: "Strategic Account Structure",
            content: "Consider using multiple accounts for different purposes: checking for daily expenses, high-yield savings for emergency funds, and separate savings accounts for specific goals."
          }
        ]
      }
    })
  }
  
  // 3. Add a module based on whether they have goals
  if (!hasGoals) {
    modules.push({
      title: "Setting Effective Financial Goals",
      description: "Learn how to create SMART financial goals that motivate you and track your progress effectively.",
      content_type: "interactive",
      difficulty: "Beginner",
      category: "Goal Setting",
      duration_minutes: 20,
      xp_reward: 35,
      content_data: {
        generated_by: "ai",
        generated_at: now,
        sections: [
          {
            title: "The SMART Goal Framework",
            content: "Effective financial goals are Specific, Measurable, Achievable, Relevant, and Time-bound. Instead of 'save more money,' try 'save $5,000 for an emergency fund by December 31st.'"
          },
          {
            title: "Prioritizing Your Goals",
            content: "Not all financial goals are equal. Prioritize emergency savings and high-interest debt repayment before other goals like vacation funds or luxury purchases."
          },
          {
            title: "Tracking Progress and Staying Motivated",
            content: "Visual progress trackers, regular check-ins, and celebrating milestones are key to maintaining momentum toward your financial goals."
          }
        ]
      }
    })
  } else {
    modules.push({
      title: "Accelerating Your Financial Goals",
      description: "Advanced strategies to reach your financial goals faster and more efficiently.",
      content_type: "interactive",
      difficulty: experience === "Beginner" ? "Beginner" : "Intermediate",
      category: "Goal Setting",
      duration_minutes: 25,
      xp_reward: 40,
      content_data: {
        generated_by: "ai",
        generated_at: now,
        sections: [
          {
            title: "The Power of Automation",
            content: "Set up automatic transfers to your goal accounts on payday. What happens first with your money tends to stick, while what happens last often falls by the wayside."
          },
          {
            title: "Finding Hidden Money",
            content: "Conduct a spending audit to identify 'money leaks' - small recurring expenses that add up over time. Redirecting these funds to your goals can accelerate progress significantly."
          },
          {
            title: "Using Windfalls Strategically",
            content: "Create a plan for how you'll allocate unexpected money like tax refunds, bonuses, or gifts. Consider the 50/30/20 rule: 50% toward goals, 30% to savings, and 20% for enjoyment."
          }
        ]
      }
    })
  }
  
  // 4. Add a quiz module
  modules.push({
    title: "Financial Fundamentals Quiz",
    description: "Test your knowledge of essential financial concepts and identify areas for further learning.",
    content_type: "quiz",
    difficulty: "Beginner",
    category: "General",
    duration_minutes: 10,
    xp_reward: 50,
    content_data: {
      generated_by: "ai",
      generated_at: now,
      questions: [
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
          question_text: "What is the recommended minimum amount for an emergency fund?",
          options: ["$100", "$500", "1 month of expenses", "3-6 months of expenses"],
          correct_answer: "3-6 months of expenses",
          explanation: "Financial experts generally recommend having 3-6 months of essential expenses saved in an emergency fund."
        },
        {
          question_text: "Which type of account typically offers the highest interest rate?",
          options: ["Checking account", "Traditional savings account", "High-yield savings account", "Money market account"],
          correct_answer: "High-yield savings account",
          explanation: "High-yield savings accounts, often offered by online banks, typically provide much higher interest rates than traditional bank accounts."
        },
        {
          question_text: "What is the first recommended step in creating a financial plan?",
          options: ["Investing in stocks", "Creating a budget", "Opening a credit card", "Taking out a loan"],
          correct_answer: "Creating a budget",
          explanation: "A budget is the foundation of any financial plan, as it helps you understand your income, expenses, and where your money is going."
        }
      ]
    }
  })
  
  // 5. Add an investment module if they're beyond beginner
  if (experience !== 'Beginner') {
    modules.push({
      title: "Investment Strategy Fundamentals",
      description: "Learn the core principles of successful investing and how to build a portfolio aligned with your goals.",
      content_type: "article",
      difficulty: "Intermediate",
      category: "Investing",
      duration_minutes: 22,
      xp_reward: 45,
      content_data: {
        generated_by: "ai",
        generated_at: now,
        sections: [
          {
            title: "Asset Allocation Basics",
            content: "Asset allocation—how you divide your investments among stocks, bonds, and other asset classes—is responsible for about 90% of your portfolio's volatility. Your ideal allocation depends on your time horizon, risk tolerance, and financial goals."
          },
          {
            title: "The Power of Index Funds",
            content: "For most investors, low-cost index funds are the most efficient way to invest. Rather than trying to pick winning stocks or time the market (which even professionals struggle to do consistently), index funds give you broad market exposure with minimal fees."
          },
          {
            title: "Dollar-Cost Averaging",
            content: "Investing a fixed amount regularly, regardless of market conditions, is called dollar-cost averaging. This strategy removes the emotional component of investing and prevents the common mistake of buying high and selling low."
          },
          {
            title: "Rebalancing Your Portfolio",
            content: "Over time, some investments will grow faster than others, causing your asset allocation to drift from your target. Rebalancing—selling some of your winners and buying more of your underperformers—keeps your risk level consistent and can actually boost returns."
          }
        ]
      }
    })
  }
  
  return modules
}