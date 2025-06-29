import React from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Zap, 
  CheckCircle, 
  BookOpen, 
  Video, 
  FileText, 
  Users, 
  Brain, 
  Activity,
  ArrowRight
} from 'lucide-react';

interface LessonCardProps {
  id: string;
  title: string;
  description: string;
  contentType: 'video' | 'article' | 'course' | 'quiz' | 'interactive';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number;
  xpReward: number;
  status: 'not_started' | 'in_progress' | 'completed';
  progress?: number;
  onClick: () => void;
  featured?: boolean;
}

const LessonCard: React.FC<LessonCardProps> = ({
  title,
  description,
  contentType,
  difficulty,
  duration,
  xpReward,
  status,
  progress = 0,
  onClick,
  featured = false
}) => {
  const getTypeIcon = () => {
    switch (contentType) {
      case 'video': return Video;
      case 'article': return FileText;
      case 'course': return Users;
      case 'quiz': return Brain;
      case 'interactive': return Activity;
      default: return BookOpen;
    }
  };

  const getTypeLabel = () => {
    switch (contentType) {
      case 'video': return 'VIDEO';
      case 'article': return 'ARTICLE';
      case 'course': return 'COURSE';
      case 'quiz': return 'QUIZ';
      case 'interactive': return 'INTERACTIVE';
      default: return 'LESSON';
    }
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Advanced': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'completed': return 'COMPLETED';
      case 'in_progress': return 'IN PROGRESS';
      case 'not_started': return 'START';
      default: return 'START';
    }
  };

  const IconComponent = getTypeIcon();

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
      className={`bg-white rounded-xl p-5 shadow-sm border ${featured ? 'border-[#2A6F68]' : 'border-gray-200'} transition-all`}
    >
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
          featured 
            ? 'bg-gradient-to-br from-[#2A6F68] to-[#B76E79]' 
            : 'bg-gradient-to-br from-gray-100 to-gray-200'
        }`}>
          <IconComponent className={`h-6 w-6 ${featured ? 'text-white' : 'text-gray-700'}`} />
        </div>
        
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getDifficultyColor()}`}>
              {difficulty}
            </span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs font-medium">
              {getTypeLabel()}
            </span>
            {featured && (
              <span className="px-2 py-0.5 bg-[#B76E79]/10 text-[#B76E79] rounded text-xs font-medium">
                FEATURED
              </span>
            )}
          </div>
          
          <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{duration} min</span>
              </div>
              <div className="flex items-center space-x-1 text-yellow-600">
                <Zap className="h-3 w-3" />
                <span>+{xpReward} XP</span>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClick}
              className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor()} transition-colors`}
            >
              {status === 'completed' ? (
                <CheckCircle className="h-3 w-3" />
              ) : status === 'in_progress' ? (
                <ArrowRight className="h-3 w-3" />
              ) : null}
              <span>{getStatusLabel()}</span>
            </motion.button>
          </div>
          
          {status === 'in_progress' && (
            <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full bg-blue-500" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default LessonCard;