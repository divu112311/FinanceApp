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
    console.log('=== GENERATE SMART WINS FUNCTION START ===')
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for admin access
    )

    // Check if we should generate new smart wins
    if (!forceGenerate) {
      // Check if we've generated wins recently (within last week)
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      
      const { data: recentWins, error: recentError } = await supabaseClient
        .from('smart_wins')
        .select('id')
        .eq('user_id', userId)
        .is('expires_at', null)
        .gt('created_at', oneWeekAgo.toISOString())
        .limit(1)
      
      if (!recentError && recentWins && recentWins.length > 0) {
        console.log('Recent smart wins found, skipping generation')
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Recent smart wins already exist',
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
      transactions: transactionsData.length,
      accountsData: accountsData.map(acc => ({
        name: acc.name,
        balance: acc.balance,
        type: acc.type,
        subtype: acc.account_subtype || acc.subtype
      }))
    })

    // Generate smart wins based on financial data
    const smartWins = []
    const now = new Date()
    
    // 1. Check for excess checking balance
    const checkingAccounts = accountsData.filter(acc => 
      acc.type === 'depository' && 
      (acc.account_subtype === 'checking' || acc.subtype === 'checking')
    )
    
    const totalChecking = checkingAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    if (totalChecking > 5000) {
      smartWins.push({
        user_id: userId,
        title: "Optimize Excess Cash",
        description: `Move $${Math.floor((totalChecking - 3000) / 100) * 100} from checking to high-yield savings for better returns`,
        type: 'opportunity',
        impact: Math.floor((totalChecking - 3000) * 0.04), // Assuming 4% APY difference
        actionable: true,
        action_text: "Set up transfer",
        created_at: now.toISOString(),
        expires_at: null,
        data_source: { 
          account_ids: checkingAccounts.map(acc => acc.id),
          total_checking: totalChecking
        }
      })
    }

    // 2. Check for spending optimization
    if (transactionsData.length > 0) {
      // Calculate spending by category
      const spendingByCategory = {}
      transactionsData.forEach(transaction => {
        if (transaction.amount > 0) { // Positive amount means spending in Plaid
          const category = transaction.category || 'Uncategorized'
          spendingByCategory[category] = (spendingByCategory[category] || 0) + transaction.amount
        }
      })
      
      // Find subscription or recurring expenses
      const subscriptionCategories = ['Subscription', 'Entertainment', 'Recreation']
      const subscriptionTransactions = transactionsData.filter(t => 
        t.amount > 0 && // Spending only
        subscriptionCategories.some(cat => 
          t.category?.includes(cat) || 
          t.name?.toLowerCase().includes('subscription') ||
          t.name?.toLowerCase().includes('netflix') ||
          t.name?.toLowerCase().includes('spotify') ||
          t.name?.toLowerCase().includes('hulu')
        )
      )
      
      if (subscriptionTransactions.length > 0) {
        const potentialSavings = Math.min(
          subscriptionTransactions.reduce((sum, t) => sum + t.amount, 0) * 0.3,
          80
        )
        
        if (potentialSavings > 20) {
          smartWins.push({
            user_id: userId,
            title: "Review Subscriptions",
            description: `Most people save $${Math.floor(potentialSavings)}-${Math.floor(potentialSavings * 1.5)}/month by auditing recurring subscriptions`,
            type: 'spending',
            impact: potentialSavings * 12, // Annual savings
            actionable: true,
            action_text: "Review subscriptions",
            created_at: now.toISOString(),
            expires_at: null,
            data_source: {
              subscription_count: subscriptionTransactions.length,
              subscription_total: subscriptionTransactions.reduce((sum, t) => sum + t.amount, 0)
            }
          })
        }
      }
      
      // Find high spending category
      if (Object.keys(spendingByCategory).length > 0) {
        // Find top category
        let topCategory = 'Uncategorized'
        let topAmount = 0
        
        for (const [category, amount] of Object.entries(spendingByCategory)) {
          if (amount > topAmount) {
            topCategory = category
            topAmount = amount
          }
        }
        
        // Calculate total income
        const totalIncome = transactionsData
          .filter(t => t.amount < 0) // Negative amount means income in Plaid
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)
        
        if (topAmount > totalIncome * 0.2) {
          smartWins.push({
            user_id: userId,
            title: `Reduce ${topCategory} Spending`,
            description: `Cutting ${topCategory} spending by 15% would save you $${Math.floor(topAmount * 0.15)} monthly`,
            type: 'spending',
            impact: Math.floor(topAmount * 0.15 * 12), // Annual savings
            actionable: true,
            action_text: "See spending breakdown",
            created_at: now.toISOString(),
            expires_at: null,
            data_source: {
              category: topCategory,
              amount: topAmount,
              total_income: totalIncome
            }
          })
        }
      }
    }

    // 3. Check for goal automation opportunity
    if (goalsData.length > 0) {
      const totalMonthlyGoalAmount = goalsData.reduce((sum, goal) => {
        // Calculate monthly amount needed based on deadline
        if (goal.deadline || goal.target_date) {
          const deadline = new Date(goal.deadline || goal.target_date || '')
          const monthsRemaining = Math.max(1, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)))
          const amountRemaining = (goal.target_amount || 0) - (goal.saved_amount || goal.current_amount || 0)
          return sum + (amountRemaining / monthsRemaining)
        }
        return sum
      }, 0)
      
      if (totalMonthlyGoalAmount > 100) {
        smartWins.push({
          user_id: userId,
          title: "Automate Goal Contributions",
          description: `Automatically save $${Math.ceil(totalMonthlyGoalAmount / 100) * 100} monthly to reach your goals faster`,
          type: 'goal',
          impact: null,
          actionable: true,
          action_text: "Set up automation",
          created_at: now.toISOString(),
          expires_at: null,
          data_source: {
            goals: goalsData.map(g => ({
              id: g.id,
              name: g.name,
              target: g.target_amount,
              saved: g.saved_amount || g.current_amount,
              deadline: g.deadline || g.target_date
            })),
            monthly_amount: totalMonthlyGoalAmount
          }
        })
      }
    }

    // 4. Check for savings opportunity
    if (transactionsData.length > 0) {
      // Calculate total income and spending
      const totalIncome = transactionsData
        .filter(t => t.amount < 0) // Negative amount means income in Plaid
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      
      const totalSpending = transactionsData
        .filter(t => t.amount > 0) // Positive amount means spending in Plaid
        .reduce((sum, t) => sum + t.amount, 0)
      
      const savingsRate = totalIncome > 0 
        ? ((totalIncome - totalSpending) / totalIncome) * 100 
        : 0
      
      if (savingsRate < 20 && totalIncome > 0) {
        const targetSavings = totalIncome * 0.2
        const currentSavings = totalIncome - totalSpending
        const additionalSavingsNeeded = targetSavings - currentSavings
        
        if (additionalSavingsNeeded > 100) {
          smartWins.push({
            user_id: userId,
            title: "Boost Your Savings Rate",
            description: `Saving an additional $${Math.ceil(additionalSavingsNeeded / 50) * 50}/month would get you to the recommended 20% savings rate`,
            type: 'savings',
            impact: Math.ceil(additionalSavingsNeeded / 50) * 50 * 12, // Annual impact
            actionable: true,
            action_text: "Create savings plan",
            created_at: now.toISOString(),
            expires_at: null,
            data_source: {
              total_income: totalIncome,
              total_spending: totalSpending,
              current_savings_rate: savingsRate,
              additional_savings_needed: additionalSavingsNeeded
            }
          })
        }
      }
    }

    // 5. Check for investment opportunity
    const totalBalance = accountsData.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    
    if (totalBalance > 10000 && !accountsData.some(acc => acc.type === 'investment')) {
      smartWins.push({
        user_id: userId,
        title: "Start Investing",
        description: `Investing just 10% of your balance ($${Math.floor(totalBalance * 0.1)}) could yield $${Math.floor(totalBalance * 0.1 * 0.07)} annually at 7% average return`,
        type: 'investment',
        impact: Math.floor(totalBalance * 0.1 * 0.07), // Annual return
        actionable: true,
        action_text: "Explore investment options",
        created_at: now.toISOString(),
        expires_at: null,
        data_source: {
          total_balance: totalBalance,
          investment_amount: Math.floor(totalBalance * 0.1),
          potential_return: Math.floor(totalBalance * 0.1 * 0.07)
        }
      })
    }

    // If we don't have enough wins, add some generic ones
    if (smartWins.length < 3) {
      if (smartWins.length < 1) {
        smartWins.push({
          user_id: userId,
          title: "Track Your Spending",
          description: "Most people find 10-15% in savings just by tracking expenses for 30 days",
          type: 'spending',
          impact: null,
          actionable: true,
          action_text: "Start tracking",
          created_at: now.toISOString(),
          expires_at: null,
          data_source: { generic: true }
        })
      }
      
      if (smartWins.length < 2) {
        smartWins.push({
          user_id: userId,
          title: "Set Up Automatic Savings",
          description: "Automating your savings can increase your savings rate by up to 20%",
          type: 'savings',
          impact: null,
          actionable: true,
          action_text: "Set up automation",
          created_at: now.toISOString(),
          expires_at: null,
          data_source: { generic: true }
        })
      }
      
      if (smartWins.length < 3) {
        smartWins.push({
          user_id: userId,
          title: "Create an Emergency Fund",
          description: "Start with $500 as a mini emergency fund to handle unexpected expenses",
          type: 'savings',
          impact: null,
          actionable: true,
          action_text: "Create fund",
          created_at: now.toISOString(),
          expires_at: null,
          data_source: { generic: true }
        })
      }
    }

    // Limit to 3 smart wins
    const limitedSmartWins = smartWins.slice(0, 3);

    // Store smart wins in database
    console.log('💾 STORING SMART WINS IN DATABASE...')
    console.log(`Generated ${limitedSmartWins.length} smart wins`)
    
    // First, expire any existing wins
    try {
      const { error: expireError } = await supabaseClient
        .from('smart_wins')
        .update({ expires_at: now.toISOString() })
        .eq('user_id', userId)
        .is('expires_at', null)
      
      if (expireError) {
        console.error('Error expiring old smart wins:', expireError)
      }
    } catch (expireError) {
      console.error('Error expiring old smart wins:', expireError)
    }
    
    // Then insert new wins
    try {
      const { data: insertedWins, error: insertError } = await supabaseClient
        .from('smart_wins')
        .insert(limitedSmartWins)
        .select()
      
      if (insertError) {
        console.error('Error storing smart wins:', insertError)
        throw new Error(`Failed to store smart wins: ${insertError.message}`)
      }
      
      console.log(`✅ Successfully stored ${insertedWins?.length || 0} smart wins`)
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          smartWins: insertedWins,
          generated: true,
          count: insertedWins?.length || 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    } catch (insertError) {
      console.error('Error storing smart wins:', insertError)
      
      // Return the generated wins even if we couldn't store them
      return new Response(
        JSON.stringify({ 
          success: true, 
          smartWins: limitedSmartWins,
          generated: true,
          count: limitedSmartWins.length,
          stored: false
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

  } catch (error) {
    console.error('=== GENERATE SMART WINS FUNCTION FAILED ===')
    console.error('❌ ERROR DETAILS:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        debug: 'Failed to generate smart wins',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})