import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User as UserIcon, Zap, TrendingUp, Target, PiggyBank, AlertTriangle, CheckCircle, Lightbulb, DollarSign, Calendar, Award, TrendingDown, Coffee, CreditCard, Banknote, Brain, MessageCircle } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useChat } from '../hooks/useChat';
import { useGoals } from '../hooks/useGoals';
import { useBankAccounts } from '../hooks/useBankAccounts';
import { useUserProfile } from '../hooks/useUserProfile';
import { useFinancialInsights } from '../hooks/useFinancialInsights';
import SmartWinsWidget from './SmartWinsWidget';

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
  const { getDisplayName } = useUserProfile(user);
  const { insights, loading: insightsLoading, generateInsights } = useFinancialInsights(user);

  useEffect(() => {
    // Generate insights if none exist
    if (!insightsLoading && insights.length === 0) {
      generateInsights();
    }
  }, [insightsLoading, insights.length]);

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

  // Calculate dynamic financial insights from real data
  const totalGoalAmount = goals.reduce((sum, goal) => sum + (goal.target_amount || 0), 0);
  const totalSavedAmount = goals.reduce((sum, goal) => sum + (goal.saved_amount || 0), 0);
  const goalProgress = totalGoalAmount > 0 ? (totalSavedAmount / totalGoalAmount) * 100 : 0;
  const completedGoals = goals.filter(goal => {
    const progress = goal.target_amount ? ((goal.saved_amount || 0) / goal.target_amount) * 100 : 0;
    return progress >= 100;
  });

  // Get AI insights for display - limit to 2 as requested
  const aiInsights = insights.slice(0, 2);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get last 6 messages to show more conversation history
  const recentMessages = messages.slice(-6);

  return (
    <div className="max-w-7xl mx-auto">
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

      {/* Unified Financial Advisor Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
      >
        {/* Compact Header Section - Same height as other pages */}
        <div className="bg-gradient-to-r from-[#2A6F68] via-[#2A6F68] to-[#B76E79] p-6 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full transform translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full transform -translate-x-12 translate-y-12"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Sensei's Circle</h1>
                  <p className="text-white/90">Strategic counsel for disciplined money moves</p>
                </div>
              </div>
              
              {/* Compact Quick Stats */}
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-lg font-bold">{formatCurrency(totalBalance)}</div>
                  <div className="text-white/80 text-xs">Total Balance</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{goalProgress.toFixed(0)}%</div>
                  <div className="text-white/80 text-xs">Goal Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{goals.length}</div>
                  <div className="text-white/80 text-xs">Active Goals</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - Seamless Layout */}
        <div className="p-8">
          <div className="grid grid-cols-12 gap-8">
            {/* Left Column - Actions & Chat (7 columns) */}
            <div className="col-span-7 space-y-6">
              {/* Smart Wins This Week - Using the new component */}
              <SmartWinsWidget user={user} />

              {/* Quick Actions - Streamlined */}
              <div className="grid grid-cols-3 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInputMessage("Help me create a budget based on my current accounts")}
                  className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl border border-blue-200 transition-all group"
                >
                  <Calendar className="h-6 w-6 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-semibold text-blue-900">Create Budget</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInputMessage("Analyze my investment options based on my current savings")}
                  className="p-4 bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-xl border border-green-200 transition-all group"
                >
                  <TrendingUp className="h-6 w-6 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-semibold text-green-900">Investment Analysis</div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInputMessage("Help me optimize my savings strategy for my goals")}
                  className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-xl border border-purple-200 transition-all group"
                >
                  <PiggyBank className="h-6 w-6 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-sm font-semibold text-purple-900">Optimize Savings</div>
                </motion.button>
              </div>

              {/* Chat Interface - Integrated */}
              <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
                {/* Chat Header */}
                <div className="bg-white p-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-lg flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Sensei DoughJo</h3>
                      <p className="text-xs text-gray-500">Your AI Financial Advisor</p>
                    </div>
                  </div>
                  {messages.length > 0 && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {messages.length} messages
                    </span>
                  )}
                </div>

                {/* Messages Container - Fixed height to prevent auto-scroll */}
                <div className="h-80 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
                  {recentMessages.length === 0 && (
                    <div className="text-center py-6">
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 mb-2">
                          Let's Optimize Your Finances, {getDisplayName()}
                        </h4>
                        <p className="text-gray-600 text-sm max-w-md mx-auto">
                          I can see you have {bankAccounts.length} connected account{bankAccounts.length !== 1 ? 's' : ''} 
                          {goals.length > 0 && ` and ${goals.length} financial goal${goals.length !== 1 ? 's' : ''}`}. 
                          Let's create a winning strategy!
                        </p>
                      </div>
                      
                      <div className="space-y-2 max-w-sm mx-auto">
                        {suggestedQuestions.slice(0, 3).map((question, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setInputMessage(question)}
                            className="w-full p-3 text-left bg-white hover:bg-gray-50 rounded-lg text-xs text-gray-700 transition-all border border-gray-200 hover:border-[#2A6F68]/30 hover:shadow-sm"
                          >
                            <div className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 bg-[#2A6F68] rounded-full"></div>
                              <span className="font-medium">{question}</span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show last 6 messages */}
                  {recentMessages.map((message, index) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-2xl ${
                          message.sender === 'user'
                            ? 'bg-[#2A6F68] text-white rounded-br-sm'
                            : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          <p className="text-sm leading-relaxed">{message.message}</p>
                          {message.sender === 'user' && (
                            <UserIcon className="h-3 w-3 mt-1 text-white/70 flex-shrink-0" />
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
                      <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 max-w-xs border border-gray-200">
                        <div className="flex items-center space-x-2">
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
                                className="w-1.5 h-1.5 bg-[#B76E79] rounded-full"
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
                <div className="p-4 bg-white border-t border-gray-200">
                  <div className="flex space-x-3">
                    <div className="flex-1 relative">
                      <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about your finances, goals, or get personalized advice..."
                        rows={1}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent resize-none transition-all text-sm"
                        style={{ minHeight: '44px', maxHeight: '100px' }}
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || loading}
                      className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] text-white p-3 rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Send className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Insights & Wisdom (5 columns) */}
            <div className="col-span-5 space-y-6">
              {/* AI Learning Insights - Seamless Design */}
              <div className="bg-gradient-to-br from-[#B76E79]/5 to-[#B76E79]/10 rounded-2xl p-6 border border-[#B76E79]/20">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-[#B76E79] rounded-lg flex items-center justify-center">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#B76E79]">AI Learning Insights</h3>
                </div>

                <div className="space-y-4">
                  {insightsLoading && aiInsights.length === 0 ? (
                    <div className="flex items-center justify-center py-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-6 h-6 border-2 border-[#B76E79] border-t-transparent rounded-full"
                      />
                    </div>
                  ) : aiInsights.length > 0 ? (
                    aiInsights.map((insight, index) => {
                      const InsightIcon = (() => {
                        switch (insight.insight_type) {
                          case 'spending_pattern': return BarChart3;
                          case 'goal_recommendation': return Target;
                          case 'risk_alert': return AlertTriangle;
                          case 'opportunity': return Lightbulb;
                          case 'budget_advice': return PiggyBank;
                          case 'investment_tip': return TrendingUp;
                          default: return Lightbulb;
                        }
                      })();
                      
                      const colorClass = (() => {
                        if (insight.priority_level === 'high') return 'text-red-600';
                        switch (insight.insight_type) {
                          case 'spending_pattern': return 'text-blue-600';
                          case 'goal_recommendation': return 'text-purple-600';
                          case 'risk_alert': return 'text-orange-600';
                          case 'opportunity': return 'text-green-600';
                          case 'budget_advice': return 'text-teal-600';
                          case 'investment_tip': return 'text-indigo-600';
                          default: return 'text-gray-600';
                        }
                      })();
                      
                      return (
                        <motion.div 
                          key={insight.insight_id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-white/60 rounded-xl p-4 border border-white/40"
                        >
                          <div className="flex items-start space-x-3">
                            <InsightIcon className={`h-5 w-5 ${colorClass} mt-0.5 flex-shrink-0`} />
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1 text-sm">{insight.title}</h4>
                              <p className="text-xs text-gray-700 leading-relaxed">{insight.description}</p>
                              <div className="mt-2">
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                  {insight.insight_type.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    // Default insights when no dynamic data available
                    <>
                      <div className="bg-white/60 rounded-xl p-4 border border-white/40">
                        <div className="flex items-start space-x-3">
                          <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1 text-sm">Connect Your Accounts</h4>
                            <p className="text-xs text-gray-700 leading-relaxed">
                              Link your bank accounts to get personalized insights about your spending patterns and savings opportunities.
                            </p>
                            <div className="mt-2">
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">setup</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/60 rounded-xl p-4 border border-white/40">
                        <div className="flex items-start space-x-3">
                          <Target className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1 text-sm">Set Financial Goals</h4>
                            <p className="text-xs text-gray-700 leading-relaxed">
                              Create specific financial goals to track your progress and stay motivated on your wealth-building journey.
                            </p>
                            <div className="mt-2">
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">planning</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Sensei Wisdom - Integrated */}
              <div className="bg-gradient-to-br from-[#2A6F68]/5 to-[#2A6F68]/10 rounded-2xl p-6 border border-[#2A6F68]/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-8 h-8 bg-[#2A6F68] rounded-lg flex items-center justify-center">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#2A6F68]">Sensei Wisdom</h3>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/60 rounded-xl p-4 border border-white/40">
                    <p className="text-sm text-[#2A6F68] mb-3 font-medium">
                      {totalBalance > 0 ? (
                        `Great progress, ${getDisplayName()}! With ${formatCurrency(totalBalance)} across your accounts and ${goalProgress.toFixed(1)}% progress toward your goals, you're building a solid financial foundation.`
                      ) : (
                        `Welcome to your financial journey, ${getDisplayName()}! I'm here to help you build wealth, achieve your goals, and make smart money decisions.`
                      )}
                    </p>
                    
                    {goals.length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center bg-[#2A6F68]/10 rounded-lg p-3">
                          <div className="text-lg font-bold text-[#2A6F68]">{formatCurrency(totalSavedAmount)}</div>
                          <div className="text-xs text-[#2A6F68]/80">Total Saved</div>
                        </div>
                        <div className="text-center bg-[#2A6F68]/10 rounded-lg p-3">
                          <div className="text-lg font-bold text-[#2A6F68]">{goalProgress.toFixed(1)}%</div>
                          <div className="text-xs text-[#2A6F68]/80">Goal Progress</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/60 rounded-xl p-4 border border-white/40">
                    <p className="text-sm text-[#2A6F68] font-medium">
                      {totalBalance > 5000 ? (
                        `Here's what I recommend: consider automating your savings to reach your goals faster. With your current balance, you could potentially save an additional $${Math.ceil(totalBalance * 0.02)} monthly.`
                      ) : (
                        `Here's what I recommend we tackle first: start with the basics - create a budget, build a small emergency fund, and set up automatic savings. Small steps lead to big results!`
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Daily Wisdom - Compact */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Lightbulb className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-orange-900">Daily Wisdom</h3>
                </div>
                <div className="bg-white/60 rounded-xl p-4 border border-white/40">
                  <p className="text-sm text-orange-900 leading-relaxed font-medium">
                    "The best time to plant a tree was 20 years ago. The second best time is now." 
                    Start investing today, even if it's just $25 per month.
                  </p>
                  <div className="mt-2 text-xs text-orange-700 font-medium">
                    - Sensei DoughJo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChatInterface;