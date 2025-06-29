import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  PiggyBank,
  CreditCard,
  Target,
  Activity,
  Info
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useBankAccounts } from '../hooks/useBankAccounts';
import { useGoals } from '../hooks/useGoals';
import { useFinancialHealth } from '../hooks/useFinancialHealth';
import { useUserProfile } from '../hooks/useUserProfile';

interface FinancialHealthBoardProps {
  user: User;
  xp: { points: number | null; badges: string[] | null } | null;
}

const FinancialHealthBoard: React.FC<FinancialHealthBoardProps> = ({ user, xp }) => {
  const { bankAccounts, totalBalance } = useBankAccounts(user);
  const { goals } = useGoals(user);
  const { healthScore, healthMetrics, insights, loading: healthLoading } = useFinancialHealth(user);
  const { profile, extendedProfile } = useUserProfile(user);

  if (healthLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[#2A6F68] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const getScoreStatus = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  };

  const getScoreColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 85) return 'from-green-400 to-green-600';
    if (score >= 70) return 'from-blue-400 to-blue-600';
    if (score >= 50) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 85) return CheckCircle;
    if (score >= 70) return TrendingUp;
    if (score >= 50) return AlertTriangle;
    return TrendingDown;
  };

  const HealthScoreIcon = getHealthScoreIcon(healthScore);

  return (
    <div className="space-y-6">
      {/* Overall Health Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#333333] mb-2">Financial Health Score</h2>
            <p className="text-gray-600">Your overall financial wellness assessment</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r ${getHealthScoreColor(healthScore)} text-white`}>
              <HealthScoreIcon className="h-5 w-5" />
              <span className="font-bold text-lg">{healthScore}/100</span>
            </div>
          </div>
        </div>

        {/* Health Score Visualization */}
        <div className="relative">
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${healthScore}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`h-4 rounded-full bg-gradient-to-r ${getHealthScoreColor(healthScore)}`}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Poor (0-49)</span>
            <span>Fair (50-69)</span>
            <span>Good (70-84)</span>
            <span>Excellent (85-100)</span>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="mt-6 p-4 bg-gradient-to-r from-[#2A6F68]/5 to-[#B76E79]/5 rounded-lg border-l-4 border-[#2A6F68]">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-[#2A6F68] mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-[#333333] mb-1">Key Insight</h4>
              <p className="text-sm text-gray-700">
                {healthScore >= 85 ? 
                  "Excellent financial health! You're demonstrating strong money management skills across all areas." :
                  healthScore >= 70 ?
                  "Good financial foundation with room for improvement in a few key areas." :
                  healthScore >= 50 ?
                  "Fair financial health. Focus on building emergency savings and increasing goal progress." :
                  "Your financial health needs attention. Start with basic emergency savings and clear goal setting."
                }
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Detailed Health Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {healthMetrics.map((metric, index) => (
          <motion.div
            key={metric.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white rounded-xl p-6 shadow-sm border-2 ${getScoreColor(metric.status)}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getScoreColor(metric.status)}`}>
                {metric.name === 'Emergency Fund' && <PiggyBank className="h-6 w-6" />}
                {metric.name === 'Savings Progress' && <Target className="h-6 w-6" />}
                {metric.name === 'Account Diversity' && <Activity className="h-6 w-6" />}
                {metric.name === 'Debt Management' && <CreditCard className="h-6 w-6" />}
                {metric.name === 'Goal Progress' && <CheckCircle className="h-6 w-6" />}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{metric.score}</div>
                <div className="text-xs uppercase tracking-wide font-medium">
                  {metric.status}
                </div>
              </div>
            </div>

            <h3 className="font-semibold text-[#333333] mb-2">{metric.name}</h3>
            <p className="text-sm text-gray-600 mb-3">{metric.description}</p>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${metric.score}%` }}
                transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                className={`h-2 rounded-full ${
                  metric.status === 'excellent' ? 'bg-green-500' :
                  metric.status === 'good' ? 'bg-blue-500' :
                  metric.status === 'fair' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
              />
            </div>

            <p className="text-xs text-gray-700 leading-relaxed">
              {metric.recommendation}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#2A6F68]/10 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-[#2A6F68]" />
            </div>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <h3 className="text-2xl font-bold text-[#333333] mb-1">
            ${totalBalance.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600">Total Account Balance</p>
          <p className="text-xs text-green-600 mt-1">
            {bankAccounts.length} connected account{bankAccounts.length !== 1 ? 's' : ''}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[#333333] mb-1">
            {goals.length}
          </h3>
          <p className="text-sm text-gray-600">Active Financial Goals</p>
          <p className="text-xs text-blue-600 mt-1">
            {goals.filter(g => {
              const progress = g.target_amount ? ((g.saved_amount || g.current_amount || 0) / g.target_amount) * 100 : 0;
              return progress >= 100 || g.status === 'completed';
            }).length} completed
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#B76E79]/10 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-[#B76E79]" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[#333333] mb-1">
            Level {Math.floor((xp?.points || 0) / 100) + 1}
          </h3>
          <p className="text-sm text-gray-600">Financial Engagement</p>
          <p className="text-xs text-[#B76E79] mt-1">
            {xp?.points || 0} XP earned
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default FinancialHealthBoard;