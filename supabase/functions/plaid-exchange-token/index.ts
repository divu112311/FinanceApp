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
    console.log('Exchanging public token for access token...')
    
    const { publicToken, userId, institution, accounts } = await req.json()
    
    if (!publicToken || !userId) {
      throw new Error('Missing required parameters: publicToken and userId')
    }

    // Get Plaid credentials from environment
    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID')
    const plaidSecret = Deno.env.get('PLAID_SECRET')
    const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox'
    
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

    console.log('Calling Plaid API to exchange token...')

    const plaidResponse = await fetch(`${plaidBaseUrl}/item/public_token/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(exchangeRequest),
    })

    if (!plaidResponse.ok) {
      const errorText = await plaidResponse.text()
      console.error(`Plaid exchange error: ${plaidResponse.status} - ${errorText}`)
      throw new Error(`Plaid API error: ${plaidResponse.status}`)
    }

    const { access_token, item_id } = await plaidResponse.json()
    console.log('Token exchange successful')

    // Get account details from Plaid
    const accountsRequest = {
      client_id: plaidClientId,
      secret: plaidSecret,
      access_token: access_token,
    }

    const accountsResponse = await fetch(`${plaidBaseUrl}/accounts/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountsRequest),
    })

    if (!accountsResponse.ok) {
      const errorText = await accountsResponse.text()
      console.error(`Plaid accounts error: ${accountsResponse.status} - ${errorText}`)
      throw new Error(`Failed to fetch account details: ${accountsResponse.status}`)
    }

    const accountsData = await accountsResponse.json()
    console.log(`Retrieved ${accountsData.accounts.length} accounts`)

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

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

    console.log('Storing accounts in database...')

    const { data: insertedAccounts, error: insertError } = await supabaseClient
      .from('bank_accounts')
      .insert(accountsToInsert)
      .select()

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw new Error('Failed to store account data')
    }

    console.log(`Successfully stored ${insertedAccounts.length} accounts`)

    return new Response(
      JSON.stringify({ 
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
    console.error('Error exchanging token:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        debug: 'Failed to exchange Plaid token'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})