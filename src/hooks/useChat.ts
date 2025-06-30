import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface ChatMessage {
  id: string;
  user_id: string | null;
  message: string | null;
  sender: string | null;
  timestamp: string | null;
}

interface ChatSession {
  session_id: string;
  user_id: string;
  title: string | null;
  context_data: any | null;
  started_at: string;
  last_message_at: string;
  is_active: boolean;
}

interface NewChatMessage {
  message_id: string;
  session_id: string;
  user_id: string;
  message_type: string;
  content: string;
  metadata: any | null;
  ai_model_used: string | null;
  response_time: number | null;
  created_at: string;
}

export const useChat = (user: User | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isSupabaseConfigured) {
      fetchChatSessions();
    } else if (user) {
      // Set demo messages if user is logged in but Supabase is not configured
      setDemoMessages();
    }
  }, [user]);

  const setDemoMessages = () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    
    const demoMessages: ChatMessage[] = [
      {
        id: 'demo-msg-1',
        user_id: user?.id || null,
        message: 'Hi! I need help creating a budget. Where should I start?',
        sender: 'user',
        timestamp: tenMinutesAgo.toISOString()
      },
      {
        id: 'demo-msg-2',
        user_id: user?.id || null,
        message: 'Great question! Let\'s start with the 50/30/20 rule. Track your monthly income first, then allocate 50% to needs like rent and groceries, 30% to wants like entertainment, and 20% to savings and debt payments. What\'s your monthly take-home income?',
        sender: 'assistant',
        timestamp: fiveMinutesAgo.toISOString()
      }
    ];
    
    setMessages(demoMessages);
    setLoading(false);
  };

  useEffect(() => {
    if (currentSessionId) {
      fetchChatMessages(currentSessionId);
    }
  }, [currentSessionId]);

  const fetchChatSessions = async () => {
    if (!user || !isSupabaseConfigured) return;

    try {
      console.log('=== FETCHING CHAT SESSIONS ===');
      console.log('User ID:', user.id);

      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('Error fetching chat sessions:', error);
        return;
      }

      console.log('Chat sessions fetched:', data?.length || 0, 'sessions');
      setSessions(data || []);

      // Set current session to the most recent active one, or create a new one
      if (data && data.length > 0) {
        const activeSession = data.find(session => session.is_active);
        if (activeSession) {
          setCurrentSessionId(activeSession.session_id);
        } else {
          createNewSession();
        }
      } else {
        createNewSession();
      }
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      // Fall back to demo messages
      setDemoMessages();
    }
  };

  const fetchChatMessages = async (sessionId: string) => {
    if (!user || !isSupabaseConfigured) return;

    try {
      console.log('=== FETCHING CHAT MESSAGES ===');
      console.log('Session ID:', sessionId);

      // Try to fetch from new chat_messages table first
      const { data: newMessages, error: newMessagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (newMessagesError) {
        console.error('Error fetching new chat messages:', newMessagesError);
      }

      if (newMessages && newMessages.length > 0) {
        // Convert new message format to old format for compatibility
        const convertedMessages = newMessages.map(msg => ({
          id: msg.message_id,
          user_id: msg.user_id,
          message: msg.content,
          sender: msg.message_type === 'user_message' ? 'user' : 'assistant',
          timestamp: msg.created_at
        }));
        
        setMessages(convertedMessages);
        return;
      }

      // Fallback to old chat_logs table
      const { data: oldMessages, error: oldMessagesError } = await supabase
        .from('chat_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true });

      if (oldMessagesError) {
        console.error('Error fetching old chat messages:', oldMessagesError);
        // Fall back to demo messages
        setDemoMessages();
        return;
      }

      console.log('Chat messages fetched:', oldMessages?.length || 0, 'messages');
      setMessages(oldMessages || []);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      // Fall back to demo messages
      setDemoMessages();
    }
  };

  const createNewSession = async () => {
    if (!user) return;

    try {
      console.log('=== CREATING NEW CHAT SESSION ===');
      
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, using local session');
        const localSessionId = 'local-session-' + Date.now();
        setCurrentSessionId(localSessionId);
        setDemoMessages();
        return;
      }
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: 'New Conversation',
          context_data: {},
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating chat session:', error);
        return;
      }

      console.log('New chat session created:', data.session_id);
      setSessions(prev => [data, ...prev]);
      setCurrentSessionId(data.session_id);
      setMessages([]);
    } catch (error) {
      console.error('Error creating chat session:', error);
      // Fall back to demo messages
      setDemoMessages();
    }
  };

  const sendMessage = async (message: string, onXPUpdate?: (points: number) => void) => {
    if (!user || !message.trim()) return;

    console.log('=== SENDING MESSAGE ===');
    console.log('Message:', message);
    console.log('User ID:', user.id);
    console.log('Session ID:', currentSessionId);

    setLoading(true);

    try {
      // Create a session if none exists
      if (!currentSessionId) {
        await createNewSession();
        if (!currentSessionId && !isSupabaseConfigured) {
          const localSessionId = 'local-session-' + Date.now();
          setCurrentSessionId(localSessionId);
        } else if (!currentSessionId) {
          throw new Error('Failed to create chat session');
        }
      }

      // If Supabase is not configured, use local messages
      if (!isSupabaseConfigured) {
        const userMessage: ChatMessage = {
          id: 'local-' + Date.now(),
          user_id: user.id,
          message: message.trim(),
          sender: 'user',
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, userMessage]);
        
        // Generate a local response
        setTimeout(() => {
          const aiResponse = generateContextualResponse(message);
          
          const assistantMessage: ChatMessage = {
            id: 'local-' + (Date.now() + 1),
            user_id: user.id,
            message: aiResponse,
            sender: 'assistant',
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          setLoading(false);
          
          // Award XP for chat interaction
          if (onXPUpdate) {
            onXPUpdate(5);
          }
        }, 1000);
        
        return;
      }

      // Determine which table to use based on availability
      const useNewMessageFormat = await checkTableExists('chat_messages');
      
      if (useNewMessageFormat && currentSessionId) {
        // Add user message to new chat_messages table
        console.log('Adding user message to chat_messages table...');
        const { data: userMessage, error: userError } = await supabase
          .from('chat_messages')
          .insert({
            session_id: currentSessionId,
            user_id: user.id,
            message_type: 'user_message',
            content: message.trim(),
            metadata: {}
          })
          .select()
          .single();

        if (userError) {
          console.error('Error saving user message:', userError);
          throw userError;
        }

        console.log('User message saved:', userMessage.message_id);

        // Update local state with converted format for compatibility
        const convertedUserMessage: ChatMessage = {
          id: userMessage.message_id,
          user_id: userMessage.user_id,
          message: userMessage.content,
          sender: 'user',
          timestamp: userMessage.created_at
        };
        
        setMessages(prev => [...prev, convertedUserMessage]);

        // Update session last_message_at
        await supabase
          .from('chat_sessions')
          .update({ last_message_at: new Date().toISOString() })
          .eq('session_id', currentSessionId);

        // Call AI API through Supabase Edge Function
        console.log('Calling AI Edge Function...');
        const startTime = Date.now();
        const { data: aiResponseData, error: aiError } = await supabase.functions.invoke('chat-ai', {
          body: {
            message: message.trim(),
            userId: user.id,
            sessionId: currentSessionId
          },
        });
        const responseTime = Date.now() - startTime;

        console.log('AI Response received in', responseTime, 'ms:', {
          hasData: !!aiResponseData,
          hasError: !!aiError,
          response: aiResponseData?.response?.substring(0, 100) + '...'
        });

        if (aiError) {
          console.error('AI API Error:', aiError);
          throw aiError;
        }

        const aiResponse = aiResponseData?.response || generateContextualResponse(message);

        // Add AI response to chat_messages table
        console.log('Saving AI response to chat_messages table...');
        const { data: aiMessage, error: aiMessageError } = await supabase
          .from('chat_messages')
          .insert({
            session_id: currentSessionId,
            user_id: user.id,
            message_type: 'ai_response',
            content: aiResponse,
            metadata: {
              model: aiResponseData?.model || 'fallback',
              tokens: aiResponseData?.tokens || 0,
              response_time: responseTime
            },
            ai_model_used: aiResponseData?.model || 'fallback',
            response_time: responseTime
          })
          .select()
          .single();

        if (aiMessageError) {
          console.error('Error saving AI message:', aiMessageError);
          throw aiMessageError;
        }

        console.log('AI message saved:', aiMessage.message_id);

        // Update local state with converted format for compatibility
        const convertedAiMessage: ChatMessage = {
          id: aiMessage.message_id,
          user_id: aiMessage.user_id,
          message: aiMessage.content,
          sender: 'assistant',
          timestamp: aiMessage.created_at
        };
        
        setMessages(prev => [...prev, convertedAiMessage]);
      } else {
        // Fallback to old chat_logs table
        // Add user message to database
        console.log('Adding user message to chat_logs table...');
        const { data: userMessage, error: userError } = await supabase
          .from('chat_logs')
          .insert({
            user_id: user.id,
            message: message.trim(),
            sender: 'user',
          })
          .select()
          .single();

        if (userError) {
          console.error('Error saving user message:', userError);
          throw userError;
        }

        console.log('User message saved:', userMessage.id);

        // Update local state immediately
        setMessages(prev => [...prev, userMessage]);

        // Call AI API through Supabase Edge Function
        console.log('Calling AI Edge Function...');
        const startTime = Date.now();
        const { data: aiResponseData, error: aiError } = await supabase.functions.invoke('chat-ai', {
          body: {
            message: message.trim(),
            userId: user.id,
          },
        });
        const responseTime = Date.now() - startTime;

        console.log('AI Response received in', responseTime, 'ms:', {
          hasData: !!aiResponseData,
          hasError: !!aiError,
          response: aiResponseData?.response?.substring(0, 100) + '...'
        });

        if (aiError) {
          console.error('AI API Error:', aiError);
          throw aiError;
        }

        const aiResponse = aiResponseData?.response || generateContextualResponse(message);

        // Add AI response to database
        console.log('Saving AI response to chat_logs table...');
        const { data: aiMessage, error: aiMessageError } = await supabase
          .from('chat_logs')
          .insert({
            user_id: user.id,
            message: aiResponse,
            sender: 'assistant',
          })
          .select()
          .single();

        if (aiMessageError) {
          console.error('Error saving AI message:', aiMessageError);
          throw aiMessageError;
        }

        console.log('AI message saved:', aiMessage.id);

        // Update local state with AI response
        setMessages(prev => [...prev, aiMessage]);
      }

      // Generate financial insight if appropriate
      if (shouldGenerateInsight(message)) {
        generateFinancialInsight(message);
      }

      // Award XP for chat interaction
      if (onXPUpdate) {
        onXPUpdate(5);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add fallback response on error
      const fallbackResponse = generateContextualResponse(message);
      
      if (isSupabaseConfigured) {
        try {
          if (currentSessionId && await checkTableExists('chat_messages')) {
            const { data: fallbackMessage } = await supabase
              .from('chat_messages')
              .insert({
                session_id: currentSessionId,
                user_id: user.id,
                message_type: 'ai_response',
                content: fallbackResponse,
                metadata: { fallback: true }
              })
              .select()
              .single();

            if (fallbackMessage) {
              const convertedMessage: ChatMessage = {
                id: fallbackMessage.message_id,
                user_id: fallbackMessage.user_id,
                message: fallbackMessage.content,
                sender: 'assistant',
                timestamp: fallbackMessage.created_at
              };
              
              setMessages(prev => [...prev, convertedMessage]);
            }
          } else {
            const { data: fallbackMessage } = await supabase
              .from('chat_logs')
              .insert({
                user_id: user.id,
                message: fallbackResponse,
                sender: 'assistant',
              })
              .select()
              .single();

            if (fallbackMessage) {
              setMessages(prev => [...prev, fallbackMessage]);
            }
          }
        } catch (dbError) {
          console.error('Error saving fallback message:', dbError);
          // Add message to local state if database operation fails
          const fallbackMessage: ChatMessage = {
            id: Date.now().toString(),
            user_id: user.id,
            message: fallbackResponse,
            sender: 'assistant',
            timestamp: new Date().toISOString(),
          };
          setMessages(prev => [...prev, fallbackMessage]);
        }
      } else {
        // Offline fallback
        const fallbackMessage: ChatMessage = {
          id: Date.now().toString(),
          user_id: user.id,
          message: fallbackResponse,
          sender: 'assistant',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, fallbackMessage]);
      }
      
      // Award XP even if there was an error
      if (onXPUpdate) {
        onXPUpdate(5);
      }
    } finally {
      setLoading(false);
    }
  };

  const shouldGenerateInsight = (message: string): boolean => {
    const insightTriggers = [
      'analyze', 'insight', 'review', 'how am i doing', 'financial health',
      'spending', 'budget', 'save more', 'investment', 'recommendation'
    ];
    
    return insightTriggers.some(trigger => 
      message.toLowerCase().includes(trigger)
    );
  };

  const generateFinancialInsight = async (message: string) => {
    if (!user || !isSupabaseConfigured || !currentSessionId) return;
    
    try {
      // Check if financial_insights table exists
      const hasInsightsTable = await checkTableExists('financial_insights');
      if (!hasInsightsTable) return;
      
      // Generate insight type based on message content
      let insightType = 'spending_pattern';
      if (message.toLowerCase().includes('invest')) {
        insightType = 'investment_tip';
      } else if (message.toLowerCase().includes('goal')) {
        insightType = 'goal_recommendation';
      } else if (message.toLowerCase().includes('budget')) {
        insightType = 'budget_advice';
      }
      
      // Insert financial insight
      await supabase
        .from('financial_insights')
        .insert({
          user_id: user.id,
          insight_type: insightType,
          title: `AI-Generated ${insightType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
          description: `Based on your recent conversation, here's a personalized ${insightType.replace('_', ' ')} insight.`,
          data_sources: { chat_session_id: currentSessionId },
          confidence_score: 0.85,
          priority_level: 'medium',
          action_items: [
            { action: 'review', description: 'Review this insight' },
            { action: 'implement', description: 'Apply this recommendation' }
          ],
          created_at: new Date().toISOString()
        });
      
      console.log('Financial insight generated for message:', message.substring(0, 30) + '...');
    } catch (error) {
      console.error('Error generating financial insight:', error);
    }
  };

  const checkTableExists = async (tableName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      return !error;
    } catch (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
  };

  const generateContextualResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Budget-related responses
    if (lowerMessage.includes('budget') || lowerMessage.includes('spending')) {
      return "Creating a budget is a great first step! I recommend the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment. Would you like help setting up specific budget categories?";
    }
    
    // Investment-related responses
    if (lowerMessage.includes('invest') || lowerMessage.includes('stock') || lowerMessage.includes('portfolio')) {
      return "Investing is key to building long-term wealth! For beginners, I often recommend starting with low-cost index funds or ETFs. They provide instant diversification and typically have lower fees. What's your investment timeline and risk tolerance?";
    }
    
    // Savings-related responses
    if (lowerMessage.includes('save') || lowerMessage.includes('emergency fund')) {
      return "Building an emergency fund is crucial for financial security! Aim for 3-6 months of expenses in a high-yield savings account. Start small - even $25 per week adds up to $1,300 in a year. What's your current savings goal?";
    }
    
    // Debt-related responses
    if (lowerMessage.includes('debt') || lowerMessage.includes('loan') || lowerMessage.includes('credit card')) {
      return "Tackling debt is a smart financial move! Consider the debt avalanche method (pay minimums on all debts, then extra on highest interest rate) or debt snowball (smallest balance first). Which approach feels more motivating to you?";
    }
    
    // Goal-related responses
    if (lowerMessage.includes('goal') || lowerMessage.includes('plan')) {
      return "Setting clear financial goals is essential for success! I recommend making them SMART: Specific, Measurable, Achievable, Relevant, and Time-bound. What financial milestone would you like to work toward first?";
    }
    
    // General responses
    const generalResponses = [
      "That's a great question! Financial planning is all about making informed decisions that align with your goals. What specific area of your finances would you like to focus on?",
      "I'm here to help you build a stronger financial future! Whether it's budgeting, saving, investing, or debt management, we can work together to create a plan that works for you.",
      "Your financial journey is unique, and I'm here to provide personalized guidance. What's your biggest financial priority right now?",
      "Building wealth takes time and consistency. I'm here to help you make smart decisions along the way. What would you like to explore today?",
      "Financial wellness is about more than just numbers - it's about creating the life you want. How can I help you move closer to your financial goals?"
    ];
    
    return generalResponses[Math.floor(Math.random() * generalResponses.length)];
  };

  return {
    messages,
    sessions,
    currentSessionId,
    loading,
    sendMessage,
    createNewSession,
    refetch: fetchChatSessions,
  };
};