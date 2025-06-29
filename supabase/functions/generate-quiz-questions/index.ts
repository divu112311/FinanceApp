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
    console.log('=== GENERATE QUIZ QUESTIONS FUNCTION START ===')
    console.log('Edge function called with method:', req.method)
    
    const { userId, topic, difficulty, count } = await req.json()
    console.log('📥 REQUEST:', {
      userId: userId || 'MISSING',
      topic: topic || 'general',
      difficulty: difficulty || 'Beginner',
      count: count || 5
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

    // Get user data to personalize questions
    const [userResult, goalsResult, accountsResult, profileResult] = await Promise.all([
      supabaseClient.from('users').select('*').eq('id', userId).single(),
      supabaseClient.from('goals').select('*').eq('user_id', userId),
      supabaseClient.from('bank_accounts').select('*').eq('user_id', userId),
      supabaseClient.from('user_profiles').select('*').eq('user_id', userId).single()
    ])

    const userData = userResult.data
    const goalsData = goalsResult.data || []
    const accountsData = accountsResult.data || []
    const profileData = profileResult.data

    console.log('📊 USER DATA FETCHED:', {
      user: userData?.first_name || userData?.full_name || 'Unknown',
      goals: goalsData.length,
      accounts: accountsData.length,
      experience: profileData?.financial_experience || 'Unknown'
    })

    // Check for OpenRouter API key to generate personalized questions
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
    console.log('🔑 API KEY STATUS:', {
      hasOpenRouterKey: !!openRouterKey,
      keyLength: openRouterKey?.length || 0
    })
    
    let questions = []
    
    if (openRouterKey) {
      console.log('🤖 GENERATING AI QUIZ QUESTIONS...')
      
      // Prepare user context for personalization
      const userContext = {
        experience: profileData?.financial_experience || 'Beginner',
        goals: goalsData.map(g => g.name),
        hasAccounts: accountsData.length > 0,
        accountTypes: [...new Set(accountsData.map(a => a.type))]
      }
      
      const prompt = `Generate ${count} quiz questions about ${topic} for a ${difficulty} level user. 

USER CONTEXT:
${JSON.stringify(userContext, null, 2)}

Each question should have:
1. A clear question_text
2. Four options array with realistic choices
3. The correct_answer (which must be one of the options)
4. A helpful explanation of why the answer is correct

FORMAT YOUR RESPONSE AS A JSON ARRAY:
[
  {
    "question_text": "Question here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": "Option B",
    "explanation": "Explanation of why Option B is correct."
  }
]

IMPORTANT GUIDELINES:
1. Make questions relevant to personal finance
2. Ensure questions are appropriate for the ${difficulty} difficulty level
3. Include practical, real-world scenarios when possible
4. Make sure the correct_answer is EXACTLY the same as one of the options
5. Return ONLY the JSON array with no additional text`

      try {
        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://doughjo.app',
            'X-Title': 'DoughJo Quiz Generator',
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.1-8b-instruct:free', // Free model with good performance
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1000,
            temperature: 0.7,
            response_format: { type: "json_object" }
          }),
        })

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          const aiContent = aiData.choices[0]?.message?.content
          
          console.log('✅ AI QUESTIONS GENERATED')
          console.log('AI response preview:', aiContent.substring(0, 200) + '...')
          
          try {
            // Parse the AI response
            let parsedQuestions
            
            // Handle different response formats
            if (typeof aiContent === 'string') {
              // Try to extract JSON from the string
              const jsonMatch = aiContent.match(/\[[\s\S]*\]/)
              if (jsonMatch) {
                parsedQuestions = JSON.parse(jsonMatch[0])
              } else {
                throw new Error('Could not extract JSON from AI response')
              }
            } else if (aiContent.questions) {
              // Some models return { questions: [...] }
              parsedQuestions = aiContent.questions
            } else {
              // Try to use the content directly
              parsedQuestions = aiContent
            }
            
            if (Array.isArray(parsedQuestions)) {
              questions = parsedQuestions
            } else {
              throw new Error('AI response is not an array of questions')
            }
          } catch (parseError) {
            console.error('Error parsing AI questions:', parseError)
            console.log('Raw AI response:', aiContent)
            // Fall back to default questions
            questions = generateDefaultQuestions(topic, difficulty, count)
          }
        } else {
          console.error('Error generating AI questions:', await aiResponse.text())
          // Fall back to default questions
          questions = generateDefaultQuestions(topic, difficulty, count)
        }
      } catch (aiError) {
        console.error('Error calling AI service:', aiError)
        // Fall back to default questions
        questions = generateDefaultQuestions(topic, difficulty, count)
      }
    } else {
      console.log('No OpenRouter API key, using default questions')
      questions = generateDefaultQuestions(topic, difficulty, count)
    }

    console.log(`Generated ${questions.length} quiz questions`)
    console.log('=== GENERATE QUIZ QUESTIONS FUNCTION SUCCESS ===')

    return new Response(
      JSON.stringify({ 
        success: true, 
        questions,
        count: questions.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('=== GENERATE QUIZ QUESTIONS FUNCTION FAILED ===')
    console.error('❌ ERROR DETAILS:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        debug: 'Failed to generate quiz questions',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Generate default questions based on topic and difficulty
function generateDefaultQuestions(topic, difficulty, count) {
  // Default questions based on topic
  const defaultQuestions = {
    budgeting: [
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
    investing: [
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
    savings: [
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
      }
    ],
    credit: [
      {
        question_text: "What factor has the biggest impact on your credit score?",
        options: ["Credit utilization", "Payment history", "Length of credit history", "Types of credit"],
        correct_answer: "Payment history",
        explanation: "Payment history accounts for about 35% of your credit score, making it the most important factor in determining your creditworthiness."
      },
      {
        question_text: "What is the recommended credit utilization ratio?",
        options: ["Below 10%", "Below 30%", "Below 50%", "Below 70%"],
        correct_answer: "Below 30%",
        explanation: "Credit experts recommend keeping your credit utilization below 30% of your available credit limit, with below 10% being even better."
      },
      {
        question_text: "How long does a late payment typically stay on your credit report?",
        options: ["1 year", "3 years", "7 years", "10 years"],
        correct_answer: "7 years",
        explanation: "Late payments generally remain on your credit report for seven years from the date of the delinquency."
      },
      {
        question_text: "What is a good credit score range?",
        options: ["300-579", "580-669", "670-739", "740-850"],
        correct_answer: "740-850",
        explanation: "Credit scores range from 300-850, with 740-850 considered very good to exceptional, qualifying you for the best rates and terms."
      },
      {
        question_text: "How often can you check your own credit report for free without affecting your score?",
        options: ["Once a year", "Once every 6 months", "Once a month", "As often as you want"],
        correct_answer: "As often as you want",
        explanation: "Checking your own credit report is considered a 'soft inquiry' and doesn't affect your credit score, so you can check it as often as you want."
      }
    ],
    general: [
      {
        question_text: "What percentage of your income should you aim to save each month?",
        options: ["5%", "10%", "20%", "50%"],
        correct_answer: "20%",
        explanation: "Financial experts typically recommend saving at least 20% of your income, which includes both emergency savings and retirement contributions."
      },
      {
        question_text: "Which of these is the best first step in financial planning?",
        options: ["Investing in stocks", "Creating a budget", "Buying insurance", "Getting a credit card"],
        correct_answer: "Creating a budget",
        explanation: "Creating a budget is the foundation of financial planning as it helps you understand your income, expenses, and spending patterns."
      },
      {
        question_text: "What is compound interest?",
        options: ["Interest paid only on the principal", "Interest paid on both principal and accumulated interest", "A fixed interest rate", "Interest that decreases over time"],
        correct_answer: "Interest paid on both principal and accumulated interest",
        explanation: "Compound interest is when you earn interest on both your initial investment (the principal) and on the interest you've already earned, creating a snowball effect over time."
      },
      {
        question_text: "Which of these is generally NOT considered a liquid asset?",
        options: ["Checking account", "Savings account", "Money market account", "Real estate"],
        correct_answer: "Real estate",
        explanation: "Liquid assets can be quickly converted to cash without significant loss of value. Real estate typically takes time to sell and may have transaction costs, making it less liquid."
      },
      {
        question_text: "What is the rule of 72 used for?",
        options: ["Calculating monthly loan payments", "Estimating how long it takes money to double", "Determining retirement age", "Setting a budget"],
        correct_answer: "Estimating how long it takes money to double",
        explanation: "The Rule of 72 is a simple way to determine how long an investment will take to double given a fixed annual rate of interest. You divide 72 by the annual rate of return."
      }
    ]
  }
  
  // Select questions based on topic
  let questions = defaultQuestions.general
  
  // Match topic to available question sets
  for (const [key, value] of Object.entries(defaultQuestions)) {
    if (topic.toLowerCase().includes(key)) {
      questions = value
      break
    }
  }
  
  // Return the requested number of questions
  return questions.slice(0, count)
}