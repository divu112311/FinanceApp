import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useBankAccounts } from './useBankAccounts';
import { useGoals } from './useGoals';
import { useTransactions } from './useTransactions';

interface FinancialHealthRule {
  rule_id: string;
  rule_name: string;
  rule_category: string;
  condition_logic: any;
  threshold_values: any;
  severity_level: string;
  recommended_actions: any[];
  rule_description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UserHealthFlag {
  flag_id: string;
  user_id: string;
  rule_id: string;
  flag_status: string;
  trigger_data: any;
  calculated_values: any;
  first_triggered_at: string;
  last_evaluated_at: string;
  resolved_at: string | null;
  auto_generated_insight_id: string | null;
}

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

interface HealthMetric {
  name: string;
  score: number;
  status: 'excellent' | 'good' | 'fair' | 'poor';
  description: string;
  recommendation: string;
}

export const useFinancialHealth = (user: User | null) => {
  const { bankAccounts, totalBalance } = useBankAccounts(user);
  const { goals } = useGoals(user);
  const { transactions, getTotalSpending, getTotalIncome } = useTransactions(user);
  
  const [healthRules, setHealthRules] = useState<FinancialHealthRule[]>([]);
  const [healthFlags, setHealthFlags] = useState<UserHealthFlag[]>([]);
  const [insights, setInsights] = useState<FinancialInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [healthScore, setHealthScore] = useState(0);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);

  useEffect(() => {
    if (user) {
      fetchFinancialHealthData();
    }
  }, [user]);

  useEffect(() => {
    calculateFinancialHealth();
  }, [bankAccounts, goals, transactions]);

  const fetchFinancialHealthData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch health rules
      const { data: rulesData, error: rulesError } = await supabase
        .from('financial_health_rules')
        .select('*')
        .eq('is_active', true);

      if (!rulesError) {
        setHealthRules(rulesData || []);
      }

      // Fetch user health flags
      const { data: flagsData, error: flagsError } = await supabase
        .from('user_health_flags')
        .select('*')
        .eq('user_id', user.id)
        .eq('flag_status', 'active');

      if (!flagsError) {
        setHealthFlags(flagsData || []);
      }

      // Fetch financial insights
      const { data: insightsData, error: insightsError } = await supabase
        .from('financial_insights')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });

      if (!insightsError) {
        setInsights(insightsData || []);
      }
    } catch (error) {
      console.error('Error fetching financial health data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinancialHealth = () => {
    const metrics: HealthMetric[] = [];
    let totalScore = 0;

    // Emergency Fund Score (25% weight)
    const emergencyFundScore = calculateEmergencyFundScore();
    metrics.push({
      name: 'Emergency Fund',
      score: emergencyFundScore,
      status: getScoreStatus(emergencyFundScore),
      description: 'Your financial safety net for unexpected expenses',
      recommendation: emergencyFundScore < 70 ? 
        'Build an emergency fund covering 3-6 months of expenses' :
        'Great job! Your emergency fund provides excellent protection'
    });
    totalScore += emergencyFundScore * 0.25;

    // Savings Rate Score (20% weight)
    const savingsScore = calculateSavingsScore();
    metrics.push({
      name: 'Savings Progress',
      score: savingsScore,
      status: getScoreStatus(savingsScore),
      description: 'How well you\'re progressing toward your financial goals',
      recommendation: savingsScore < 70 ?
        'Increase your savings rate to 20% of income for better financial health' :
        'Excellent savings discipline! You\'re on track for financial success'
    });
    totalScore += savingsScore * 0.20;

    // Account Diversity Score (15% weight)
    const diversityScore = calculateAccountDiversityScore();
    metrics.push({
      name: 'Account Diversity',
      score: diversityScore,
      status: getScoreStatus(diversityScore),
      description: 'Variety of account types for different financial needs',
      recommendation: diversityScore < 70 ?
        'Consider opening different account types (checking, savings, investment)' :
        'Good account diversity supports your financial flexibility'
    });
    totalScore += diversityScore * 0.15;

    // Debt-to-Income Score (20% weight)
    const debtScore = calculateDebtScore();
    metrics.push({
      name: 'Debt Management',
      score: debtScore,
      status: getScoreStatus(debtScore),
      description: 'Your debt level relative to income',
      recommendation: debtScore < 70 ?
        'Focus on reducing high-interest debt and improving your debt-to-income ratio' :
        'Your debt levels are well-managed. Continue making timely payments'
    });
    totalScore += debtScore * 0.20;

    // Goal Achievement Score (20% weight)
    const goalScore = calculateGoalAchievementScore();
    metrics.push({
      name: 'Goal Progress',
      score: goalScore,
      status: getScoreStatus(goalScore),
      description: 'Progress toward your financial objectives',
      recommendation: goalScore < 70 ?
        'Set specific, measurable financial goals and track your progress' :
        'Outstanding goal achievement! You\'re building wealth effectively'
    });
    totalScore += goalScore * 0.20;

    setHealthMetrics(metrics);
    setHealthScore(Math.round(totalScore));
  };

  const calculateEmergencyFundScore = (): number => {
    if (!bankAccounts.length) return 30;
    
    const savingsAccounts = bankAccounts.filter(acc => 
      acc.type === 'depository' && acc.account_subtype === 'savings'
    );
    
    if (savingsAccounts.length === 0) return 40;
    
    const totalSavings = savingsAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    
    // Assume monthly expenses of $3000 for calculation (this would ideally come from spending data)
    const monthlyExpenses = getTotalSpending() / 3 || 3000; // Use actual spending if available
    const monthsCovered = totalSavings / monthlyExpenses;
    
    if (monthsCovered >= 6) return 100;
    if (monthsCovered >= 3) return 80;
    if (monthsCovered >= 1) return 60;
    return Math.max(30, monthsCovered * 30);
  };

  const calculateSavingsScore = (): number => {
    if (!goals.length) return 40;
    
    const totalTargetAmount = goals.reduce((sum, goal) => sum + (goal.target_amount || 0), 0);
    const totalSavedAmount = goals.reduce((sum, goal) => sum + (goal.saved_amount || goal.current_amount || 0), 0);
    
    if (totalTargetAmount === 0) return 50;
    
    const progressPercentage = (totalSavedAmount / totalTargetAmount) * 100;
    return Math.min(100, Math.max(20, progressPercentage));
  };

  const calculateAccountDiversityScore = (): number => {
    if (!bankAccounts.length) return 20;
    
    const accountTypes = new Set(bankAccounts.map(acc => acc.account_subtype));
    const typeCount = accountTypes.size;
    
    if (typeCount >= 4) return 100;
    if (typeCount === 3) return 80;
    if (typeCount === 2) return 60;
    return 40;
  };

  const calculateDebtScore = (): number => {
    // This is a placeholder - in a real app, we would calculate based on actual debt data
    // For now, we'll use a random score between 60-90
    return Math.floor(Math.random() * 30) + 60;
  };

  const calculateGoalAchievementScore = (): number => {
    if (!goals.length) return 30;
    
    const completedGoals = goals.filter(goal => {
      const progress = goal.target_amount ? 
        ((goal.saved_amount || goal.current_amount || 0) / goal.target_amount) * 100 : 0;
      return progress >= 100 || goal.status === 'completed';
    });
    
    const averageProgress = goals.reduce((sum, goal) => {
      const progress = goal.target_amount ? 
        ((goal.saved_amount || goal.current_amount || 0) / goal.target_amount) * 100 : 0;
      return sum + Math.min(100, progress);
    }, 0) / goals.length;
    
    return Math.round(averageProgress);
  };

  const getScoreStatus = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  };

  const getActiveFlags = () => {
    return healthFlags.filter(flag => flag.flag_status === 'active');
  };

  const getRecentInsights = (limit = 5) => {
    return insights
      .filter(insight => !insight.is_dismissed)
      .slice(0, limit);
  };

  const dismissInsight = async (insightId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('financial_insights')
        .update({ is_dismissed: true })
        .eq('insight_id', insightId)
        .eq('user_id', user.id);

      if (error) throw error;

      setInsights(prev => prev.filter(insight => insight.insight_id !== insightId));
      return true;
    } catch (error) {
      console.error('Error dismissing insight:', error);
      return false;
    }
  };

  const resolveHealthFlag = async (flagId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_health_flags')
        .update({ 
          flag_status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('flag_id', flagId)
        .eq('user_id', user.id);

      if (error) throw error;

      setHealthFlags(prev => prev.filter(flag => flag.flag_id !== flagId));
      return true;
    } catch (error) {
      console.error('Error resolving health flag:', error);
      return false;
    }
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
          was_acted_upon: false
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error providing feedback:', error);
      return false;
    }
  };

  return {
    healthScore,
    healthMetrics,
    healthRules,
    healthFlags,
    insights,
    loading,
    getActiveFlags,
    getRecentInsights,
    dismissInsight,
    resolveHealthFlag,
    provideFeedback,
    refetch: fetchFinancialHealthData
  };
};