import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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
      
      const { data, error } = await supabase
        .from('financial_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching insights:', error);
        setError(error.message);
        return;
      }

      console.log(`Fetched ${data?.length || 0} insights`);
      setInsights(data || []);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error('Error in fetchInsights:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = async (force: boolean = false) => {
    if (!user) return;

    setGenerating(true);
    setError(null);
    try {
      console.log('Generating new insights for user:', user.id);
      
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: {
          userId: user.id,
          forceGenerate: force
        },
      });

      if (error) {
        console.error('Error generating insights:', error);
        setError(error.message);
        return;
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
    } finally {
      setGenerating(false);
    }
  };

  const dismissInsight = async (insightId: string) => {
    if (!user) return false;

    try {
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

      // Update local state
      setInsights(prev => prev.filter(insight => insight.insight_id !== insightId));
      return true;
    } catch (err: any) {
      console.error('Error in dismissInsight:', err);
      setError(err.message);
      return false;
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