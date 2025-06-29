import React from 'react';
import { motion } from 'framer-motion';
import { 
  Award, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Calendar, 
  Zap,
  BookOpen,
  Brain,
  Target
} from 'lucide-react';

interface ProgressTrackerProps {
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  streakDays: number;
  xpEarned: number;
  nextMilestone?: {
    name: string;
    modulesNeeded: number;
  };
  lastActivity?: Date;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  totalModules,
  completedModules,
  inProgressModules,
  streakDays,
  xpEarned,
  nextMilestone,
  lastActivity
}) => {
  const completionPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
  
  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#333333]">Learning Progress</h2>
        <div className="flex items-center space-x-1 bg-[#2A6F68]/10 text-[#2A6F68] px-3 py-1 rounded-full text-sm font-medium">
          <Zap className="h-4 w-4" />
          <span>{xpEarned} XP Earned</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {completedModules} of {totalModules} modules completed
          </span>
          <span className="text-sm font-medium text-[#2A6F68]">
            {completionPercentage.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-3 rounded-full bg-gradient-to-r from-[#2A6F68] to-[#B76E79]"
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#2A6F68]/5 rounded-lg p-3 text-center">
          <div className="w-8 h-8 bg-[#2A6F68]/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="h-4 w-4 text-[#2A6F68]" />
          </div>
          <div className="text-lg font-bold text-[#2A6F68]">{completedModules}</div>
          <div className="text-xs text-gray-600">Completed</div>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-blue-600">{inProgressModules}</div>
          <div className="text-xs text-gray-600">In Progress</div>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Calendar className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-amber-600">{streakDays}</div>
          <div className="text-xs text-gray-600">Day Streak</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3 text-center">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <Brain className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-lg font-bold text-purple-600">{totalModules - completedModules}</div>
          <div className="text-xs text-gray-600">Remaining</div>
        </div>
      </div>

      {/* Next Milestone */}
      {nextMilestone && (
        <div className="bg-gradient-to-r from-[#2A6F68]/5 to-[#B76E79]/5 rounded-lg p-4 border-l-4 border-[#2A6F68] mb-4">
          <div className="flex items-start space-x-3">
            <Target className="h-5 w-5 text-[#2A6F68] mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-[#333333] mb-1">Next Milestone: {nextMilestone.name}</h4>
              <p className="text-sm text-gray-700">
                Complete {nextMilestone.modulesNeeded} more module{nextMilestone.modulesNeeded !== 1 ? 's' : ''} to reach this milestone.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last Activity */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-1">
          <BookOpen className="h-4 w-4" />
          <span>Last activity: {formatDate(lastActivity)}</span>
        </div>
        <div className="flex items-center space-x-1">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span className="text-green-600">+{completionPercentage.toFixed(0)}% this week</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;