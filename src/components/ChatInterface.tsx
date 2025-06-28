import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User as UserIcon, Zap, TrendingUp, Target, PiggyBank, AlertTriangle, CheckCircle, Lightbulb, DollarSign, Calendar, Award, TrendingDown, Coffee, CreditCard, Banknote, Brain, MessageCircle } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useChat } from '../hooks/useChat';
import { useGoals } from '../hooks/useGoals';
import { useBankAccounts } from '../hooks/useBankAccounts';
import doughjoMascot from '../assets/doughjo-mascot.png';

interface ChatInterfaceProps {
  user: User;
  onXPUpdate: (points: number) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, onXPUpdate }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [xpGained, setXpGained] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sendMessage } = useChat(user);
  const { goals } = useGoals(user);
  const { bankAccounts, totalBalance } = useBankAccounts(user);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const message = inputMessage.trim();
    setInputMessage('');

    await sendMessage(message, (points) => {
      setXpGained(points);
      onXPUpdate(points);
      setTimeout(() => setXpGained(null), 3000);
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "Analyze my current financial position",
    "Create a personalized investment strategy",
    "Build an emergency fund plan",
    "Optimize my monthly budget",
    "Plan my path to financial independence"
  ];

  // Calculate financial insights
  const totalGoalAmount = goals.reduce((sum, goal) => sum + (goal.target_amount || 0), 0);
  const totalSavedAmount = goals.reduce((sum, goal) => sum + (goal.saved_amount || 0), 0);
  const goalProgress = totalGoalAmount > 0 ? (totalSavedAmount / totalGoalAmount) * 100 : 0;
  const completedGoals = goals.filter(goal => {
    const progress = goal.target_amount ? ((goal.saved_amount || 0) / goal.target_amount) * 100 : 0;
    return progress >= 100;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] max-w-7xl mx-auto gap-6">
      {/* XP Gained Animation */}
      <AnimatePresence>
        {xpGained && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className="fixed top-20 right-4 bg-[#2A6F68] text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2"
          >
            <Zap className="h-4 w-4 text-yellow-300" />
            <span>+{xpGained} XP</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col space-y-4 min-w-0">
        {/* Easy Wins Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#B76E79] to-[#2A6F68] rounded-xl p-4 text-white flex-shrink-0"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="h-5 w-5 text-white" />
            <h3 className="text-lg font-bold text-white">Easy Wins This Week</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-white/90">Those unused subscriptions? Canceling them could free up $47/month for your dreams.</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-white/90">A high-yield savings account could grow your money while you sleep.</p>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-white/90">Automatic bill pay means one less thing to worry about (and no late fees).</p>
            </div>
          </div>
        </motion.div>

        {/* Chat Container */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col min-h-0">
          {/* Chat Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border-b border-gray-200 rounded-t-2xl flex-shrink-0"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <motion.div 
                  animate={{ 
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="w-12 h-12 bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-full flex items-center justify-center p-1"
                >
                  <img 
                    src={doughjoMascot} 
                    alt="DoughJo Sensei" 
                    className="w-full h-full object-contain rounded-full"
                  />
                </motion.div>
                <div>
                  <h2 className="text-lg font-semibold text-[#333333]">Sensei DoughJo</h2>
                  <p className="text-sm text-gray-600">Your AI Financial Advisor</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-[#2A6F68]/5 to-[#B76E79]/5 rounded-lg p-4 border-l-4 border-[#2A6F68]">
              <p className="text-[#333333] text-sm font-medium mb-2">
                🎯 Let's optimize your financial strategy
              </p>
              <p className="text-[#666666] text-sm leading-relaxed">
                I'm here to provide personalized financial guidance, create actionable strategies, and help you build lasting wealth. 
                Let's start by analyzing your current situation and identifying opportunities for growth.
              </p>
            </div>
          </motion.div>

          {/* Messages Container - Fixed Height with Better Scrolling */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0" style={{ maxHeight: 'calc(100vh - 400px)' }}>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="w-20 h-20 mx-auto mb-6"
                >
                  <img 
                    src={doughjoMascot} 
                    alt="DoughJo Sensei" 
                    className="w-full h-full object-contain opacity-70 rounded-full"
                  />
                </motion.div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-[#333333] mb-2">
                    Let's Build Your Financial Success Plan
                  </h3>
                  <p className="text-gray-600 text-sm max-w-md mx-auto">
                    Choose an area where you'd like immediate guidance, or tell me about your specific financial goals and challenges.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 gap-3 max-w-lg mx-auto">
                  {suggestedQuestions.map((question, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, backgroundColor: '#f8fafc' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setInputMessage(question)}
                      className="p-4 text-left bg-white hover:bg-gray-50 rounded-lg text-sm text-[#333333] transition-all border-2 border-gray-100 hover:border-[#2A6F68]/20 shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#2A6F68] rounded-full"></div>
                        <span className="font-medium">{question}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-8 p-4 bg-gradient-to-r from-[#2A6F68]/10 to-[#B76E79]/10 rounded-lg max-w-md mx-auto"
                >
                  <p className="text-xs text-gray-600 text-center">
                    💡 <strong>Pro Tip:</strong> The more specific you are about your financial situation and goals, 
                    the more personalized and actionable my advice will be.
                  </p>
                </motion.div>
              </motion.div>
            )}

            {/* Show last 3 messages for better visibility */}
            {messages.slice(-3).map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-[#2A6F68] text-white rounded-br-sm'
                      : 'bg-gray-100 text-[#333333] rounded-bl-sm'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.sender !== 'user' && (
                      <div className="w-5 h-5 mt-1 flex-shrink-0">
                        <img 
                          src={doughjoMascot} 
                          alt="DoughJo" 
                          className="w-full h-full object-contain rounded-full"
                        />
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{message.message}</p>
                    {message.sender === 'user' && (
                      <UserIcon className="h-4 w-4 mt-1 text-white/70 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 max-w-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5">
                      <img 
                        src={doughjoMascot} 
                        alt="DoughJo" 
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.2
                          }}
                          className="w-2 h-2 bg-[#B76E79] rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 border-t border-gray-200 rounded-b-2xl flex-shrink-0"
          >
            <div className="flex space-x-3">
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Describe your financial goals or ask for specific advice..."
                  rows={1}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent resize-none transition-all"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || loading}
                className="bg-[#2A6F68] text-white p-3 rounded-lg hover:bg-[#235A54] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-5 w-5" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Sidebar - Fixed Width and Height */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="w-80 flex flex-col space-y-4 h-[calc(100vh-140px)] overflow-y-auto"
      >
        {/* AI Learning Insights Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-[#B76E79] to-[#2A6F68] rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-[#333333]">AI Learning Insights</h3>
          </div>

          <div className="space-y-4">
            {/* Coffee Spending Alert */}
            <div className="border-l-4 border-[#B76E79] pl-4">
              <div className="flex items-start space-x-3">
                <TrendingDown className="h-5 w-5 text-[#B76E79] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Coffee Spending Alert</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    You've spent $156 on coffee this month - 23% more than last month. Consider brewing at home to save $80/month.
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">spending</span>
                    <button className="px-3 py-1 bg-[#2A6F68] text-white rounded text-xs font-medium hover:bg-[#235A54] transition-colors">
                      Learn More
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Fund Progress */}
            <div className="border-l-4 border-[#2A6F68] pl-4">
              <div className="flex items-start space-x-3">
                <TrendingUp className="h-5 w-5 text-[#2A6F68] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Emergency Fund Progress</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Great job! You're 87.5% towards your emergency fund goal. Just $1,250 more to go!
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">saving</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Investment Opportunity */}
            <div className="border-l-4 border-[#2A6F68] pl-4">
              <div className="flex items-start space-x-3">
                <DollarSign className="h-5 w-5 text-[#2A6F68] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Investment Opportunity</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    You have $2,000+ sitting in checking. Consider moving some to your high-yield savings or investment account.
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">investing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DoughJo Wisdom Section */}
        <div className="bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-xl p-6 text-white flex-shrink-0">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold">DoughJo Wisdom</h3>
          </div>

          <div className="space-y-4">
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <p className="text-sm text-white/90 mb-2">
                Good morning, Alex! I've been analyzing your financial situation overnight. I found some significant opportunities that could save you $3,720 annually. Let me walk you through what I discovered:
              </p>
              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">$1,680</div>
                  <div className="text-xs text-white/80">Debt Consolidation savings</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">$2,040</div>
                  <div className="text-xs text-white/80">Tax Optimization savings</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">Risk</div>
                  <div className="text-xs text-white/80">Investment Rebalancing Reduction</div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <p className="text-sm text-white/90">
                Here's what I recommend we tackle first: consolidate that $28k debt at 18.4% into a 7.2% personal loan. This alone saves you $1,680 annually and frees up $140/month for your emergency fund. Should I run the numbers on specific lenders?
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="h-5 w-5 text-[#2A6F68]" />
            <h3 className="text-lg font-semibold text-[#333333]">Quick Actions</h3>
          </div>

          <div className="space-y-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setInputMessage("Help me create a budget")}
              className="w-full text-left p-3 bg-gray-50 hover:bg-[#2A6F68]/5 rounded-lg transition-colors border border-transparent hover:border-[#2A6F68]/20"
            >
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-[#2A6F68]" />
                <span className="text-sm font-medium text-[#333333]">Create Budget</span>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setInputMessage("Analyze my investment options")}
              className="w-full text-left p-3 bg-gray-50 hover:bg-[#2A6F68]/5 rounded-lg transition-colors border border-transparent hover:border-[#2A6F68]/20"
            >
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-[#2A6F68]" />
                <span className="text-sm font-medium text-[#333333]">Investment Analysis</span>
              </div>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setInputMessage("Help me optimize my savings")}
              className="w-full text-left p-3 bg-gray-50 hover:bg-[#2A6F68]/5 rounded-lg transition-colors border border-transparent hover:border-[#2A6F68]/20"
            >
              <div className="flex items-center space-x-2">
                <PiggyBank className="h-4 w-4 text-[#2A6F68]" />
                <span className="text-sm font-medium text-[#333333]">Optimize Savings</span>
              </div>
            </motion.button>
          </div>
        </div>

        {/* Financial Tip of the Day */}
        <div className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] rounded-xl p-6 text-white flex-shrink-0">
          <div className="flex items-center space-x-2 mb-3">
            <Lightbulb className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Daily Wisdom</h3>
          </div>
          <p className="text-sm text-white/90 leading-relaxed">
            "The best time to plant a tree was 20 years ago. The second best time is now." 
            Start investing today, even if it's just $25 per month.
          </p>
          <div className="mt-3 text-xs text-white/70">
            - Sensei DoughJo
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatInterface;