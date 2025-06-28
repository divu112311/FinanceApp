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
  X
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useGoals } from '../hooks/useGoals';

interface GoalsManagerProps {
  user: User;
  onXPUpdate?: (points: number) => void;
}

interface GoalFormData {
  name: string;
  target_amount: number;
  saved_amount: number;
  deadline: string;
  category: string;
}

const GoalsManager: React.FC<GoalsManagerProps> = ({ user, onXPUpdate }) => {
  const { goals, loading, createGoal, updateGoal, deleteGoal } = useGoals(user);
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    name: '',
    target_amount: 0,
    saved_amount: 0,
    deadline: '',
    category: 'savings'
  });

  const goalCategories = [
    { id: 'emergency', label: 'Emergency Fund', icon: PiggyBank, color: 'from-red-400 to-red-600' },
    { id: 'savings', label: 'General Savings', icon: DollarSign, color: 'from-green-400 to-green-600' },
    { id: 'house', label: 'Home Purchase', icon: Home, color: 'from-blue-400 to-blue-600' },
    { id: 'car', label: 'Vehicle', icon: Car, color: 'from-purple-400 to-purple-600' },
    { id: 'vacation', label: 'Vacation', icon: Plane, color: 'from-orange-400 to-orange-600' },
    { id: 'education', label: 'Education', icon: GraduationCap, color: 'from-indigo-400 to-indigo-600' },
    { id: 'wedding', label: 'Wedding', icon: Heart, color: 'from-pink-400 to-pink-600' },
    { id: 'other', label: 'Other', icon: Gift, color: 'from-gray-400 to-gray-600' }
  ];

  const handleOpenModal = (goal?: any) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name || '',
        target_amount: goal.target_amount || 0,
        saved_amount: goal.saved_amount || 0,
        deadline: goal.deadline || '',
        category: goal.category || 'savings'
      });
    } else {
      setEditingGoal(null);
      setFormData({
        name: '',
        target_amount: 0,
        saved_amount: 0,
        deadline: '',
        category: 'savings'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGoal(null);
    setFormData({
      name: '',
      target_amount: 0,
      saved_amount: 0,
      deadline: '',
      category: 'savings'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || formData.target_amount <= 0) {
      return;
    }

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
      handleCloseModal();
    } catch (error) {
      console.error('Error saving goal:', error);
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
      if (onXPUpdate && newAmount > (goal.saved_amount || 0)) {
        onXPUpdate(10);
      }
    }
  };

  const getCategoryInfo = (categoryId: string) => {
    return goalCategories.find(cat => cat.id === categoryId) || goalCategories[1];
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
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-[#2A6F68] text-white px-4 py-2 rounded-lg hover:bg-[#235A54] transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Goal</span>
        </motion.button>
      </div>

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
            onClick={() => handleOpenModal()}
            className="inline-flex items-center space-x-2 bg-[#2A6F68] text-white px-6 py-3 rounded-lg hover:bg-[#235A54] transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Your First Goal</span>
          </motion.button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {goals.map((goal, index) => {
              const categoryInfo = getCategoryInfo(goal.category || 'savings');
              const CategoryIcon = categoryInfo.icon;
              const progress = getProgressPercentage(goal.saved_amount || 0, goal.target_amount || 0);
              const daysLeft = getDaysUntilDeadline(goal.deadline || '');
              const isCompleted = progress >= 100;
              
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
                    
                    {isCompleted && (
                      <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                        <CheckCircle className="h-3 w-3" />
                        <span>Complete</span>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[#333333]">
                        {formatCurrency(goal.saved_amount || 0)} of {formatCurrency(goal.target_amount || 0)}
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
                  {goal.deadline && (
                    <div className="flex items-center space-x-2 mb-4 text-sm">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">{formatDate(goal.deadline)}</span>
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
                        value={goal.saved_amount || 0}
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
                      onClick={() => handleOpenModal(goal)}
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
      )}

      {/* Goal Creation/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-[#333333]">
                  {editingGoal ? 'Edit Goal' : 'Create New Goal'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Goal Name */}
                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-2">
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

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {goalCategories.map(category => {
                      const CategoryIcon = category.icon;
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, category: category.id }))}
                          className={`flex items-center space-x-2 p-2 rounded-lg border-2 transition-all text-sm ${
                            formData.category === category.id
                              ? 'border-[#2A6F68] bg-[#2A6F68]/5 text-[#2A6F68]'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <CategoryIcon className="h-4 w-4" />
                          <span>{category.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Amount */}
                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-2">
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
                  <label className="block text-sm font-medium text-[#333333] mb-2">
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

                {/* Deadline */}
                <div>
                  <label className="block text-sm font-medium text-[#333333] mb-2">
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
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!formData.name.trim() || formData.target_amount <= 0}
                    className="flex-1 bg-[#2A6F68] text-white px-4 py-2 rounded-lg hover:bg-[#235A54] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {editingGoal ? 'Update Goal' : 'Create Goal'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GoalsManager;