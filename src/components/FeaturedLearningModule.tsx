import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Zap, 
  BookOpen, 
  Video, 
  FileText, 
  Users, 
  Brain, 
  Activity,
  Star,
  CheckCircle,
  Play
} from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface FeaturedLearningModuleProps {
  user: User;
  module: {
    id: string;
    title: string;
    description: string;
    content_type: 'video' | 'article' | 'course' | 'quiz' | 'interactive';
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    category: string;
    duration_minutes: number;
    xp_reward: number;
    progress?: {
      status: 'not_started' | 'in_progress' | 'completed';
      progress_percentage: number;
    };
  };
  onStart: (moduleId: string) => void;
}

const FeaturedLearningModule: React.FC<FeaturedLearningModuleProps> = ({ 
  user, 
  module,
  onStart
}) => {
  const getTypeIcon = () => {
    switch (module.content_type) {
      case 'video': return Video;
      case 'article': return FileText;
      case 'course': return Users;
      case 'quiz': return Brain;
      case 'interactive': return Activity;
      default: return BookOpen;
    }
  };

  const getTypeLabel = () => {
    switch (module.content_type) {
      case 'video': return 'VIDEO';
      case 'article': return 'ARTICLE';
      case 'course': return 'COURSE';
      case 'quiz': return 'QUIZ';
      case 'interactive': return 'INTERACTIVE';
      default: return 'LESSON';
    }
  };

  const getButtonLabel = () => {
    if (module.progress?.status === 'completed') {
      return 'COMPLETED';
    } else if (module.progress?.status === 'in_progress') {
      return 'CONTINUE';
    } else {
      switch (module.content_type) {
        case 'video': return 'WATCH';
        case 'article': return 'READ';
        case 'quiz': return 'START QUIZ';
        default: return 'START';
      }
    }
  };

  const getDifficultyColor = () => {
    switch (module.difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-blue-100 text-blue-800';
      case 'Advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getButtonColor = () => {
    if (module.progress?.status === 'completed') {
      return 'bg-green-500 hover:bg-green-600';
    } else if (module.progress?.status === 'in_progress') {
      return 'bg-blue-500 hover:bg-blue-600';
    } else {
      return 'bg-[#2A6F68] hover:bg-[#235A54]';
    }
  };

  const TypeIcon = getTypeIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-teal-500 to-purple-500 rounded-xl p-6 shadow-md text-white overflow-hidden relative"
    >
      <div className="absolute top-4 left-4 bg-yellow-400 text-yellow-800 px-2 py-0.5 rounded-md text-xs font-bold">
        Featured
      </div>
      
      <div className="absolute top-4 right-4 bg-white/20 px-2 py-0.5 rounded-md text-xs font-bold">
        {module.difficulty}
      </div>
      
      <div className="mt-8">
        <h3 className="text-2xl font-bold mb-2">{module.title}</h3>
        <p className="text-white/90 mb-4">
          {module.description}
        </p>
        
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{module.duration_minutes} min</span>
          </div>
          <div className="flex items-center space-x-1">
            <Zap className="h-4 w-4 text-yellow-300" />
            <span>+{module.xp_reward} XP</span>
          </div>
          <div className="flex items-center space-x-1">
            <TypeIcon className="h-4 w-4" />
            <span>{getTypeLabel()}</span>
          </div>
          <div className="flex items-center space-x-1">
            <BookOpen className="h-4 w-4" />
            <span>{module.category}</span>
          </div>
        </div>
        
        {module.progress?.status === 'in_progress' && (
          <div className="mb-4">
            <div className="w-full bg-white/20 rounded-full h-2 mb-1">
              <div 
                className="h-2 rounded-full bg-white" 
                style={{ width: `${module.progress.progress_percentage}%` }} 
              />
            </div>
            <div className="text-xs text-white/80">
              {module.progress.progress_percentage}% complete
            </div>
          </div>
        )}
        
        <button 
          onClick={() => onStart(module.id)}
          className={`flex items-center space-x-2 ${getButtonColor()} text-white px-4 py-2 rounded-lg transition-colors font-medium`}
        >
          {module.progress?.status === 'completed' ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Completed</span>
            </>
          ) : module.progress?.status === 'in_progress' ? (
            <>
              <Play className="h-4 w-4" />
              <span>Continue</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              <span>{getButtonLabel()}</span>
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

export default FeaturedLearningModule;