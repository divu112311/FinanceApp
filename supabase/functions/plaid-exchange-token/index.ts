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
    console.log('=== PLAID EXCHANGE TOKEN START ===')
    
    const { publicToken, userId, institution, accounts } = await req.json()
    
    console.log('📥 REQUEST INPUTS:', {
      hasPublicToken: !!publicToken,
      userId: userId || 'MISSING',
      institutionName: institution?.name || 'MISSING',
      accountCount: accounts?.length || 0
    })
    
    if (!publicToken || !userId) {
      throw new Error('Missing required parameters: publicToken and userId')
    }

    // Get Plaid credentials from environment
    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID')
    const plaidSecret = Deno.env.get('PLAID_SECRET')
    const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox'
    
    console.log('🔧 PLAID CONFIG:', {
      environment: plaidEnv,
      hasClientId: !!plaidClientId,
      hasSecret: !!plaidSecret
    })
    
    if (!plaidClientId || !plaidSecret) {
      throw new Error('Plaid credentials not configured')
    }

    // Determine Plaid environment URL
    const plaidBaseUrl = plaidEnv === 'production' 
      ? 'https://production.plaid.com'
      : plaidEnv === 'development'
      ? 'https://development.plaid.com'
      : 'https://sandbox.plaid.com'

    // Exchange public token for access token
    const exchangeRequest = {
      client_id: plaidClientId,
      secret: plaidSecret,
      public_token: publicToken,
    }

    console.log('🔄 EXCHANGING PUBLIC TOKEN FOR ACCESS TOKEN...')

    const plaidResponse = await fetch(`${plaidBaseUrl}/item/public_token/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exchangeRequest),
    })

    if (!plaidResponse.ok) {
      const errorText = await plaidResponse.text()
      console.error(`❌ PLAID EXCHANGE ERROR: ${plaidResponse.status} - ${errorText}`)
      throw new Error(`Plaid API error: ${plaidResponse.status} - ${errorText}`)
    }

    const { access_token, item_id } = await plaidResponse.json()
    console.log('✅ TOKEN EXCHANGE SUCCESSFUL, item_id:', item_id)

    // Get account details from Plaid
    const accountsRequest = {
      client_id: plaidClientId,
      secret: plaidSecret,
      access_token: access_token,
    }

    console.log('🔍 FETCHING ACCOUNT DETAILS FROM PLAID...')

    const accountsResponse = await fetch(`${plaidBaseUrl}/accounts/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountsRequest),
    })

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text()
      console.error(`❌ PLAID ACCOUNTS ERROR: ${accountsResponse.status} - ${errorText}`)
      throw new Error(`Failed to fetch account details: ${accountsResponse.status} - ${errorText}`)
    }

    const accountsData = await accountsResponse.json()
    console.log(`✅ RETRIEVED ${accountsData.accounts.length} ACCOUNTS FROM PLAID`)

    // Initialize Supabase client with service role key
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

    // Store accounts in database
    const accountsToInsert = accountsData.accounts.map((account: any) => ({
      user_id: userId,
      plaid_account_id: account.account_id,
      plaid_access_token: access_token,
      name: account.name,
      type: account.type,
      subtype: account.subtype,
      balance: account.balances.current,
      institution_name: institution?.name || 'Unknown Institution',
      institution_id: institution?.institution_id || 'unknown',
      mask: account.mask,
      last_updated: new Date().toISOString(),
    }))

    console.log('💾 STORING ACCOUNTS IN DATABASE...')
    console.log('Accounts to insert:', accountsToInsert.map(acc => ({
      name: acc.name,
      type: acc.type,
      subtype: acc.subtype,
      balance: acc.balance
    })))

    const { data: insertedAccounts, error: insertError } = await supabaseClient
      .from('bank_accounts')
      .insert(accountsToInsert)
      .select()

    if (insertError) {
      console.error('❌ DATABASE INSERT ERROR:', insertError)
      console.error('Insert error details:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint
      })
      throw new Error(`Failed to store account data: ${insertError.message}`)
    }

    console.log(`✅ SUCCESSFULLY STORED ${insertedAccounts.length} ACCOUNTS`)
    console.log('=== PLAID EXCHANGE TOKEN SUCCESS ===')

    return new Response(
      JSON.stringify({ 
        success: true,
        accounts: insertedAccounts,
        item_id: item_id,
        institution: institution
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('=== PLAID EXCHANGE TOKEN FAILED ===')
    console.error('❌ ERROR DETAILS:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        debug: 'Failed to exchange Plaid token',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})