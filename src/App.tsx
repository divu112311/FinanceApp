import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import LearningCenter from './components/LearningCenter';
import LandingPage from './components/LandingPage';
import { useAuth } from './hooks/useAuth';
import { useUserProfile } from './hooks/useUserProfile';
import { useXP } from './hooks/useXP'; // Updated import
import doughjoMascot from './assets/doughjo-mascot.png';

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, getDisplayName } = useUserProfile(user);
  const { xp, enhancedXP, updateXP, getCurrentLevel, getTotalXP, loading: xpLoading } = useXP(user); // Updated hook
  const [activeView, setActiveView] = useState<'dashboard' | 'advisor' | 'learning'>('advisor');
  const [showAuth, setShowAuth] = useState(false);

  const handleXPUpdate = async (points: number) => {
    await updateXP(points);
  };

  const handleGetStarted = () => {
    setShowAuth(true);
  };

  const handleSignIn = () => {
    setShowAuth(true);
  };

  if (authLoading || profileLoading || xpLoading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[#2A6F68] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Show landing page if user is not authenticated and not trying to sign in
  if (!user && !showAuth) {
    return <LandingPage onGetStarted={handleGetStarted} onSignIn={handleSignIn} />;
  }

  // Show login form if user is not authenticated but wants to sign in
  if (!user && showAuth) {
    return <LoginForm />;
  }

  // Get level from enhanced XP if available, otherwise calculate from regular XP
  const level = enhancedXP ? enhancedXP.current_level : getCurrentLevel();
  const totalXP = getTotalXP();
  const displayName = getDisplayName();

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-3"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-[#2A6F68] to-[#B76E79] rounded-full flex items-center justify-center p-1">
                  <img 
                    src={doughjoMascot} 
                    alt="DoughJo Mascot" 
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <h1 className="text-2xl font-serif font-bold text-[#333333]">
                  Hi {displayName}
                </h1>
              </motion.div>
            </div>

            <div className="flex items-center space-x-4">
              <nav className="flex space-x-2">
                <button
                  onClick={() => setActiveView('advisor')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeView === 'advisor'
                      ? 'bg-[#2A6F68] text-white'
                      : 'text-[#333333] hover:bg-gray-100'
                  }`}
                >
                  Sensei's Circle
                </button>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeView === 'dashboard'
                      ? 'bg-[#2A6F68] text-white'
                      : 'text-[#333333] hover:bg-gray-100'
                  }`}
                >
                  Dough Vault
                </button>
                <button
                  onClick={() => setActiveView('learning')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    activeView === 'learning'
                      ? 'bg-[#2A6F68] text-white'
                      : 'text-[#333333] hover:bg-gray-100'
                  }`}
                >
                  Finance Kata
                </button>
              </nav>
              
              <button
                onClick={signOut}
                className="text-[#333333] hover:text-[#B76E79] transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {activeView === 'advisor' ? (
            <motion.div
              key="advisor"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <ChatInterface user={user} onXPUpdate={handleXPUpdate} />
            </motion.div>
          ) : activeView === 'dashboard' ? (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Dashboard user={user} xp={{ points: totalXP, badges: xp?.badges || [] }} />
            </motion.div>
          ) : (
            <motion.div
              key="learning"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <LearningCenter user={user} xp={{ points: totalXP, badges: xp?.badges || [] }} onXPUpdate={handleXPUpdate} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;