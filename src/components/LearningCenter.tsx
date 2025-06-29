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
  Bookmark
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
      case 'video': return Video;
      case 'article': return FileText;
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
            <span className="text-white/90">5/28 Complete</span>
          </div>
        </div>

        {/* Your Achievements */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#333333]">Your Achievements</h2>
            <div className="text-sm text-gray-500">
              3/8 Unlocked
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* 3 Day Streak */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-sm font-medium">3 Day Streak</span>
                </div>
                <span className="text-xs text-gray-500">5/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-green-500" style={{ width: '100%' }} />
              </div>
            </div>

            {/* Module Master */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Bookmark className="h-3 w-3 text-yellow-600" />
                  </div>
                  <span className="text-sm font-medium">Module Master</span>
                </div>
                <span className="text-xs text-gray-500">3/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-yellow-500" style={{ width: '60%' }} />
              </div>
            </div>

            {/* Quiz Champion */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                    <Brain className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Quiz Champion</span>
                </div>
                <span className="text-xs text-gray-500">2/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: '40%' }} />
              </div>
            </div>
          </div>

          {/* Recent Badges */}
          <div className="mt-4 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Recent Badges</h3>
            <button className="text-xs text-blue-600 hover:text-blue-800">
              View All
            </button>
          </div>
          <div className="mt-2 flex space-x-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center mb-1">
                <Zap className="h-5 w-5 text-amber-600" />
              </div>
              <span className="text-xs text-gray-600">7-DAY STREAK</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-1">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <span className="text-xs text-gray-600">BUDGET MASTER</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Featured Learning Module */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <h2 className="text-lg font-bold text-[#333333]">Featured Learning Module</h2>
            </div>
            
            <div className="bg-gradient-to-r from-teal-500 to-purple-500 rounded-xl p-6 text-white">
              <div className="flex items-center space-x-2 mb-1">
                <div className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">Featured</div>
                <div className="px-2 py-0.5 bg-white/20 rounded text-xs font-medium">Beginner</div>
              </div>
              <h3 className="text-xl font-bold mb-2">Personal Finance 101: Getting Started</h3>
              <p className="text-white/80 text-sm mb-4">
                Learn the fundamental concepts of personal finance including budgeting, saving, and basic investing principles.
              </p>
              
              <div className="flex items-center space-x-4 mb-4 text-sm">
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
              
              <div className="bg-white/10 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Completed</div>
                  <CheckCircle className="h-5 w-5 text-green-300" />
                </div>
              </div>
            </div>

            {/* Available Lessons */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#333333]">Available Lessons</h2>
              
              <div className="space-y-3">
                {/* Emergency Fund Basics */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Emergency Fund Basics</h3>
                        <div className="text-xs text-gray-500">+15 XP</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-full bg-gray-200 rounded-full h-2 w-24">
                        <div className="h-2 rounded-full bg-green-500" style={{ width: '100%' }} />
                      </div>
                      <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        REVIEW
                      </div>
                    </div>
                  </div>
                </div>

                {/* Credit Score Fundamentals */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Credit Score Fundamentals</h3>
                        <div className="text-xs text-gray-500">+15 XP</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-full bg-gray-200 rounded-full h-2 w-24">
                        <div className="h-2 rounded-full bg-blue-500" style={{ width: '60%' }} />
                      </div>
                      <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-xs font-medium">
                        CONTINUE
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investment 101 */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Investment 101</h3>
                        <div className="text-xs text-gray-500">+20 XP</div>
                      </div>
                    </div>
                    <div className="px-3 py-1 bg-teal-500 text-white rounded-full text-xs font-medium">
                      START
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* For You Section */}
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                FOR YOU
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Budgeting Strategies That Actually Work</h3>
                    <p className="text-sm text-gray-600">Practical methods – 50/30/20 rule, zero-based budgeting</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <Video className="h-3 w-3" />
                    <span>VIDEO</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Bookmark className="h-3 w-3" />
                    <span>BEGINNER</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>19 MIN</span>
                  </div>
                </div>
                
                <button className="w-full bg-teal-500 text-white py-2 rounded-lg font-medium hover:bg-teal-600 transition-colors">
                  START LEARNING
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Explore More and Training Tips */}
          <div className="space-y-6">
            {/* Explore More Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-[#333333]">Explore More</h2>
              
              <div className="space-y-3">
                {/* Debt Avalanche vs. Debt Snowball */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">Intermediate</span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-medium">VIDEO</span>
                        </div>
                        <h3 className="font-medium text-gray-900">Debt Avalanche vs. Debt Snowball</h3>
                        <div className="text-xs text-gray-500">ARTICLE • INTERMEDIATE • 8 MIN</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investment Basics for Beginners */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs font-medium">Advanced</span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-medium">VIEW</span>
                        </div>
                        <h3 className="font-medium text-gray-900">Investment Basics for Beginners</h3>
                        <div className="text-xs text-gray-500">ARTICLE • ADVANCED • 15 MIN</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tax Optimization Strategies */}
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">Intermediate</span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-medium">VIEW</span>
                        </div>
                        <h3 className="font-medium text-gray-900">Tax Optimization Strategies</h3>
                        <div className="text-xs text-gray-500">VIDEO • INTERMEDIATE • 12 MIN</div>
                      </div>
                    </div>
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