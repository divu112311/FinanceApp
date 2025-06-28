import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Play, 
  Clock, 
  Award, 
  Target, 
  TrendingUp,
  DollarSign,
  PiggyBank,
  CreditCard,
  Home,
  Briefcase,
  Heart,
  Star,
  CheckCircle,
  Lock,
  Zap,
  BarChart3,
  Shield,
  Lightbulb,
  Users,
  Calendar
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import doughjoMascot from '../assets/doughjo-mascot.png';

interface LearningCenterProps {
  user: User;
  xp: { points: number | null; badges: string[] | null } | null;
  onXPUpdate: (points: number) => void;
}

interface LearningModule {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'article' | 'course' | 'quiz';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  xpReward: number;
  category: string;
  icon: React.ComponentType<any>;
  isCompleted: boolean;
  isLocked: boolean;
  requiredLevel?: number;
  personalizedFor?: string;
}

const LearningCenter: React.FC<LearningCenterProps> = ({ user, xp, onXPUpdate }) => {
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());

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

  const learningModules: LearningModule[] = [
    // Beginner Modules
    {
      id: 'budgeting-basics',
      title: 'Budgeting Strategies That Actually Work',
      description: 'Practical budgeting methods that fit real life, including the 50/30/20 rule and zero-based budgeting.',
      type: 'video',
      difficulty: 'Beginner',
      duration: '18 min watch',
      xpReward: 50,
      category: 'Budgeting',
      icon: PiggyBank,
      isCompleted: completedModules.has('budgeting-basics'),
      isLocked: false,
      personalizedFor: 'For You'
    },
    {
      id: 'emergency-fund',
      title: 'Building Your Emergency Fund',
      description: 'A step-by-step, no-pressure guide to building financial security that lets you sleep better at night.',
      type: 'video',
      difficulty: 'Beginner',
      duration: '12 min watch',
      xpReward: 50,
      category: 'Savings',
      icon: Shield,
      isCompleted: completedModules.has('emergency-fund'),
      isLocked: false,
      personalizedFor: 'For You'
    },
    {
      id: 'credit-utilization',
      title: 'Understanding Credit Utilization',
      description: 'Learn how credit utilization affects your credit score and gentle strategies to optimize it.',
      type: 'article',
      difficulty: 'Beginner',
      duration: '5 min read',
      xpReward: 25,
      category: 'Credit',
      icon: CreditCard,
      isCompleted: completedModules.has('credit-utilization'),
      isLocked: false,
      personalizedFor: 'For You'
    },

    // Intermediate Modules
    {
      id: 'debt-strategies',
      title: 'Debt Avalanche vs. Debt Snowball',
      description: 'Compare the two most effective debt payoff strategies and choose the right one for your situation.',
      type: 'article',
      difficulty: 'Intermediate',
      duration: '8 min read',
      xpReward: 75,
      category: 'Debt Management',
      icon: TrendingUp,
      isCompleted: completedModules.has('debt-strategies'),
      isLocked: false
    },
    {
      id: 'investment-basics',
      title: 'Investment Basics for Beginners',
      description: 'Start your investment journey with confidence. Learn about stocks, bonds, and index funds.',
      type: 'course',
      difficulty: 'Intermediate',
      duration: '45 min course',
      xpReward: 100,
      category: 'Investing',
      icon: BarChart3,
      isCompleted: completedModules.has('investment-basics'),
      isLocked: level < 5,
      requiredLevel: 5
    },
    {
      id: 'home-buying',
      title: 'First-Time Home Buyer Guide',
      description: 'Navigate the home buying process with confidence. From pre-approval to closing.',
      type: 'course',
      difficulty: 'Intermediate',
      duration: '60 min course',
      xpReward: 150,
      category: 'Real Estate',
      icon: Home,
      isCompleted: completedModules.has('home-buying'),
      isLocked: level < 10,
      requiredLevel: 10
    },

    // Advanced Modules
    {
      id: 'tax-optimization',
      title: 'Tax Optimization Strategies',
      description: 'Advanced techniques to minimize your tax burden legally and maximize your wealth building.',
      type: 'article',
      difficulty: 'Advanced',
      duration: '15 min read',
      xpReward: 125,
      category: 'Tax Planning',
      icon: Briefcase,
      isCompleted: completedModules.has('tax-optimization'),
      isLocked: level < 15,
      requiredLevel: 15
    },
    {
      id: 'retirement-planning',
      title: 'Advanced Retirement Planning',
      description: 'Build a comprehensive retirement strategy that ensures financial freedom in your golden years.',
      type: 'course',
      difficulty: 'Advanced',
      duration: '90 min course',
      xpReward: 200,
      category: 'Retirement',
      icon: Calendar,
      isCompleted: completedModules.has('retirement-planning'),
      isLocked: level < 20,
      requiredLevel: 20
    },

    // Quiz Modules
    {
      id: 'financial-literacy-quiz',
      title: 'Financial Literacy Assessment',
      description: 'Test your knowledge and identify areas for improvement in your financial education.',
      type: 'quiz',
      difficulty: 'Beginner',
      duration: '10 min quiz',
      xpReward: 30,
      category: 'Assessment',
      icon: CheckCircle,
      isCompleted: completedModules.has('financial-literacy-quiz'),
      isLocked: false
    }
  ];

  const personalizedModules = learningModules.filter(m => m.personalizedFor);
  const otherModules = learningModules.filter(m => !m.personalizedFor);

  const handleStartModule = async (moduleId: string) => {
    const module = learningModules.find(m => m.id === moduleId);
    if (!module || module.isLocked) return;

    // Mark as completed and award XP
    setCompletedModules(prev => new Set([...prev, moduleId]));
    await onXPUpdate(module.xpReward);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'article': return BookOpen;
      case 'course': return Users;
      case 'quiz': return CheckCircle;
      default: return BookOpen;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-blue-100 text-blue-800';
      case 'Advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const completedCount = completedModules.size;
  const totalModules = learningModules.length;
  const progressPercentage = (completedCount / totalModules) * 100;

  return (
    <div className="space-y-8">
      {/* Header */}
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
          Your Learning Journey 🎓
        </h1>
        <p className="text-white/90 mb-4">
          Personalized education that meets you where you are. No judgment, just growth.
        </p>
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 bg-gradient-to-r ${beltRank.color} text-white rounded-lg px-3 py-1`}>
            <span className="text-sm">{beltRank.emoji}</span>
            <span className="text-sm font-medium">{beltRank.name}</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-1">
            <BookOpen className="h-4 w-4" />
            <span className="text-sm">{completedCount}/{totalModules} Complete</span>
          </div>
        </div>
      </motion.div>

      {/* Progress Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-[#333333] mb-2">Learning Progress</h2>
            <p className="text-gray-600">Your path to financial mastery</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#2A6F68] mb-1">
              {progressPercentage.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">Complete</div>
          </div>
        </div>

        <div className="relative mb-4">
          <div className="w-full bg-gray-200 rounded-full h-4">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="h-4 rounded-full bg-gradient-to-r from-[#2A6F68] to-[#B76E79]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-[#2A6F68]/5 rounded-lg">
            <div className="text-2xl font-bold text-[#2A6F68] mb-1">{completedCount}</div>
            <div className="text-sm text-gray-600">Modules Completed</div>
          </div>
          <div className="text-center p-4 bg-[#B76E79]/5 rounded-lg">
            <div className="text-2xl font-bold text-[#B76E79] mb-1">
              {learningModules.reduce((sum, m) => sum + (completedModules.has(m.id) ? m.xpReward : 0), 0)}
            </div>
            <div className="text-sm text-gray-600">XP Earned</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {learningModules.filter(m => !m.isLocked).length}
            </div>
            <div className="text-sm text-gray-600">Available Modules</div>
          </div>
        </div>
      </motion.div>

      {/* Perfect for You Right Now */}
      {personalizedModules.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <div className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-[#B76E79]" />
            <h2 className="text-xl font-bold text-[#333333]">Perfect for You Right Now</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {personalizedModules.map((module, index) => {
              const TypeIcon = getTypeIcon(module.type);
              const ModuleIcon = module.icon;
              
              return (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-[#2A6F68]/10 rounded-lg flex items-center justify-center">
                        <ModuleIcon className="h-6 w-6 text-[#2A6F68]" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <TypeIcon className="h-4 w-4 text-gray-500" />
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                          {module.difficulty}
                        </span>
                        <span className="px-2 py-1 bg-[#B76E79]/10 text-[#B76E79] rounded text-xs font-medium">
                          For You
                        </span>
                      </div>
                    </div>
                    {module.isCompleted && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-[#333333] mb-2">{module.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">{module.description}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{module.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <span>+{module.xpReward} XP</span>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStartModule(module.id)}
                      disabled={module.isCompleted}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        module.isCompleted
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-[#2A6F68] text-white hover:bg-[#235A54]'
                      }`}
                    >
                      {module.isCompleted ? 'Completed' : 'Start Learning'}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Explore More */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-4"
      >
        <h2 className="text-xl font-bold text-[#333333]">Explore More</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherModules.map((module, index) => {
            const TypeIcon = getTypeIcon(module.type);
            const ModuleIcon = module.icon;
            
            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
                className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all ${
                  module.isLocked ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      module.isLocked ? 'bg-gray-100' : 'bg-[#2A6F68]/10'
                    }`}>
                      {module.isLocked ? (
                        <Lock className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ModuleIcon className="h-5 w-5 text-[#2A6F68]" />
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <TypeIcon className="h-3 w-3 text-gray-500" />
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                        {module.difficulty}
                      </span>
                    </div>
                  </div>
                  {module.isCompleted && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>

                <h3 className="font-semibold text-[#333333] mb-2 text-sm">{module.title}</h3>
                <p className="text-gray-600 text-xs mb-3 leading-relaxed line-clamp-2">{module.description}</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{module.duration}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      <span>+{module.xpReward}</span>
                    </div>
                  </div>
                  
                  {module.isLocked ? (
                    <div className="text-xs text-gray-500">
                      Level {module.requiredLevel}+
                    </div>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleStartModule(module.id)}
                      disabled={module.isCompleted}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        module.isCompleted
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-[#2A6F68] text-white hover:bg-[#235A54]'
                      }`}
                    >
                      {module.isCompleted ? 'Done' : 'Start'}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default LearningCenter;