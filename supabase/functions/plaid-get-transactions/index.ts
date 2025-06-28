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
    console.log('=== PLAID GET TRANSACTIONS START ===')
    
    const { userId, accountId, startDate, endDate } = await req.json()
    
    console.log('📥 REQUEST INPUTS:', {
      userId: userId || 'MISSING',
      accountId: accountId || 'ALL_ACCOUNTS',
      startDate: startDate || 'MISSING',
      endDate: endDate || 'MISSING'
    })
    
    if (!userId || !startDate || !endDate) {
      throw new Error('Missing required parameters: userId, startDate, endDate')
    }

    // Get Plaid credentials from environment
    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID')
    const plaidSecret = Deno.env.get('PLAID_SECRET')
    const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox'
    
    if (!plaidClientId || !plaidSecret) {
      throw new Error('Plaid credentials not configured')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('🔍 FETCHING USER BANK ACCOUNTS...')

    // Get user's bank accounts
    let accountsQuery = supabaseClient
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)

    if (accountId) {
      accountsQuery = accountsQuery.eq('id', accountId)
    }

    const { data: bankAccounts, error: accountsError } = await accountsQuery

    if (accountsError) {
      console.error('❌ DATABASE ERROR:', accountsError)
      throw new Error(`Failed to fetch bank accounts: ${accountsError.message}`)
    }

    if (!bankAccounts || bankAccounts.length === 0) {
      console.log('⚠️ NO BANK ACCOUNTS FOUND')
      return new Response(
        JSON.stringify({ 
          transactions: [],
          accounts: [],
          message: 'No bank accounts connected'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        },
      )
    }

    console.log(`📊 FOUND ${bankAccounts.length} BANK ACCOUNTS`)

    // Determine Plaid environment URL
    const plaidBaseUrl = plaidEnv === 'production' 
      ? 'https://production.plaid.com'
      : plaidEnv === 'development'
      ? 'https://development.plaid.com'
      : 'https://sandbox.plaid.com'

    // Group accounts by access token to minimize API calls
    const accessTokenGroups = new Map()
    bankAccounts.forEach(account => {
      const token = account.plaid_access_token
      if (!accessTokenGroups.has(token)) {
        accessTokenGroups.set(token, [])
      }
      accessTokenGroups.get(token).push(account)
    })

    console.log(`🔗 GROUPED INTO ${accessTokenGroups.size} ACCESS TOKENS`)

    let allTransactions: any[] = []
    let processedAccounts: any[] = []

    // Fetch transactions for each access token group
    for (const [accessToken, accounts] of accessTokenGroups) {
      try {
        console.log(`📤 FETCHING TRANSACTIONS for ${accounts.length} accounts...`)

        const transactionsRequest = {
          client_id: plaidClientId,
          secret: plaidSecret,
          access_token: accessToken,
          start_date: startDate,
          end_date: endDate,
          count: 100, // Limit to 100 transactions per request
          offset: 0
        }

        const transactionsResponse = await fetch(`${plaidBaseUrl}/transactions/get`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transactionsRequest),
        })

        if (!transactionsResponse.ok) {
          const errorText = await transactionsResponse.text()
          console.error(`❌ PLAID TRANSACTIONS ERROR: ${transactionsResponse.status} - ${errorText}`)
          
          // Continue with other accounts even if one fails
          continue
        }

        const transactionsData = await transactionsResponse.json()
        console.log(`✅ RECEIVED ${transactionsData.transactions.length} TRANSACTIONS`)

        // Add account info to transactions
        const enrichedTransactions = transactionsData.transactions.map((transaction: any) => {
          const account = accounts.find(acc => acc.plaid_account_id === transaction.account_id)
          return {
            ...transaction,
            account_name: account?.name || 'Unknown Account',
            account_type: account?.type || 'unknown',
            account_subtype: account?.subtype || 'unknown',
            institution_name: account?.institution_name || 'Unknown Institution'
          }
        })

        allTransactions = [...allTransactions, ...enrichedTransactions]
        processedAccounts = [...processedAccounts, ...accounts]

      } catch (error) {
        console.error(`❌ ERROR PROCESSING ACCESS TOKEN:`, error)
        // Continue with other accounts
        continue
      }
    }

    // Sort transactions by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    console.log(`✅ TOTAL TRANSACTIONS RETRIEVED: ${allTransactions.length}`)
    console.log('=== PLAID GET TRANSACTIONS SUCCESS ===')

    return new Response(
      JSON.stringify({ 
        transactions: allTransactions,
        accounts: processedAccounts,
        total_count: allTransactions.length,
        date_range: {
          start: startDate,
          end: endDate
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('=== PLAID GET TRANSACTIONS FAILED ===')
    console.error('❌ ERROR DETAILS:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        debug: 'Failed to fetch transactions',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})