import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface PlaidCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (username: string, password: string) => void;
  isLoading: boolean;
}

const PlaidCredentialsModal: React.FC<PlaidCredentialsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [username, setUsername] = useState('user_good');
  const [password, setPassword] = useState('pass_good');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && password.trim()) {
      onSubmit(username.trim(), password.trim());
    }
  };

  const testAccounts = [
    { username: 'user_good', password: 'pass_good', label: 'Standard Account' },
    { username: 'user_custom', password: 'pass_good', label: 'Custom Account' },
    { username: 'user_bad', password: 'pass_good', label: 'Error Testing' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] p-4 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Connect Your Bank</h2>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-blue-900 mb-1">Sandbox Mode</h4>
                      <p className="text-sm text-blue-800">
                        This is a demo environment. Use the test credentials below to simulate connecting to a bank.
                      </p>
                    </div>
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">Enter Bank Credentials</h3>
                <p className="text-sm text-gray-600 mb-4">
                  In a production environment, you would be redirected to your bank's secure login page.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent transition-all"
                      placeholder="Enter username"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent transition-all"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Quick Select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Accounts
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {testAccounts.map((account, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setUsername(account.username);
                          setPassword(account.password);
                        }}
                        className={`p-2 text-sm rounded-lg border-2 transition-all ${
                          username === account.username && password === account.password
                            ? 'border-[#2A6F68] bg-[#2A6F68]/5 text-[#2A6F68]'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {account.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading || !username.trim() || !password.trim()}
                    className="flex-1 bg-gradient-to-r from-[#2A6F68] to-[#B76E79] text-white px-4 py-3 rounded-lg hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center font-medium"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      'Connect Bank'
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PlaidCredentialsModal;