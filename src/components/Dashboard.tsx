import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  Award,
  Plus,
  Activity,
  Building2,
  PiggyBank,
  CreditCard,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  TrendingDown,
  Info,
  Wifi,
  WifiOff,
  Clock
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useGoals } from '../hooks/useGoals';
import { useBankAccounts } from '../hooks/useBankAccounts';
import { usePlaidLink } from '../hooks/usePlaidLink';
import PlaidCredentialsModal from './PlaidCredentialsModal';
import GoalsManager from './GoalsManager';
import doughjoMascot from '../assets/doughjo-mascot.png';

interface DashboardProps {
  user: User;
  xp: { points: number | null; badges: string[] | null } | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user, xp }) => {
  const { goals, loading: goalsLoading } = useGoals(user);
  const { bankAccounts, loading: accountsLoading, refreshAccounts, totalBalance } = useBankAccounts(user);
  const { 
    openPlaidLink, 
    connectWithCredentials,
    closeCredentialsModal,
    isLoading: plaidLoading, 
    error: plaidError,
    showCredentialsModal
  } = usePlaidLink(user);
  const [showBalances, setShowBalances] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'goals' | 'accounts'>('overview');

  const level = Math.floor((xp?.points || 0) / 100) + 1;

  const getBeltRank = (level: number) => {
    if (level >= 50) return { name: "Grand Master", color: "from-yellow-400 to-yellow-600", emoji: "🏆" };
    if (level >= 40) return { name: "Master", color: "from-purple-400 to-purple-600", emoji: "👑" };
    if (level >= 30) return { name: "Black Belt", color: "from-gray-800 to-black", emoji: "🥋" };
    if (level >= 20) return { name: "Brown Belt", color: "from-amber-600 to-amber-800", emoji: "🤎" };
    if (level >= 15) return { name: "Blue Belt", color: "from-blue-400 to-blue-600", emoji: "💙" };
    if (level >= 10) return { name: "Green Belt", color: "from-green-400 to-green-600", emoji: "💚" };
    if (level >= 5) return { name: "Yellow Belt", color: "from-yellow-300 to-yellow-500", emoji: "💛" };
    return { name: "White Belt", color: "from-gray-100 to-gray-300", emoji: "🤍" };
  };

  const beltRank = getBeltRank(level);

  // Financial Health Calculations
  const calculateFinancialHealth = () => {
    let totalScore = 0;

    // Emergency Fund Score (25% weight)
    const emergencyFundScore = calculateEmergencyFundScore();
    totalScore += emergencyFundScore * 0.25;

    // Savings Rate Score (20% weight)
    const savingsScore = calculateSavingsScore();
    totalScore += savingsScore * 0.20;

    // Account Diversity Score (15% weight)
    const diversityScore = calculateAccountDiversityScore();
    totalScore += diversityScore * 0.15;

    // Financial Engagement Score (20% weight)
    const engagementScore = calculateEngagementScore();
    totalScore += engagementScore * 0.20;

    // Goal Achievement Score (20% weight)
    const goalScore = calculateGoalAchievementScore();
    totalScore += goalScore * 0.20;

    return Math.round(totalScore);
  };

  const calculateEmergencyFundScore = (): number => {
    if (!bankAccounts.length) return 30;
    
    const savingsAccounts = bankAccounts.filter(acc => 
      acc.type === 'depository' && acc.subtype === 'savings'
    );
    
    if (savingsAccounts.length === 0) return 40;
    
    const totalSavings = savingsAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const monthlyExpenses = 3000; // This would ideally come from spending data
    const monthsCovered = totalSavings / monthlyExpenses;
    
    if (monthsCovered >= 6) return 100;
    if (monthsCovered >= 3) return 80;
    if (monthsCovered >= 1) return 60;
    return Math.max(30, monthsCovered * 30);
  };

  const calculateSavingsScore = (): number => {
    if (!goals.length) return 40;
    
    const totalTargetAmount = goals.reduce((sum, goal) => sum + (goal.target_amount || 0), 0);
    const totalSavedAmount = goals.reduce((sum, goal) => sum + (goal.saved_amount || 0), 0);
    
    if (totalTargetAmount === 0) return 50;
    
    const progressPercentage = (totalSavedAmount / totalTargetAmount) * 100;
    return Math.min(100, Math.max(20, progressPercentage));
  };

  const calculateAccountDiversityScore = (): number => {
    if (!bankAccounts.length) return 20;
    
    const accountTypes = new Set(bankAccounts.map(acc => acc.subtype));
    const typeCount = accountTypes.size;
    
    if (typeCount >= 4) return 100;
    if (typeCount === 3) return 80;
    if (typeCount === 2) return 60;
    return 40;
  };

  const calculateEngagementScore = (): number => {
    const baseScore = Math.min(100, level * 10);
    const accountBonus = bankAccounts.length > 0 ? 20 : 0;
    const goalBonus = goals.length > 0 ? 15 : 0;
    
    return Math.min(100, baseScore + accountBonus + goalBonus);
  };

  const calculateGoalAchievementScore = (): number => {
    if (!goals.length) return 30;
    
    const averageProgress = goals.reduce((sum, goal) => {
      const progress = goal.target_amount ? 
        ((goal.saved_amount || 0) / goal.target_amount) * 100 : 0;
      return sum + Math.min(100, progress);
    }, 0) / goals.length;
    
    return Math.round(averageProgress);
  };

  const healthScore = calculateFinancialHealth();

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

  const getAccountIcon = (type: string, subtype: string) => {
    if (type === 'depository') {
      if (subtype === 'checking') return CreditCard;
      if (subtype === 'savings') return PiggyBank;
    }
    if (type === 'investment') return TrendingUp;
    return Building2;
  };

  const getAccountTypeLabel = (type: string, subtype: string) => {
    if (type === 'depository') {
      if (subtype === 'checking') return 'Checking';
      if (subtype === 'savings') return 'Savings';
      if (subtype === 'cd') return 'Certificate of Deposit';
    }
    if (type === 'investment') {
      if (subtype === '401k') return '401(k)';
      if (subtype === 'ira') return 'IRA';
      return 'Investment';
    }
    if (type === 'credit') return 'Credit Card';
    if (type === 'loan') return 'Loan';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getAccountColor = (type: string) => {
    switch (type) {
      case 'depository': return 'from-blue-400 to-blue-600';
      case 'investment': return 'from-green-400 to-green-600';
      case 'credit': return 'from-purple-400 to-purple-600';
      case 'loan': return 'from-orange-400 to-orange-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const formatBalance = (balance: number) => {
    if (!showBalances) return '••••••';
    return `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatAccountNumber = (mask: string | null) => {
    if (!mask) return '••••';
    return `••••${mask}`;
  };

  return (
    <div className="space-y-8">
      {/* Plaid Credentials Modal */}
      <PlaidCredentialsModal
        isOpen={showCredentialsModal}
        onClose={closeCredentialsModal}
        onSubmit={connectWithCredentials}
        isLoading={plaidLoading}
      />

      {/* Plaid Connection Status Indicator */}
      {plaidLoading && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-20 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
          />
          <span className="text-sm">Connecting to Plaid...</span>
        </motion.div>
      )}

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] rounded-2xl p-6 text-white relative overflow-hidden"
      >
        <div className="absolute top-4 right-4">
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="w-16 h-16 opacity-20"
          >
            <img 
              src={doughjoMascot} 
              alt="DoughJo" 
              className="w-full h-full object-contain rounded-full"
            />
          </motion.div>
        </div>
        
        <h1 className="text-2xl font-serif font-bold mb-2">
          Welcome back, Financial Warrior! 🥋
        </h1>
        <p className="text-white/90 mb-4">
          Your comprehensive financial command center
        </p>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 bg-gradient-to-r ${beltRank.color} text-white rounded-lg px-3 py-1`}>
            <span className="text-sm">{beltRank.emoji}</span>
            <span className="text-sm font-medium">{beltRank.name}</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-1">
            <Award className="h-4 w-4" />
            <span className="text-sm">Level {level}</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-1">
            <span className="text-sm">{xp?.points || 0} XP</span>
          </div>
        </div>
      </motion.div>

      {/* Error Display */}
      {plaidError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3">
            <WifiOff className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-900 mb-1">Plaid Connection Error</h4>
              <p className="text-sm text-red-800">{plaidError}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-2 shadow-sm border border-gray-200"
      >
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-[#2A6F68] text-white'
                : 'text-gray-600 hover:text-[#2A6F68] hover:bg-gray-50'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('goals')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'goals'
                ? 'bg-[#2A6F68] text-white'
                : 'text-gray-600 hover:text-[#2A6F68] hover:bg-gray-50'
            }`}
          >
            Goals
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'accounts'
                ? 'bg-[#2A6F68] text-white'
                : 'text-gray-600 hover:text-[#2A6F68] hover:bg-gray-50'
            }`}
          >
            Accounts
          </button>
        </div>
      </motion.div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Financial Health Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#333333] mb-2">Financial Health Score</h2>
                <p className="text-gray-600">Your overall financial wellness assessment</p>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r ${getHealthScoreColor(healthScore)} text-white`}>
                  <HealthScoreIcon className="h-5 w-5" />
                  <span className="font-bold text-lg">{healthScore}/100</span>
                </div>
              </div>
            </div>

            <div className="relative mb-4">
              <div className="w-full bg-gray-200 rounded-full h-4">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${healthScore}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`h-4 rounded-full bg-gradient-to-r ${getHealthScoreColor(healthScore)}`}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Poor (0-49)</span>
                <span>Fair (50-69)</span>
                <span>Good (70-84)</span>
                <span>Excellent (85-100)</span>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-[#2A6F68]/5 to-[#B76E79]/5 rounded-lg border-l-4 border-[#2A6F68]">
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

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#2A6F68]/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-[#2A6F68]" />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowBalances(!showBalances)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {showBalances ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                  </button>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#333333] mb-1">
                {formatBalance(totalBalance)}
              </h3>
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className="text-xs text-green-600 mt-1">
                {bankAccounts.length} connected account{bankAccounts.length !== 1 ? 's' : ''}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
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
              <p className="text-sm text-gray-600">Active Goals</p>
              <p className="text-xs text-blue-600 mt-1">
                {goals.filter(g => {
                  const progress = g.target_amount ? ((g.saved_amount || 0) / g.target_amount) * 100 : 0;
                  return progress >= 100;
                }).length} completed
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-[#B76E79]/10 rounded-lg flex items-center justify-center">
                  <Award className="h-6 w-6 text-[#B76E79]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#333333] mb-1">
                {xp?.badges?.length || 0}
              </h3>
              <p className="text-sm text-gray-600">Achievements</p>
              <p className="text-xs text-[#B76E79] mt-1">
                {xp?.points || 0} XP earned
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${beltRank.color} rounded-lg flex items-center justify-center`}>
                  <span className="text-lg">{beltRank.emoji}</span>
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[#333333] mb-1">
                {beltRank.name}
              </h3>
              <p className="text-sm text-gray-600">Current Rank</p>
            </motion.div>
          </div>
        </>
      )}

      {activeTab === 'goals' && (
        <GoalsManager user={user} />
      )}

      {activeTab === 'accounts' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-[#333333]">Bank Accounts</h3>
              <p className="text-sm text-gray-600">Connected financial accounts</p>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={refreshAccounts}
                disabled={accountsLoading}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${accountsLoading ? 'animate-spin' : ''}`} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={openPlaidLink}
                disabled={plaidLoading}
                className="flex items-center space-x-2 bg-[#2A6F68] text-white px-4 py-2 rounded-lg hover:bg-[#235A54] disabled:opacity-50 transition-colors"
              >
                {plaidLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>Connect</span>
              </motion.button>
            </div>
          </div>

          {bankAccounts.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-2">No accounts connected</p>
              <p className="text-sm text-gray-400 mb-4">Connect your bank accounts for personalized insights</p>
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                <CheckCircle className="h-3 w-3" />
                <span>Bank-level security</span>
                <span>•</span>
                <CheckCircle className="h-3 w-3" />
                <span>Read-only access</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {bankAccounts.map((account, index) => {
                const IconComponent = getAccountIcon(account.type, account.subtype || '');
                
                return (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${getAccountColor(account.type)} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-[#333333] text-sm">{account.name}</h4>
                        <p className="text-xs text-gray-600">
                          {getAccountTypeLabel(account.type, account.subtype || '')} • {formatAccountNumber(account.mask)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#333333]">
                        {formatBalance(account.balance || 0)}
                      </p>
                      <p className="text-xs text-gray-500">{account.institution_name}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;