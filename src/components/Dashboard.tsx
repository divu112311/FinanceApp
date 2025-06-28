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
  Shield
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

  // Financial Health Calculations
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
    const monthlyExpenses = 3000;
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

  return (
    <div className="space-y-8">
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Financial Goals (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Goals Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-[#333333] mb-2">Financial Goals</h2>
                <p className="text-gray-600">Track your progress toward financial milestones</p>
              </div>
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
              <div className="space-y-4">
                {goals.slice(0, 3).map((goal, index) => {
                  const categoryInfo = getCategoryInfo(goal.category || 'savings');
                  const CategoryIcon = categoryInfo.icon;
                  const progress = getProgressPercentage(goal.saved_amount || 0, goal.target_amount || 0);
                  const remaining = (goal.target_amount || 0) - (goal.saved_amount || 0);
                  
                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 bg-gradient-to-r ${categoryInfo.color} rounded-lg flex items-center justify-center`}>
                            <CategoryIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#333333]">{goal.name}</h4>
                            <p className="text-sm text-gray-600">{categoryInfo.label}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#333333]">
                            {formatCurrency(goal.saved_amount || 0)} / {formatCurrency(goal.target_amount || 0)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatCurrency(remaining)} to go
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-600">{progress.toFixed(0)}% complete</span>
                          <button
                            onClick={() => setShowGoalsModal(true)}
                            className="text-[#2A6F68] hover:text-[#235A54] transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ delay: 0.3 + index * 0.1, duration: 1 }}
                            className={`h-3 rounded-full bg-gradient-to-r ${categoryInfo.color}`}
                          />
                        </div>
                      </div>

                      {goal.deadline && (
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Target: {new Date(goal.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                
                {goals.length > 3 && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setShowGoalsModal(true)}
                      className="text-[#2A6F68] hover:text-[#235A54] text-sm font-medium transition-colors"
                    >
                      View all {goals.length} goals →
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Financial Health Score */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
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
        </div>

        {/* Right Column - Stats & Accounts (1/3 width) */}
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-[#2A6F68]/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-[#2A6F68]" />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowBalances(!showBalances)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    {showBalances ? <EyeOff className="h-3 w-3 text-gray-400" /> : <Eye className="h-3 w-3 text-gray-400" />}
                  </button>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#333333] mb-1">
                {showBalances ? `$${totalBalance.toLocaleString()}` : '••••••'}
              </h3>
              <p className="text-sm text-gray-600">Total Balance</p>
              <p className="text-xs text-green-600 mt-1">
                {bankAccounts.length} connected account{bankAccounts.length !== 1 ? 's' : ''}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#333333] mb-1">
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
              transition={{ delay: 0.6 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-[#B76E79]/10 rounded-lg flex items-center justify-center">
                  <Award className="h-5 w-5 text-[#B76E79]" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#333333] mb-1">
                {xp?.badges?.length || 0}
              </h3>
              <p className="text-sm text-gray-600">Achievements</p>
              <p className="text-xs text-[#B76E79] mt-1">
                {xp?.points || 0} XP earned
              </p>
            </motion.div>
          </div>

          {/* Bank Accounts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-[#333333]">Bank Accounts</h3>
                <p className="text-xs text-gray-600">Connected accounts</p>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={refreshAccounts}
                  disabled={accountsLoading}
                  className="p-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  <RefreshCw className={`h-3 w-3 ${accountsLoading ? 'animate-spin' : ''}`} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={openPlaidLink}
                  disabled={plaidLoading}
                  className="flex items-center space-x-1 bg-[#2A6F68] text-white px-2 py-1 rounded text-xs hover:bg-[#235A54] disabled:opacity-50 transition-colors"
                >
                  {plaidLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-3 h-3 border border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  <span>Connect</span>
                </motion.button>
              </div>
            </div>

            {bankAccounts.length === 0 ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Building2 className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 mb-2">No accounts connected</p>
                <p className="text-xs text-gray-400">Connect for insights</p>
              </div>
            ) : (
              <div className="space-y-2">
                {bankAccounts.slice(0, 3).map((account, index) => (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.1 }}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-[#2A6F68]/10 rounded flex items-center justify-center">
                        {account.subtype === 'checking' ? (
                          <CreditCard className="h-3 w-3 text-[#2A6F68]" />
                        ) : (
                          <PiggyBank className="h-3 w-3 text-[#2A6F68]" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-medium text-[#333333]">{account.name}</h4>
                        <p className="text-xs text-gray-500">{account.institution_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-[#333333]">
                        {showBalances ? `$${(account.balance || 0).toLocaleString()}` : '••••'}
                      </p>
                    </div>
                  </motion.div>
                ))}
                {bankAccounts.length > 3 && (
                  <p className="text-xs text-gray-500 text-center pt-1">
                    +{bankAccounts.length - 3} more
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>

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
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
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