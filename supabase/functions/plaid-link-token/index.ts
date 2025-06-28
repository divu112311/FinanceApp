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
    console.log('=== PLAID LINK TOKEN CREATION START ===')
    
    const requestBody = await req.json()
    const { userId, username, password } = requestBody
    
    console.log('📥 REQUEST INPUTS:', {
      userId: userId || 'MISSING',
      hasUsername: !!username,
      hasPassword: !!password
    })
    
    if (!userId) {
      console.error('❌ VALIDATION ERROR: Missing userId')
      throw new Error('Missing required parameter: userId')
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
      console.error('❌ PLAID CREDENTIALS ERROR: Missing client ID or secret')
      throw new Error('Plaid credentials not configured')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('🔧 SUPABASE CONFIG:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    })
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ SUPABASE CREDENTIALS ERROR: Missing URL or service key')
      throw new Error('Supabase credentials not configured')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('🔍 FETCHING USER DATA for userId:', userId)

    // Get user data
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    console.log('👤 USER DATA RESULT:', {
      hasData: !!userData,
      error: userError?.message || 'none'
    })

    if (userError) {
      console.error('❌ DATABASE ERROR:', userError)
      throw new Error(`Failed to fetch user data: ${userError.message}`)
    }

    if (!userData) {
      console.error('❌ USER NOT FOUND in database')
      throw new Error('User not found in database')
    }

    // Determine Plaid environment URL
    const plaidBaseUrl = plaidEnv === 'production' 
      ? 'https://production.plaid.com'
      : plaidEnv === 'development'
      ? 'https://development.plaid.com'
      : 'https://sandbox.plaid.com'

    console.log('🌐 PLAID BASE URL:', plaidBaseUrl)

    // Use provided credentials or fallback to defaults for sandbox
    const testUsername = username || 'user_good'
    const testPassword = password || 'pass_good'
    const testEmail = `${userData.email || 'user@example.com'}`

    console.log('🧪 TEST CREDENTIALS:', {
      username: testUsername,
      hasPassword: !!testPassword,
      email: testEmail
    })

    // Create link token request
    const linkTokenRequest = {
      client_id: plaidClientId,
      secret: plaidSecret,
      client_name: 'DoughJo Financial App',
      country_codes: ['US'],
      language: 'en',
      user: {
        client_user_id: userId,
        email_address: testEmail
      },
      products: ['transactions', 'investments'],
      required_if_supported_products: ['identity'],
      optional_products: ['auth', 'liabilities', 'assets'],
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

    console.log('📤 PLAID API REQUEST:', {
      url: `${plaidBaseUrl}/link/token/create`,
      products: linkTokenRequest.products,
      optional_products: linkTokenRequest.optional_products
    })

    // Call Plaid API
    const plaidResponse = await fetch(`${plaidBaseUrl}/link/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(linkTokenRequest),
    })

    console.log('📥 PLAID API RESPONSE:', {
      status: plaidResponse.status,
      statusText: plaidResponse.statusText,
      ok: plaidResponse.ok
    })

    if (!plaidResponse.ok) {
      const errorText = await plaidResponse.text()
      console.error('❌ PLAID API ERROR:', {
        status: plaidResponse.status,
        statusText: plaidResponse.statusText,
        errorBody: errorText
      })
      throw new Error(`Plaid API error: ${plaidResponse.status} - ${errorText}`)
    }

    const plaidData = await plaidResponse.json()
    console.log('✅ PLAID SUCCESS:', {
      hasLinkToken: !!plaidData.link_token,
      linkTokenLength: plaidData.link_token?.length || 0,
      expiration: plaidData.expiration,
      requestId: plaidData.request_id
    })

    console.log('=== PLAID LINK TOKEN CREATION SUCCESS ===')

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
    console.error('=== PLAID LINK TOKEN CREATION FAILED ===')
    console.error('❌ ERROR DETAILS:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
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