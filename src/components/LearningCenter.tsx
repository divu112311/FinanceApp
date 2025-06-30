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
  Flame,
  TrendingDown,
  X,
  RefreshCw
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useLearning } from '../hooks/useLearning';
import { useAILearning } from '../hooks/useAILearning';
import { useFeaturedLearning } from '../hooks/useFeaturedLearning';
import QuizInterface from './QuizInterface';
import ArticleView from './ArticleView';
import FeaturedLearningModule from './FeaturedLearningModule';
import KnowledgeProgressView from './KnowledgeProgressView';

interface LearningCenterProps {
  user: User;
  xp: { points: number | null; badges: string[] | null } | null;
  onXPUpdate: (points: number) => void;
}

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
    submitQuizResults,
    getTodaysPractice,
    getRecommendedModules,
    getOverallProgress: getAIProgress,
    generateQuizQuestions,
    getUserKnowledgeLevel,
    checkContentRefresh
  } = useAILearning(user);

  const {
    featuredModule,
    loading: featuredLoading,
    generating: generatingFeatured,
    generateFeaturedLearning
  } = useFeaturedLearning(user);

  const [showQuiz, setShowQuiz] = useState(false);
  const [showArticle, setShowArticle] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'quiz' | 'article' | 'knowledge' | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [refreshingContent, setRefreshingContent] = useState(false);

  const level = Math.floor((xp?.points || 0) / 100) + 1;
  const knowledgeLevel = getUserKnowledgeLevel();

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
  
  // Filter out duplicates from recommended modules
  const recommendedModulesMap = new Map();
  const recommendedModules = getRecommendedModules().filter(module => {
    if (recommendedModulesMap.has(module.title)) {
      return false;
    }
    recommendedModulesMap.set(module.title, true);
    return true;
  });
  
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
    
    // If no featured module and not already generating, trigger generation
    if (!featuredModule && !featuredLoading && !generatingFeatured) {
      generateFeaturedLearning();
    }
  }, [aiModules.length, aiLoading, generating, featuredModule, featuredLoading, generatingFeatured]);

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
        setLoadingQuiz(true);
        
        // Start the module first if not started
        if (module.progress?.status === 'not_started' || !module.progress) {
          console.log('Starting quiz module...');
          if (isAIModule) {
            await startAIModule(moduleId);
          } else {
            await startModule(moduleId);
          }
        }
        
        // Check if module has questions in content_data
        if (module.content_data && module.content_data.questions && module.content_data.questions.length > 0) {
          console.log('Using questions from module content_data');
          setQuizQuestions(module.content_data.questions);
        } else {
          // Generate questions if not available
          console.log('Generating quiz questions for:', module.title);
          try {
            const generatedQuestions = await generateQuizQuestions(module.title, module.difficulty, 5);
            console.log('Generated questions:', generatedQuestions);
            setQuizQuestions(generatedQuestions);
          } catch (error) {
            console.error('Error generating questions:', error);
            // Fallback to default questions
            setQuizQuestions([
              {
                question_text: "What does the 50/30/20 budgeting rule recommend for needs?",
                options: ["30% of income", "50% of income", "20% of income", "70% of income"],
                correct_answer: "50% of income",
                explanation: "The 50/30/20 rule suggests allocating 50% of your after-tax income to needs, 30% to wants, and 20% to savings and debt repayment."
              },
              {
                question_text: "Which of these is typically considered a 'need' in budgeting?",
                options: ["Netflix subscription", "Housing costs", "Dining out", "New clothes"],
                correct_answer: "Housing costs",
                explanation: "Needs are expenses that are essential for living, such as housing, utilities, groceries, and basic transportation."
              },
              {
                question_text: "What is the recommended minimum amount for an emergency fund?",
                options: ["$100", "$500", "1 month of expenses", "3-6 months of expenses"],
                correct_answer: "3-6 months of expenses",
                explanation: "Financial experts generally recommend having 3-6 months of essential expenses saved in an emergency fund."
              },
              {
                question_text: "Which type of account typically offers the highest interest rate?",
                options: ["Checking account", "Traditional savings account", "High-yield savings account", "Money market account"],
                correct_answer: "High-yield savings account",
                explanation: "High-yield savings accounts, often offered by online banks, typically provide much higher interest rates than traditional bank accounts."
              },
              {
                question_text: "What is the first recommended step in creating a financial plan?",
                options: ["Investing in stocks", "Creating a budget", "Opening a credit card", "Taking out a loan"],
                correct_answer: "Creating a budget",
                explanation: "A budget is the foundation of any financial plan, as it helps you understand your income, expenses, and where your money is going."
              }
            ]);
          }
        }
        
        setSelectedModule({...module, isAIModule});
        setCurrentView('quiz');
        setShowQuiz(true);
        setLoadingQuiz(false);
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

      // If it's a video module, show the video player
      if (module.content_type === 'video' && module.title === 'Credit Score Fundamentals') {
        console.log('Opening video player for:', module.title);
        
        // Start the module first if not started
        if (module.progress?.status === 'not_started' || !module.progress) {
          console.log('Starting video module...');
          if (isAIModule) {
            await startAIModule(moduleId);
          } else {
            await startModule(moduleId);
          }
        }
        
        setShowVideo(true);
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

  const handleQuizComplete = async (score: number, xpEarned: number, results: any[]) => {
    if (!selectedModule) return;

    console.log('=== QUIZ COMPLETION ===');
    console.log('Module:', selectedModule.title);
    console.log('Score:', score);
    console.log('XP Earned:', xpEarned);
    console.log('Results:', results);

    try {
      if (selectedModule.isAIModule) {
        // Submit quiz results for knowledge assessment
        const quizResults = results.map(result => ({
          questionId: result.questionId,
          isCorrect: result.isCorrect,
          conceptId: result.question.concept_id
        }));
        
        await submitQuizResults(selectedModule.id, quizResults);
      } else {
        // Update progress to completed
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
    setShowVideo(false);
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

  const handleStartFeatured = () => {
    if (featuredModule) {
      handleStartModule(featuredModule.id, false);
    }
  };

  const handleRefreshContent = async () => {
    setRefreshingContent(true);
    try {
      await checkContentRefresh();
    } finally {
      setRefreshingContent(false);
    }
  };

  const handleViewKnowledge = () => {
    setCurrentView('knowledge');
  };

  const handleBackFromKnowledge = () => {
    setCurrentView(null);
  };

  // Get button label based on content type
  const getButtonLabel = (contentType: string) => {
    switch (contentType) {
      case 'video': return 'WATCH';
      case 'article': return 'VIEW';
      case 'quiz': return 'START';
      case 'course': return 'START';
      case 'interactive': return 'START';
      default: return 'START';
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
        questions={quizQuestions}
        isLoading={loadingQuiz}
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

  if (currentView === 'knowledge') {
    return (
      <div className="space-y-6">
        {/* Finance Kata Header */}
        <div className="bg-[#2A6F68] rounded-xl p-6 text-white relative overflow-hidden flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Knowledge Progress</h1>
              <p className="text-white/90 text-sm">Track your financial knowledge journey</p>
            </div>
          </div>
          
          <button
            onClick={handleBackFromKnowledge}
            className="bg-white/20 rounded-lg px-3 py-1 text-sm hover:bg-white/30 transition-colors"
          >
            Back to Learning
          </button>
        </div>
        
        <KnowledgeProgressView user={user} />
      </div>
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
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleViewKnowledge}
              className="bg-white/20 rounded-lg px-3 py-1 text-sm hover:bg-white/30 transition-colors"
            >
              <div className="flex items-center space-x-1">
                <Brain className="h-4 w-4" />
                <span>Knowledge Level {knowledgeLevel}</span>
              </div>
            </button>
            
            <div className="bg-white/20 rounded-lg px-3 py-1 text-sm">
              <span className="text-white font-medium">{beltRank.name}</span>
              <span className="mx-2 text-white/60">•</span>
              <span className="text-white/90">{overallProgress.completed}/{overallProgress.total} Complete</span>
            </div>
          </div>
        </div>

        {/* Main Content Grid - 2 columns with 2/3 and 1/3 split */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Today's Practice (2/3 width) */}
          <div className="col-span-2 space-y-6">
            {/* Today's Practice */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <h2 className="text-lg font-bold text-[#333333]">Today's Practice</h2>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefreshContent}
                  disabled={refreshingContent}
                  className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm"
                >
                  <RefreshCw className={`h-3 w-3 ${refreshingContent ? 'animate-spin' : ''}`} />
                  <span>Refresh Content</span>
                </motion.button>
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
                          : getButtonLabel(todaysPractice.content_type)}
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
                {/* Credit Score Fundamentals Video */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#2A6F68]/20 to-[#B76E79]/20 rounded-lg flex items-center justify-center">
                        <Video className="h-5 w-5 text-[#2A6F68]" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-0.5 ${getDifficultyColor('Beginner')} rounded text-xs font-medium`}>
                            Beginner
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                            VIDEO
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900">Credit Score Fundamentals</h3>
                        <div className="text-xs text-gray-500 flex items-center space-x-2">
                          <span>18 min</span>
                          <span>•</span>
                          <span className="text-yellow-500 flex items-center">
                            <Zap className="h-3 w-3 mr-0.5" />
                            +35 XP
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowVideo(true)}
                        className="px-3 py-1 bg-teal-500 text-white rounded-full text-xs font-medium"
                      >
                        WATCH
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Display filtered recommended modules */}
                {recommendedModules.slice(0, 3).map((module, index) => {
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
                              {getButtonLabel(module.content_type)}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Featured Learning Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <h2 className="text-lg font-bold text-[#333333]">Featured Learning</h2>
              </div>
              
              {featuredLoading || generatingFeatured ? (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex items-center justify-center">
                  <div className="text-center py-8">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 border-2 border-[#2A6F68] border-t-transparent rounded-full mx-auto mb-4"
                    />
                    <h3 className="text-lg font-semibold text-[#333333] mb-2">Preparing Featured Content</h3>
                    <p className="text-gray-600">Creating this week's featured learning module...</p>
                  </div>
                </div>
              ) : featuredModule ? (
                <FeaturedLearningModule 
                  user={user} 
                  module={featuredModule} 
                  onStart={handleStartFeatured} 
                />
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-teal-500 to-purple-500 rounded-xl p-6 shadow-md text-white overflow-hidden relative"
                >
                  <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-800 px-2 py-0.5 rounded-md text-xs font-bold">
                    Featured
                  </div>
                  
                  <div className="absolute top-4 right-4 bg-green-100 text-green-800 px-2 py-0.5 rounded-md text-xs font-bold">
                    Beginner
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-2xl font-bold mb-2">Personal Finance 101: Getting Started</h3>
                    <p className="text-white/90 mb-4">
                      Learn the fundamental concepts of personal finance including budgeting, saving, and basic investing principles.
                    </p>
                    
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>45 min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Zap className="h-4 w-4 text-yellow-300" />
                        <span>+100 XP</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>Financial Basics</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => generateFeaturedLearning()}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                      Generate Featured Content
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Column - Explore More (1/3 width) */}
          <div className="space-y-6">
            {/* Knowledge Level Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#333333]">Knowledge Level</h2>
              
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-[#2A6F68]" />
                    <h3 className="font-semibold text-[#333333]">Financial Knowledge</h3>
                  </div>
                  <div className="px-2 py-1 bg-[#2A6F68]/10 text-[#2A6F68] rounded-lg text-sm font-medium">
                    Level {knowledgeLevel}
                  </div>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(knowledgeLevel / 10) * 100}%` }}
                    className="h-2 rounded-full bg-[#2A6F68]"
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Beginner</span>
                  <span>Intermediate</span>
                  <span>Advanced</span>
                </div>
                
                <button
                  onClick={handleViewKnowledge}
                  className="w-full mt-3 text-center text-[#2A6F68] text-sm font-medium hover:underline"
                >
                  View Knowledge Progress
                </button>
              </div>
            </div>
            
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
                {/* Debt Avalanche vs. Debt Snowball */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-0.5 ${getDifficultyColor('Beginner')} rounded text-xs font-medium`}>
                          Beginner
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                          ARTICLE
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900">Debt Avalanche vs. Debt Snowball</h3>
                      <div className="text-xs text-gray-500 flex items-center space-x-2">
                        <span>15 min</span>
                        <span>•</span>
                        <span className="text-yellow-500 flex items-center">
                          <Zap className="h-3 w-3 mr-0.5" />
                          +25 XP
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button className="px-3 py-1 bg-teal-500 text-white rounded-full text-xs font-medium">
                      VIEW
                    </button>
                  </div>
                </div>

                {/* Investment Basics for Beginners */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                      <Video className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-0.5 ${getDifficultyColor('Beginner')} rounded text-xs font-medium`}>
                          Beginner
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                          VIDEO
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900">Investment Basics for Beginners</h3>
                      <div className="text-xs text-gray-500 flex items-center space-x-2">
                        <span>22 min</span>
                        <span>•</span>
                        <span className="text-yellow-500 flex items-center">
                          <Zap className="h-3 w-3 mr-0.5" />
                          +40 XP
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button className="px-3 py-1 bg-teal-500 text-white rounded-full text-xs font-medium">
                      WATCH
                    </button>
                  </div>
                </div>

                {/* Investment 101 */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-0.5 ${getDifficultyColor('Beginner')} rounded text-xs font-medium`}>
                          Beginner
                        </span>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                          COURSE
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900">Investment 101</h3>
                      <div className="text-xs text-gray-500 flex items-center space-x-2">
                        <span>45 min</span>
                        <span>•</span>
                        <span className="text-yellow-500 flex items-center">
                          <Zap className="h-3 w-3 mr-0.5" />
                          +75 XP
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button className="px-3 py-1 bg-teal-500 text-white rounded-full text-xs font-medium">
                      START
                    </button>
                  </div>
                </div>
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

      {/* Video Player Modal */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] p-4 text-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <Video className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Credit Score Fundamentals</h2>
                    <p className="text-white/80 text-xs">Video Lesson</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseContent}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video 
                    controls 
                    className="w-full h-full"
                    poster="https://images.pexels.com/photos/4386372/pexels-photo-4386372.jpeg"
                    onEnded={() => {
                      // Award XP when video completes
                      onXPUpdate(35);
                      setTimeout(() => {
                        handleCloseContent();
                      }, 1000);
                    }}
                  >
                    <source src="https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 text-gray-500 text-sm">
                      <Clock className="h-4 w-4" />
                      <span>18 minutes</span>
                    </div>
                    <div className="flex items-center space-x-1 text-yellow-500 text-sm">
                      <Zap className="h-4 w-4" />
                      <span>+35 XP on completion</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                      <Bookmark className="h-3 w-3" />
                      <span>Save</span>
                    </button>
                    <button 
                      onClick={handleCloseContent}
                      className="flex items-center space-x-1 px-3 py-1 bg-[#2A6F68] text-white rounded-lg hover:bg-[#235A54] transition-colors text-sm"
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span>Mark Complete</span>
                    </button>
                  </div>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">About This Lesson</h3>
                  <p className="text-sm text-gray-700">
                    Learn what affects your credit score and how to improve it. This video covers credit reports, payment history, credit utilization, and practical strategies to build and maintain excellent credit.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LearningCenter;