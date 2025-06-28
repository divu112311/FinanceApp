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

    console.log('Processing request for userId:', userId)

    // Get Plaid credentials from environment
    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID')
    const plaidSecret = Deno.env.get('PLAID_SECRET')
    const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox'
    
    console.log('Plaid environment:', plaidEnv)
    console.log('Plaid credentials available:', { 
      hasClientId: !!plaidClientId, 
      hasSecret: !!plaidSecret 
    })
    
    if (!plaidClientId || !plaidSecret) {
      throw new Error('Plaid credentials not configured')
    }

    // Initialize Supabase client with service role key for edge functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Supabase credentials available:', { 
      hasUrl: !!supabaseUrl, 
      hasServiceKey: !!supabaseServiceKey 
    })
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('Fetching user data for userId:', userId)

    // Get user data with service role permissions (bypasses RLS)
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    console.log('Database query result:', { 
      hasData: !!userData, 
      error: userError?.message,
      errorCode: userError?.code 
    })

    if (userError) {
      console.error('Database error fetching user:', userError)
      throw new Error(`Failed to fetch user data: ${userError.message}`)
    }

    if (!userData) {
      throw new Error('User not found in database')
    }

    console.log('User data retrieved successfully:', {
      userId: userData.id,
      email: userData.email,
      hasFullName: !!userData.full_name
    })

    // Determine Plaid environment URL
    const plaidBaseUrl = plaidEnv === 'production' 
      ? 'https://production.plaid.com'
      : plaidEnv === 'development'
      ? 'https://development.plaid.com'
      : 'https://sandbox.plaid.com'

    console.log('Using Plaid base URL:', plaidBaseUrl)

    // Create link token request with hardcoded sandbox test credentials
    const linkTokenRequest = {
      client_id: plaidClientId,
      secret: plaidSecret,
      client_name: 'DoughJo Financial App',
      country_codes: ['US'],
      language: 'en',
      user: {
        client_user_id: userId,
        // Hardcode sandbox test user credentials
        email_address: 'user_good@example.com',
        phone_number: null,
        legal_name: 'user_good'
      },
      products: ['transactions', 'accounts'],
      required_if_supported_products: ['identity'],
      optional_products: ['investments', 'liabilities'],
      redirect_uri: null,
      webhook: `${supabaseUrl}/functions/v1/plaid-webhook`,
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
    console.log('Using hardcoded sandbox credentials:', {
      email: 'user_good@example.com',
      legal_name: 'user_good'
    })

    // Call Plaid API
    const plaidResponse = await fetch(`${plaidBaseUrl}/link/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(linkTokenRequest),
    })

    console.log('Plaid API response status:', plaidResponse.status)

    if (!plaidResponse.ok) {
      const errorText = await plaidResponse.text()
      console.error(`Plaid API error: ${plaidResponse.status} - ${errorText}`)
      throw new Error(`Plaid API error: ${plaidResponse.status} - ${errorText}`)
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
    console.error('Error stack:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        debug: 'Failed to create Plaid link token',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})