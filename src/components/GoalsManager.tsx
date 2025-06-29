import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Target, 
  Calendar, 
  DollarSign, 
  Edit3, 
  Trash2, 
  CheckCircle,
  TrendingUp,
  PiggyBank,
  Home,
  Car,
  Plane,
  GraduationCap,
  Heart,
  Gift,
  Shield,
  X,
  Lightbulb,
  TrendingDown,
  AlertTriangle,
  Flag
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useGoals } from '../hooks/useGoals';

interface GoalsManagerProps {
  user: User;
  onXPUpdate?: (points: number) => void;
}

interface GoalFormData {
  name: string;
  description: string; // New field
  target_amount: number;
  saved_amount: number;
  deadline: string;
  goal_type: string; // New field
  priority_level: string; // New field
  status: string; // New field
}

const GoalsManager: React.FC<GoalsManagerProps> = ({ user, onXPUpdate }) => {
  const { goals, loading, createGoal, updateGoal, deleteGoal, updateGoalStatus, updateGoalPriority } = useGoals(user);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    name: '',
    description: '',
    target_amount: 0,
    saved_amount: 0,
    deadline: '',
    goal_type: 'savings',
    priority_level: 'medium',
    status: 'active'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goalCategories = [
    { id: 'emergency', label: 'Emergency Fund', icon: Shield, color: 'from-red-400 to-red-600' },
    { id: 'savings', label: 'General Savings', icon: PiggyBank, color: 'from-green-400 to-green-600' },
    { id: 'house', label: 'Home Purchase', icon: Home, color: 'from-blue-400 to-blue-600' },
    { id: 'car', label: 'Vehicle', icon: Car, color: 'from-purple-400 to-purple-600' },
    { id: 'vacation', label: 'Vacation', icon: Plane, color: 'from-orange-400 to-orange-600' },
    { id: 'education', label: 'Education', icon: GraduationCap, color: 'from-indigo-400 to-indigo-600' },
    { id: 'wedding', label: 'Wedding', icon: Heart, color: 'from-pink-400 to-pink-600' },
    { id: 'investment', label: 'Investment', icon: TrendingUp, color: 'from-teal-400 to-teal-600' },
    { id: 'debt', label: 'Debt Payoff', icon: TrendingDown, color: 'from-red-400 to-red-600' },
    { id: 'other', label: 'Other', icon: Gift, color: 'from-gray-400 to-gray-600' }
  ];

  const priorityLevels = [
    { id: 'high', label: 'High Priority', color: 'text-red-600 bg-red-100', icon: AlertTriangle },
    { id: 'medium', label: 'Medium Priority', color: 'text-yellow-600 bg-yellow-100', icon: Flag },
    { id: 'low', label: 'Low Priority', color: 'text-green-600 bg-green-100', icon: CheckCircle }
  ];

  const statusOptions = [
    { id: 'active', label: 'Active', color: 'text-blue-600 bg-blue-100' },
    { id: 'completed', label: 'Completed', color: 'text-green-600 bg-green-100' },
    { id: 'paused', label: 'Paused', color: 'text-yellow-600 bg-yellow-100' },
    { id: 'cancelled', label: 'Cancelled', color: 'text-red-600 bg-red-100' }
  ];

  const handleOpenForm = (goal?: any) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name || '',
        description: goal.description || '',
        target_amount: goal.target_amount || 0,
        saved_amount: goal.saved_amount || goal.current_amount || 0,
        deadline: goal.deadline || goal.target_date || '',
        goal_type: goal.goal_type || 'savings',
        priority_level: goal.priority_level || 'medium',
        status: goal.status || 'active'
      });
    } else {
      setEditingGoal(null);
      setFormData({
        name: '',
        description: '',
        target_amount: 0,
        saved_amount: 0,
        deadline: '',
        goal_type: 'savings',
        priority_level: 'medium',
        status: 'active'
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingGoal(null);
    setFormData({
      name: '',
      description: '',
      target_amount: 0,
      saved_amount: 0,
      deadline: '',
      goal_type: 'savings',
      priority_level: 'medium',
      status: 'active'
    });
    setIsSubmitting(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || formData.target_amount <= 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingGoal) {
        await updateGoal(editingGoal.id, formData);
      } else {
        await createGoal(formData);
        // Award XP for creating a new goal
        if (onXPUpdate) {
          onXPUpdate(50);
        }
      }
      handleCloseForm();
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      await deleteGoal(goalId);
    }
  };

  const handleUpdateProgress = async (goalId: string, newAmount: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      await updateGoal(goalId, { saved_amount: newAmount });
      
      // Award XP for progress updates
      if (onXPUpdate && newAmount > (goal.saved_amount || goal.current_amount || 0)) {
        onXPUpdate(10);
      }
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return goalCategories.find(cat => cat.id === categoryId) || goalCategories[1];
  };

  const getPriorityInfo = (priorityId: string) => {
    return priorityLevels.find(p => p.id === priorityId) || priorityLevels[1];
  };

  const getStatusInfo = (statusId: string) => {
    return statusOptions.find(s => s.id === statusId) || statusOptions[0];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No deadline';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProgressPercentage = (saved: number, target: number) => {
    if (target <= 0) return 0;
    return Math.min((saved / target) * 100, 100);
  };

  const getDaysUntilDeadline = (deadline: string) => {
    if (!deadline) return null;
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Calculate insights
  const totalTargetAmount = goals.reduce((sum, goal) => sum + (goal.target_amount || 0), 0);
  const totalSavedAmount = goals.reduce((sum, goal) => sum + (goal.saved_amount || goal.current_amount || 0), 0);
  const overallProgress = totalTargetAmount > 0 ? (totalSavedAmount / totalTargetAmount) * 100 : 0;
  const completedGoals = goals.filter(goal => 
    goal.status === 'completed' || 
    getProgressPercentage(goal.saved_amount || goal.current_amount || 0, goal.target_amount || 0) >= 100
  );
  const nearDeadlineGoals = goals.filter(goal => {
    const days = getDaysUntilDeadline(goal.deadline || goal.target_date || '');
    return days !== null && days <= 30 && days >= 0;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#333333] mb-2">Financial Goals</h2>
          <p className="text-gray-600">Track your progress toward financial milestones</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleOpenForm()}
          className="flex items-center space-x-2 bg-[#2A6F68] text-white px-4 py-2 rounded-lg hover:bg-[#235A54] transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Goal</span>
        </motion.button>
      </div>

      {/* Enhanced Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#333333]">
                {editingGoal ? 'Edit Goal' : 'Create New Goal'}
              </h3>
              <button
                onClick={handleCloseForm}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Goal Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#333333] mb-1">
                  Goal Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Emergency Fund, Dream Vacation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent transition-all"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#333333] mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your goal and why it's important to you"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent transition-all"
                />
              </div>

              {/* Target Amount */}
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">
                  Target Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={formData.target_amount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, target_amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="10000"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Current Amount */}
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">
                  Current Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.saved_amount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, saved_amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Goal Type */}
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">
                  Goal Type
                </label>
                <select
                  value={formData.goal_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, goal_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent transition-all"
                >
                  {goalCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority Level */}
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">
                  Priority Level
                </label>
                <select
                  value={formData.priority_level}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority_level: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent transition-all"
                >
                  {priorityLevels.map(priority => (
                    <option key={priority.id} value={priority.id}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent transition-all"
                >
                  {statusOptions.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium text-[#333333] mb-1">
                  Target Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent transition-all"
                />
              </div>

              {/* Actions */}
              <div className="md:col-span-2 flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={!formData.name.trim() || formData.target_amount <= 0 || isSubmitting}
                  className="flex-1 bg-[#2A6F68] text-white px-4 py-2 rounded-lg hover:bg-[#235A54] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    editingGoal ? 'Update Goal' : 'Create Goal'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goals Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-[#2A6F68] border-t-transparent rounded-full"
          />
        </div>
      ) : goals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300"
        >
          <div className="w-16 h-16 bg-[#2A6F68]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="h-8 w-8 text-[#2A6F68]" />
          </div>
          <h3 className="text-xl font-semibold text-[#333333] mb-2">No Goals Yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Start your financial journey by setting your first goal. Whether it's an emergency fund, 
            vacation, or dream home - every goal begins with a single step.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleOpenForm()}
            className="inline-flex items-center space-x-2 bg-[#2A6F68] text-white px-6 py-3 rounded-lg hover:bg-[#235A54] transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Your First Goal</span>
          </motion.button>
        </motion.div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {goals.map((goal, index) => {
                const categoryInfo = getCategoryInfo(goal.goal_type || 'savings');
                const priorityInfo = getPriorityInfo(goal.priority_level || 'medium');
                const statusInfo = getStatusInfo(goal.status || 'active');
                const CategoryIcon = categoryInfo.icon;
                const PriorityIcon = priorityInfo.icon;
                const progress = getProgressPercentage(goal.saved_amount || goal.current_amount || 0, goal.target_amount || 0);
                const daysLeft = getDaysUntilDeadline(goal.deadline || goal.target_date || '');
                const isCompleted = goal.status === 'completed' || progress >= 100;
                
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white rounded-xl p-6 shadow-sm border-2 transition-all hover:shadow-md ${
                      isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 bg-gradient-to-r ${categoryInfo.color} rounded-lg flex items-center justify-center`}>
                          <CategoryIcon className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#333333] text-lg">{goal.name}</h3>
                          <p className="text-sm text-gray-600">{categoryInfo.label}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-1">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <span>{statusInfo.label}</span>
                        </div>
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}>
                          <PriorityIcon className="h-3 w-3" />
                          <span>{priorityInfo.label.split(' ')[0]}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {goal.description && (
                      <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
                    )}

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[#333333]">
                          {formatCurrency(goal.saved_amount || goal.current_amount || 0)} of {formatCurrency(goal.target_amount || 0)}
                        </span>
                        <span className="text-sm font-medium text-[#2A6F68]">
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-3 rounded-full ${
                            isCompleted 
                              ? 'bg-gradient-to-r from-green-400 to-green-600' 
                              : `bg-gradient-to-r ${categoryInfo.color}`
                          }`}
                        />
                      </div>
                    </div>

                    {/* Deadline */}
                    {(goal.deadline || goal.target_date) && (
                      <div className="flex items-center space-x-2 mb-4 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">{formatDate(goal.deadline || goal.target_date || '')}</span>
                        {daysLeft !== null && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            daysLeft < 0 ? 'bg-red-100 text-red-700' :
                            daysLeft < 30 ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {daysLeft < 0 ? 'Overdue' : 
                             daysLeft === 0 ? 'Today' :
                             daysLeft === 1 ? '1 day left' :
                             `${daysLeft} days left`}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Quick Progress Update */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Update Progress
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max={goal.target_amount || 0}
                          value={goal.saved_amount || goal.current_amount || 0}
                          onChange={(e) => handleUpdateProgress(goal.id, parseFloat(e.target.value) || 0)}
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#2A6F68] focus:border-transparent"
                        />
                        <TrendingUp className="h-4 w-4 text-[#2A6F68]" />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOpenForm(goal)}
                        className="flex-1 flex items-center justify-center space-x-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(goal.id)}
                        className="flex items-center justify-center bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Goal Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="h-5 w-5 text-[#B76E79]" />
              <h3 className="text-lg font-semibold text-[#333333]">Goal Insights</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-[#2A6F68]/5 rounded-lg">
                <div className="text-2xl font-bold text-[#2A6F68] mb-1">
                  {overallProgress.toFixed(0)}%
                </div>
                <div className="text-sm text-gray-600">Overall Progress</div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatCurrency(totalSavedAmount)} of {formatCurrency(totalTargetAmount)}
                </div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {completedGoals.length}
                </div>
                <div className="text-sm text-gray-600">Goals Completed</div>
                <div className="text-xs text-gray-500 mt-1">
                  {goals.length > 0 ? ((completedGoals.length / goals.length) * 100).toFixed(0) : 0}% completion rate
                </div>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {nearDeadlineGoals.length}
                </div>
                <div className="text-sm text-gray-600">Due Soon</div>
                <div className="text-xs text-gray-500 mt-1">
                  Within 30 days
                </div>
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-[#2A6F68]/5 to-[#B76E79]/5 rounded-lg border-l-4 border-[#2A6F68]">
              <div className="flex items-start space-x-3">
                <TrendingUp className="h-5 w-5 text-[#2A6F68] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-[#333333] mb-1">Financial Wisdom</h4>
                  <p className="text-sm text-gray-700">
                    {overallProgress >= 80 ? 
                      "Excellent progress! You're demonstrating strong financial discipline. Consider setting stretch goals to maintain momentum." :
                      overallProgress >= 50 ?
                      "Good momentum on your financial goals! Focus on consistency and consider automating your savings to accelerate progress." :
                      overallProgress >= 25 ?
                      "You're building good habits! Try the 'pay yourself first' strategy - save for goals before other expenses." :
                      "Every financial journey starts with a single step. Start small, be consistent, and celebrate each milestone along the way."
                    }
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default GoalsManager;