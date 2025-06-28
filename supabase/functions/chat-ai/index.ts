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
    console.log('=== CHAT AI EDGE FUNCTION START ===')
    console.log('Edge function called with method:', req.method)
    
    const { message, userId } = await req.json()
    console.log('📥 REQUEST:', {
      messageLength: message?.length || 0,
      userId: userId || 'MISSING',
      messagePreview: message?.substring(0, 50) + '...'
    })

    if (!message || !userId) {
      throw new Error('Missing required parameters: message and userId')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    console.log('🔍 FETCHING USER CONTEXT...')

    // Get comprehensive user context from database
    const [userResult, goalsResult, xpResult, chatsResult, profileResult, accountsResult] = await Promise.all([
      supabaseClient.from('users').select('*').eq('id', userId).single(),
      supabaseClient.from('goals').select('*').eq('user_id', userId),
      supabaseClient.from('xp').select('*').eq('user_id', userId).single(),
      supabaseClient.from('chat_logs').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(10),
      supabaseClient.from('user_profiles').select('*').eq('user_id', userId).single(),
      supabaseClient.from('bank_accounts').select('*').eq('user_id', userId)
    ])

    const userData = userResult.data
    const goalsData = goalsResult.data || []
    const xpData = xpResult.data
    const recentChats = chatsResult.data || []
    const profileData = profileResult.data
    const accountsData = accountsResult.data || []

    console.log('📊 USER CONTEXT FETCHED:', {
      user: userData?.full_name || 'Unknown',
      goals: goalsData.length,
      xp: xpData?.points || 0,
      chats: recentChats.length,
      accounts: accountsData.length,
      experience: profileData?.financial_experience || 'Unknown'
    })

    // Calculate financial metrics
    const totalBalance = accountsData.reduce((sum, acc) => sum + (acc.balance || 0), 0)
    const totalGoalAmount = goalsData.reduce((sum, goal) => sum + (goal.target_amount || 0), 0)
    const totalSavedAmount = goalsData.reduce((sum, goal) => sum + (goal.saved_amount || 0), 0)
    const goalProgress = totalGoalAmount > 0 ? (totalSavedAmount / totalGoalAmount) * 100 : 0

    // Build comprehensive context for AI
    const userContext = {
      name: userData?.full_name || 'User',
      email: userData?.email,
      level: Math.floor((xpData?.points || 0) / 100) + 1,
      xp: xpData?.points || 0,
      badges: xpData?.badges || [],
      experience: profileData?.financial_experience || 'Beginner',
      goals: goalsData,
      accounts: accountsData,
      totalBalance,
      totalGoalAmount,
      totalSavedAmount,
      goalProgress,
      recentConversation: recentChats.reverse()
    }

    // Create enhanced system prompt with comprehensive user context
    const systemPrompt = `You are Sensei DoughJo, an AI-powered financial advisor for DoughJo, a premium personal finance app. You're helping ${userContext.name}, who is currently at Level ${userContext.level} with ${userContext.xp} XP.

COMPREHENSIVE USER PROFILE:
- Name: ${userContext.name}
- Experience Level: ${userContext.experience}
- Current Level: ${userContext.level} (${userContext.xp} XP)
- Total Account Balance: $${userContext.totalBalance.toLocaleString()}
- Connected Accounts: ${userContext.accounts.length}
- Active Goals: ${userContext.goals.length}
- Goal Progress: ${userContext.goalProgress.toFixed(1)}% (${userContext.totalSavedAmount.toLocaleString()} of ${userContext.totalGoalAmount.toLocaleString()})

FINANCIAL ACCOUNTS:
${userContext.accounts.map(acc => 
  `- ${acc.name} (${acc.institution_name}): $${(acc.balance || 0).toLocaleString()} [${acc.type}/${acc.subtype}]`
).join('\n') || 'No accounts connected yet'}

FINANCIAL GOALS:
${userContext.goals.map(goal => {
  const progress = goal.target_amount ? ((goal.saved_amount || 0) / goal.target_amount) * 100 : 0;
  return `- ${goal.name}: $${(goal.saved_amount || 0).toLocaleString()} saved of $${(goal.target_amount || 0).toLocaleString()} target (${progress.toFixed(1)}% complete) ${goal.deadline ? `Due: ${goal.deadline}` : 'No deadline'}`;
}).join('\n') || 'No goals set yet'}

RECENT CONVERSATION CONTEXT:
${userContext.recentConversation.slice(-8).map(chat => 
  `${chat.sender === 'user' ? 'User' : 'Sensei DoughJo'}: ${chat.message}`
).join('\n') || 'This is the start of your conversation'}

YOUR PERSONALITY & APPROACH:
- Wise financial sensei with martial arts philosophy
- Encouraging and motivational about financial goals
- Provide specific, actionable advice based on their actual data
- Reference their real goals, account balances, and progress
- Celebrate achievements and guide through challenges
- Use warm, professional tone befitting a premium service

RESPONSE GUIDELINES:
- Keep responses concise but helpful (2-4 sentences typically)
- Always reference their actual financial data when relevant
- Provide specific, actionable advice based on their real situation
- If they have goals, reference progress and suggest optimizations
- If they have accounts, mention specific opportunities
- Be encouraging about their financial journey and progress
- Focus on building good financial habits and mindset

CURRENT CONTEXT: The user just said: "${message}"`

    // Check for OpenRouter API key
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
    console.log('🔑 API KEY STATUS:', {
      hasOpenRouterKey: !!openRouterKey,
      keyLength: openRouterKey?.length || 0
    })
    
    if (!openRouterKey) {
      console.log('⚠️ OpenRouter API key not found, using enhanced fallback')
      throw new Error('OpenRouter API key not configured')
    }

    console.log('🤖 CALLING OPENROUTER API...')

    // Call OpenRouter API with free model
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://doughjo.app',
        'X-Title': 'DoughJo AI Financial Sensei',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free', // Free model with good performance
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 400,
        temperature: 0.7,
        top_p: 0.9,
      }),
    })

    console.log('📡 OPENROUTER RESPONSE:', {
      status: openRouterResponse.status,
      statusText: openRouterResponse.statusText,
      ok: openRouterResponse.ok
    })

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text()
      console.error(`❌ OpenRouter API error: ${openRouterResponse.status} - ${errorText}`)
      
      // If rate limited on free model, try backup model
      if (openRouterResponse.status === 429) {
        console.log('🔄 TRYING BACKUP MODEL...')
        
        const backupResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://doughjo.app',
            'X-Title': 'DoughJo AI Financial Sensei',
          },
          body: JSON.stringify({
            model: 'google/gemma-2-9b-it:free', // Alternative free model
            messages: [
              {
                role: 'user',
                content: `${systemPrompt}\n\nUser message: ${message}`
              }
            ],
            max_tokens: 400,
            temperature: 0.7,
          }),
        })
        
        if (backupResponse.ok) {
          const backupData = await backupResponse.json()
          const aiResponse = backupData.choices[0]?.message?.content || generateEnhancedFallback(message, userContext)
          
          console.log('✅ BACKUP MODEL SUCCESS')
          return new Response(
            JSON.stringify({ response: aiResponse }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            },
          )
        }
      }
      
      throw new Error(`OpenRouter API error: ${openRouterResponse.status} - ${errorText}`)
    }

    const openRouterData = await openRouterResponse.json()
    console.log('✅ OPENROUTER SUCCESS')
    
    const aiResponse = openRouterData.choices[0]?.message?.content || generateEnhancedFallback(message, userContext)

    console.log('📤 SENDING RESPONSE:', {
      responseLength: aiResponse.length,
      responsePreview: aiResponse.substring(0, 100) + '...'
    })

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('❌ ERROR IN CHAT-AI FUNCTION:', error)
    
    // Enhanced fallback with user context if available
    let fallbackResponse = "I'm here to help with your financial goals! What would you like to know about budgeting, saving, or investing?"
    
    try {
      // Try to get basic user context for better fallback
      const { userId } = await req.json()
      if (userId) {
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        )
        
        const [userResult, goalsResult] = await Promise.all([
          supabaseClient.from('users').select('full_name').eq('id', userId).single(),
          supabaseClient.from('goals').select('name, target_amount, saved_amount').eq('user_id', userId).limit(3)
        ])
        
        const userName = userResult.data?.full_name || 'there'
        const goals = goalsResult.data || []
        
        if (goals.length > 0) {
          fallbackResponse = `Hi ${userName}! I can see you have ${goals.length} financial goal${goals.length > 1 ? 's' : ''} in progress. I'm experiencing some technical difficulties with my AI processing, but I'm still here to help with your financial planning! What would you like to discuss?`
        } else {
          fallbackResponse = `Hi ${userName}! I'm experiencing some technical difficulties with my AI processing, but I'm still here to help you build a strong financial foundation. What financial topic interests you most?`
        }
      }
    } catch (fallbackError) {
      console.error('Fallback context fetch failed:', fallbackError)
    }

    return new Response(
      JSON.stringify({ 
        response: fallbackResponse,
        error: error.message,
        debug: 'Function executed but encountered an error'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  }
})

// Enhanced fallback response generator with user context
function generateEnhancedFallback(message: string, userContext: any): string {
  const lowerMessage = message.toLowerCase()
  const { name, totalBalance, goals, goalProgress, experience } = userContext
  
  // Budget-related responses
  if (lowerMessage.includes('budget') || lowerMessage.includes('spending')) {
    if (totalBalance > 0) {
      return `Great question, ${name}! With $${totalBalance.toLocaleString()} across your accounts, let's create a budget that works for you. I recommend the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings. Based on your current balance, you're in a good position to optimize your spending!`
    }
    return `Creating a budget is a great first step, ${name}! I recommend the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment. Would you like help setting up specific budget categories?`
  }
  
  // Investment-related responses
  if (lowerMessage.includes('invest') || lowerMessage.includes('stock') || lowerMessage.includes('portfolio')) {
    if (experience === 'Beginner') {
      return `Perfect timing to start investing, ${name}! As a beginner, I recommend starting with low-cost index funds or ETFs. They provide instant diversification and typically have lower fees. With your current financial position, you could start with as little as $100 monthly.`
    }
    return `Investing is key to building long-term wealth, ${name}! For your experience level, consider diversifying across asset classes. What's your investment timeline and risk tolerance?`
  }
  
  // Goal-related responses
  if (lowerMessage.includes('goal') || lowerMessage.includes('plan')) {
    if (goals.length > 0) {
      return `You're doing great with your ${goals.length} financial goal${goals.length > 1 ? 's' : ''}, ${name}! At ${goalProgress.toFixed(1)}% progress overall, you're building solid momentum. Let's optimize your strategy to reach your targets faster!`
    }
    return `Setting clear financial goals is essential for success, ${name}! I recommend making them SMART: Specific, Measurable, Achievable, Relevant, and Time-bound. What financial milestone would you like to work toward first?`
  }
  
  // Savings-related responses
  if (lowerMessage.includes('save') || lowerMessage.includes('emergency fund')) {
    return `Building an emergency fund is crucial for financial security, ${name}! Aim for 3-6 months of expenses in a high-yield savings account. Start small - even $25 per week adds up to $1,300 in a year. What's your current savings goal?`
  }
  
  // General personalized response
  if (totalBalance > 0 && goals.length > 0) {
    return `I'm here to help optimize your financial strategy, ${name}! With $${totalBalance.toLocaleString()} in accounts and ${goalProgress.toFixed(1)}% progress toward your goals, you're building a solid foundation. What specific area would you like to focus on today?`
  }
  
  return `I'm here to help you build a stronger financial future, ${name}! Whether it's budgeting, saving, investing, or debt management, we can work together to create a plan that works for you. What's your biggest financial priority right now?`
}