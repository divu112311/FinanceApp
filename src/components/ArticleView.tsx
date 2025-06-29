import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  BookOpen, 
  Award, 
  CheckCircle,
  Bookmark,
  Share2,
  ThumbsUp,
  Printer,
  Zap
} from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface ArticleViewProps {
  user: User;
  moduleId: string;
  title: string;
  content: any;
  difficulty: string;
  duration: number;
  xpReward: number;
  onComplete: () => void;
  onBack: () => void;
}

const ArticleView: React.FC<ArticleViewProps> = ({
  user,
  moduleId,
  title,
  content,
  difficulty,
  duration,
  xpReward,
  onComplete,
  onBack
}) => {
  const [readingProgress, setReadingProgress] = useState(0);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [startTime] = useState(new Date());

  // Track scroll position to update reading progress
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      
      // Calculate reading progress percentage
      const progress = (scrollTop / (documentHeight - windowHeight)) * 100;
      setReadingProgress(progress);
      
      // Check if user has reached the end of the article
      if (progress > 90 && !hasReachedEnd) {
        setHasReachedEnd(true);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasReachedEnd]);

  // Mark as completed when user has spent enough time and reached the end
  useEffect(() => {
    if (hasReachedEnd && !isCompleted) {
      const timeSpent = (new Date().getTime() - startTime.getTime()) / 1000 / 60; // in minutes
      
      // Only mark as completed if they've spent at least half the estimated duration
      if (timeSpent >= duration / 2) {
        setIsCompleted(true);
        onComplete();
      }
    }
  }, [hasReachedEnd, isCompleted, duration, startTime, onComplete]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Advanced': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gray-200 z-50">
        <div 
          className="h-full bg-[#2A6F68]" 
          style={{ width: `${readingProgress}%` }}
        />
      </div>
      
      {/* Article Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-[#2A6F68] mb-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to lessons</span>
        </button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
        
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center space-x-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{duration} min read</span>
          </div>
          
          <div className="flex items-center space-x-2 text-yellow-600">
            <Zap className="h-4 w-4" />
            <span>+{xpReward} XP</span>
          </div>
          
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
            {difficulty}
          </div>
          
          <div className="flex items-center space-x-2 text-gray-600">
            <BookOpen className="h-4 w-4" />
            <span>Article</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-1 text-gray-600 hover:text-[#2A6F68]">
              <Bookmark className="h-4 w-4" />
              <span className="text-sm">Save</span>
            </button>
            
            <button className="flex items-center space-x-1 text-gray-600 hover:text-[#2A6F68]">
              <Share2 className="h-4 w-4" />
              <span className="text-sm">Share</span>
            </button>
            
            <button className="flex items-center space-x-1 text-gray-600 hover:text-[#2A6F68]">
              <Printer className="h-4 w-4" />
              <span className="text-sm">Print</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-1 text-gray-600">
            <ThumbsUp className="h-4 w-4" />
            <span className="text-sm">42 found helpful</span>
          </div>
        </div>
      </div>
      
      {/* Article Content */}
      <div className="prose prose-lg max-w-none mb-12">
        {content.sections.map((section, index) => (
          <div key={index} className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-3">{section.title}</h2>
            <p className="text-gray-700 leading-relaxed">{section.content}</p>
          </div>
        ))}
      </div>
      
      {/* Completion Status */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isCompleted ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {isCompleted ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <Clock className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {isCompleted ? 'Article Completed!' : 'Keep Reading'}
              </h3>
              <p className="text-sm text-gray-600">
                {isCompleted 
                  ? `You've earned ${xpReward} XP for completing this article.` 
                  : `Continue reading to earn ${xpReward} XP.`}
              </p>
            </div>
          </div>
          
          {isCompleted && (
            <div className="flex items-center space-x-2 bg-green-100 text-green-700 px-3 py-1 rounded-full">
              <Award className="h-4 w-4" />
              <span className="text-sm font-medium">+{xpReward} XP</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Next Steps */}
      <div className="flex justify-between items-center mb-12">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to lessons</span>
        </button>
        
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-2 bg-[#2A6F68] text-white px-4 py-2 rounded-lg"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Completed</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ArticleView;