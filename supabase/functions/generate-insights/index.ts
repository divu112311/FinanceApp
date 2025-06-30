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
    console.log('=== GENERATE INSIGHTS FUNCTION START ===')
    console.log('Edge function called with method:', req.method)
    
    const { userId, forceGenerate } = await req.json()
    console.log('📥 REQUEST:', {
      userId: userId || 'MISSING',
      forceGenerate: forceGenerate || false
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

    // Check if we should generate new insights
    if (!forceGenerate) {
      // Check if we've generated insights recently (within last 24 hours)
      const oneDayAgo = new Date()
      oneDayAgo.setDate(oneDayAgo.getDate() - 1)
      
      const { data: recentInsights, error: recentError } = await supabaseClient
        .from('financial_insights')
        .select('insight_id')
        .eq('user_id', userId)
        .gt('created_at', oneDayAgo.toISOString())
        .limit(1)
      
      if (!recentError && recentInsights && recentInsights.length > 0) {
        console.log('Recent insights found, skipping generation')
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Recent insights already exist',
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
    try {
      const [userResult, goalsResult, accountsResult, transactionsResult] = await Promise.all([
        supabaseClient.from('users').select('*').eq('id', userId).single(),
        supabaseClient.from('goals').select('*').eq('user_id', userId),
        supabaseClient.from('bank_accounts').select('*').eq('user_id', userId),
        supabaseClient.from('transactions')
          .select('*')
          .eq('user_id', userId)
          .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('date', { ascending: false })
      ])

      const userData = userResult.data
      const goalsData = goalsResult.data || []
      const accountsData = accountsResult.data || []
      const transactionsData = transactionsResult.data || []

      console.log('📊 USER DATA FETCHED:', {
        user: userData?.first_name || userData?.full_name || 'Unknown',
        goals: goalsData.length,
        accounts: accountsData.length,
        transactions: transactionsData.length
      })

      // If no accounts or transactions, return early
      if (accountsData.length === 0 && transactionsData.length === 0) {
        console.log('No financial data to analyze')
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Insufficient data for insights',
            generated: false
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }

      // Calculate financial metrics
      const totalBalance = accountsData.reduce((sum, acc) => sum + (acc.balance || 0), 0)
      const totalGoalAmount = goalsData.reduce((sum, goal) => sum + (goal.target_amount || 0), 0)
      const totalSavedAmount = goalsData.reduce((sum, goal) => sum + (goal.saved_amount || goal.current_amount || 0), 0)
      const goalProgress = totalGoalAmount > 0 ? (totalSavedAmount / totalGoalAmount) * 100 : 0

      // Calculate spending by category
      const spendingByCategory = {}
      transactionsData.forEach(transaction => {
        if (transaction.amount > 0) { // Positive amount means spending in Plaid
          const category = transaction.category || 'Uncategorized'
          spendingByCategory[category] = (spendingByCategory[category] || 0) + transaction.amount
        }
      })

      // Calculate income
      const totalIncome = transactionsData
        .filter(t => t.amount < 0) // Negative amount means income in Plaid
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)

      // Calculate spending
      const totalSpending = transactionsData
        .filter(t => t.amount > 0) // Positive amount means spending in Plaid
        .reduce((sum, t) => sum + t.amount, 0)

      // Calculate savings rate
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpending) / totalIncome) * 100 : 0

      // Generate insights based on financial data
      const insights = []

      // Check for OpenRouter API key
      const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
      console.log('🔑 API KEY STATUS:', {
        hasOpenRouterKey: !!openRouterKey,
        keyLength: openRouterKey?.length || 0
      })
      
      // Prepare data for AI analysis
      const financialData = {
        user: {
          name: userData?.first_name || userData?.full_name || 'User',
          email: userData?.email
        },
        accounts: {
          count: accountsData.length,
          totalBalance,
          types: accountsData.map(acc => ({
            name: acc.name,
            type: acc.type,
            subtype: acc.account_subtype || acc.subtype,
            balance: acc.balance
          }))
        },
        goals: {
          count: goalsData.length,
          totalTarget: totalGoalAmount,
          totalSaved: totalSavedAmount,
          progress: goalProgress,
          items: goalsData.map(goal => ({
            name: goal.name,
            target: goal.target_amount,
            saved: goal.saved_amount || goal.current_amount || 0,
            deadline: goal.deadline || goal.target_date,
            category: goal.category || goal.goal_type
          }))
        },
        transactions: {
          count: transactionsData.length,
          totalSpending,
          totalIncome,
          savingsRate,
          spendingByCategory,
          recent: transactionsData.slice(0, 10).map(t => ({
            date: t.date,
            amount: t.amount,
            name: t.name || t.merchant_name,
            category: t.category
          }))
        }
      }

      // Generate AI insights if OpenRouter key is available
      if (openRouterKey) {
        console.log('🤖 GENERATING AI INSIGHTS...')
        
        const prompt = `You are a financial analyst AI for DoughJo, a personal finance app. Analyze the following financial data and generate 3-5 specific, actionable insights. Each insight should have a title, description, priority level (high/medium/low), and 1-2 specific action items the user can take.

FINANCIAL DATA:
${JSON.stringify(financialData, null, 2)}

FORMAT YOUR RESPONSE AS A JSON ARRAY OF INSIGHTS:
[
  {
    "title": "Insight title",
    "description": "Detailed explanation of the insight",
    "insight_type": "One of: spending_pattern, goal_recommendation, risk_alert, opportunity, budget_advice, investment_tip",
    "priority_level": "high/medium/low",
    "confidence_score": 0.XX (between 0 and 1),
    "action_items": [
      {"action": "action_name", "description": "What the user should do"}
    ]
  }
]

IMPORTANT GUIDELINES:
1. Be specific and reference actual numbers from their data
2. Focus on actionable advice, not generic statements
3. Prioritize insights that will have the biggest financial impact
4. Consider their goals, spending patterns, and account balances
5. If they're saving well, acknowledge it
6. If they're overspending in certain categories, highlight it
7. Identify opportunities to optimize their finances
8. Return ONLY the JSON array with no additional text`

        try {
          const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openRouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://doughjo.app',
              'X-Title': 'DoughJo Financial Insights Generator',
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
            
            console.log('✅ AI INSIGHTS GENERATED')
            console.log('AI response preview:', aiContent.substring(0, 200) + '...')
            
            try {
              // Parse the AI response
              let parsedInsights
              
              // Handle different response formats
              if (typeof aiContent === 'string') {
                // Try to extract JSON from the string
                const jsonMatch = aiContent.match(/\[[\s\S]*\]/)
                if (jsonMatch) {
                  parsedInsights = JSON.parse(jsonMatch[0])
                } else {
                  throw new Error('Could not extract JSON from AI response')
                }
              } else if (aiContent.insights) {
                // Some models return { insights: [...] }
                parsedInsights = aiContent.insights
              } else {
                // Try to use the content directly
                parsedInsights = aiContent
              }
              
              if (Array.isArray(parsedInsights)) {
                insights.push(...parsedInsights)
              } else {
                throw new Error('AI response is not an array of insights')
              }
            } catch (parseError) {
              console.error('Error parsing AI insights:', parseError)
              console.log('Raw AI response:', aiContent)
            }
          } else {
            console.error('Error generating AI insights:', await aiResponse.text())
          }
        } catch (aiError) {
          console.error('Error calling AI service:', aiError)
        }
      }

      // If AI insights failed or no OpenRouter key, generate rule-based insights
      if (insights.length === 0) {
        console.log('Generating rule-based insights...')
        
        // 1. Spending category insight
        if (Object.keys(spendingByCategory).length > 0) {
          // Find top spending category
          let topCategory = 'Uncategorized'
          let topAmount = 0
          
          for (const [category, amount] of Object.entries(spendingByCategory)) {
            if (amount > topAmount) {
              topCategory = category
              topAmount = amount
            }
          }
          
          insights.push({
            title: `High Spending in ${topCategory}`,
            description: `You spent $${topAmount.toFixed(2)} on ${topCategory} in the last 30 days, which is your highest spending category.`,
            insight_type: "spending_pattern",
            priority_level: "medium",
            confidence_score: 0.85,
            action_items: [
              {
                action: "review_spending",
                description: `Review your ${topCategory} expenses to identify potential savings opportunities.`
              },
              {
                action: "set_budget",
                description: `Consider setting a budget for ${topCategory} to keep spending in check.`
              }
            ]
          })
        }
        
        // 2. Savings rate insight
        if (savingsRate < 20 && totalIncome > 0) {
          insights.push({
            title: "Improve Your Savings Rate",
            description: `Your current savings rate is ${savingsRate.toFixed(1)}%, which is below the recommended 20%. Increasing your savings rate can help you reach your financial goals faster.`,
            insight_type: "budget_advice",
            priority_level: "high",
            confidence_score: 0.9,
            action_items: [
              {
                action: "reduce_expenses",
                description: "Identify non-essential expenses you can reduce to increase savings."
              },
              {
                action: "automate_savings",
                description: "Set up automatic transfers to your savings account on payday."
              }
            ]
          })
        } else if (savingsRate >= 20) {
          insights.push({
            title: "Strong Savings Rate",
            description: `Your savings rate of ${savingsRate.toFixed(1)}% is excellent! You're saving more than the recommended 20% of your income.`,
            insight_type: "opportunity",
            priority_level: "low",
            confidence_score: 0.9,
            action_items: [
              {
                action: "optimize_investments",
                description: "Consider optimizing your investments to make your savings work harder for you."
              }
            ]
          })
        }
        
        // 3. Goal progress insight
        if (goalsData.length > 0) {
          const goalInsight = {
            title: goalProgress >= 50 ? "Good Goal Progress" : "Boost Your Goal Progress",
            description: goalProgress >= 50 
              ? `You're making excellent progress at ${goalProgress.toFixed(1)}% toward your financial goals.` 
              : `Your goal progress is currently at ${goalProgress.toFixed(1)}%. Let's work on strategies to accelerate your progress.`,
            insight_type: "goal_recommendation",
            priority_level: goalProgress < 30 ? "high" : "medium",
            confidence_score: 0.8,
            action_items: [
              {
                action: "review_goals",
                description: "Review your goals and ensure they're still aligned with your priorities."
              }
            ]
          }
          
          if (goalProgress < 50) {
            goalInsight.action_items.push({
              action: "increase_contributions",
              description: "Consider increasing your monthly contributions to reach your goals faster."
            })
          }
          
          insights.push(goalInsight)
        }
        
        // 4. Emergency fund insight
        const emergencyFundGoal = goalsData.find(g => 
          g.name?.toLowerCase().includes('emergency') || 
          g.category === 'emergency' || 
          g.goal_type === 'emergency'
        )
        
        const savingsAccounts = accountsData.filter(acc => 
          acc.type === 'depository' && 
          (acc.account_subtype === 'savings' || acc.subtype === 'savings')
        )
        
        if (!emergencyFundGoal && savingsAccounts.length === 0) {
          insights.push({
            title: "Start an Emergency Fund",
            description: "You don't appear to have an emergency fund. Financial experts recommend having 3-6 months of expenses saved for unexpected situations.",
            insight_type: "risk_alert",
            priority_level: "high",
            confidence_score: 0.85,
            action_items: [
              {
                action: "create_emergency_fund",
                description: "Create an emergency fund goal and start with saving $500 as a mini emergency fund."
              },
              {
                action: "automate_savings",
                description: "Set up automatic transfers to build your emergency fund consistently."
              }
            ]
          })
        }
      }

      // Store insights in database
      console.log('💾 STORING INSIGHTS IN DATABASE...')
      console.log(`Generated ${insights.length} insights`)
      
      const insightsToInsert = insights.map(insight => ({
        user_id: userId,
        insight_type: insight.insight_type,
        title: insight.title,
        description: insight.description,
        data_sources: { 
          generated_from: 'financial_data_analysis',
          accounts_analyzed: accountsData.length,
          transactions_analyzed: transactionsData.length,
          goals_analyzed: goalsData.length
        },
        confidence_score: insight.confidence_score || 0.8,
        priority_level: insight.priority_level || 'medium',
        action_items: insight.action_items || [],
        is_dismissed: false,
        created_at: new Date().toISOString()
      }))
      
      const { data: insertedInsights, error: insertError } = await supabaseClient
        .from('financial_insights')
        .insert(insightsToInsert)
        .select()
      
      if (insertError) {
        console.error('Error storing insights:', insertError)
        throw new Error(`Failed to store insights: ${insertError.message}`)
      }
      
      console.log(`✅ Successfully stored ${insertedInsights.length} insights`)
      console.log('=== GENERATE INSIGHTS FUNCTION SUCCESS ===')

      return new Response(
        JSON.stringify({ 
          success: true, 
          insights: insertedInsights,
          generated: true,
          count: insertedInsights.length
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } catch (dataError) {
      console.error('Error fetching or processing user data:', dataError)
      
      // Generate fallback insights
      const fallbackInsights = [
        {
          title: "Start an Emergency Fund",
          description: "Financial experts recommend having 3-6 months of expenses saved for unexpected situations.",
          insight_type: "risk_alert",
          priority_level: "high",
          confidence_score: 0.9,
          action_items: [
            {
              action: "create_emergency_fund",
              description: "Start with saving $500 as a mini emergency fund."
            },
            {
              action: "automate_savings",
              description: "Set up automatic transfers to build your emergency fund consistently."
            }
          ]
        },
        {
          title: "Review Your Spending",
          description: "Tracking your expenses is the first step to financial control. Most people find 10-15% in savings just by monitoring their spending.",
          insight_type: "budget_advice",
          priority_level: "medium",
          confidence_score: 0.85,
          action_items: [
            {
              action: "track_expenses",
              description: "Track all expenses for the next 30 days to identify patterns."
            },
            {
              action: "categorize_spending",
              description: "Categorize your spending to see where your money is going."
            }
          ]
        },
        {
          title: "Set Clear Financial Goals",
          description: "Having specific, measurable financial goals increases your chances of success.",
          insight_type: "goal_recommendation",
          priority_level: "medium",
          confidence_score: 0.8,
          action_items: [
            {
              action: "create_goals",
              description: "Create SMART financial goals (Specific, Measurable, Achievable, Relevant, Time-bound)."
            }
          ]
        }
      ]
      
      // Try to store fallback insights
      try {
        const insightsToInsert = fallbackInsights.map(insight => ({
          user_id: userId,
          insight_type: insight.insight_type,
          title: insight.title,
          description: insight.description,
          data_sources: { 
            generated_from: 'fallback_system',
            error_recovery: true
          },
          confidence_score: insight.confidence_score,
          priority_level: insight.priority_level,
          action_items: insight.action_items,
          is_dismissed: false,
          created_at: new Date().toISOString()
        }))
        
        const { data: insertedInsights, error: insertError } = await supabaseClient
          .from('financial_insights')
          .insert(insightsToInsert)
          .select()
        
        if (insertError) {
          console.error('Error storing fallback insights:', insertError)
          return new Response(
            JSON.stringify({ 
              success: true, 
              insights: fallbackInsights,
              generated: true,
              count: fallbackInsights.length,
              stored: false
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            },
          )
        }
        
        console.log(`✅ Successfully stored ${insertedInsights.length} fallback insights`)
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            insights: insertedInsights,
            generated: true,
            count: insertedInsights.length,
            fallback: true
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      } catch (fallbackError) {
        console.error('Error storing fallback insights:', fallbackError)
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            insights: fallbackInsights,
            generated: true,
            count: fallbackInsights.length,
            stored: false,
            fallback: true
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          },
        )
      }
    }
  } catch (error) {
    console.error('=== GENERATE INSIGHTS FUNCTION FAILED ===')
    console.error('❌ ERROR DETAILS:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        debug: 'Failed to generate insights',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})