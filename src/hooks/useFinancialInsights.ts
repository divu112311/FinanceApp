import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface FinancialInsight {
  insight_id: string;
  user_id: string;
  insight_type: string;
  title: string;
  description: string;
  data_sources: any;
  confidence_score: number;
  priority_level: string;
  action_items: any[];
  is_dismissed: boolean;
  expires_at: string | null;
  created_at: string;
}

export const useFinancialInsights = (user: User | null) => {
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (user) {
      fetchInsights();
    }
  }, [user]);

  const fetchInsights = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    try {
      console.log('Fetching financial insights for user:', user.id);
      
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, using demo insights');
        setInsights(generateDemoInsights());
        setLastUpdated(new Date());
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('financial_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching insights:', error);
        setError(error.message);
        // Fall back to demo insights
        setInsights(generateDemoInsights());
        return;
      }

      console.log(`Fetched ${data?.length || 0} insights`);
      
      // If no insights, generate demo ones
      if (!data || data.length === 0) {
        setInsights(generateDemoInsights());
      } else {
        setInsights(data);
      }
      
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error in fetchInsights:', err);
      setError(err.message);
      // Fall back to demo insights
      setInsights(generateDemoInsights());
    } finally {
      setLoading(false);
    }
  };

  const generateDemoInsights = (): FinancialInsight[] => {
    const now = new Date();
    return [
      {
        insight_id: 'demo-insight-1',
        user_id: user?.id || '',
        insight_type: 'spending_pattern',
        title: 'Dining Out Expenses Increasing',
        description: 'Your spending on restaurants has increased by 15% compared to last month. Consider setting a dining budget to keep this category in check.',
        data_sources: { type: 'transaction_analysis' },
        confidence_score: 0.85,
        priority_level: 'medium',
        action_items: [
          { action: 'review', description: 'Review your restaurant transactions' },
          { action: 'budget', description: 'Set a monthly dining budget' }
        ],
        is_dismissed: false,
        expires_at: null,
        created_at: now.toISOString()
      },
      {
        insight_id: 'demo-insight-2',
        user_id: user?.id || '',
        insight_type: 'opportunity',
        title: 'High-Yield Savings Opportunity',
        description: 'You have $2,850 in your checking account. Moving $2,000 to a high-yield savings account could earn you an extra $80 per year.',
        data_sources: { type: 'account_analysis' },
        confidence_score: 0.92,
        priority_level: 'high',
        action_items: [
          { action: 'transfer', description: 'Transfer excess funds to savings' },
          { action: 'research', description: 'Compare high-yield savings options' }
        ],
        is_dismissed: false,
        expires_at: null,
        created_at: now.toISOString()
      },
      {
        insight_id: 'demo-insight-3',
        user_id: user?.id || '',
        insight_type: 'goal_recommendation',
        title: 'Emergency Fund Progress',
        description: 'You\'re making good progress on your emergency fund goal. At your current rate, you\'ll reach your target in approximately 4 months.',
        data_sources: { type: 'goal_analysis' },
        confidence_score: 0.88,
        priority_level: 'low',
        action_items: [
          { action: 'automate', description: 'Set up automatic transfers to reach your goal faster' }
        ],
        is_dismissed: false,
        expires_at: null,
        created_at: now.toISOString()
      },
      {
        insight_id: 'demo-insight-4',
        user_id: user?.id || '',
        insight_type: 'budget_advice',
        title: 'Subscription Audit Recommended',
        description: 'We\'ve identified multiple subscription services in your transactions. Reviewing these could save you $25-40 monthly.',
        data_sources: { type: 'transaction_analysis' },
        confidence_score: 0.78,
        priority_level: 'medium',
        action_items: [
          { action: 'review', description: 'Review your active subscriptions' },
          { action: 'cancel', description: 'Cancel unused services' }
        ],
        is_dismissed: false,
        expires_at: null,
        created_at: now.toISOString()
      }
    ];
  };

  const generateInsights = async (force: boolean = false) => {
    if (!user) return;

    setGenerating(true);
    setError(null);
    try {
      console.log('Generating new insights for user:', user.id);
      
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, using demo insights');
        setInsights(generateDemoInsights());
        setLastUpdated(new Date());
        setGenerating(false);
        return { generated: true, demo: true };
      }
      
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: {
          userId: user.id,
          forceGenerate: force
        },
      });

      if (error) {
        console.error('Error generating insights:', error);
        setError(error.message);
        // Fall back to demo insights
        setInsights(generateDemoInsights());
        return { generated: true, demo: true };
      }

      console.log('Generate insights response:', data);
      
      if (data.generated) {
        // Refresh insights if new ones were generated
        await fetchInsights();
      }
      
      return data;
    } catch (err: any) {
      console.error('Error in generateInsights:', err);
      setError(err.message);
      // Fall back to demo insights
      setInsights(generateDemoInsights());
      return { generated: true, demo: true };
    } finally {
      setGenerating(false);
    }
  };

  const dismissInsight = async (insightId: string) => {
    if (!user) return false;

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('financial_insights')
          .update({ is_dismissed: true })
          .eq('insight_id', insightId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error dismissing insight:', error);
          setError(error.message);
          return false;
        }
      }

      // Update local state
      setInsights(prev => prev.filter(insight => insight.insight_id !== insightId));
      return true;
    } catch (err: any) {
      console.error('Error in dismissInsight:', err);
      setError(err.message);
      // Update local state even if database update fails
      setInsights(prev => prev.filter(insight => insight.insight_id !== insightId));
      return true;
    }
  };

  const getInsightsByType = (type: string) => {
    return insights.filter(insight => insight.insight_type === type);
  };

  const getInsightsByPriority = (priority: string) => {
    return insights.filter(insight => insight.priority_level === priority);
  };

  const getRecentInsights = (limit: number = 5) => {
    return insights.slice(0, limit);
  };

  const getHighPriorityInsights = (limit: number = 3) => {
    return insights
      .filter(insight => insight.priority_level === 'high')
      .slice(0, limit);
  };

  const provideFeedback = async (insightId: string, feedbackType: string, rating?: number, feedbackText?: string) => {
    if (!user) return false;

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('ai_insight_feedback')
          .insert({
            user_id: user.id,
            insight_id: insightId,
            feedback_type: feedbackType,
            rating,
            feedback_text: feedbackText,
            was_acted_upon: feedbackType === 'helpful'
          });

        if (error) {
          console.error('Error providing feedback:', error);
          setError(error.message);
          return false;
        }
      }

      return true;
    } catch (err: any) {
      console.error('Error in provideFeedback:', err);
      setError(err.message);
      return false;
    }
  };

  return {
    insights,
    loading,
    generating,
    error,
    lastUpdated,
    fetchInsights,
    generateInsights,
    dismissInsight,
    getInsightsByType,
    getInsightsByPriority,
    getRecentInsights,
    getHighPriorityInsights,
    provideFeedback
  };
};