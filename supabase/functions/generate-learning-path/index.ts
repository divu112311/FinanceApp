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
    console.log('=== GENERATE LEARNING PATH FUNCTION START ===')
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
      supabaseClient.from('user_xp').select('*').eq('user_id', userId).single()
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
      xp: xpData?.total_xp || 0,
      level: xpData?.current_level || 1
    })

    // Check for OpenRouter API key to generate personalized content
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
    console.log('🔑 API KEY STATUS:', {
      hasOpenRouterKey: !!openRouterKey,
      keyLength: openRouterKey?.length || 0
    })
    
    // Prepare user context for AI
    const userContext = {
      name: userData?.first_name || userData?.full_name?.split(' ')[0] || 'User',
      experience: profileData?.financial_experience || 'Beginner',
      level: xpData?.current_level || Math.floor((xpData?.total_xp || 0) / 100) + 1,
      goals: goalsData.map(g => ({
        name: g.name,
        target: g.target_amount,
        saved: g.saved_amount || g.current_amount || 0,
        progress: g.target_amount ? ((g.saved_amount || g.current_amount || 0) / g.target_amount) * 100 : 0,
        category: g.goal_type || g.category || 'savings'
      })),
      accounts: {
        count: accountsData.length,
        types: [...new Set(accountsData.map(a => a.type))],
        subtypes: [...new Set(accountsData.map(a => a.account_subtype || a.subtype))]
      },
      transactions: {
        count: transactionsData.length,
        categories: [...new Set(transactionsData.map(t => t.category).filter(Boolean))]
      },
      interests: profileData?.interests || [],
      learning_style: profileData?.learning_style || 'Visual'
    }

    // Generate learning path
    let modules = []
    
    if (openRouterKey) {
      console.log('🤖 GENERATING AI LEARNING PATH...')
      
      const prompt = `Generate a personalized learning path for a user with the following profile:

USER PROFILE:
${JSON.stringify(userContext, null, 2)}

Create 5 learning modules that would be most beneficial for this user based on their financial situation, goals, and experience level.

Each module should include:
1. A title
2. A description
3. Content type (article, quiz, video, interactive)
4. Difficulty level (Beginner, Intermediate, Advanced)
5. Category (e.g., Budgeting, Investing, Savings, etc.)
6. Duration in minutes
7. XP reward
8. For articles: 4-5 sections with titles and content
9. For quizzes: 5 multiple-choice questions with options, correct answers, and explanations

FORMAT YOUR RESPONSE AS A JSON ARRAY:
[
  {
    "title": "Module title",
    "description": "Module description",
    "content_type": "article|quiz|video|interactive",
    "difficulty": "Beginner|Intermediate|Advanced",
    "category": "category name",
    "duration_minutes": 15,
    "xp_reward": 50,
    "content_data": {
      // For articles:
      "sections": [
        {"title": "Section title", "content": "Section content"}
      ],
      // For quizzes:
      "questions": [
        {
          "question_text": "Question?",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_answer": "Option B",
          "explanation": "Explanation why B is correct"
        }
      ]
    }
  }
]

IMPORTANT GUIDELINES:
1. Make content highly personalized to the user's specific situation
2. Focus on their goals and financial experience level
3. Include practical, actionable advice
4. For beginners, focus on fundamentals
5. For intermediate/advanced users, include more sophisticated concepts
6. Return ONLY the JSON array with no additional text`

      try {
        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://doughjo.app',
            'X-Title': 'DoughJo Learning Path Generator',
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
          
          console.log('✅ AI LEARNING PATH GENERATED')
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
            // Fall back to rule-based generation
            modules = generateDefaultModules(userContext)
          }
        } else {
          console.error('Error generating AI modules:', await aiResponse.text())
          // Fall back to rule-based generation
          modules = generateDefaultModules(userContext)
        }
      } catch (aiError) {
        console.error('Error calling AI service:', aiError)
        // Fall back to rule-based generation
        modules = generateDefaultModules(userContext)
      }
    } else {
      console.log('No OpenRouter API key, using default modules')
      modules = generateDefaultModules(userContext)
    }

    console.log(`Generated ${modules.length} learning modules`)

    // Store modules in database
    console.log('💾 STORING MODULES IN DATABASE...')
    
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
      is_active: true
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

    // Create a learning path
    console.log('🛣️ CREATING LEARNING PATH...')
    
    const { data: learningPath, error: pathError } = await supabaseClient
      .from('learning_paths_new')
      .insert({
        name: `${userContext.name}'s Personalized Learning Path`,
        description: `Customized learning path for ${userContext.name} based on their financial goals and experience level`,
        target_audience: userContext.experience,
        estimated_duration: modules.reduce((sum, m) => sum + m.duration_minutes, 0),
        is_featured: false
      })
      .select()
      .single()
    
    if (pathError) {
      console.error('Error creating learning path:', pathError)
      throw new Error(`Failed to create learning path: ${pathError.message}`)
    }
    
    console.log(`✅ Created learning path: ${learningPath.path_id}`)

    // Add modules to learning path
    console.log('🔄 ADDING MODULES TO LEARNING PATH...')
    
    const pathModulesToInsert = insertedModules.map((module, index) => ({
      path_id: learningPath.path_id,
      module_id: module.id,
      sequence_order: index + 1,
      is_required: true
    }))
    
    const { data: pathModules, error: pathModulesError } = await supabaseClient
      .from('learning_path_modules')
      .insert(pathModulesToInsert)
      .select()
    
    if (pathModulesError) {
      console.error('Error adding modules to path:', pathModulesError)
      throw new Error(`Failed to add modules to path: ${pathModulesError.message}`)
    }
    
    console.log(`✅ Added ${pathModules.length} modules to learning path`)
    console.log('=== GENERATE LEARNING PATH FUNCTION SUCCESS ===')

    return new Response(
      JSON.stringify({ 
        success: true, 
        modules: insertedModules,
        path: learningPath,
        pathModules: pathModules
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('=== GENERATE LEARNING PATH FUNCTION FAILED ===')
    console.error('❌ ERROR DETAILS:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        debug: 'Failed to generate learning path',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Generate default modules based on user context
function generateDefaultModules(userContext) {
  const modules = []
  const now = new Date().toISOString()
  
  // Determine user's financial situation
  const hasGoals = userContext.goals && userContext.goals.length > 0
  const hasAccounts = userContext.accounts && userContext.accounts.count > 0
  const financialExperience = userContext.experience || 'Beginner'
  const userLevel = userContext.level || 1
  
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
        },
        {
          title: "Making Your Budget Work",
          content: "The best budget is one you'll actually use. Choose a method that fits your personality and lifestyle, whether that's an app, spreadsheet, or the envelope system."
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
          },
          {
            title: "Mobile Banking Features",
            content: "Take advantage of mobile check deposit, account alerts, and budgeting tools offered by your bank's mobile app."
          }
        ]
      }
    })
  } else {
    modules.push({
      title: "Optimizing Your Bank Accounts",
      description: "Learn strategies to maximize the benefits of your existing accounts and minimize fees.",
      content_type: "article",
      difficulty: financialExperience === "Beginner" ? "Beginner" : "Intermediate",
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
          },
          {
            title: "Banking Relationship Benefits",
            content: "Many banks offer relationship benefits like fee waivers, higher interest rates, or better loan terms when you maintain certain balances or use multiple products."
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
          },
          {
            title: "Adjusting Goals When Life Changes",
            content: "Life is unpredictable. Be prepared to adjust your goals when circumstances change, but don't abandon them completely."
          }
        ]
      }
    })
  } else {
    modules.push({
      title: "Accelerating Your Financial Goals",
      description: "Advanced strategies to reach your financial goals faster and more efficiently.",
      content_type: "interactive",
      difficulty: financialExperience === "Beginner" ? "Beginner" : "Intermediate",
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
          },
          {
            title: "Stacking Financial Wins",
            content: "As you complete smaller goals, roll that momentum into larger ones. This 'goal stacking' approach maintains motivation and accelerates progress on your bigger objectives."
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
  
  // 5. Add a module based on experience level
  if (financialExperience === 'Beginner') {
    modules.push({
      title: "Understanding Credit Scores",
      description: "Learn what makes up your credit score and how to improve it over time.",
      content_type: "article",
      difficulty: "Beginner",
      category: "Credit",
      duration_minutes: 15,
      xp_reward: 25,
      content_data: {
        generated_by: "ai",
        generated_at: now,
        sections: [
          {
            title: "What Makes Up Your Credit Score",
            content: "Your FICO credit score is determined by: Payment History (35%), Credit Utilization (30%), Length of Credit History (15%), New Credit (10%), and Credit Mix (10%)."
          },
          {
            title: "Payment History: The Foundation",
            content: "Always pay your bills on time. Set up automatic payments for at least the minimum due to avoid late payments, which can stay on your credit report for up to 7 years."
          },
          {
            title: "Credit Utilization: Keep It Low",
            content: "Try to use less than 30% of your available credit. For example, if your credit limit is $1,000, keep your balance below $300. Lower utilization (under 10%) is even better."
          },
          {
            title: "Building Credit from Scratch",
            content: "Start with a secured credit card or become an authorized user on someone else's account. Use the card for small purchases and pay it off in full each month."
          }
        ]
      }
    })
  } else if (financialExperience === 'Intermediate') {
    modules.push({
      title: "Investment Portfolio Fundamentals",
      description: "Learn how to build a diversified investment portfolio based on your goals and risk tolerance.",
      content_type: "article",
      difficulty: "Intermediate",
      category: "Investing",
      duration_minutes: 25,
      xp_reward: 40,
      content_data: {
        generated_by: "ai",
        generated_at: now,
        sections: [
          {
            title: "Asset Allocation Basics",
            content: "Your asset allocation—how you divide investments among stocks, bonds, and other assets—determines about 90% of your portfolio's volatility. A common starting point is subtracting your age from 110 to get your stock percentage."
          },
          {
            title: "Diversification Within Asset Classes",
            content: "Don't just diversify between stocks and bonds—diversify within them. For stocks, consider U.S. vs. international, large-cap vs. small-cap, growth vs. value. For bonds, consider government, municipal, and corporate bonds of varying durations."
          },
          {
            title: "Low-Cost Index Funds",
            content: "For most investors, low-cost index funds are the most efficient way to invest. They provide broad market exposure with minimal fees, which can save you tens of thousands of dollars over your investing lifetime."
          },
          {
            title: "Rebalancing Strategy",
            content: "Set a schedule to rebalance your portfolio back to your target allocation, either annually or when allocations drift by 5% or more. This enforces the 'buy low, sell high' principle automatically."
          }
        ]
      }
    })
  } else {
    modules.push({
      title: "Advanced Tax Optimization Strategies",
      description: "Learn sophisticated techniques to minimize your tax burden and maximize after-tax returns.",
      content_type: "article",
      difficulty: "Advanced",
      category: "Taxes",
      duration_minutes: 30,
      xp_reward: 60,
      content_data: {
        generated_by: "ai",
        generated_at: now,
        sections: [
          {
            title: "Tax-Loss Harvesting",
            content: "Strategically sell investments at a loss to offset capital gains. This can reduce your tax bill while maintaining your overall investment exposure through similar (but not identical) investments."
          },
          {
            title: "Asset Location Optimization",
            content: "Place tax-inefficient investments (like bonds or REITs) in tax-advantaged accounts, and tax-efficient investments (like index funds) in taxable accounts to minimize your overall tax burden."
          },
          {
            title: "Roth Conversion Ladders",
            content: "Systematically convert traditional IRA funds to Roth IRAs during low-income years to minimize taxes and create tax-free growth and withdrawals in retirement."
          },
          {
            title: "Charitable Giving Strategies",
            content: "Consider donor-advised funds, qualified charitable distributions from IRAs (if over 70½), and donating appreciated securities instead of cash to maximize tax benefits while supporting causes you care about."
          }
        ]
      }
    })
  }
  
  return modules
}