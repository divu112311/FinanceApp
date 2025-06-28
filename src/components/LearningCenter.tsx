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
    console.log('=== HANDLE START MODULE ===');
    console.log('Module ID:', moduleId);
    
    const module = modules.find(m => m.id === moduleId);
    if (!module) {
      console.error('Module not found:', moduleId);
      return;
    }

    console.log('Module found:', {
      title: module.title,
      contentType: module.content_type,
      status: module.progress?.status
    });

    // Don't do anything if already completed
    if (module.progress?.status === 'completed') {
      console.log('Module already completed, skipping');
      return;
    }

    try {
      // If it's a quiz module, show the quiz interface
      if (module.content_type === 'quiz') {
        console.log('Opening quiz interface for:', module.title);
        
        // Start the module first if not started
        if (module.progress?.status === 'not_started' || !module.progress) {
          console.log('Starting quiz module...');
          await startModule(moduleId);
        }
        
        setSelectedModule(module);
        setShowQuiz(true);
        return;
      }

      // For non-quiz modules, start and complete immediately
      console.log('Processing non-quiz module:', module.title);
      
      // Start the module if not started
      if (module.progress?.status === 'not_started' || !module.progress) {
        console.log('Starting module...');
        await startModule(moduleId);
      }

      // Complete the module immediately for non-quiz types
      console.log('Completing module...');
      await updateProgress(moduleId, 100, module.duration_minutes);
      
      // Award XP
      console.log('Awarding XP:', module.xp_reward);
      onXPUpdate(module.xp_reward);
      
    } catch (error) {
      console.error('Error handling module:', error);
    }
  };

  const handleQuizComplete = async (score: number, xpEarned: number) => {
    if (!selectedModule) return;

    console.log('=== QUIZ COMPLETION ===');
    console.log('Module:', selectedModule.title);
    console.log('Score:', score);
    console.log('XP Earned:', xpEarned);

    try {
      // Update progress to completed
      await updateProgress(selectedModule.id, 100, selectedModule.duration_minutes);
      
      // Award XP
      onXPUpdate(xpEarned);
      
      // Close quiz
      setShowQuiz(false);
      setSelectedModule(null);
    } catch (error) {
      console.error('Error completing quiz:', error);
    }
  };

  const handleQuizClose = () => {
    console.log('Quiz closed by user');
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
      <div className="space-y-6">
        {/* Compact Header - Same height as other pages */}
        <div className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] rounded-2xl p-6 text-white relative overflow-hidden">
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
                    ease: "easeInOut"
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
                  <h1 className="text-2xl font-bold mb-1">Finance Kata</h1>
                  <p className="text-white/90">Sharpen your money moves through daily financial practice</p>
                </div>
              </div>
              
              {/* Compact Quick Stats */}
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 bg-gradient-to-r ${beltRank.color} text-white rounded-lg px-3 py-1`}>
                  <span className="text-sm">{beltRank.emoji}</span>
                  <span className="text-sm font-medium">{beltRank.name}</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/20 rounded-lg px-3 py-1">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-sm">{overallProgress.completed}/{overallProgress.total} Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simplified Progress Overview */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#333333]">Learning Progress</h2>
            <div className="text-2xl font-bold text-[#2A6F68]">
              {overallProgress.percentage.toFixed(0)}%
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-[#2A6F68] to-[#B76E79]"
              style={{ width: `${overallProgress.percentage}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-[#2A6F68]">{overallProgress.completed}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-[#B76E79]">{overallProgress.inProgress}</div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {modules.reduce((sum, m) => sum + (m.progress?.status === 'completed' ? m.xp_reward : 0), 0)}
              </div>
              <div className="text-sm text-gray-600">XP Earned</div>
            </div>
          </div>
        </div>

        {/* Personalized Modules */}
        {personalizedModules.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-[#B76E79]" />
              <h2 className="text-xl font-bold text-[#333333]">Perfect for You Right Now</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personalizedModules.map((module, index) => {
                const TypeIcon = getTypeIcon(module.content_type);
                
                return (
                  <div
                    key={module.id}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-lg flex items-center justify-center">
                          <TypeIcon className="h-6 w-6 text-white" />
                        </div>
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

                    <h3 className="text-lg font-bold text-[#333333] mb-2">{module.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{module.description}</p>

                    {module.progress?.status === 'in_progress' && (
                      <div className="mb-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-[#2A6F68] to-[#B76E79]"
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('=== PERSONALIZED MODULE BUTTON CLICKED ===');
                          console.log('Module:', module.title);
                          console.log('Type:', module.content_type);
                          handleStartModule(module.id);
                        }}
                        disabled={module.progress?.status === 'completed'}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
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
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Explore More Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[#333333]">Explore More</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedModules.map((module, index) => {
              const TypeIcon = getTypeIcon(module.content_type);
              const isLocked = module.required_level > level;
              
              return (
                <div
                  key={module.id}
                  className={`bg-white rounded-xl p-4 shadow-sm border border-gray-200 transition-all ${
                    isLocked ? 'opacity-60' : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isLocked ? 'bg-gray-100' : 'bg-gradient-to-br from-[#2A6F68] to-[#B76E79]'
                      }`}>
                        {isLocked ? (
                          <Lock className="h-5 w-5 text-gray-400" />
                        ) : (
                          <TypeIcon className="h-5 w-5 text-white" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
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
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>

                  <h3 className="font-bold text-[#333333] mb-2 text-sm">{module.title}</h3>
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2">{module.description}</p>

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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('=== EXPLORE MODULE BUTTON CLICKED ===');
                          console.log('Module:', module.title);
                          console.log('Type:', module.content_type);
                          handleStartModule(module.id);
                        }}
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
                </div>
              );
            })}
          </div>
        </div>

        {/* Updated Training Tips */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="h-5 w-5 text-[#B76E79]" />
            <h3 className="text-lg font-bold text-[#333333]">Training Tips from Sensei DoughJo</h3>
          </div>

          <div className="p-4 bg-gradient-to-r from-[#2A6F68]/5 to-[#B76E79]/5 rounded-lg border-l-4 border-[#2A6F68]">
            <div className="flex items-start space-x-3">
              <Activity className="h-5 w-5 text-[#2A6F68] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-[#333333] mb-2">Master Your Financial Kata</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Practice daily financial exercises to build muscle memory</li>
                  <li>• Start with your recommended difficulty level and advance gradually</li>
                  <li>• Focus on form over speed - understanding beats rushing</li>
                  <li>• Apply each kata to your real financial decisions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
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