import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Filter, 
  Search, 
  SlidersHorizontal, 
  ChevronDown, 
  ChevronUp,
  X,
  CheckCircle
} from 'lucide-react';
import LessonCard from './LessonCard';

interface Lesson {
  id: string;
  title: string;
  description: string;
  contentType: 'video' | 'article' | 'course' | 'quiz' | 'interactive';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  duration: number;
  xpReward: number;
  status: 'not_started' | 'in_progress' | 'completed';
  progress?: number;
  featured?: boolean;
}

interface LessonListProps {
  lessons: Lesson[];
  onSelectLesson: (lessonId: string) => void;
  title?: string;
  showFilters?: boolean;
}

const LessonList: React.FC<LessonListProps> = ({ 
  lessons, 
  onSelectLesson,
  title = "Available Lessons",
  showFilters = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState({
    difficulty: [] as string[],
    contentType: [] as string[],
    category: [] as string[],
    status: [] as string[]
  });

  // Extract unique categories from lessons
  const categories = [...new Set(lessons.map(lesson => lesson.category))];

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    setFilters(prev => {
      const current = [...prev[type]];
      const index = current.indexOf(value);
      
      if (index === -1) {
        current.push(value);
      } else {
        current.splice(index, 1);
      }
      
      return { ...prev, [type]: current };
    });
  };

  const clearFilters = () => {
    setFilters({
      difficulty: [],
      contentType: [],
      category: [],
      status: []
    });
    setSearchTerm('');
  };

  const filteredLessons = lessons.filter(lesson => {
    // Search filter
    if (searchTerm && !lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !lesson.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Difficulty filter
    if (filters.difficulty.length > 0 && !filters.difficulty.includes(lesson.difficulty)) {
      return false;
    }
    
    // Content type filter
    if (filters.contentType.length > 0 && !filters.contentType.includes(lesson.contentType)) {
      return false;
    }
    
    // Category filter
    if (filters.category.length > 0 && !filters.category.includes(lesson.category)) {
      return false;
    }
    
    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(lesson.status)) {
      return false;
    }
    
    return true;
  });

  const hasActiveFilters = searchTerm || 
    filters.difficulty.length > 0 || 
    filters.contentType.length > 0 || 
    filters.category.length > 0 || 
    filters.status.length > 0;

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#333333]">{title}</h2>
        
        {showFilters && (
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search lessons..."
                className="pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent transition-all w-48 md:w-64"
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
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm ${
                hasActiveFilters 
                  ? 'bg-[#2A6F68] text-white' 
                  : 'bg-white border border-gray-200 text-gray-700'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="bg-white text-[#2A6F68] rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  {filters.difficulty.length + filters.contentType.length + filters.category.length + filters.status.length + (searchTerm ? 1 : 0)}
                </span>
              )}
              {showFiltersPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </motion.button>
          </div>
        )}
      </div>
      
      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && showFiltersPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filter Lessons</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-[#2A6F68] hover:underline"
              >
                Clear all filters
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Difficulty Filter */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2 text-sm">Difficulty</h4>
                <div className="space-y-2">
                  {['Beginner', 'Intermediate', 'Advanced'].map(difficulty => (
                    <label key={difficulty} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.difficulty.includes(difficulty)}
                        onChange={() => toggleFilter('difficulty', difficulty)}
                        className="rounded text-[#2A6F68] focus:ring-[#2A6F68]"
                      />
                      <span className="text-sm text-gray-700">{difficulty}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Content Type Filter */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2 text-sm">Content Type</h4>
                <div className="space-y-2">
                  {['article', 'video', 'quiz', 'interactive', 'course'].map(type => (
                    <label key={type} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.contentType.includes(type)}
                        onChange={() => toggleFilter('contentType', type)}
                        className="rounded text-[#2A6F68] focus:ring-[#2A6F68]"
                      />
                      <span className="text-sm text-gray-700">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Category Filter */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2 text-sm">Category</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {categories.map(category => (
                    <label key={category} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.category.includes(category)}
                        onChange={() => toggleFilter('category', category)}
                        className="rounded text-[#2A6F68] focus:ring-[#2A6F68]"
                      />
                      <span className="text-sm text-gray-700">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Status Filter */}
              <div>
                <h4 className="font-medium text-gray-700 mb-2 text-sm">Status</h4>
                <div className="space-y-2">
                  {[
                    { value: 'not_started', label: 'Not Started' },
                    { value: 'in_progress', label: 'In Progress' },
                    { value: 'completed', label: 'Completed' }
                  ].map(status => (
                    <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.status.includes(status.value)}
                        onChange={() => toggleFilter('status', status.value)}
                        className="rounded text-[#2A6F68] focus:ring-[#2A6F68]"
                      />
                      <span className="text-sm text-gray-700">{status.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Lessons Grid */}
      {filteredLessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLessons.map(lesson => (
            <LessonCard
              key={lesson.id}
              id={lesson.id}
              title={lesson.title}
              description={lesson.description}
              contentType={lesson.contentType}
              difficulty={lesson.difficulty}
              duration={lesson.duration}
              xpReward={lesson.xpReward}
              status={lesson.status}
              progress={lesson.progress}
              featured={lesson.featured}
              onClick={() => onSelectLesson(lesson.id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-[#333333] mb-2">No Lessons Found</h3>
          <p className="text-gray-600 mb-4">
            {hasActiveFilters 
              ? 'Try adjusting your filters to see more lessons' 
              : 'No lessons are available at the moment'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      )}
      
      {/* Results Count */}
      {filteredLessons.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredLessons.length} of {lessons.length} lessons
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-2 text-[#2A6F68] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonList;