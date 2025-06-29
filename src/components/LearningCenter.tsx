import React, { useState, useEffect } from 'react';
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
  Flame
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useLearning } from '../hooks/useLearning';
import { useAILearning } from '../hooks/useAILearning';
import QuizInterface from './QuizInterface';
import ArticleView from './ArticleView';

interface LearningCenterProps {
  user: User;
  xp: { points: number | null; badges: string[] | null } | null;
  onXPUpdate: (points: number) => void;
}

// Move utility functions outside the component
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

const LearningCenter: React.FC<LearningCenterProps> = ({ user, xp, onXPUpdate }) => {
  const { 
    modules, 
    userProfile, 
    loading: regularLoading, 
    startModule, 
    updateProgress,
    getOverallProgress: getRegularProgress
  } = useLearning(user);

  const {
    aiModules,
    loading: aiLoading,
    generating,
    generateAILearningContent,
    startModule: startAIModule,
    completeModule: completeAIModule,
    getTodaysPractice,
    getRecommendedModules,
    getOverallProgress: getAIProgress
  } = useAILearning(user);

  const [showQuiz, setShowQuiz] = useState(false);
  const [showArticle, setShowArticle] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'quiz' | 'article' | null>(null);

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
  const todaysPractice = getTodaysPractice();
  const recommendedModules = getRecommendedModules();
  const aiProgress = getAIProgress();
  const regularProgress = getRegularProgress();
  
  // Combined progress
  const overallProgress = {
    total: aiProgress.total + regularProgress.total,
    completed: aiProgress.completed + regularProgress.completed,
    inProgress: aiProgress.inProgress + regularProgress.inProgress,
    percentage: (aiProgress.total + regularProgress.total) > 0 ? 
      ((aiProgress.completed + regularProgress.completed) / (aiProgress.total + regularProgress.total)) * 100 : 0
  };

  useEffect(() => {
    // If no AI modules and not already generating, trigger generation
    if (aiModules.length === 0 && !aiLoading && !generating) {
      generateAILearningContent();
    }
  }, [aiModules.length, aiLoading, generating]);

  const handleStartModule = async (moduleId: string, isAIModule: boolean = false) => {
    console.log('=== HANDLE START MODULE ===');
    console.log('Module ID:', moduleId);
    console.log('Is AI Module:', isAIModule);
    
    // Find the module
    const module = isAIModule 
      ? aiModules.find(m => m.id === moduleId)
      : modules.find(m => m.id === moduleId);
      
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
          if (isAIModule) {
            await startAIModule(moduleId);
          } else {
            await startModule(moduleId);
          }
        }
        
        setSelectedModule({...module, isAIModule});
        setCurrentView('quiz');
        setShowQuiz(true);
        return;
      }
      
      // If it's an article module, show the article view
      if (module.content_type === 'article') {
        console.log('Opening article view for:', module.title);
        
        // Start the module first if not started
        if (module.progress?.status === 'not_started' || !module.progress) {
          console.log('Starting article module...');
          if (isAIModule) {
            await startAIModule(moduleId);
          } else {
            await startModule(moduleId);
          }
        }
        
        setSelectedModule({...module, isAIModule});
        setCurrentView('article');
        setShowArticle(true);
        return;
      }

      // For other non-quiz modules, start and complete immediately
      console.log('Processing non-quiz module:', module.title);
      
      // Start the module if not started
      if (module.progress?.status === 'not_started' || !module.progress) {
        console.log('Starting module...');
        if (isAIModule) {
          await startAIModule(moduleId);
        } else {
          await startModule(moduleId);
        }
      }

      // Complete the module immediately for non-quiz types
      console.log('Completing module...');
      if (isAIModule) {
        const result = await completeAIModule(moduleId, module.duration_minutes);
        // Award XP
        console.log('Awarding XP:', result?.xpEarned || module.xp_reward);
        onXPUpdate(result?.xpEarned || module.xp_reward);
      } else {
        await updateProgress(moduleId, 100, module.duration_minutes);
        // Award XP
        console.log('Awarding XP:', module.xp_reward);
        onXPUpdate(module.xp_reward);
      }
      
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
      if (selectedModule.isAIModule) {
        await completeAIModule(selectedModule.id, selectedModule.duration_minutes);
      } else {
        await updateProgress(selectedModule.id, 100, selectedModule.duration_minutes);
      }
      
      // Award XP
      onXPUpdate(xpEarned);
      
      // Close quiz
      setShowQuiz(false);
      setSelectedModule(null);
      setCurrentView(null);
    } catch (error) {
      console.error('Error completing quiz:', error);
    }
  };

  const handleArticleComplete = async () => {
    if (!selectedModule) return;

    console.log('=== ARTICLE COMPLETION ===');
    console.log('Module:', selectedModule.title);

    try {
      // Update progress to completed
      if (selectedModule.isAIModule) {
        const result = await completeAIModule(selectedModule.id, selectedModule.duration_minutes);
        // Award XP
        onXPUpdate(result?.xpEarned || selectedModule.xp_reward);
      } else {
        await updateProgress(selectedModule.id, 100, selectedModule.duration_minutes);
        // Award XP
        onXPUpdate(selectedModule.xp_reward);
      }
    } catch (error) {
      console.error('Error completing article:', error);
    }
  };

  const handleCloseContent = () => {
    console.log('Content closed by user');
    setShowQuiz(false);
    setShowArticle(false);
    setSelectedModule(null);
    setCurrentView(null);
  };

  const handleStartPractice = () => {
    if (todaysPractice) {
      handleStartModule(todaysPractice.id, true);
    } else {
      // If no practice available, generate new content
      generateAILearningContent().then(() => {
        // After generation, get the new practice and start it
        const newPractice = getTodaysPractice();
        if (newPractice) {
          handleStartModule(newPractice.id, true);
        }
      });
    }
  };

  if (regularLoading && aiLoading) {
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

  // If showing quiz or article, render that instead of the main view
  if (currentView === 'quiz' && showQuiz && selectedModule) {
    return (
      <QuizInterface
        moduleId={selectedModule.id}
        moduleTitle={selectedModule.title}
        user={user}
        onComplete={handleQuizComplete}
        onClose={handleCloseContent}
      />
    );
  }

  if (currentView === 'article' && showArticle && selectedModule) {
    return (
      <ArticleView
        user={user}
        moduleId={selectedModule.id}
        title={selectedModule.title}
        content={selectedModule.content_data}
        difficulty={selectedModule.difficulty}
        duration={selectedModule.duration_minutes}
        xpReward={selectedModule.xp_reward}
        onComplete={handleArticleComplete}
        onBack={handleCloseContent}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Finance Kata Header */}
        <div className="bg-[#2A6F68] rounded-xl p-6 text-white relative overflow-hidden flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Finance Kata</h1>
              <p className="text-white/90 text-sm">Sharpen your money moves through daily financial practice</p>
            </div>
          </div>
          
          <div className="bg-white/20 rounded-lg px-3 py-1 text-sm">
            <span className="text-white font-medium">White Belt</span>
            <span className="mx-2 text-white/60">•</span>
            <span className="text-white/90">{overallProgress.completed}/{overallProgress.total} Complete</span>
          </div>
        </div>

        {/* Main Content Grid - 2 columns with 2/3 and 1/3 split */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Today's Practice (2/3 width) */}
          <div className="col-span-2 space-y-6">
            {/* Today's Practice */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <h2 className="text-lg font-bold text-[#333333]">Today's Practice</h2>
              </div>
              
              {generating ? (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex items-center justify-center">
                  <div className="text-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-2 border-[#2A6F68] border-t-transparent rounded-full mx-auto mb-4"
                    />
                    <h3 className="text-lg font-semibold text-[#333333] mb-2">Generating Your Practice</h3>
                    <p className="text-gray-600">Creating personalized learning content just for you...</p>
                  </div>
                </div>
              ) : todaysPractice ? (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-purple-400 rounded-lg flex items-center justify-center">
                      {React.createElement(getTypeIcon(todaysPractice.content_type), { className: "h-6 w-6 text-white" })}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-0.5 ${getDifficultyColor(todaysPractice.difficulty)} rounded text-xs font-medium`}>
                          {todaysPractice.difficulty}
                        </span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                          {getTypeLabel(todaysPractice.content_type)}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{todaysPractice.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">
                        {todaysPractice.description}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        <div className="flex items-center space-x-1 text-gray-500 text-xs">
                          <Clock className="h-3 w-3" />
                          <span>{todaysPractice.duration_minutes} min practice</span>
                        </div>
                        <div className="flex items-center space-x-1 text-yellow-500 text-xs">
                          <Zap className="h-3 w-3" />
                          <span>+{todaysPractice.xp_reward} XP</span>
                        </div>
                      </div>
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleStartPractice}
                        className={`px-4 py-2 ${
                          todaysPractice.progress?.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : todaysPractice.progress?.status === 'in_progress'
                            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                            : 'bg-[#2A6F68] text-white hover:bg-[#235A54]'
                        } rounded-lg transition-colors text-sm font-medium`}
                      >
                        {todaysPractice.progress?.status === 'completed' 
                          ? 'Completed' 
                          : todaysPractice.progress?.status === 'in_progress'
                          ? 'Continue Practice'
                          : 'Start Practice'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BookOpen className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#333333] mb-2">No Practice Available</h3>
                    <p className="text-gray-600 mb-4">We're preparing your personalized learning content</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => generateAILearningContent()}
                      className="inline-flex items-center space-x-2 bg-[#2A6F68] text-white px-4 py-2 rounded-lg hover:bg-[#235A54] transition-colors"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Generate Practice</span>
                    </motion.button>
                  </div>
                </div>
              )}
            </div>

            {/* Available Lessons */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#333333]">Available Lessons</h2>
              
              <div className="space-y-3">
                {aiModules.slice(0, 4).map((module, index) => {
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
                          {module.progress?.status === 'completed' ? (
                            <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              COMPLETED
                            </div>
                          ) : module.progress?.status === 'in_progress' ? (
                            <div className="flex flex-col items-end">
                              <div className="w-full bg-gray-200 rounded-full h-2 w-24 mb-1">
                                <div 
                                  className="h-2 rounded-full bg-blue-500" 
                                  style={{ width: `${module.progress.progress_percentage}%` }} 
                                />
                              </div>
                              <button
                                onClick={() => handleStartModule(module.id, true)}
                                className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-medium"
                              >
                                CONTINUE
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartModule(module.id, true)}
                              className="px-3 py-1 bg-teal-500 text-white rounded-full text-xs font-medium"
                            >
                              START
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Explore More (1/3 width) */}
          <div className="space-y-6">
            {/* Recent Achievements Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#333333]">Recent Achievements</h2>
              
              <div className="space-y-3">
                {/* 7-Day Streak */}
                <div className="bg-amber-50 rounded-xl p-4 shadow-sm border border-amber-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Flame className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-amber-900">7-Day Streak</h3>
                      <p className="text-xs text-amber-700">Keep it up!</p>
                    </div>
                  </div>
                </div>
                
                {/* Budget Master */}
                <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-green-900">Budget Master</h3>
                      <p className="text-xs text-green-700">3 categories on track</p>
                    </div>
                  </div>
                </div>
                
                {/* Learning Ninja */}
                <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-blue-900">Learning Ninja</h3>
                      <p className="text-xs text-blue-700">{overallProgress.completed}/{overallProgress.total} completed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Explore More Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#333333]">Explore More</h2>
              
              <div className="space-y-3">
                {recommendedModules.slice(0, 3).map((module, index) => {
                  const TypeIcon = getTypeIcon(module.content_type);
                  
                  return (
                    <div key={module.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <TypeIcon className="h-5 w-5 text-blue-600" />
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
                            <div className="text-xs text-gray-500">
                              {module.duration_minutes} MIN {getTypeLabel(module.content_type)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Training Tips from Sensei DoughJo */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#333333]">Training Tips from Sensei DoughJo</h2>
              
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <div className="flex items-center space-x-2 mb-3">
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-amber-800">Daily Financial Kata</h3>
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm text-amber-700">
                    "Like martial arts, financial mastery requires daily practice. Start each morning by reviewing your spending from yesterday."
                  </p>
                  
                  <div>
                    <h4 className="font-medium text-amber-800 mb-1">Today's Tip</h4>
                    <p className="text-sm text-amber-700">
                      Track one small expense you usually ignore - like coffee or snacks. Awareness is the first step to mastery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LearningCenter;