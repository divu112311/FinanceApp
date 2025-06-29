import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  PiggyBank,
  Target,
  ArrowRight,
  Zap
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useFinancialInsights } from '../hooks/useFinancialInsights';

interface InsightsWidgetProps {
  user: User;
  limit?: number;
  onViewAll?: () => void;
}

const InsightsWidget: React.FC<InsightsWidgetProps> = ({ 
  user, 
  limit = 2,
  onViewAll
}) => {
  const { 
    insights, 
    loading, 
    generating,
    getHighPriorityInsights
  } = useFinancialInsights(user);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'spending_pattern': return BarChart3;
      case 'goal_recommendation': return Target;
      case 'risk_alert': return AlertTriangle;
      case 'opportunity': return Lightbulb;
      case 'budget_advice': return PiggyBank;
      case 'investment_tip': return TrendingUp;
      default: return Lightbulb;
    }
  };

  const getInsightColor = (type: string, priority: string) => {
    if (priority === 'high') return 'text-red-600';
    
    switch (type) {
      case 'spending_pattern': return 'text-blue-600';
      case 'goal_recommendation': return 'text-purple-600';
      case 'risk_alert': return 'text-orange-600';
      case 'opportunity': return 'text-green-600';
      case 'budget_advice': return 'text-teal-600';
      case 'investment_tip': return 'text-indigo-600';
      default: return 'text-gray-600';
    }
  };

  // Get high priority insights first, then fill with other insights
  const highPriorityInsights = getHighPriorityInsights();
  const displayInsights = highPriorityInsights.length > 0 
    ? highPriorityInsights.slice(0, limit)
    : insights.slice(0, limit);

  if (loading && insights.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#2A6F68]/5 to-[#B76E79]/10 rounded-2xl p-4 border border-[#2A6F68]/20">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 bg-[#2A6F68] rounded-lg flex items-center justify-center">
            <Zap className="h-3 w-3 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-[#2A6F68]">AI Financial Insights</h3>
        </div>

        <div className="flex items-center justify-center py-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-5 h-5 border-2 border-[#2A6F68] border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#2A6F68]/5 to-[#B76E79]/10 rounded-2xl p-4 border border-[#2A6F68]/20">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 bg-[#2A6F68] rounded-lg flex items-center justify-center">
            <Zap className="h-3 w-3 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-[#2A6F68]">AI Financial Insights</h3>
        </div>

        <div className="bg-white/60 rounded-lg p-3 border border-white/40">
          <div className="flex items-start space-x-2">
            <Lightbulb className="h-4 w-4 text-[#B76E79] mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-gray-900 text-xs mb-1">Connect Your Accounts</h4>
              <p className="text-xs text-gray-700 line-clamp-2">
                Link your bank accounts to get personalized AI insights about your finances.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#2A6F68]/5 to-[#B76E79]/10 rounded-2xl p-4 border border-[#2A6F68]/20">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-6 h-6 bg-[#2A6F68] rounded-lg flex items-center justify-center">
          <Zap className="h-3 w-3 text-white" />
        </div>
        <h3 className="text-sm font-semibold text-[#2A6F68]">AI Financial Insights</h3>
      </div>

      <div className="space-y-2">
        {displayInsights.map((insight) => {
          const InsightIcon = getInsightIcon(insight.insight_type);
          const colorClass = getInsightColor(insight.insight_type, insight.priority_level);
          
          return (
            <motion.div
              key={insight.insight_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/60 rounded-lg p-3 border border-white/40"
            >
              <div className="flex items-start space-x-2">
                <InsightIcon className={`h-4 w-4 ${colorClass} mt-0.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-xs mb-1 truncate">{insight.title}</h4>
                  <p className="text-xs text-gray-700 line-clamp-2">{insight.description}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {insights.length > limit && onViewAll && (
        <div className="mt-2 text-center">
          <button 
            onClick={onViewAll}
            className="text-xs text-[#2A6F68] font-medium hover:underline flex items-center justify-center space-x-1 mx-auto"
          >
            <span>View all insights</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default InsightsWidget;