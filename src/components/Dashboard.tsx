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
  ArrowDown
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useGoals } from '../hooks/useGoals';
import { useBankAccounts } from '../hooks/useBankAccounts';
import { usePlaidLink } from '../hooks/usePlaidLink';
import GoalsManager from './GoalsManager';
import doughjoMascot from '../assets/doughjo-mascot.png';

interface DashboardProps {
  user: User;
  xp: { points: number | null; badges: string[] | null } | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user, xp }) => {
  const { goals, loading: goalsLoading, updateGoal } = useGoals(user);
  const { bankAccounts, loading: accountsLoading, refreshAccounts, totalBalance } = useBankAccounts(user);
  const { openPlaidLink, isLoading: plaidLoading } = usePlaidLink(user);
  const [showBalances, setShowBalances] = useState(true);
  const [showGoalsModal, setShowGoalsModal] = useState(false);

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

  // Enhanced Financial Health Calculations
  const calculateFinancialHealth = () => {
    let totalScore = 0;
    const emergencyFundScore = calculateEmergencyFundScore();
    const savingsScore = calculateSavingsScore();
    const diversityScore = calculateAccountDiversityScore();
    const engagementScore = calculateEngagementScore();
    const goalScore = calculateGoalAchievementScore();

    totalScore += emergencyFundScore * 0.25;
    totalScore += savingsScore * 0.20;
    totalScore += diversityScore * 0.15;
    totalScore += engagementScore * 0.20;
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
    const monthlyExpenses = 3000; // Estimated
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

  // Calculate additional metrics
  const calculateCreditUtilization = () => {
    // Simulated - in real app would come from credit data
    return Math.floor(Math.random() * 30) + 15; // 15-45%
  };

  const calculateDebtToIncome = () => {
    // Simulated - would calculate from actual debt and income data
    return Math.floor(Math.random() * 25) + 15; // 15-40%
  };

  const calculateSavingsRate = () => {
    if (!goals.length || totalBalance === 0) return 0;
    const totalSaved = goals.reduce((sum, goal) => sum + (goal.saved_amount || 0), 0);
    return Math.min(100, (totalSaved / totalBalance) * 100);
  };

  const calculateMonthlyCashFlow = () => {
    // Simulated positive cash flow
    return Math.floor(Math.random() * 2000) + 500;
  };

  const healthScore = calculateFinancialHealth();
  const creditUtilization = calculateCreditUtilization();
  const debtToIncome = calculateDebtToIncome();
  const savingsRate = calculateSavingsRate();
  const monthlyCashFlow = calculateMonthlyCashFlow();

  const getHealthScoreColor = (score: number) => {
    if (score >= 85) return 'from-green-400 to-green-600';
    if (score >= 70) return 'from-[#2A6F68] to-[#2A6F68]';
    if (score >= 50) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 85) return CheckCircle;
    if (score >= 70) return TrendingUp;
    if (score >= 50) return AlertTriangle;
    return TrendingDown;
  };

  const getMetricColor = (value: number, type: 'credit' | 'debt' | 'savings') => {
    switch (type) {
      case 'credit':
        if (value <= 10) return 'text-green-600';
        if (value <= 30) return 'text-yellow-600';
        return 'text-red-600';
      case 'debt':
        if (value <= 20) return 'text-green-600';
        if (value <= 35) return 'text-yellow-600';
        return 'text-red-600';
      case 'savings':
        if (value >= 20) return 'text-green-600';
        if (value >= 10) return 'text-yellow-600';
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getMetricStatus = (value: number, type: 'credit' | 'debt' | 'savings') => {
    switch (type) {
      case 'credit':
        if (value <= 10) return 'Excellent';
        if (value <= 30) return 'Good';
        return 'Needs Attention';
      case 'debt':
        if (value <= 20) return 'Healthy';
        if (value <= 35) return 'Manageable';
        return 'High';
      case 'savings':
        if (value >= 20) return 'Excellent';
        if (value >= 10) return 'Good';
        return 'Low';
      default:
        return 'Unknown';
    }
  };

  const HealthScoreIcon = getHealthScoreIcon(healthScore);

  // Goal insights calculations
  const totalTargetAmount = goals.reduce((sum, goal) => sum + (goal.target_amount || 0), 0);
  const totalSavedAmount = goals.reduce((sum, goal) => sum + (goal.saved_amount || 0), 0);
  const overallProgress = totalTargetAmount > 0 ? (totalSavedAmount / totalTargetAmount) * 100 : 0;
  const completedGoals = goals.filter(goal => getProgressPercentage(goal.saved_amount || 0, goal.target_amount || 0) >= 100);

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
                <h1 className="text-2xl font-bold mb-1">Financial Dashboard</h1>
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

      {/* Simplified Financial Health Score - Matching Screenshot */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
            Good progress! You're in the 75th percentile for your age group.
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
            <div className="text-xl font-bold text-[#2A6F68]">+{formatCurrency(monthlyCashFlow)}</div>
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
            <div className={`text-xl font-bold ${getMetricColor(debtToIncome, 'debt')}`}>
              {debtToIncome}%
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
            <div className={`text-xl font-bold ${getMetricColor(savingsRate, 'savings')}`}>
              {savingsRate.toFixed(0)}%
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
                Hello! I'm your AI financial companion. I've been analyzing your finances, and I have some insights to share. You're not behind — you're just getting started.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary of Accounts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#333333] mb-2">Account Summary</h2>
            <p className="text-gray-600">Overview of your connected financial accounts</p>
          </div>
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowBalances(!showBalances)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="text-sm">{showBalances ? 'Hide' : 'Show'} Balances</span>
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
              onClick={openPlaidLink}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Total Balance</h3>
                  <p className="text-3xl font-bold">
                    {showBalances ? formatCurrency(totalBalance) : '••••••'}
                  </p>
                  <p className="text-white/80 text-sm mt-1">
                    Across {bankAccounts.length} account{bankAccounts.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <DollarSign className="h-8 w-8" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#333333] mb-1">
                {bankAccounts.filter(acc => acc.subtype === 'checking').length}
              </h3>
              <p className="text-sm text-gray-600">Checking Accounts</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <PiggyBank className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#333333] mb-1">
                {bankAccounts.filter(acc => acc.subtype === 'savings').length}
              </h3>
              <p className="text-sm text-gray-600">Savings Accounts</p>
            </div>
          </div>
        )}
      </motion.div>

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
                const progress = getProgressPercentage(goal.saved_amount || 0, goal.target_amount || 0);
                const remaining = (goal.target_amount || 0) - (goal.saved_amount || 0);
                
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
                          {formatCurrency(goal.saved_amount || 0)} / {formatCurrency(goal.target_amount || 0)}
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
                  `You're ${overallProgress.toFixed(0)}% of the way to your emergency fund goal. At your current savings rate, you'll reach your target in approximately 3 months. Keep up the excellent work!` :
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

      {/* Connected Accounts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#333333] mb-2">Connected Accounts</h2>
            <p className="text-gray-600">Your linked financial accounts</p>
          </div>
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
            <span>Connect Account</span>
          </motion.button>
        </div>

        {bankAccounts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-[#333333] mb-2">No Accounts Connected</h3>
            <p className="text-gray-600">Connect your bank accounts for personalized insights</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.slice(0, 4).map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#2A6F68]/10 rounded-lg flex items-center justify-center">
                    {account.subtype === 'checking' ? (
                      <CreditCard className="h-5 w-5 text-[#2A6F68]" />
                    ) : (
                      <PiggyBank className="h-5 w-5 text-[#2A6F68]" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-[#333333]">{account.name}</h4>
                    <p className="text-sm text-gray-600">{account.institution_name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#333333]">
                    {showBalances ? formatCurrency(account.balance || 0) : '••••••'}
                  </p>
                  <p className="text-xs text-gray-500">••••{account.mask}</p>
                </div>
              </motion.div>
            ))}
            {bankAccounts.length > 4 && (
              <div className="text-center pt-2 md:col-span-2">
                <p className="text-sm text-gray-500">
                  +{bankAccounts.length - 4} more accounts
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>

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
    </div>
  );
};

export default Dashboard;