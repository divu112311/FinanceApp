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
    console.log('Edge function called with method:', req.method)
    
    const { message, userId } = await req.json()
    console.log('Received message:', message, 'for user:', userId)

    if (!message || !userId) {
      throw new Error('Missing required parameters: message and userId')
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    console.log('Fetching user context...')

    // Get user context from database
    const [userResult, goalsResult, xpResult, chatsResult] = await Promise.all([
      supabaseClient.from('users').select('*').eq('id', userId).single(),
      supabaseClient.from('goals').select('*').eq('user_id', userId),
      supabaseClient.from('xp').select('*').eq('user_id', userId).single(),
      supabaseClient.from('chat_logs').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(10)
    ])

    const userData = userResult.data
    const goalsData = goalsResult.data || []
    const xpData = xpResult.data
    const recentChats = chatsResult.data || []

    console.log('User data fetched:', {
      user: userData?.full_name,
      goals: goalsData.length,
      xp: xpData?.points,
      chats: recentChats.length
    })

    // Build context for AI
    const userContext = {
      name: userData?.full_name || 'User',
      email: userData?.email,
      level: Math.floor((xpData?.points || 0) / 100) + 1,
      xp: xpData?.points || 0,
      badges: xpData?.badges || [],
      goals: goalsData,
      recentConversation: recentChats.reverse()
    }

    // Create system prompt with user context
    const systemPrompt = `You are LuxeBot, an AI-powered financial concierge for LuxeFi, a premium personal finance app. You're helping ${userContext.name}, who is currently at Level ${userContext.level} with ${userContext.xp} XP.

User Context:
- Name: ${userContext.name}
- Current Level: ${userContext.level}
- XP Points: ${userContext.xp}
- Active Goals: ${userContext.goals.length} goals
- Badges Earned: ${userContext.badges.join(', ') || 'None yet'}

Financial Goals:
${userContext.goals.map(goal => 
  `- ${goal.name}: $${goal.saved_amount || 0} saved of $${goal.target_amount || 0} target (${goal.deadline ? `Due: ${goal.deadline}` : 'No deadline'})`
).join('\n') || 'No goals set yet'}

Recent Conversation Context:
${userContext.recentConversation.slice(-6).map(chat => 
  `${chat.sender === 'user' ? 'User' : 'LuxeBot'}: ${chat.message}`
).join('\n') || 'This is the start of your conversation'}

Your personality:
- Sophisticated yet approachable financial advisor
- Encouraging and motivational about financial goals
- Provide actionable, personalized advice
- Reference their goals and progress when relevant
- Celebrate their achievements and milestones
- Use a warm, professional tone befitting a luxury service

Guidelines:
- Keep responses concise but helpful (2-3 sentences typically)
- Always be encouraging about their financial journey
- Provide specific, actionable advice when possible
- Reference their current goals and progress when relevant
- If they ask about features not yet implemented, acknowledge it positively
- Focus on building good financial habits and mindset

Current user message: "${message}"`

    // Check if OpenRouter API key is available
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
    console.log('OpenRouter API key available:', !!openRouterKey)
    
    if (!openRouterKey) {
      console.log('OpenRouter API key not found, using fallback response')
      throw new Error('OpenRouter API key not configured')
    }

    console.log('Calling OpenRouter API with free model...')

    // Call OpenRouter API with free model
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://luxefi.app',
        'X-Title': 'LuxeFi AI Financial Concierge',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free', // Free model with 20 requests/minute
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
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    console.log('OpenRouter response status:', openRouterResponse.status)

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text()
      console.error(`OpenRouter API error: ${openRouterResponse.status} - ${errorText}`)
      
      // If rate limited on free model, try another free model
      if (openRouterResponse.status === 429) {
        console.log('Rate limited on primary free model, trying backup...')
        
        const backupResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://luxefi.app',
            'X-Title': 'LuxeFi AI Financial Concierge',
          },
          body: JSON.stringify({
            model: 'google/gemma-2-9b-it:free', // Alternative free model
            messages: [
              {
                role: 'user',
                content: `${systemPrompt}\n\nUser message: ${message}`
              }
            ],
            max_tokens: 300,
            temperature: 0.7,
          }),
        })
        
        if (backupResponse.ok) {
          const backupData = await backupResponse.json()
          const aiResponse = backupData.choices[0]?.message?.content || "I'm here to help with your financial goals!"
          
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
    console.log('OpenRouter response received')
    
    const aiResponse = openRouterData.choices[0]?.message?.content || "I'm here to help with your financial goals!"

    console.log('Sending response back to client')

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in chat-ai function:', error)
    
    // Enhanced fallback responses based on user context
    const fallbackResponses = [
      "I'm here to help with your financial goals! What would you like to know about budgeting, saving, or investing?",
      "Great question! Building good financial habits is the foundation of long-term wealth. What specific area interests you most?",
      "I'm experiencing some technical difficulties, but I'm still here to help with your financial planning!",
      "Your financial journey is important. Let me help you make smart decisions about your money.",
      "I'd love to help you optimize your finances. What's your biggest financial priority right now?"
    ]
    
    const fallbackResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)]

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