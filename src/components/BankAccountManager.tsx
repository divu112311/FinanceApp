import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Building2, 
  CreditCard, 
  PiggyBank, 
  TrendingUp,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Trash2,
  Edit3
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useBankAccounts } from '../hooks/useBankAccounts';
import { usePlaidLink } from '../hooks/usePlaidLink';
import PlaidCredentialsModal from './PlaidCredentialsModal';

interface BankAccountManagerProps {
  user: User;
}

const BankAccountManager: React.FC<BankAccountManagerProps> = ({ user }) => {
  const [showBalances, setShowBalances] = useState(true);
  const { bankAccounts, loading, refreshAccounts, totalBalance, deleteBankAccount } = useBankAccounts(user);
  const { 
    openPlaidLink, 
    connectWithCredentials,
    closeCredentialsModal,
    isLoading: plaidLoading, 
    error: plaidError,
    showCredentialsModal
  } = usePlaidLink(user);

  const getAccountIcon = (type: string, subtype: string) => {
    if (type === 'depository') {
      if (subtype === 'checking') return CreditCard;
      if (subtype === 'savings') return PiggyBank;
    }
    if (type === 'investment') return TrendingUp;
    return Building2;
  };

  const getAccountTypeLabel = (type: string, subtype: string) => {
    if (type === 'depository') {
      if (subtype === 'checking') return 'Checking';
      if (subtype === 'savings') return 'Savings';
      if (subtype === 'cd') return 'Certificate of Deposit';
    }
    if (type === 'investment') {
      if (subtype === '401k') return '401(k)';
      if (subtype === 'ira') return 'IRA';
      return 'Investment';
    }
    if (type === 'credit') return 'Credit Card';
    if (type === 'loan') return 'Loan';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getAccountColor = (type: string) => {
    switch (type) {
      case 'depository': return 'from-blue-400 to-blue-600';
      case 'investment': return 'from-green-400 to-green-600';
      case 'credit': return 'from-purple-400 to-purple-600';
      case 'loan': return 'from-orange-400 to-orange-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const formatBalance = (balance: number) => {
    if (!showBalances) return '••••••';
    return `$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatAccountNumber = (mask: string | null) => {
    if (!mask) return '••••';
    return `••••${mask}`;
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (window.confirm('Are you sure you want to disconnect this account?')) {
      await deleteBankAccount(accountId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Plaid Credentials Modal */}
      <PlaidCredentialsModal
        isOpen={showCredentialsModal}
        onClose={closeCredentialsModal}
        onSubmit={connectWithCredentials}
        isLoading={plaidLoading}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#333333] mb-2">Bank Accounts</h2>
          <p className="text-gray-600">Manage your connected financial accounts</p>
        </div>
        <div className="flex items-center space-x-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowBalances(!showBalances)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="text-sm">{showBalances ? 'Hide' : 'Show'} Balances</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refreshAccounts}
            disabled={loading}
            className="flex items-center space-x-2 px-3 py-2 bg-[#2A6F68] text-white rounded-lg hover:bg-[#235A54] disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-sm">Refresh</span>
          </motion.button>
        </div>
      </div>

      {/* Error Display */}
      {plaidError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-900 mb-1">Connection Error</h4>
              <p className="text-sm text-red-800">{plaidError}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Total Balance Card */}
      {bankAccounts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] rounded-2xl p-6 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-2">Total Balance</h3>
              <p className="text-3xl font-bold">
                {formatBalance(totalBalance)}
              </p>
              <p className="text-white/80 text-sm mt-1">
                Across {bankAccounts.length} account{bankAccounts.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Building2 className="h-8 w-8" />
            </div>
          </div>
        </motion.div>
      )}

      {/* Add Account Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl p-6 shadow-sm border-2 border-dashed border-gray-300 hover:border-[#2A6F68] transition-colors"
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-[#2A6F68]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-[#2A6F68]" />
          </div>
          <h3 className="text-lg font-semibold text-[#333333] mb-2">Connect Bank Account</h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            Securely connect your bank accounts to get a complete view of your finances and personalized insights.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openPlaidLink}
            disabled={plaidLoading}
            className="inline-flex items-center space-x-2 bg-[#2A6F68] text-white px-6 py-3 rounded-lg hover:bg-[#235A54] disabled:opacity-50 transition-colors"
          >
            {plaidLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            <span>Connect Account</span>
          </motion.button>
          
          <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
            <CheckCircle className="h-3 w-3" />
            <span>Bank-level security</span>
            <span>•</span>
            <CheckCircle className="h-3 w-3" />
            <span>Read-only access</span>
            <span>•</span>
            <CheckCircle className="h-3 w-3" />
            <span>Powered by Plaid</span>
          </div>
        </div>
      </motion.div>

      {/* Connected Accounts */}
      {bankAccounts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-[#333333]">Connected Accounts</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {bankAccounts.map((account, index) => {
                const IconComponent = getAccountIcon(account.type, account.subtype || '');
                
                return (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${getAccountColor(account.type)} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-[#333333]">
                          {formatBalance(account.balance || 0)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatAccountNumber(account.mask)}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <h4 className="font-semibold text-[#333333]">{account.name}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {getAccountTypeLabel(account.type, account.subtype || '')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {account.institution_name}
                        </span>
                      </div>
                      
                      {account.last_updated && (
                        <div className="text-xs text-gray-400 flex items-center space-x-1">
                          <RefreshCw className="h-3 w-3" />
                          <span>
                            Updated {new Date(account.last_updated).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Account Actions */}
                    <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 flex items-center justify-center space-x-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Edit</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteAccount(account.id)}
                        className="flex items-center justify-center bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty State */}
      {bankAccounts.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-[#333333] mb-2">No Accounts Connected</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Connect your bank accounts to get started with personalized financial insights and automated tracking.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <h4 className="font-medium text-blue-900 mb-1">Why Connect Your Accounts?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Automatic transaction categorization</li>
                  <li>• Real-time balance updates</li>
                  <li>• Personalized financial insights</li>
                  <li>• Goal progress tracking</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Plaid Attribution */}
      <div className="text-center">
        <div className="inline-flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
          <span>Powered by</span>
          <ExternalLink className="h-3 w-3" />
          <span className="font-medium">Plaid</span>
        </div>
      </div>
    </div>
  );
};

export default BankAccountManager;