import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User as UserIcon, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useChat } from '../hooks/useChat';
import doughjoMascot from '../assets/doughjo-mascot.png';

interface ChatInterfaceProps {
  user: User;
  onXPUpdate: (points: number) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, onXPUpdate }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error' | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, loading, sendMessage } = useChat(user);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const testOpenRouterConnection = async () => {
    setConnectionStatus('checking');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-ai`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Test connection',
          userId: user.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.response && !data.error) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
          console.error('OpenRouter API test failed:', data);
        }
      } else {
        setConnectionStatus('error');
        console.error('Edge function test failed:', response.status);
      }
    } catch (error) {
      setConnectionStatus('error');
      console.error('Connection test error:', error);
    }

    // Clear status after 3 seconds
    setTimeout(() => setConnectionStatus(null), 3000);
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

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto">
      {/* Connection Status */}
      <AnimatePresence>
        {connectionStatus && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.8 }}
            className={`fixed top-20 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2 ${
              connectionStatus === 'checking' ? 'bg-blue-500 text-white' :
              connectionStatus === 'connected' ? 'bg-green-500 text-white' :
              'bg-red-500 text-white'
            }`}
          >
            {connectionStatus === 'checking' && (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Testing OpenRouter connection...</span>
              </>
            )}
            {connectionStatus === 'connected' && (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>OpenRouter API connected!</span>
              </>
            )}
            {connectionStatus === 'error' && (
              <>
                <AlertCircle className="h-4 w-4" />
                <span>OpenRouter API not responding</span>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Chat Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-t-2xl p-6 border-b border-gray-200"
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
              <p className="text-sm text-gray-600">Your Personal Financial Advisor</p>
            </div>
          </div>
          
          {/* Test Connection Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={testOpenRouterConnection}
            disabled={connectionStatus === 'checking'}
            className="flex items-center space-x-2 bg-[#2A6F68] text-white px-3 py-2 rounded-lg hover:bg-[#235A54] disabled:opacity-50 transition-colors text-sm"
          >
            {connectionStatus === 'checking' ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-3 h-3 border border-white border-t-transparent rounded-full"
              />
            ) : (
              <Zap className="h-3 w-3" />
            )}
            <span>Test AI</span>
          </motion.button>
        </div>
        <div className="bg-gradient-to-r from-[#2A6F68]/5 to-[#B76E79]/5 rounded-lg p-4 border-l-4 border-[#2A6F68]">
          <p className="text-[#333333] text-sm font-medium mb-2">
            🎯 Ready to transform your financial future?
          </p>
          <p className="text-[#666666] text-sm leading-relaxed">
            I'm here to provide personalized financial guidance, create actionable strategies, and help you build lasting wealth. 
            Let's start by analyzing your current situation and identifying opportunities for growth.
          </p>
        </div>
      </motion.div>

      {/* Messages Container */}
      <div className="flex-1 bg-white overflow-y-auto p-6 space-y-4">
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
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

        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
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
        className="bg-white rounded-b-2xl p-6 border-t border-gray-200"
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
      </div>
    </div>
  );
};

export default ChatInterface;