import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@supabase/supabase-js';
import Dashboard from './Dashboard';
import ChatInterface from './ChatInterface';
import LearningCenter from './LearningCenter';
import InsightsDashboard from './InsightsDashboard';
import { 
  LayoutDashboard, 
  MessageCircle, 
  BookOpen, 
  Lightbulb,
  BarChart3
} from 'lucide-react';

interface AppRouterProps {
  user: User;
  xp: { points: number | null; badges: string[] | null } | null;
  onXPUpdate: (points: number) => void;
}

const AppRouter: React.FC<AppRouterProps> = ({ user, xp, onXPUpdate }) => {
  const [activeView, setActiveView] = useState<'dashboard' | 'advisor' | 'learning' | 'insights'>('advisor');

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1">
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-4 gap-1 w-full">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all ${
                activeView === 'dashboard'
                  ? 'bg-[#2A6F68] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="font-medium">Dashboard</span>
            </button>
            
            <button
              onClick={() => setActiveView('advisor')}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all ${
                activeView === 'advisor'
                  ? 'bg-[#2A6F68] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="font-medium">Sensei's Circle</span>
            </button>
            
            <button
              onClick={() => setActiveView('insights')}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all ${
                activeView === 'insights'
                  ? 'bg-[#2A6F68] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              <span className="font-medium">AI Insights</span>
            </button>
            
            <button
              onClick={() => setActiveView('learning')}
              className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all ${
                activeView === 'learning'
                  ? 'bg-[#2A6F68] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span className="font-medium">Finance Kata</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {activeView === 'dashboard' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard user={user} xp={xp} />
          </motion.div>
        ) : activeView === 'advisor' ? (
          <motion.div
            key="advisor"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <ChatInterface user={user} onXPUpdate={onXPUpdate} />
          </motion.div>
        ) : activeView === 'insights' ? (
          <motion.div
            key="insights"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <InsightsDashboard user={user} />
          </motion.div>
        ) : (
          <motion.div
            key="learning"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <LearningCenter user={user} xp={xp} onXPUpdate={onXPUpdate} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AppRouter;