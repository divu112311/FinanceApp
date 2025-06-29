import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  BarChart3,
  PiggyBank,
  Target,
  DollarSign,
  Calendar,
  ArrowRight,
  Filter,
  X,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Zap
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useFinancialInsights } from '../hooks/useFinancialInsights';
import { useBankAccounts } from '../hooks/useBankAccounts';
import { useGoals } from '../hooks/useGoals';

interface InsightsDashboardProps {
  user: User;
}

const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ user }) => {
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
    getInsightsByType,
    getInsightsByPriority
  } = useFinancialInsights(user);
  
  const { bankAccounts, totalBalance } = useBankAccounts(user);
  const { goals } = useGoals(user);
  
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState<Record<string, boolean>>({});

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

  // Filter insights based on selected type and priority
  const filteredInsights = insights.filter(insight => {
    const typeMatch = selectedType === 'all' || insight.insight_type === selectedType;
    const priorityMatch = selectedPriority === 'all' || insight.priority_level === selectedPriority;
    return typeMatch && priorityMatch;
  });

  // Get counts for each type and priority
  const typeCounts = {
    all: insights.length,
    spending_pattern: getInsightsByType('spending_pattern').length,
    goal_recommendation: getInsightsByType('goal_recommendation').length,
    risk_alert: getInsightsByType('risk_alert').length,
    opportunity: getInsightsByType('opportunity').length,
    budget_advice: getInsightsByType('budget_advice').length,
    investment_tip: getInsightsByType('investment_tip').length
  };

  const priorityCounts = {
    all: insights.length,
    high: getInsightsByPriority('high').length,
    medium: getInsightsByPriority('medium').length,
    low: getInsightsByPriority('low').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#333333] mb-2">Financial Insights</h2>
          <p className="text-gray-600">AI-powered analysis of your financial data</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={generating}
          className="flex items-center space-x-2 bg-[#2A6F68] text-white px-4 py-2 rounded-lg hover:bg-[#235A54] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
          <span>{generating ? 'Generating...' : 'Generate New Insights'}</span>
        </motion.button>
      </div>

      {/* Financial Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#2A6F68]/10 to-[#B76E79]/10 rounded-xl p-6 border border-[#2A6F68]/20"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-[#2A6F68] rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-semibold text-[#333333]">Total Balance</h3>
            </div>
            <div className="text-2xl font-bold text-[#2A6F68]">${totalBalance.toLocaleString()}</div>
            <div className="text-sm text-gray-600 mt-1">{bankAccounts.length} connected accounts</div>
          </div>
          
          <div className="bg-white/80 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-[#B76E79] rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-semibold text-[#333333]">Active Goals</h3>
            </div>
            <div className="text-2xl font-bold text-[#B76E79]">{goals.length}</div>
            <div className="text-sm text-gray-600 mt-1">
              {goals.filter(g => g.status === 'completed').length} completed
            </div>
          </div>
          
          <div className="bg-white/80 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-semibold text-[#333333]">AI Insights</h3>
            </div>
            <div className="text-2xl font-bold text-indigo-500">{insights.length}</div>
            <div className="text-sm text-gray-600 mt-1">
              {getInsightsByPriority('high').length} high priority
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
      >
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <h3 className="font-medium text-[#333333]">Filter Insights</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Insight Type
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedType('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedType === 'all' 
                    ? 'bg-[#2A6F68] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({typeCounts.all})
              </button>
              <button
                onClick={() => setSelectedType('spending_pattern')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedType === 'spending_pattern' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                Spending ({typeCounts.spending_pattern})
              </button>
              <button
                onClick={() => setSelectedType('goal_recommendation')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedType === 'goal_recommendation' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                Goals ({typeCounts.goal_recommendation})
              </button>
              <button
                onClick={() => setSelectedType('risk_alert')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedType === 'risk_alert' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                }`}
              >
                Risks ({typeCounts.risk_alert})
              </button>
              <button
                onClick={() => setSelectedType('opportunity')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedType === 'opportunity' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                Opportunities ({typeCounts.opportunity})
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority Level
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedPriority('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedPriority === 'all' 
                    ? 'bg-[#2A6F68] text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({priorityCounts.all})
              </button>
              <button
                onClick={() => setSelectedPriority('high')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedPriority === 'high' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                High ({priorityCounts.high})
              </button>
              <button
                onClick={() => setSelectedPriority('medium')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedPriority === 'medium' 
                    ? 'bg-yellow-600 text-white' 
                    : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                }`}
              >
                Medium ({priorityCounts.medium})
              </button>
              <button
                onClick={() => setSelectedPriority('low')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedPriority === 'low' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                }`}
              >
                Low ({priorityCounts.low})
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Insights List */}
      <div className="space-y-4">
        {loading && insights.length === 0 ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-2 border-[#2A6F68] border-t-transparent rounded-full"
            />
          </div>
        ) : error && insights.length === 0 ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900 mb-2">Error Loading Insights</h4>
                <p className="text-red-800">{error}</p>
                <button
                  onClick={fetchInsights}
                  className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="h-8 w-8 text-gray-400" />
            </div>
            {insights.length === 0 ? (
              <>
                <h3 className="text-xl font-semibold text-[#333333] mb-2">No Insights Available</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Connect your accounts and set financial goals to get personalized AI insights.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefresh}
                  disabled={generating}
                  className="inline-flex items-center space-x-2 bg-[#2A6F68] text-white px-6 py-3 rounded-lg hover:bg-[#235A54] disabled:opacity-50 transition-colors"
                >
                  {generating ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <Lightbulb className="h-4 w-4" />
                  )}
                  <span>{generating ? 'Generating...' : 'Generate Insights'}</span>
                </motion.button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-[#333333] mb-2">No Matching Insights</h3>
                <p className="text-gray-600 mb-4">
                  No insights match your current filters. Try changing your filter criteria.
                </p>
                <button
                  onClick={() => {
                    setSelectedType('all');
                    setSelectedPriority('all');
                  }}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Filter className="h-4 w-4" />
                  <span>Clear Filters</span>
                </button>
              </>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filteredInsights.map((insight, index) => {
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
                  className={`rounded-xl p-6 border ${bgColorClass}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bgColorClass}`}>
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
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            insight.insight_type === 'spending_pattern' ? 'bg-blue-100 text-blue-800' :
                            insight.insight_type === 'goal_recommendation' ? 'bg-purple-100 text-purple-800' :
                            insight.insight_type === 'risk_alert' ? 'bg-orange-100 text-orange-800' :
                            insight.insight_type === 'opportunity' ? 'bg-green-100 text-green-800' :
                            insight.insight_type === 'budget_advice' ? 'bg-teal-100 text-teal-800' :
                            'bg-indigo-100 text-indigo-800'
                          }`}>
                            {insight.insight_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(insight.created_at)}</span>
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
        )}
      </div>

      {/* Last Updated Info */}
      {lastUpdated && (
        <div className="text-center text-sm text-gray-500">
          <div className="flex items-center justify-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>Last updated: {formatDate(lastUpdated.toISOString())}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsDashboard;