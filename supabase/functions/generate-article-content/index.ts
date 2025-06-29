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
    console.log('=== GENERATE ARTICLE CONTENT FUNCTION START ===')
    console.log('Edge function called with method:', req.method)
    
    const { userId, topic, difficulty } = await req.json()
    console.log('📥 REQUEST:', {
      userId: userId || 'MISSING',
      topic: topic || 'general',
      difficulty: difficulty || 'Beginner'
    })

    if (!userId) {
      throw new Error('Missing required parameter: userId')
    }

    // Initialize Supabase client with service role key for full data access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for admin access
    )

    console.log('🔍 FETCHING USER DATA...')

    // Get user data to personalize content
    const [userResult, goalsResult, accountsResult, profileResult] = await Promise.all([
      supabaseClient.from('users').select('*').eq('id', userId).single(),
      supabaseClient.from('goals').select('*').eq('user_id', userId),
      supabaseClient.from('bank_accounts').select('*').eq('user_id', userId),
      supabaseClient.from('user_profiles').select('*').eq('user_id', userId).single()
    ])

    const userData = userResult.data
    const goalsData = goalsResult.data || []
    const accountsData = accountsResult.data || []
    const profileData = profileResult.data

    console.log('📊 USER DATA FETCHED:', {
      user: userData?.first_name || userData?.full_name || 'Unknown',
      goals: goalsData.length,
      accounts: accountsData.length,
      experience: profileData?.financial_experience || 'Unknown'
    })

    // Check for OpenRouter API key to generate personalized content
    const openRouterKey = Deno.env.get('OPENROUTER_API_KEY')
    console.log('🔑 API KEY STATUS:', {
      hasOpenRouterKey: !!openRouterKey,
      keyLength: openRouterKey?.length || 0
    })
    
    let content = null
    
    if (openRouterKey) {
      console.log('🤖 GENERATING AI ARTICLE CONTENT...')
      
      // Prepare user context for personalization
      const userContext = {
        name: userData?.first_name || userData?.full_name?.split(' ')[0] || 'User',
        experience: profileData?.financial_experience || 'Beginner',
        goals: goalsData.map(g => g.name),
        hasAccounts: accountsData.length > 0,
        accountTypes: [...new Set(accountsData.map(a => a.type))]
      }
      
      const prompt = `Generate an educational article about ${topic} for a ${difficulty} level user. 

USER CONTEXT:
${JSON.stringify(userContext, null, 2)}

The article should have:
1. A compelling title
2. 4-5 sections, each with a clear heading and informative content
3. Practical, actionable advice the user can implement
4. Content appropriate for the user's experience level (${difficulty})

FORMAT YOUR RESPONSE AS A JSON OBJECT:
{
  "title": "Article Title Here",
  "sections": [
    {
      "title": "Section 1 Title",
      "content": "Section 1 content paragraphs..."
    },
    {
      "title": "Section 2 Title",
      "content": "Section 2 content paragraphs..."
    }
  ]
}

IMPORTANT GUIDELINES:
1. Make content practical and actionable
2. Use clear, concise language appropriate for the ${difficulty} level
3. Include specific examples and steps
4. Personalize based on the user's context when possible
5. Keep each section to 1-2 paragraphs (150-250 words)
6. Return ONLY the JSON object with no additional text`

      try {
        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://doughjo.app',
            'X-Title': 'DoughJo Article Generator',
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.1-8b-instruct:free', // Free model with good performance
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            max_tokens: 1500,
            temperature: 0.7,
            response_format: { type: "json_object" }
          }),
        })

        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          const aiContent = aiData.choices[0]?.message?.content
          
          console.log('✅ AI ARTICLE GENERATED')
          console.log('AI response preview:', aiContent.substring(0, 200) + '...')
          
          try {
            // Parse the AI response
            let parsedContent
            
            // Handle different response formats
            if (typeof aiContent === 'string') {
              // Try to extract JSON from the string
              const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
              if (jsonMatch) {
                parsedContent = JSON.parse(jsonMatch[0])
              } else {
                throw new Error('Could not extract JSON from AI response')
              }
            } else {
              // Try to use the content directly
              parsedContent = aiContent
            }
            
            content = parsedContent
          } catch (parseError) {
            console.error('Error parsing AI content:', parseError)
            console.log('Raw AI response:', aiContent)
            // Fall back to default content
            content = generateDefaultContent(topic, difficulty)
          }
        } else {
          console.error('Error generating AI content:', await aiResponse.text())
          // Fall back to default content
          content = generateDefaultContent(topic, difficulty)
        }
      } catch (aiError) {
        console.error('Error calling AI service:', aiError)
        // Fall back to default content
        content = generateDefaultContent(topic, difficulty)
      }
    } else {
      console.log('No OpenRouter API key, using default content')
      content = generateDefaultContent(topic, difficulty)
    }

    console.log('=== GENERATE ARTICLE CONTENT FUNCTION SUCCESS ===')

    return new Response(
      JSON.stringify({ 
        success: true, 
        content,
        generated: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('=== GENERATE ARTICLE CONTENT FUNCTION FAILED ===')
    console.error('❌ ERROR DETAILS:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    })
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        debug: 'Failed to generate article content',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Generate default content based on topic and difficulty
function generateDefaultContent(topic, difficulty) {
  // Default content based on topic
  const defaultContent = {
    budgeting: {
      title: "Mastering Your Budget: A Practical Guide",
      sections: [
        {
          title: "Understanding Your Cash Flow",
          content: "The foundation of any budget is understanding your cash flow - how much money comes in and goes out each month. Start by tracking all income sources and categorizing your expenses for at least 30 days. This baseline will reveal your actual spending patterns rather than what you think they are."
        },
        {
          title: "The 50/30/20 Framework",
          content: "A simple but effective budgeting framework is the 50/30/20 rule. Allocate 50% of your after-tax income to needs (housing, utilities, groceries, transportation), 30% to wants (dining out, entertainment, hobbies), and 20% to savings and debt repayment. This balanced approach ensures you're covering essentials while still enjoying life and building financial security."
        },
        {
          title: "Zero-Based Budgeting",
          content: "In zero-based budgeting, you assign every dollar of income to a specific category until your income minus your expenses equals zero. This doesn't mean spending everything - savings and investments are categories too. The key benefit is intentionality: every dollar has a purpose."
        },
        {
          title: "Practical Implementation",
          content: "Choose a budgeting method that fits your personality. Tech-savvy individuals might prefer apps like YNAB or Mint, while others might prefer spreadsheets or the envelope system. The best budget is one you'll actually use consistently."
        }
      ]
    },
    investing: {
      title: "Investment Fundamentals: Building Wealth Systematically",
      sections: [
        {
          title: "The Power of Compound Interest",
          content: "Albert Einstein allegedly called compound interest the eighth wonder of the world. When you invest, you earn returns not just on your initial investment, but also on the accumulated interest over time. This creates an exponential growth curve that accelerates as time passes."
        },
        {
          title: "Asset Allocation Basics",
          content: "Asset allocation - how you divide your investments among stocks, bonds, and other asset classes - is responsible for about 90% of your portfolio's volatility. Your ideal allocation depends on your time horizon, risk tolerance, and financial goals."
        },
        {
          title: "Index Fund Investing",
          content: "For most investors, low-cost index funds are the most efficient way to invest. Rather than trying to pick winning stocks or time the market (which even professionals struggle to do consistently), index funds give you broad market exposure with minimal fees."
        },
        {
          title: "Dollar-Cost Averaging",
          content: "Investing a fixed amount regularly, regardless of market conditions, is called dollar-cost averaging. This strategy removes the emotional component of investing and prevents the common mistake of buying high and selling low."
        }
      ]
    },
    savings: {
      title: "Strategic Saving: Beyond the Basics",
      sections: [
        {
          title: "Emergency Fund Fundamentals",
          content: "Before focusing on other financial goals, establish an emergency fund covering 3-6 months of essential expenses. Keep this money in a high-yield savings account where it's liquid but still earning some return."
        },
        {
          title: "The Savings Rate Imperative",
          content: "Your savings rate - the percentage of income you save - is the most important factor in building wealth. Even small increases in your savings rate can dramatically accelerate your progress toward financial independence."
        },
        {
          title: "Automating Your Savings",
          content: "Set up automatic transfers to your savings accounts on payday. This 'pay yourself first' approach ensures saving happens before discretionary spending and removes the willpower element from the equation."
        },
        {
          title: "Strategic Savings Buckets",
          content: "Beyond your emergency fund, create separate savings 'buckets' for different goals with different time horizons. Short-term goals (under 3 years) should stay in cash equivalents, while medium-term goals (3-7 years) might include some conservative investments."
        }
      ]
    },
    credit: {
      title: "Mastering Your Credit: Building and Maintaining Excellent Credit",
      sections: [
        {
          title: "Understanding Credit Scores",
          content: "Your credit score is a numerical representation of your creditworthiness, typically ranging from 300-850. The main factors affecting your score are payment history (35%), credit utilization (30%), length of credit history (15%), new credit (10%), and credit mix (10%)."
        },
        {
          title: "Strategic Credit Card Usage",
          content: "Used responsibly, credit cards can be powerful financial tools. Pay your balance in full each month, keep utilization below 30% (ideally below 10%), and choose cards with rewards that match your spending patterns."
        },
        {
          title: "Building Credit from Scratch",
          content: "If you're new to credit, start with a secured credit card or become an authorized user on someone else's account. Make small purchases and pay them off immediately to establish a positive payment history."
        },
        {
          title: "Monitoring and Protecting Your Credit",
          content: "Regularly check your credit reports from all three bureaus for errors or fraudulent activity. You're entitled to free weekly reports from AnnualCreditReport.com. Consider freezing your credit when you're not actively applying for new credit to prevent identity theft."
        }
      ]
    },
    general: {
      title: "Financial Wellness: A Holistic Approach",
      sections: [
        {
          title: "The Financial Wellness Framework",
          content: "Financial wellness goes beyond just having money - it's about having security, freedom of choice, and the ability to absorb financial shocks. The key components are spending less than you earn, having adequate protection, debt management, saving for goals, and investing for the future."
        },
        {
          title: "The Wealth-Building Formula",
          content: "Building wealth comes down to a simple formula: Earn more, spend less, and invest the difference wisely. While simple in concept, each component requires specific strategies and consistent execution."
        },
        {
          title: "Financial Decision-Making",
          content: "Many financial decisions involve tradeoffs between present and future benefits. Developing a decision-making framework that aligns with your values helps ensure your financial choices support your long-term goals while still allowing you to enjoy the present."
        },
        {
          title: "The Psychology of Money",
          content: "Our financial behaviors are driven more by psychology than by math. Understanding your money scripts - unconscious beliefs about money formed in childhood - can help you identify and change patterns that may be hindering your financial progress."
        }
      ]
    }
  }
  
  // Select content based on topic
  let content = defaultContent.general
  
  // Match topic to available content sets
  for (const [key, value] of Object.entries(defaultContent)) {
    if (topic.toLowerCase().includes(key)) {
      content = value
      break
    }
  }
  
  // Adjust content based on difficulty
  if (difficulty === 'Intermediate' || difficulty === 'Advanced') {
    // For a real implementation, we would have different content for different difficulty levels
    // For this implementation, we'll just use what we have
    content.title = `Advanced ${content.title}`
  }
  
  return content
}