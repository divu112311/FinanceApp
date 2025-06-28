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
    console.log('Creating Plaid link token...')
    
    const { userId } = await req.json()
    
    if (!userId) {
      throw new Error('Missing required parameter: userId')
    }

    // Get Plaid credentials from environment
    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID')
    const plaidSecret = Deno.env.get('PLAID_SECRET')
    const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox'
    
    if (!plaidClientId || !plaidSecret) {
      throw new Error('Plaid credentials not configured')
    }

    // Initialize Supabase client to get user info
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Get user data
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError) {
      throw new Error('Failed to fetch user data')
    }

    // Determine Plaid environment URL
    const plaidBaseUrl = plaidEnv === 'production' 
      ? 'https://production.plaid.com'
      : plaidEnv === 'development'
      ? 'https://development.plaid.com'
      : 'https://sandbox.plaid.com'

    // Create link token request
    const linkTokenRequest = {
      client_id: plaidClientId,
      secret: plaidSecret,
      client_name: 'DoughJo Financial App',
      country_codes: ['US'],
      language: 'en',
      user: {
        client_user_id: userId,
        email_address: userData.email,
        phone_number: null,
        legal_name: userData.full_name
      },
      products: ['transactions', 'accounts'],
      required_if_supported_products: ['identity'],
      optional_products: ['investments', 'liabilities'],
      redirect_uri: null,
      webhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/plaid-webhook`,
      account_filters: {
        depository: {
          account_subtypes: ['checking', 'savings', 'money_market', 'cd']
        },
        investment: {
          account_subtypes: ['401k', 'ira', 'roth', 'investment']
        }
      }
    }

    console.log('Calling Plaid API to create link token...')

    // Call Plaid API
    const plaidResponse = await fetch(`${plaidBaseUrl}/link/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(linkTokenRequest),
    })

    if (!plaidResponse.ok) {
      const errorText = await plaidResponse.text()
      console.error(`Plaid API error: ${plaidResponse.status} - ${errorText}`)
      throw new Error(`Plaid API error: ${plaidResponse.status}`)
    }

    const plaidData = await plaidResponse.json()
    console.log('Link token created successfully')

    return new Response(
      JSON.stringify({ 
        link_token: plaidData.link_token,
        expiration: plaidData.expiration,
        request_id: plaidData.request_id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error creating link token:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        debug: 'Failed to create Plaid link token'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})