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
import LearningPathView from './LearningPathView';

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
    getTodaysPractice,
    getRecommendedModules,
    getOverallProgress: getAIProgress
  } = useAILearning(user);

  const [showQuiz, setShowQuiz] = useState(false);
  const [showArticle, setShowArticle] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'quiz' | 'article' | 'path' | null>('path');

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
      setCurrentView('path');
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
      
      // Close article
      setShowArticle(false);
      setSelectedModule(null);
      setCurrentView('path');
    } catch (error) {
      console.error('Error completing article:', error);
    }
  };

  const handleCloseContent = () => {
    console.log('Content closed by user');
    setShowQuiz(false);
    setShowArticle(false);
    setSelectedModule(null);
    setCurrentView('path');
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

  // Default view - Learning Path
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
            <span className="text-white font-medium">{beltRank.name}</span>
            <span className="mx-2 text-white/60">•</span>
            <span className="text-white/90">{overallProgress.completed}/{overallProgress.total} Complete</span>
          </div>
        </div>

        {/* Main Content */}
        <LearningPathView 
          user={user}
          xp={xp}
          onXPUpdate={onXPUpdate}
          onStartModule={handleStartModule}
        />
      </div>
    </>
  );
};

export default LearningCenter;