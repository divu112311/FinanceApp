import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Play, 
  Clock, 
  Award, 
  Target, 
  TrendingUp,
  CheckCircle,
  Lock,
  Zap,
  BarChart3,
  Shield,
  Lightbulb,
  Users,
  Calendar,
  Star,
  Brain,
  Trophy,
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useLearning } from '../hooks/useLearning';
import QuizInterface from './QuizInterface';
import doughjoMascot from '../assets/doughjo-mascot.png';

interface LearningCenterProps {
  user: User;
  xp: { points: number | null; badges: string[] | null } | null;
  onXPUpdate: (points: number) => void;
}

const LearningCenter: React.FC<LearningCenterProps> = ({ user, xp, onXPUpdate }) => {
  const { 
    modules, 
    userProfile, 
    loading, 
    startModule, 
    updateProgress,
    getPersonalizedModules,
    getRecommendedModules,
    getOverallProgress
  } = useLearning(user);

  const [showQuiz, setShowQuiz] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);

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
  const personalizedModules = getPersonalizedModules();
  const recommendedModules = getRecommendedModules();
  const overallProgress = getOverallProgress();

  const handleStartModule = async (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    if (module.progress?.status === 'completed') {
      return; // Already completed
    }

    // If it's a quiz module, show the quiz interface
    if (module.content_type === 'quiz') {
      setSelectedModule(module);
      setShowQuiz(true);
      return;
    }

    // For non-quiz modules, start and simulate completion
    if (module.progress?.status === 'not_started' || !module.progress) {
      await startModule(moduleId);
    }

    // Simulate completion for non-quiz modules
    await updateProgress(moduleId, 100, module.duration_minutes);
    onXPUpdate(module.xp_reward);
  };

  const handleQuizComplete = async (score: number, xpEarned: number) => {
    if (!selectedModule) return;

    // Update progress to completed
    await updateProgress(selectedModule.id, 100, selectedModule.duration_minutes);
    
    // Award XP
    onXPUpdate(xpEarned);
    
    // Close quiz
    setShowQuiz(false);
    setSelectedModule(null);
  };

  const handleQuizClose = () => {
    setShowQuiz(false);
    setSelectedModule(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Play;
      case 'article': return BookOpen;
      case 'course': return Users;
      case 'quiz': return Brain;
      case 'interactive': return Activity;
      default: return BookOpen;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Advanced': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
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

  return (
    <>
      <div className="space-y-8">
        {/* Enhanced Header with Floating Elements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative bg-gradient-to-br from-[#2A6F68] via-[#2A6F68] to-[#B76E79] rounded-3xl p-8 text-white overflow-hidden"
        >
          {/* Floating Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              animate={{ 
                x: [0, 100, 0],
                y: [0, -50, 0],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute top-10 right-10 w-32 h-32 bg-white/5 rounded-full"
            />
            <motion.div
              animate={{ 
                x: [0, -80, 0],
                y: [0, 60, 0],
                rotate: [0, -180, -360]
              }}
              transition={{ 
                duration: 25,
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute bottom-10 left-10 w-24 h-24 bg-white/5 rounded-full"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full"
            />
          </div>

          {/* Mascot with Enhanced Animation */}
          <div className="absolute top-6 right-6">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
                y: [0, -5, 0]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="relative"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-white/20 rounded-full blur-md"
              />
              <img 
                src={doughjoMascot} 
                alt="DoughJo" 
                className="relative w-20 h-20 object-contain rounded-full"
              />
            </motion.div>
          </div>
          
          <div className="relative z-10">
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-serif font-bold mb-3"
            >
              <span className="inline-flex items-center space-x-2">
                <span>Your Learning Journey</span>
                <motion.span
                  animate={{ rotate: [0, 20, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🎓
                </motion.span>
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white/90 mb-6 text-lg"
            >
              {userProfile?.financial_experience === 'Beginner' 
                ? "Building your financial foundation with personalized guidance"
                : userProfile?.financial_experience === 'Advanced'
                ? "Advanced strategies for wealth mastery and optimization"
                : "Expanding your financial knowledge and investment skills"
              }
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center gap-3"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className={`flex items-center space-x-2 bg-gradient-to-r ${beltRank.color} text-white rounded-xl px-4 py-2 shadow-lg`}
              >
                <span className="text-lg">{beltRank.emoji}</span>
                <span className="font-semibold">{beltRank.name}</span>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2"
              >
                <BookOpen className="h-5 w-5" />
                <span className="font-medium">{overallProgress.completed}/{overallProgress.total} Complete</span>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2"
              >
                <Trophy className="h-5 w-5" />
                <span className="font-medium">{userProfile?.financial_experience || 'Learner'}</span>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-[#333333] mb-2">Learning Progress</h2>
              <p className="text-gray-600">Your path to financial mastery</p>
            </div>
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="text-right"
            >
              <div className="text-4xl font-bold text-[#2A6F68] mb-1">
                {overallProgress.percentage.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Complete</div>
            </motion.div>
          </div>

          <div className="relative mb-6">
            <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress.percentage}%` }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="h-6 rounded-full bg-gradient-to-r from-[#2A6F68] via-[#2A6F68] to-[#B76E79] relative overflow-hidden"
              >
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                />
              </motion.div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                value: overallProgress.completed, 
                label: 'Modules Completed', 
                color: 'from-[#2A6F68] to-[#2A6F68]',
                icon: CheckCircle
              },
              { 
                value: overallProgress.inProgress, 
                label: 'In Progress', 
                color: 'from-[#B76E79] to-[#B76E79]',
                icon: Activity
              },
              { 
                value: modules.reduce((sum, m) => sum + (m.progress?.status === 'completed' ? m.xp_reward : 0), 0), 
                label: 'XP Earned', 
                color: 'from-green-400 to-green-600',
                icon: Zap
              }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`text-center p-6 bg-gradient-to-br ${stat.color} rounded-xl text-white shadow-lg`}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-12 h-12 mx-auto mb-3 bg-white/20 rounded-full flex items-center justify-center"
                >
                  <stat.icon className="h-6 w-6" />
                </motion.div>
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 200 }}
                  className="text-3xl font-bold mb-1"
                >
                  {stat.value}
                </motion.div>
                <div className="text-white/90 text-sm font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Enhanced Personalized Modules */}
        {personalizedModules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            <div className="flex items-center space-x-3">
              <motion.div
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="h-6 w-6 text-[#B76E79]" />
              </motion.div>
              <h2 className="text-2xl font-bold text-[#333333]">Perfect for You Right Now</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {personalizedModules.map((module, index) => {
                const TypeIcon = getTypeIcon(module.content_type);
                
                return (
                  <motion.div
                    key={module.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    whileHover={{ 
                      scale: 1.02, 
                      y: -5,
                      boxShadow: "0 20px 40px rgba(0,0,0,0.1)"
                    }}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:border-[#2A6F68]/20 transition-all duration-300 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <motion.div 
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-14 h-14 bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-xl flex items-center justify-center shadow-lg"
                        >
                          <TypeIcon className="h-7 w-7 text-white" />
                        </motion.div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(module.difficulty)}`}>
                            {module.difficulty}
                          </span>
                          {module.is_featured && (
                            <motion.span 
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="px-3 py-1 bg-gradient-to-r from-[#B76E79] to-[#B76E79] text-white rounded-full text-xs font-semibold"
                            >
                              Featured
                            </motion.span>
                          )}
                          {module.content_type === 'quiz' && (
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold">
                              Interactive Quiz
                            </span>
                          )}
                        </div>
                      </div>
                      {module.progress?.status === 'completed' && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        </motion.div>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-[#333333] mb-3 group-hover:text-[#2A6F68] transition-colors">
                      {module.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">
                      {module.description}
                    </p>

                    {module.progress?.status === 'in_progress' && (
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${module.progress.progress_percentage}%` }}
                            className="h-3 rounded-full bg-gradient-to-r from-[#2A6F68] to-[#B76E79]"
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {module.progress.progress_percentage}% complete
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{module.duration_minutes} min</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span>+{module.xp_reward} XP</span>
                        </div>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStartModule(module.id)}
                        disabled={module.progress?.status === 'completed'}
                        className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                          module.progress?.status === 'completed'
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : module.progress?.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-gradient-to-r from-[#2A6F68] to-[#B76E79] text-white hover:shadow-lg'
                        }`}
                      >
                        <span>
                          {module.progress?.status === 'completed' ? 'Completed' : 
                           module.progress?.status === 'in_progress' ? 'Continue' : 
                           module.content_type === 'quiz' ? 'Take Quiz' : 'Start Learning'}
                        </span>
                        {module.progress?.status !== 'completed' && (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Enhanced Explore More Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-[#333333]">Explore More</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedModules.map((module, index) => {
              const TypeIcon = getTypeIcon(module.content_type);
              const isLocked = module.required_level > level;
              
              return (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  whileHover={{ 
                    scale: isLocked ? 1 : 1.02, 
                    y: isLocked ? 0 : -3
                  }}
                  className={`bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all duration-300 ${
                    isLocked ? 'opacity-60' : 'hover:shadow-lg hover:border-[#2A6F68]/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <motion.div 
                        whileHover={isLocked ? {} : { scale: 1.1, rotate: 5 }}
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isLocked ? 'bg-gray-100' : 'bg-gradient-to-br from-[#2A6F68] to-[#B76E79]'
                        }`}
                      >
                        {isLocked ? (
                          <Lock className="h-6 w-6 text-gray-400" />
                        ) : (
                          <TypeIcon className="h-6 w-6 text-white" />
                        )}
                      </motion.div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(module.difficulty)}`}>
                          {module.difficulty}
                        </span>
                        {module.content_type === 'quiz' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-xs font-medium">
                            Quiz
                          </span>
                        )}
                      </div>
                    </div>
                    {module.progress?.status === 'completed' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>

                  <h3 className="font-bold text-[#333333] mb-2 text-sm">{module.title}</h3>
                  <p className="text-gray-600 text-xs mb-3 leading-relaxed line-clamp-2">{module.description}</p>

                  {module.progress?.status === 'in_progress' && (
                    <div className="mb-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-[#2A6F68] to-[#B76E79]"
                          style={{ width: `${module.progress.progress_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{module.duration_minutes}m</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        <span>+{module.xp_reward}</span>
                      </div>
                    </div>
                    
                    {isLocked ? (
                      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Level {module.required_level}+
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStartModule(module.id)}
                        disabled={module.progress?.status === 'completed'}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                          module.progress?.status === 'completed'
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : module.progress?.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-[#2A6F68] text-white hover:bg-[#235A54]'
                        }`}
                      >
                        {module.progress?.status === 'completed' ? 'Done' : 
                         module.progress?.status === 'in_progress' ? 'Continue' : 
                         module.content_type === 'quiz' ? 'Quiz' : 'Start'}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Enhanced Learning Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100"
        >
          <div className="flex items-center space-x-3 mb-6">
            <motion.div
              animate={{ rotate: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Lightbulb className="h-6 w-6 text-[#B76E79]" />
            </motion.div>
            <h3 className="text-xl font-bold text-[#333333]">Learning Insights</h3>
          </div>

          <motion.div
            whileHover={{ scale: 1.01 }}
            className="p-6 bg-gradient-to-r from-[#2A6F68]/5 to-[#B76E79]/5 rounded-xl border-l-4 border-[#2A6F68]"
          >
            <div className="flex items-start space-x-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Activity className="h-6 w-6 text-[#2A6F68] mt-0.5 flex-shrink-0" />
              </motion.div>
              <div>
                <h4 className="font-bold text-[#333333] mb-2">Your Learning Journey</h4>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {overallProgress.percentage >= 80 ? 
                    `Outstanding progress! You've completed ${overallProgress.completed} modules and earned ${modules.reduce((sum, m) => sum + (m.progress?.status === 'completed' ? m.xp_reward : 0), 0)} XP. You're well on your way to financial mastery.` :
                    overallProgress.percentage >= 50 ?
                    `Great momentum! You've completed ${overallProgress.completed} modules. Focus on the personalized recommendations to accelerate your learning.` :
                    overallProgress.percentage >= 25 ?
                    `Good start! You've completed ${overallProgress.completed} modules. Consistency is key - try to complete one module per week.` :
                    `Welcome to your financial education journey! Start with the personalized modules designed specifically for your experience level and goals.`
                  }
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Enhanced Quiz Interface */}
      <AnimatePresence>
        {showQuiz && selectedModule && (
          <QuizInterface
            moduleId={selectedModule.id}
            moduleTitle={selectedModule.title}
            user={user}
            onComplete={handleQuizComplete}
            onClose={handleQuizClose}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default LearningCenter;