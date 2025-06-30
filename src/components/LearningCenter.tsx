import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Zap, 
  Award, 
  CheckCircle, 
  Clock, 
  Calendar,
  Target,
  ArrowRight,
  Search,
  Filter,
  X,
  Play,
  Sparkles
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useLearning } from '../hooks/useLearning';
import { useLearningPath } from '../hooks/useLearningPath';
import LessonCard from './LessonCard';
import FeaturedLearningModule from './FeaturedLearningModule';
import ProgressTracker from './ProgressTracker';
import ArticleView from './ArticleView';
import QuizInterface from './QuizInterface';
import LearningPathView from './LearningPathView';

interface LearningCenterProps {
  user: User;
  xp: { points: number | null; badges: string[] | null } | null;
  onXPUpdate: (points: number) => void;
}

const LearningCenter: React.FC<LearningCenterProps> = ({ user, xp, onXPUpdate }) => {
  const { 
    modules, 
    getPersonalizedModules, 
    getRecommendedModules, 
    getCompletedModules,
    getInProgressModules,
    getOverallProgress,
    startModule,
    updateProgress,
    loading: learningLoading 
  } = useLearning(user);
  
  const {
    currentPath,
    todaysModule,
    upcomingModules,
    completedModules: pathCompletedModules,
    loading: pathLoading,
    generateLearningPath,
    startModule: startPathModule
  } = useLearningPath(user);

  const [activeView, setActiveView] = useState<'modules' | 'path' | 'progress'>('path');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [moduleView, setModuleView] = useState<'article' | 'quiz' | null>(null);
  const [isGeneratingPath, setIsGeneratingPath] = useState(false);

  // Get personalized modules
  const personalizedModules = getPersonalizedModules();
  const recommendedModules = getRecommendedModules();
  const completedModules = getCompletedModules();
  const inProgressModules = getInProgressModules();
  const progress = getOverallProgress();

  // Filter modules based on search term
  const filteredModules = modules.filter(module => 
    module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Convert modules to lesson card format
  const getLessonData = (module: any) => ({
    id: module.id,
    title: module.title,
    description: module.description,
    contentType: module.content_type,
    difficulty: module.difficulty,
    duration: module.duration_minutes,
    xpReward: module.xp_reward,
    status: module.progress?.status || 'not_started',
    progress: module.progress?.progress_percentage || 0,
    category: module.category,
    featured: module.is_featured
  });

  const handleStartModule = async (moduleId: string, isAIModule: boolean = false) => {
    // Find the module
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;
    
    // Start the module
    await startModule(moduleId);
    
    // Set the selected module and view
    setSelectedModule(moduleId);
    setModuleView(module.content_type === 'quiz' ? 'quiz' : 'article');
  };

  const handleStartPathModule = async (moduleId: string) => {
    // Start the module in the path
    await startPathModule(moduleId);
    
    // Find the module
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;
    
    // Set the selected module and view
    setSelectedModule(moduleId);
    setModuleView(module.content_type === 'quiz' ? 'quiz' : 'article');
  };

  const handleCompleteModule = async (moduleId: string) => {
    // Find the module
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;
    
    // Update progress to 100%
    await updateProgress(moduleId, 100, module.duration_minutes);
    
    // Award XP
    onXPUpdate(module.xp_reward);
    
    // Close the module view
    setSelectedModule(null);
    setModuleView(null);
  };

  const handleCompleteQuiz = async (score: number, xpEarned: number, results: any[]) => {
    if (!selectedModule) return;
    
    // Update progress to 100%
    await updateProgress(selectedModule, 100, 0);
    
    // Award XP
    onXPUpdate(xpEarned);
    
    // Close the module view
    setSelectedModule(null);
    setModuleView(null);
  };

  const handleCloseModule = () => {
    setSelectedModule(null);
    setModuleView(null);
  };

  const handleGeneratePath = async () => {
    setIsGeneratingPath(true);
    try {
      await generateLearningPath();
    } finally {
      setIsGeneratingPath(false);
    }
  };

  if (learningLoading || pathLoading) {
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

  // If a module is selected, show the module view
  if (selectedModule && moduleView) {
    const module = modules.find(m => m.id === selectedModule);
    if (!module) return null;
    
    if (moduleView === 'article') {
      return (
        <ArticleView
          user={user}
          moduleId={module.id}
          title={module.title}
          content={module.content_data}
          difficulty={module.difficulty}
          duration={module.duration_minutes}
          xpReward={module.xp_reward}
          onComplete={() => handleCompleteModule(module.id)}
          onBack={handleCloseModule}
        />
      );
    } else if (moduleView === 'quiz') {
      return (
        <QuizInterface
          user={user}
          moduleId={module.id}
          moduleTitle={module.title}
          onComplete={handleCompleteQuiz}
          onClose={handleCloseModule}
          questions={module.content_data?.questions}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-lg flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Finance Kata</h2>
              <p className="text-gray-600">Master financial concepts through personalized learning</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-[#2A6F68]/10 text-[#2A6F68] px-3 py-1 rounded-full text-sm font-medium">
              <Zap className="h-4 w-4" />
              <span>{xp?.points || 0} XP</span>
            </div>
            <div className="flex items-center space-x-1 bg-[#B76E79]/10 text-[#B76E79] px-3 py-1 rounded-full text-sm font-medium">
              <Award className="h-4 w-4" />
              <span>{completedModules.length} Completed</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveView('path')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeView === 'path'
                ? 'text-[#2A6F68] border-b-2 border-[#2A6F68]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Learning Path
          </button>
          <button
            onClick={() => setActiveView('modules')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeView === 'modules'
                ? 'text-[#2A6F68] border-b-2 border-[#2A6F68]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Modules
          </button>
          <button
            onClick={() => setActiveView('progress')}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeView === 'progress'
                ? 'text-[#2A6F68] border-b-2 border-[#2A6F68]'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Progress
          </button>
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeView === 'path' && (
          <motion.div
            key="path"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentPath ? (
              <LearningPathView 
                user={user}
                xp={xp}
                onXPUpdate={onXPUpdate}
                onStartModule={handleStartPathModule}
              />
            ) : (
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
                <div className="w-20 h-20 bg-[#2A6F68]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-10 w-10 text-[#2A6F68]" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Create Your Learning Path</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Let's create a personalized learning path based on your financial goals and experience level.
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleGeneratePath}
                  disabled={isGeneratingPath}
                  className="inline-flex items-center space-x-2 bg-[#2A6F68] text-white px-6 py-3 rounded-lg hover:bg-[#235A54] disabled:opacity-50 transition-colors"
                >
                  {isGeneratingPath ? (
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
            )}
          </motion.div>
        )}

        {activeView === 'modules' && (
          <motion.div
            key="modules"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search modules..."
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent transition-all"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <button className="flex items-center space-x-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">Filter</span>
                  </button>
                </div>
              </div>

              {/* Featured Module */}
              {personalizedModules.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#333333]">Recommended For You</h3>
                  <FeaturedLearningModule
                    user={user}
                    module={getLessonData(personalizedModules[0])}
                    onStart={() => handleStartModule(personalizedModules[0].id)}
                  />
                </div>
              )}

              {/* In Progress Modules */}
              {inProgressModules.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[#333333]">Continue Learning</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inProgressModules.slice(0, 4).map(module => (
                      <LessonCard
                        key={module.id}
                        {...getLessonData(module)}
                        onClick={() => handleStartModule(module.id)}
                      />
                    ))}
                  </div>
                  {inProgressModules.length > 4 && (
                    <div className="text-center">
                      <button className="text-[#2A6F68] text-sm font-medium hover:underline inline-flex items-center space-x-1">
                        <span>View all in-progress modules</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* All Modules or Filtered Results */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#333333]">
                  {searchTerm ? 'Search Results' : 'All Modules'}
                </h3>
                {filteredModules.length === 0 ? (
                  <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-[#333333] mb-2">No Modules Found</h3>
                    <p className="text-gray-600 mb-4">
                      Try adjusting your search terms or filters to find what you're looking for.
                    </p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <X className="h-4 w-4" />
                        <span>Clear Search</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredModules.slice(0, 8).map(module => (
                      <LessonCard
                        key={module.id}
                        {...getLessonData(module)}
                        onClick={() => handleStartModule(module.id)}
                      />
                    ))}
                  </div>
                )}
                {filteredModules.length > 8 && (
                  <div className="text-center">
                    <button className="text-[#2A6F68] text-sm font-medium hover:underline inline-flex items-center space-x-1">
                      <span>View all modules</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeView === 'progress' && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-6">
              {/* Progress Tracker */}
              <ProgressTracker
                totalModules={progress.total}
                completedModules={progress.completed}
                inProgressModules={progress.inProgress}
                streakDays={3} // This would come from a streak tracking system
                xpEarned={xp?.points || 0}
                nextMilestone={{
                  name: "Financial Apprentice",
                  modulesNeeded: 5 - completedModules.length
                }}
                lastActivity={completedModules.length > 0 ? new Date(completedModules[0].progress?.last_accessed_at || '') : undefined}
              />

              {/* Completed Modules */}
              {completedModules.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold text-[#333333] mb-4">Completed Modules</h3>
                  <div className="space-y-4">
                    {completedModules.slice(0, 5).map(module => (
                      <div key={module.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{module.title}</h4>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{module.category}</span>
                              <span>•</span>
                              <span>{module.difficulty}</span>
                              <span>•</span>
                              <span>Completed {new Date(module.progress?.completed_at || '').toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                          <Zap className="h-3 w-3" />
                          <span>+{module.xp_reward} XP</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  {completedModules.length > 5 && (
                    <div className="text-center mt-4">
                      <button className="text-[#2A6F68] text-sm font-medium hover:underline inline-flex items-center space-x-1">
                        <span>View all completed modules</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Learning Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-[#2A6F68]/10 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-[#2A6F68]" />
                    </div>
                    <h3 className="font-bold text-[#333333]">Time Invested</h3>
                  </div>
                  <div className="text-3xl font-bold text-[#2A6F68] mb-1">
                    {completedModules.reduce((sum, module) => sum + (module.progress?.time_spent_minutes || 0), 0)} min
                  </div>
                  <p className="text-gray-600 text-sm">
                    Total learning time
                  </p>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-[#B76E79]/10 rounded-lg flex items-center justify-center">
                      <Target className="h-5 w-5 text-[#B76E79]" />
                    </div>
                    <h3 className="font-bold text-[#333333]">Completion Rate</h3>
                  </div>
                  <div className="text-3xl font-bold text-[#B76E79] mb-1">
                    {progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0}%
                  </div>
                  <p className="text-gray-600 text-sm">
                    Of available modules
                  </p>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-amber-600" />
                    </div>
                    <h3 className="font-bold text-[#333333]">Learning Streak</h3>
                  </div>
                  <div className="text-3xl font-bold text-amber-600 mb-1">
                    3 days
                  </div>
                  <p className="text-gray-600 text-sm">
                    Current streak
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LearningCenter;