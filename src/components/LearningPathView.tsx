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
  Sparkles,
  Video,
  FileText,
  Bookmark,
  Flame,
  RefreshCw
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useLearningPath } from '../hooks/useLearningPath';

interface LearningPathViewProps {
  user: User;
  xp: { points: number | null; badges: string[] | null } | null;
  onXPUpdate: (points: number) => void;
  onStartModule: (moduleId: string, isAIModule: boolean) => void;
}

const LearningPathView: React.FC<LearningPathViewProps> = ({ 
  user, 
  xp, 
  onXPUpdate,
  onStartModule
}) => {
  const { 
    currentPath, 
    todaysModule, 
    upcomingModules, 
    completedModules,
    loading, 
    error, 
    generateLearningPath,
    getOverallProgress
  } = useLearningPath(user);
  
  const [generating, setGenerating] = useState(false);

  const handleGenerateNewPath = async () => {
    setGenerating(true);
    try {
      await generateLearningPath();
    } finally {
      setGenerating(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return Video;
      case 'article': return FileText;
      case 'course': return Users;
      case 'quiz': return Brain;
      case 'interactive': return Activity;
      default: return BookOpen;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'VIDEO';
      case 'article': return 'ARTICLE';
      case 'course': return 'COURSE';
      case 'quiz': return 'QUIZ';
      case 'interactive': return 'INTERACTIVE';
      default: return 'LESSON';
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

  const progress = getOverallProgress();

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

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Learning Path</h3>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={handleGenerateNewPath}
          className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!currentPath) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
        <div className="w-20 h-20 bg-[#2A6F68]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <BookOpen className="h-10 w-10 text-[#2A6F68]" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">No Learning Path Found</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Let's create a personalized learning path based on your financial goals and experience level.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleGenerateNewPath}
          disabled={generating}
          className="inline-flex items-center space-x-2 bg-[#2A6F68] text-white px-6 py-3 rounded-lg hover:bg-[#235A54] disabled:opacity-50 transition-colors"
        >
          {generating ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              <span>Generating Your Path...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              <span>Generate Learning Path</span>
            </>
          )}
        </motion.button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Path Overview */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{currentPath.name}</h3>
              <p className="text-gray-600 text-sm">{currentPath.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              <span className="font-medium text-[#2A6F68]">{progress.completed}</span>
              <span className="mx-1">/</span>
              <span>{progress.total}</span>
              <span className="ml-1">completed</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleGenerateNewPath}
              disabled={generating}
              className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm"
            >
              <RefreshCw className={`h-3 w-3 ${generating ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </motion.button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              className="h-2 rounded-full bg-gradient-to-r from-[#2A6F68] to-[#B76E79]"
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Just Started</span>
            <span>In Progress</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Path Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[#2A6F68]/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-[#2A6F68]">{currentPath.estimated_duration} min</div>
            <div className="text-xs text-gray-600">Total Duration</div>
          </div>
          <div className="bg-[#B76E79]/5 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-[#B76E79]">
              {currentPath.modules.reduce((sum, m) => sum + m.xp_reward, 0)} XP
            </div>
            <div className="text-xs text-gray-600">Total XP</div>
          </div>
          <div className="bg-amber-50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-amber-600">
              {currentPath.modules.filter(m => m.content_type === 'quiz').length}
            </div>
            <div className="text-xs text-gray-600">Quizzes</div>
          </div>
        </div>
      </div>

      {/* Today's Module */}
      {todaysModule && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Star className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-bold text-[#333333]">Today's Learning</h2>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-purple-400 rounded-lg flex items-center justify-center">
                {React.createElement(getTypeIcon(todaysModule.content_type), { className: "h-6 w-6 text-white" })}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-0.5 ${getDifficultyColor(todaysModule.difficulty)} rounded text-xs font-medium`}>
                    {todaysModule.difficulty}
                  </span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                    {getTypeLabel(todaysModule.content_type)}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">{todaysModule.title}</h3>
                <p className="text-gray-600 text-sm mb-4">
                  {todaysModule.description}
                </p>
                
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <div className="flex items-center space-x-1 text-gray-500 text-xs">
                    <Clock className="h-3 w-3" />
                    <span>{todaysModule.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center space-x-1 text-yellow-500 text-xs">
                    <Zap className="h-3 w-3" />
                    <span>+{todaysModule.xp_reward} XP</span>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onStartModule(todaysModule.id, true)}
                  className={`px-4 py-2 ${
                    todaysModule.progress?.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : todaysModule.progress?.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-[#2A6F68] text-white hover:bg-[#235A54]'
                  } rounded-lg transition-colors text-sm font-medium`}
                >
                  {todaysModule.progress?.status === 'completed' 
                    ? 'Completed' 
                    : todaysModule.progress?.status === 'in_progress'
                    ? 'Continue Learning'
                    : 'Start Learning'}
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Modules */}
      {upcomingModules.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#333333]">Upcoming Lessons</h2>
          
          <div className="space-y-3">
            {upcomingModules.slice(0, 3).map((module, index) => {
              const TypeIcon = getTypeIcon(module.content_type);
              
              return (
                <div key={module.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#2A6F68]/20 to-[#B76E79]/20 rounded-lg flex items-center justify-center">
                        <TypeIcon className="h-5 w-5 text-[#2A6F68]" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-0.5 ${getDifficultyColor(module.difficulty)} rounded text-xs font-medium`}>
                            {module.difficulty}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                            {getTypeLabel(module.content_type)}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900">{module.title}</h3>
                        <div className="text-xs text-gray-500 flex items-center space-x-2">
                          <span>{module.duration_minutes} min</span>
                          <span>•</span>
                          <span className="text-yellow-500 flex items-center">
                            <Zap className="h-3 w-3 mr-0.5" />
                            +{module.xp_reward} XP
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {index === 0 ? (
                        <button
                          onClick={() => onStartModule(module.id, true)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium hover:bg-gray-200 transition-colors"
                        >
                          START
                        </button>
                      ) : (
                        <div className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                          UPCOMING
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Modules */}
      {completedModules.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[#333333]">Completed Lessons</h2>
          
          <div className="space-y-3">
            {completedModules.slice(0, 3).map((module) => {
              const TypeIcon = getTypeIcon(module.content_type);
              
              return (
                <div key={module.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 opacity-80">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <TypeIcon className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">
                            COMPLETED
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                            {getTypeLabel(module.content_type)}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900">{module.title}</h3>
                        <div className="text-xs text-gray-500">
                          Completed {module.progress?.completed_at ? new Date(module.progress.completed_at).toLocaleDateString() : 'recently'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                      <CheckCircle className="h-3 w-3" />
                      <span>+{module.xp_reward} XP</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {completedModules.length > 3 && (
              <div className="text-center">
                <button className="text-[#2A6F68] text-sm font-medium hover:underline">
                  View all {completedModules.length} completed lessons
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Learning Tips */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-amber-600" />
          </div>
          <h3 className="font-bold text-amber-800">Learning Tip</h3>
        </div>
        
        <div className="space-y-3">
          <p className="text-sm text-amber-700">
            "Consistency beats intensity. Just 15 minutes of daily learning compounds into massive knowledge over time."
          </p>
          
          <div>
            <h4 className="font-medium text-amber-800 mb-1">Today's Tip</h4>
            <p className="text-sm text-amber-700">
              After completing a module, try explaining the key concepts to someone else. Teaching reinforces learning and reveals gaps in understanding.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPathView;