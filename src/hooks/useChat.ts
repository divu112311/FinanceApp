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

export const useChat = (user: User | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && isSupabaseConfigured) {
      fetchChatHistory();
    }
  }, [user]);

  const fetchChatHistory = async () => {
    if (!user || !isSupabaseConfigured) return;

    try {
      const { data, error } = await supabase
        .from('chat_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching chat history:', error);
        return;
      }

      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const sendMessage = async (message: string, onXPUpdate?: (points: number) => void) => {
    if (!user || !message.trim()) return;

    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        // Handle offline mode with mock responses
        const mockUserMessage: ChatMessage = {
          id: Date.now().toString(),
          user_id: user.id,
          message: message.trim(),
          sender: 'user',
          timestamp: new Date().toISOString(),
        };

        const mockAiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          user_id: user.id,
          message: generateContextualResponse(message),
          sender: 'assistant',
          timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, mockUserMessage, mockAiMessage]);
        
        if (onXPUpdate) {
          onXPUpdate(5);
        }
        return;
      }

      // Add user message to database
      const { data: userMessage, error: userError } = await supabase
        .from('chat_logs')
        .insert({
          user_id: user.id,
          message: message.trim(),
          sender: 'user',
        })
        .select()
        .single();

      if (userError) throw userError;

      // Update local state immediately
      setMessages(prev => [...prev, userMessage]);

      // Call OpenAI API through Supabase Edge Function
      const { data: aiResponseData, error: aiError } = await supabase.functions.invoke('chat-ai', {
        body: {
          message: message.trim(),
          userId: user.id,
        },
      });

      if (aiError) {
        console.error('AI API Error:', aiError);
        throw aiError;
      }

      const aiResponse = aiResponseData?.response || generateContextualResponse(message);

      // Add AI response to database
      const { data: aiMessage, error: aiMessageError } = await supabase
        .from('chat_logs')
        .insert({
          user_id: user.id,
          message: aiResponse,
          sender: 'assistant',
        })
        .select()
        .single();

      if (aiMessageError) throw aiMessageError;

      // Update local state with AI response
      setMessages(prev => [...prev, aiMessage]);

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
        } catch (dbError) {
          console.error('Error saving fallback message:', dbError);
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
    } finally {
      setLoading(false);
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
    loading,
    sendMessage,
    refetch: fetchChatHistory,
  };
};