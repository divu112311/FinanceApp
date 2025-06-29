import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Lightbulb,
  RefreshCw,
  X,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Clock,
  Sparkles,
  PiggyBank,
  DollarSign,
  BarChart3,
  Zap
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useFinancialInsights } from '../hooks/useFinancialInsights';

interface FinancialInsightsProps {
  user: User;
  compact?: boolean;
  limit?: number;
}

const FinancialInsights: React.FC<FinancialInsightsProps> = ({ 
  user, 
  compact = false,
  limit = 3
}) => {
  const { 
    insights, 
    loading, 
    generating,
    error, 
    lastUpdated,
    fetchInsights, 
    generateInsights,
    dismissInsight,
    provideFeedback,
    getHighPriorityInsights
  } = useFinancialInsights(user);
  
  const [showAll, setShowAll] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // If no insights, generate them automatically
    if (!loading && !generating && insights.length === 0) {
      generateInsights();
    }
  }, [loading, generating, insights.length]);

  const handleRefresh = async () => {
    await generateInsights(true);
  };

  const handleDismiss = async (insightId: string) => {
    await dismissInsight(insightId);
  };

  const handleFeedback = async (insightId: string, feedbackType: string) => {
    setFeedbackSubmitting(prev => ({ ...prev, [insightId]: true }));
    try {
      await provideFeedback(insightId, feedbackType);
      // After feedback, dismiss the insight
      await dismissInsight(insightId);
    } finally {
      setFeedbackSubmitting(prev => ({ ...prev, [insightId]: false }));
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'spending_pattern': return BarChart3;
      case 'goal_recommendation': return Target;
      case 'risk_alert': return AlertTriangle;
      case 'opportunity': return Lightbulb;
      case 'budget_advice': return PiggyBank;
      case 'investment_tip': return TrendingUp;
      default: return Sparkles;
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

  const getInsightBgColor = (type: string, priority: string) => {
    if (priority === 'high') return 'bg-red-50 border-red-200';
    
    switch (type) {
      case 'spending_pattern': return 'bg-blue-50 border-blue-200';
      case 'goal_recommendation': return 'bg-purple-50 border-purple-200';
      case 'risk_alert': return 'bg-orange-50 border-orange-200';
      case 'opportunity': return 'bg-green-50 border-green-200';
      case 'budget_advice': return 'bg-teal-50 border-teal-200';
      case 'investment_tip': return 'bg-indigo-50 border-indigo-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const displayInsights = showAll ? insights : insights.slice(0, limit);
  const highPriorityInsights = getHighPriorityInsights();

  if (loading && insights.length === 0) {
    return (
      <div className="flex items-center justify-center py-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-6 h-6 border-2 border-[#2A6F68] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (error && insights.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-red-900 mb-1">Error Loading Insights</h4>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 ${compact ? 'text-sm' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5 text-[#2A6F68]" />
            <h3 className={`font-semibold text-[#333333] ${compact ? 'text-base' : 'text-lg'}`}>Financial Insights</h3>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={generating}
            className="flex items-center space-x-1 text-xs bg-[#2A6F68] text-white px-2 py-1 rounded hover:bg-[#235A54] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${generating ? 'animate-spin' : ''}`} />
            <span>Generate</span>
          </motion.button>
        </div>
        
        <div className="text-center py-6">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lightbulb className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-2">No financial insights available yet</p>
          <p className="text-sm text-gray-500">
            {generating ? 'Generating insights...' : 'Connect accounts or set goals to get personalized insights'}
          </p>
        </div>
      </div>
    );
  }

  if (compact) {
    // Compact view for dashboard
    return (
      <div className="bg-gradient-to-br from-[#2A6F68]/5 to-[#B76E79]/10 rounded-2xl p-4 border border-[#2A6F68]/20">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-6 h-6 bg-[#2A6F68] rounded-lg flex items-center justify-center">
            <Zap className="h-3 w-3 text-white" />
          </div>
          <h3 className="text-sm font-semibold text-[#2A6F68]">AI Financial Insights</h3>
        </div>

        <div className="space-y-2">
          {highPriorityInsights.length > 0 ? (
            highPriorityInsights.map((insight) => {
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
            })
          ) : (
            displayInsights.slice(0, 2).map((insight) => {
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
            })
          )}
        </div>
        
        <div className="mt-2 text-center">
          <button 
            onClick={() => setShowAll(true)}
            className="text-xs text-[#2A6F68] font-medium hover:underline flex items-center justify-center space-x-1 mx-auto"
          >
            <span>View all insights</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  // Full view
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-lg flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-[#333333]">AI Financial Insights</h3>
            <p className="text-sm text-gray-600">
              Personalized insights based on your financial data
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {lastUpdated && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>Updated {formatDate(lastUpdated.toISOString())}</span>
            </div>
          )}
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            disabled={generating}
            className="flex items-center space-x-2 bg-[#2A6F68] text-white px-3 py-2 rounded-lg hover:bg-[#235A54] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
            <span>{generating ? 'Generating...' : 'Refresh Insights'}</span>
          </motion.button>
        </div>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {displayInsights.map((insight, index) => {
            const InsightIcon = getInsightIcon(insight.insight_type);
            const colorClass = getInsightColor(insight.insight_type, insight.priority_level);
            const bgColorClass = getInsightBgColor(insight.insight_type, insight.priority_level);
            
            return (
              <motion.div
                key={insight.insight_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-xl p-5 border ${bgColorClass}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgColorClass}`}>
                      <InsightIcon className={`h-5 w-5 ${colorClass}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">{insight.title}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          insight.priority_level === 'high' ? 'bg-red-100 text-red-800' :
                          insight.priority_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {insight.priority_level.charAt(0).toUpperCase() + insight.priority_level.slice(1)} Priority
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(insight.created_at).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDismiss(insight.insight_id)}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
                
                <p className="text-gray-700 mb-4">{insight.description}</p>
                
                {insight.action_items && insight.action_items.length > 0 && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-900 mb-2 text-sm">Recommended Actions:</h5>
                    <ul className="space-y-2">
                      {insight.action_items.map((item, i) => (
                        <li key={i} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{item.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleFeedback(insight.insight_id, 'helpful')}
                    disabled={feedbackSubmitting[insight.insight_id]}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    <span>Helpful</span>
                  </button>
                  <button
                    onClick={() => handleFeedback(insight.insight_id, 'not_helpful')}
                    disabled={feedbackSubmitting[insight.insight_id]}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm"
                  >
                    <ThumbsDown className="h-3 w-3" />
                    <span>Not Helpful</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {insights.length > limit && !showAll && (
          <div className="text-center pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAll(true)}
              className="inline-flex items-center space-x-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <span>Show All {insights.length} Insights</span>
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        )}
        
        {showAll && insights.length > limit && (
          <div className="text-center pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAll(false)}
              className="inline-flex items-center space-x-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <span>Show Less</span>
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialInsights;