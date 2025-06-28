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
    console.log('Plaid webhook received')
    
    const webhookData = await req.json()
    console.log('Webhook type:', webhookData.webhook_type)
    console.log('Webhook code:', webhookData.webhook_code)

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    // Handle different webhook types
    switch (webhookData.webhook_type) {
      case 'TRANSACTIONS':
        await handleTransactionsWebhook(webhookData, supabaseClient)
        break
      
      case 'ITEM':
        await handleItemWebhook(webhookData, supabaseClient)
        break
      
      case 'ACCOUNTS':
        await handleAccountsWebhook(webhookData, supabaseClient)
        break
      
      default:
        console.log('Unhandled webhook type:', webhookData.webhook_type)
    }

    return new Response(
      JSON.stringify({ status: 'success' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Webhook error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        debug: 'Webhook processing failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function handleTransactionsWebhook(webhookData: any, supabaseClient: any) {
  console.log('Processing transactions webhook...')
  
  // Handle transaction updates
  if (webhookData.webhook_code === 'DEFAULT_UPDATE' || 
      webhookData.webhook_code === 'INITIAL_UPDATE') {
    
    // In a real implementation, you would:
    // 1. Fetch new transactions from Plaid
    // 2. Store them in your transactions table
    // 3. Update account balances
    // 4. Trigger any necessary notifications
    
    console.log('Transaction update for item:', webhookData.item_id)
    console.log('New transactions:', webhookData.new_transactions)
  }
}

async function handleItemWebhook(webhookData: any, supabaseClient: any) {
  console.log('Processing item webhook...')
  
  // Handle item errors or updates
  if (webhookData.webhook_code === 'ERROR') {
    console.log('Item error:', webhookData.error)
    
    // Update account status in database
    const { error } = await supabaseClient
      .from('bank_accounts')
      .update({ 
        status: 'error',
        error_message: webhookData.error.error_message,
        last_updated: new Date().toISOString()
      })
      .eq('plaid_access_token', webhookData.item_id)
    
    if (error) {
      console.error('Failed to update account status:', error)
    }
  }
}

async function handleAccountsWebhook(webhookData: any, supabaseClient: any) {
  console.log('Processing accounts webhook...')
  
  // Handle account updates
  if (webhookData.webhook_code === 'DEFAULT_UPDATE') {
    console.log('Account update for item:', webhookData.item_id)
    
    // In a real implementation, you would refresh account data
    // and update balances in your database
  }
}