import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  TrendingUp, 
  PiggyBank, 
  Target, 
  DollarSign,
  Zap
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useSmartWins } from '../hooks/useSmartWins';

interface SmartWinsWidgetProps {
  user: User;
}

const SmartWinsWidget: React.FC<SmartWinsWidgetProps> = ({ user }) => {
  const { smartWins, loading, fetchSmartWins } = useSmartWins(user);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch smart wins when component mounts
  useEffect(() => {
    const loadData = async () => {
      await fetchSmartWins();
      setIsInitialLoad(false);
    };
    
    loadData();
  }, [user.id]);

  const getWinIcon = (type: string) => {
    switch (type) {
      case 'savings': return PiggyBank;
      case 'spending': return DollarSign;
      case 'investment': return TrendingUp;
      case 'goal': return Target;
      case 'opportunity': return Lightbulb;
      default: return Lightbulb;
    }
  };

  // Limit smart wins to 3
  const displayWins = smartWins.slice(0, 3);

  if ((loading && isInitialLoad) || displayWins.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#2A6F68]/5 to-[#2A6F68]/10 rounded-2xl p-6 border border-[#2A6F68]/20">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-[#2A6F68] rounded-lg flex items-center justify-center">
            <Lightbulb className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-bold text-[#2A6F68] ml-3">Smart Wins This Week</h3>
        </div>
        
        {loading && isInitialLoad ? (
          <div className="flex items-center justify-center py-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-6 h-6 border-2 border-[#2A6F68] border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
              <div className="w-2 h-2 bg-[#2A6F68] rounded-full flex-shrink-0"></div>
              <p className="text-sm text-[#2A6F68] font-medium">
                Move excess checking funds (${Math.floor(Math.random() * 1000) + 1000}) to high-yield savings for better returns
              </p>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
              <div className="w-2 h-2 bg-[#2A6F68] rounded-full flex-shrink-0"></div>
              <p className="text-sm text-[#2A6F68] font-medium">
                Automate ${Math.floor(Math.random() * 200) + 100} monthly to reach goals faster
              </p>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg">
              <div className="w-2 h-2 bg-[#2A6F68] rounded-full flex-shrink-0"></div>
              <p className="text-sm text-[#2A6F68] font-medium">Review subscriptions - most people save $40-80/month</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-[#2A6F68]/5 to-[#2A6F68]/10 rounded-2xl p-6 border border-[#2A6F68]/20">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-[#2A6F68] rounded-lg flex items-center justify-center">
          <Lightbulb className="h-4 w-4 text-white" />
        </div>
        <h3 className="text-lg font-bold text-[#2A6F68] ml-3">Smart Wins This Week</h3>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {displayWins.map((win, index) => {
          const WinIcon = getWinIcon(win.type);
          
          return (
            <motion.div
              key={win.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center space-x-3 p-3 bg-white/60 rounded-lg"
            >
              <div className="w-2 h-2 bg-[#2A6F68] rounded-full flex-shrink-0"></div>
              <p className="text-sm text-[#2A6F68] font-medium flex-1">
                {win.description}
              </p>
              {win.impact && (
                <div className="flex items-center space-x-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                  <Zap className="h-3 w-3" />
                  <span>${win.impact}/yr</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default SmartWinsWidget;