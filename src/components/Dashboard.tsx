import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Edit3,
  Calendar,
  Home,
  Car,
  Plane,
  GraduationCap,
  Heart,
  Gift,
  Shield,
  X,
  BarChart3,
  Percent,
  Calculator,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useGoals } from '../hooks/useGoals';
import { useBankAccounts } from '../hooks/useBankAccounts';
import { usePlaidLink } from '../hooks/usePlaidLink';
import { useFinancialHealth } from '../hooks/useFinancialHealth';
import GoalsManager from './GoalsManager';
import FinancialHealthBoard from './FinancialHealthBoard';
import PlaidCredentialsModal from './PlaidCredentialsModal';
import doughjoMascot from '../assets/doughjo-mascot.png';

interface DashboardProps {
  user: User;
  xp: { points: number | null; badges: string[] | null } | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user, xp }) => {
  const { goals, loading: goalsLoading, updateGoal } = useGoals(user);
  const { bankAccounts, loading: accountsLoading, refreshAccounts, totalBalance } = useBankAccounts(user);
  const { 
    connectWithCredentials,
    isLoading: plaidLoading, 
    error: plaidError
  } = usePlaidLink(user);
  const { healthScore, healthMetrics } = useFinancialHealth(user);
  const [showBalances, setShowBalances] = useState(true);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'health'>('overview');

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

  const goalCategories = {
    emergency: { label: 'Emergency Fund', icon: Shield, color: 'from-red-400 to-red-600' },
    savings: { label: 'General Savings', icon: PiggyBank, color: 'from-green-400 to-green-600' },
    house: { label: 'Home Purchase', icon: Home, color: 'from-blue-400 to-blue-600' },
    car: { label: 'Vehicle', icon: Car, color: 'from-purple-400 to-purple-600' },
    vacation: { label: 'Vacation', icon: Plane, color: 'from-orange-400 to-orange-600' },
    education: { label: 'Education', icon: GraduationCap, color: 'from-indigo-400 to-indigo-600' },
    wedding: { label: 'Wedding', icon: Heart, color: 'from-pink-400 to-pink-600' },
    investment: { label: 'Investment', icon: TrendingUp, color: 'from-teal-400 to-teal-600' },
    debt: { label: 'Debt Payoff', icon: TrendingDown, color: 'from-red-400 to-red-600' },
    other: { label: 'Other', icon: Gift, color: 'from-gray-400 to-gray-600' }
  };

  const getCategoryInfo = (categoryId: string) => {
    return goalCategories[categoryId as keyof typeof goalCategories] || goalCategories.savings;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getProgressPercentage = (saved: number, target: number) => {
    if (target <= 0) return 0;
    return Math.min((saved / target) * 100, 100);
  };

  const handleUpdateProgress = async (goalId: string, newAmount: number) => {
    await updateGoal(goalId, { saved_amount: newAmount });
  };

  const handleConnectAccount = () => {
    setShowConnectModal(true);
  };

  const handleConnectWithCredentials = async (username: string, password: string) => {
    await connectWithCredentials(username, password);
    setShowConnectModal(false);
  };

  const handleCloseConnectModal = () => {
    setShowConnectModal(false);
  };

  // Goal insights calculations
  const totalTargetAmount = goals.reduce((sum, goal) => sum + (goal.target_amount || 0), 0);
  const totalSavedAmount = goals.reduce((sum, goal) => sum + (goal.saved_amount || goal.current_amount || 0), 0);
  const overallProgress = totalTargetAmount > 0 ? (totalSavedAmount / totalTargetAmount) * 100 : 0;
  const completedGoals = goals.filter(goal => 
    goal.status === 'completed' || 
    getProgressPercentage(goal.saved_amount || goal.current_amount || 0, goal.target_amount || 0) >= 100
  );

  return (
    <div className="space-y-6">
      {/* Compact Header - Same height as other pages */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#2A6F68] via-[#2A6F68] to-[#B76E79] rounded-2xl p-6 text-white relative overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full transform translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full transform -translate-x-12 translate-y-12"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
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
                className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center p-1"
              >
                <img 
                  src={doughjoMascot} 
                  alt="DoughJo" 
                  className="w-full h-full object-contain rounded-lg"
                />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Dough Vault</h1>
                <p className="text-white/90">Your complete financial overview and insights</p>
              </div>
            </div>
            
            {/* Compact Quick Stats */}
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
          </div>
        </div>
      </motion.div>

      {/* Dashboard Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'overview'
              ? 'bg-[#2A6F68] text-white'
              : 'text-[#333333] hover:bg-gray-100'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'health'
              ? 'bg-[#2A6F68] text-white'
              : 'text-[#333333] hover:bg-gray-100'
          }`}
        >
          Financial Health
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>
          {/* Side-by-side Account Summary (Left) and Financial Health Score (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Account Summary - Left Side */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-[#333333] mb-2">Account Summary</h2>
                  <p className="text-gray-600">Overview of your financial position</p>
                </div>
                <div className="flex items-center space-x-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowBalances(!showBalances)}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="text-sm">{showBalances ? 'Hide' : 'Show'}</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={refreshAccounts}
                    disabled={accountsLoading}
                    className="flex items-center space-x-2 px-3 py-2 bg-[#2A6F68] text-white rounded-lg hover:bg-[#235A54] disabled:opacity-50 transition-colors"
                  >
                    <RefreshCw className={`h-4 w-4 ${accountsLoading ? 'animate-spin' : ''}`} />
                    <span className="text-sm">Refresh</span>
                  </motion.button>
                </div>
              </div>

              {bankAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#333333] mb-2">No Accounts Connected</h3>
                  <p className="text-gray-600 mb-4">Connect your bank accounts for personalized insights</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConnectAccount}
                    disabled={plaidLoading}
                    className="inline-flex items-center space-x-2 bg-[#2A6F68] text-white px-4 py-2 rounded-lg hover:bg-[#235A54] disabled:opacity-50 transition-colors"
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
                    <span>Connect Account</span>
                  </motion.button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Net Worth, Assets, Debt - 3 Column Grid */}
                  <div className="grid grid-cols-3 gap-4">
                    {/* Net Worth */}
                    <div className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] rounded-xl p-4 text-white text-center">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div className="text-lg font-bold">
                        {showBalances ? formatCurrency(totalBalance) : '••••••'}
                      </div>
                      <div className="text-white/80 text-xs">Net Worth</div>
                    </div>

                    {/* Assets */}
                    <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="text-lg font-bold text-green-700">
                        {showBalances ? formatCurrency(totalBalance) : '••••••'}
                      </div>
                      <div className="text-green-600 text-xs">Assets</div>
                    </div>

                    {/* Debt */}
                    <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Minus className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="text-lg font-bold text-red-700">
                        {showBalances ? '$0' : '••••••'}
                      </div>
                      <div className="text-red-600 text-xs">Debt</div>
                    </div>
                  </div>

                  {/* Account Types */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="text-lg font-bold text-[#333333] mb-1">
                        {bankAccounts.filter(acc => acc.account_subtype === 'checking').length}
                      </div>
                      <div className="text-sm text-gray-600">Checking Accounts</div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <PiggyBank className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div className="text-lg font-bold text-[#333333] mb-1">
                        {bankAccounts.filter(acc => acc.account_subtype === 'savings').length}
                      </div>
                      <div className="text-sm text-gray-600">Savings Accounts</div>
                    </div>
                  </div>

                  {/* Add Account Button */}
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-[#2A6F68] transition-colors">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConnectAccount}
                      disabled={plaidLoading}
                      className="inline-flex items-center space-x-2 text-[#2A6F68] hover:text-[#235A54] transition-colors"
                    >
                      {plaidLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-[#2A6F68] border-t-transparent rounded-full"
                        />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      <span className="font-medium">Connect Another Account</span>
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Financial Health Score - Right Side */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#333333]">Financial Health Score</h2>
                <div className="text-right">
                  <div className="text-4xl font-bold text-[#2A6F68]">{healthScore}</div>
                </div>
              </div>

              {/* Main Health Score Progress */}
              <div className="relative mb-6">
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${healthScore}%` }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className="h-3 rounded-full bg-[#2A6F68]"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {healthScore >= 75 ? 
                    "Good progress! You're in the 75th percentile for your age group." :
                    healthScore >= 50 ?
                    "You're making progress! Continue building your financial foundation." :
                    "You're taking the first steps toward financial wellness."}
                </p>
              </div>

              {/* Compact Health Metrics Grid - 2x2 Layout */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Financial Health */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Financial Health</span>
                    <div className="flex items-center space-x-1">
                      <ArrowUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">+5</span>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-[#2A6F68]">{healthScore}/100</div>
                </div>

                {/* Monthly Cash Flow */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Monthly Cash Flow</span>
                    <div className="flex items-center space-x-1">
                      <ArrowUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">+12%</span>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-[#2A6F68]">+{formatCurrency(totalBalance * 0.05)}</div>
                </div>

                {/* Debt-to-Income */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Debt-to-Income</span>
                    <div className="flex items-center space-x-1">
                      <ArrowDown className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">-3%</span>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    0%
                  </div>
                </div>

                {/* Savings Rate */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Savings Rate</span>
                    <div className="flex items-center space-x-1">
                      <ArrowUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">+2%</span>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-green-600">
                    {totalBalance > 0 && totalSavedAmount > 0 ? 
                      `${Math.min(100, Math.round((totalSavedAmount / totalBalance) * 100))}%` : 
                      '0%'}
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="p-4 bg-gradient-to-r from-[#2A6F68]/5 to-[#B76E79]/5 rounded-xl border-l-4 border-[#2A6F68]">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-[#2A6F68] mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-[#333333] mb-1">AI Financial Insight</h4>
                    <p className="text-sm text-gray-700">
                      {bankAccounts.length > 0 ? 
                        `Based on your ${bankAccounts.length} connected account${bankAccounts.length !== 1 ? 's' : ''} and ${goals.length} goal${goals.length !== 1 ? 's' : ''}, your financial foundation is ${healthScore >= 70 ? 'strong' : 'developing'}. ${healthScore >= 70 ? 'Consider optimizing your savings strategy.' : 'Focus on building your emergency fund first.'}` :
                        "Connect your bank accounts to get personalized financial insights and recommendations tailored to your situation."}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Financial Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#333333]">Financial Goals</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowGoalsModal(true)}
                className="flex items-center space-x-2 bg-[#2A6F68] text-white px-4 py-2 rounded-lg hover:bg-[#235A54] transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>New Goal</span>
              </motion.button>
            </div>

            {goalsLoading ? (
              <div className="flex items-center justify-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 border-2 border-[#2A6F68] border-t-transparent rounded-full"
                />
              </div>
            ) : goals.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-[#2A6F68]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-[#2A6F68]" />
                </div>
                <h3 className="text-lg font-semibold text-[#333333] mb-2">No Goals Yet</h3>
                <p className="text-gray-600 mb-4">Start your financial journey by setting your first goal</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowGoalsModal(true)}
                  className="inline-flex items-center space-x-2 bg-[#2A6F68] text-white px-4 py-2 rounded-lg hover:bg-[#235A54] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Goal</span>
                </motion.button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Goal Cards */}
                <div className="space-y-4">
                  {goals.map((goal, index) => {
                    const progress = getProgressPercentage(goal.saved_amount || goal.current_amount || 0, goal.target_amount || 0);
                    const remaining = (goal.target_amount || 0) - (goal.saved_amount || goal.current_amount || 0);
                    
                    return (
                      <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 + index * 0.1 }}
                        className="bg-gray-50 rounded-xl p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-[#333333]">{goal.name}</h3>
                          <div className="text-right">
                            <div className="text-lg font-bold text-[#333333]">
                              {formatCurrency(goal.saved_amount || goal.current_amount || 0)} / {formatCurrency(goal.target_amount || 0)}
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                              className="h-3 rounded-full bg-[#2A6F68]"
                            />
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{progress.toFixed(0)}% complete</span>
                            <span className="text-gray-600">{formatCurrency(remaining)} to go</span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Goal Insights */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-[#2A6F68]/5 rounded-xl p-6 border-l-4 border-[#2A6F68]"
                >
                  <h3 className="text-lg font-semibold text-[#2A6F68] mb-3">Goal Insight</h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {overallProgress >= 80 ? 
                      `You're ${overallProgress.toFixed(0)}% of the way to your financial goals. At your current savings rate, you'll reach your targets ahead of schedule. Keep up the excellent work!` :
                      overallProgress >= 50 ?
                      `You're making solid progress at ${overallProgress.toFixed(0)}% completion across your goals. Consider automating your savings to accelerate your progress.` :
                      overallProgress >= 25 ?
                      `You're ${overallProgress.toFixed(0)}% of the way there! Try the 'pay yourself first' strategy - save for goals before other expenses to build momentum.` :
                      "Every financial journey starts with a single step. Start small, be consistent, and celebrate each milestone along the way."
                    }
                  </p>
                </motion.div>
              </div>
            )}
          </motion.div>
        </>
      ) : (
        <FinancialHealthBoard user={user} xp={xp} />
      )}

      {/* Goals Manager Modal */}
      <AnimatePresence>
        {showGoalsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowGoalsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-[#333333]">Manage Financial Goals</h2>
                  <button
                    onClick={() => setShowGoalsModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <GoalsManager user={user} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connect Account Modal */}
      <PlaidCredentialsModal
        isOpen={showConnectModal}
        onClose={handleCloseConnectModal}
        onSubmit={handleConnectWithCredentials}
        isLoading={plaidLoading}
      />
    </div>
  );
};

export default Dashboard;