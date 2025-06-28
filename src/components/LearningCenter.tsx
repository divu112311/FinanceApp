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
  Activity
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

    if (module.progress?.status === 'not_started' || !module.progress) {
      await startModule(moduleId);
    }

    // Simulate completion for non-quiz modules (in real app, this would be based on actual content consumption)
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
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-blue-100 text-blue-800';
      case 'Advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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
            {userProfile?.financial_experience === 'Beginner' 
              ? "Building your financial foundation with personalized guidance"
              : userProfile?.financial_experience === 'Advanced'
              ? "Advanced strategies for wealth mastery and optimization"
              : "Expanding your financial knowledge and investment skills"
            }
          </p>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 bg-gradient-to-r ${beltRank.color} text-white rounded-lg px-3 py-1`}>
              <span className="text-sm">{beltRank.emoji}</span>
              <span className="text-sm font-medium">{beltRank.name}</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-1">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm">{overallProgress.completed}/{overallProgress.total} Complete</span>
            </div>
            <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-1">
              <Trophy className="h-4 w-4" />
              <span className="text-sm">{userProfile?.financial_experience || 'Learner'}</span>
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
                {overallProgress.percentage.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Complete</div>
            </div>
          </div>

          <div className="relative mb-4">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress.percentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="h-4 rounded-full bg-gradient-to-r from-[#2A6F68] to-[#B76E79]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-[#2A6F68]/5 rounded-lg">
              <div className="text-2xl font-bold text-[#2A6F68] mb-1">{overallProgress.completed}</div>
              <div className="text-sm text-gray-600">Modules Completed</div>
            </div>
            <div className="text-center p-4 bg-[#B76E79]/5 rounded-lg">
              <div className="text-2xl font-bold text-[#B76E79] mb-1">{overallProgress.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {modules.reduce((sum, m) => sum + (m.progress?.status === 'completed' ? m.xp_reward : 0), 0)}
              </div>
              <div className="text-sm text-gray-600">XP Earned</div>
            </div>
          </div>
        </motion.div>

        {/* Personalized for You */}
        {personalizedModules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-[#B76E79]" />
              <h2 className="text-xl font-bold text-[#333333]">Perfect for You Right Now</h2>
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
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-[#2A6F68]/10 rounded-lg flex items-center justify-center">
                          <TypeIcon className="h-6 w-6 text-[#2A6F68]" />
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                            {module.difficulty}
                          </span>
                          {module.is_featured && (
                            <span className="px-2 py-1 bg-[#B76E79]/10 text-[#B76E79] rounded text-xs font-medium">
                              Featured
                            </span>
                          )}
                          {module.content_type === 'quiz' && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              Quiz
                            </span>
                          )}
                        </div>
                      </div>
                      {module.progress?.status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-[#333333] mb-2">{module.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{module.description}</p>

                    {module.progress?.status === 'in_progress' && (
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-[#2A6F68]"
                            style={{ width: `${module.progress.progress_percentage}%` }}
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
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          module.progress?.status === 'completed'
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : module.progress?.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-[#2A6F68] text-white hover:bg-[#235A54]'
                        }`}
                      >
                        {module.progress?.status === 'completed' ? 'Completed' : 
                         module.progress?.status === 'in_progress' ? 'Continue' : 
                         module.content_type === 'quiz' ? 'Take Quiz' : 'Start Learning'}
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
            {recommendedModules.map((module, index) => {
              const TypeIcon = getTypeIcon(module.content_type);
              const isLocked = module.required_level > level;
              
              return (
                <motion.div
                  key={module.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  className={`bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-300 ${
                    isLocked ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isLocked ? 'bg-gray-100' : 'bg-[#2A6F68]/10'
                      }`}>
                        {isLocked ? (
                          <Lock className="h-5 w-5 text-gray-400" />
                        ) : (
                          <TypeIcon className="h-5 w-5 text-[#2A6F68]" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                          {module.difficulty}
                        </span>
                        {module.content_type === 'quiz' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            Quiz
                          </span>
                        )}
                      </div>
                    </div>
                    {module.progress?.status === 'completed' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>

                  <h3 className="font-semibold text-[#333333] mb-2 text-sm">{module.title}</h3>
                  <p className="text-gray-600 text-xs mb-3 leading-relaxed line-clamp-2">{module.description}</p>

                  {module.progress?.status === 'in_progress' && (
                    <div className="mb-3">
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div 
                          className="h-1 rounded-full bg-[#2A6F68]"
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
                      <div className="text-xs text-gray-500">
                        Level {module.required_level}+
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleStartModule(module.id)}
                        disabled={module.progress?.status === 'completed'}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
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

        {/* Learning Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="h-5 w-5 text-[#B76E79]" />
            <h3 className="text-lg font-semibold text-[#333333]">Learning Insights</h3>
          </div>

          <div className="p-4 bg-gradient-to-r from-[#2A6F68]/5 to-[#B76E79]/5 rounded-lg border-l-4 border-[#2A6F68]">
            <div className="flex items-start space-x-3">
              <Activity className="h-5 w-5 text-[#2A6F68] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-[#333333] mb-1">Your Learning Journey</h4>
                <p className="text-sm text-gray-700">
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
          </div>
        </motion.div>
      </div>

      {/* Quiz Interface */}
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