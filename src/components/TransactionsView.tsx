import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar,
  Filter,
  TrendingDown,
  TrendingUp,
  DollarSign,
  CreditCard,
  Building2,
  Search,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  PieChart,
  BarChart3
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useTransactions } from '../hooks/useTransactions';
import { useBankAccounts } from '../hooks/useBankAccounts';

interface TransactionsViewProps {
  user: User;
}

const TransactionsView: React.FC<TransactionsViewProps> = ({ user }) => {
  const { 
    transactions, 
    loading, 
    error, 
    fetchTransactions,
    getTransactionsByCategory,
    getTotalSpending,
    getTotalIncome
  } = useTransactions(user);
  
  const { bankAccounts } = useBankAccounts(user);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleRefresh = () => {
    fetchTransactions(
      dateRange.start,
      dateRange.end,
      selectedAccount === 'all' ? undefined : selectedAccount
    );
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const newDateRange = { ...dateRange, [field]: value };
    setDateRange(newDateRange);
    
    // Auto-fetch when date range changes
    setTimeout(() => {
      fetchTransactions(
        newDateRange.start,
        newDateRange.end,
        selectedAccount === 'all' ? undefined : selectedAccount
      );
    }, 500);
  };

  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(transaction => {
      const matchesSearch = transaction.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.merchant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.category?.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesAccount = selectedAccount === 'all' || transaction.account_id === selectedAccount;
      
      const matchesCategory = selectedCategory === 'all' || 
                             transaction.category?.includes(selectedCategory);
      
      return matchesSearch && matchesAccount && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount':
          comparison = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const categories = Array.from(new Set(
    transactions.flatMap(t => t.category || [])
  )).sort();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTransactionIcon = (transaction: any) => {
    if (transaction.amount < 0) return TrendingUp; // Income
    if (transaction.category?.includes('Transfer')) return ArrowUpDown;
    if (transaction.category?.includes('Payment')) return CreditCard;
    return TrendingDown; // Expense
  };

  const getTransactionColor = (transaction: any) => {
    if (transaction.amount < 0) return 'text-green-600'; // Income
    if (transaction.category?.includes('Transfer')) return 'text-blue-600';
    return 'text-red-600'; // Expense
  };

  const categoryData = getTransactionsByCategory().slice(0, 5);
  const totalSpending = getTotalSpending();
  const totalIncome = getTotalIncome();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#333333] mb-2">Transactions</h2>
          <p className="text-gray-600">Track your spending and income</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center space-x-2 bg-[#2A6F68] text-white px-4 py-2 rounded-lg hover:bg-[#235A54] disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </motion.button>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-red-900 mb-1">Error Loading Transactions</h4>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[#333333] mb-1">
            {formatCurrency(totalSpending)}
          </h3>
          <p className="text-sm text-gray-600">Total Spending</p>
          <p className="text-xs text-red-600 mt-1">
            {transactions.filter(t => t.amount > 0).length} transactions
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[#333333] mb-1">
            {formatCurrency(totalIncome)}
          </h3>
          <p className="text-sm text-gray-600">Total Income</p>
          <p className="text-xs text-green-600 mt-1">
            {transactions.filter(t => t.amount < 0).length} transactions
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-[#333333] mb-1">
            {formatCurrency(totalIncome - totalSpending)}
          </h3>
          <p className="text-sm text-gray-600">Net Income</p>
          <p className="text-xs text-blue-600 mt-1">
            {transactions.length} total transactions
          </p>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-[#333333] mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search transactions..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent transition-all text-sm"
              />
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-[#333333] mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#333333] mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent transition-all text-sm"
            />
          </div>

          {/* Account Filter */}
          <div>
            <label className="block text-sm font-medium text-[#333333] mb-2">
              Account
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent transition-all text-sm"
            >
              <option value="all">All Accounts</option>
              {bankAccounts.map(account => (
                <option key={account.id} value={account.plaid_account_id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-[#333333] mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent transition-all text-sm"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Transactions List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#333333]">
              Recent Transactions ({filteredTransactions.length})
            </h3>
            <div className="flex items-center space-x-2">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as 'date' | 'amount' | 'name');
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="date-desc">Date (Newest)</option>
                <option value="date-asc">Date (Oldest)</option>
                <option value="amount-desc">Amount (Highest)</option>
                <option value="amount-asc">Amount (Lowest)</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-[#2A6F68] border-t-transparent rounded-full"
              />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-[#333333] mb-2">No Transactions Found</h3>
              <p className="text-gray-600">
                {transactions.length === 0 
                  ? 'Connect your bank accounts to see transactions'
                  : 'Try adjusting your filters to see more results'
                }
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredTransactions.slice(0, 50).map((transaction, index) => {
                const TransactionIcon = getTransactionIcon(transaction);
                const colorClass = getTransactionColor(transaction);
                
                return (
                  <motion.div
                    key={transaction.transaction_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          transaction.amount < 0 ? 'bg-green-100' : 
                          transaction.category?.includes('Transfer') ? 'bg-blue-100' : 'bg-red-100'
                        }`}>
                          <TransactionIcon className={`h-5 w-5 ${colorClass}`} />
                        </div>
                        <div>
                          <h4 className="font-medium text-[#333333]">
                            {transaction.merchant_name || transaction.name}
                          </h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>{transaction.account_name}</span>
                            <span>•</span>
                            <span>{transaction.category?.[0] || 'Other'}</span>
                            <span>•</span>
                            <span>{formatDate(transaction.date)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${colorClass}`}>
                          {transaction.amount < 0 ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                        {transaction.pending && (
                          <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mt-1">
                            Pending
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {filteredTransactions.length > 50 && (
          <div className="p-4 text-center border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing first 50 of {filteredTransactions.length} transactions
            </p>
          </div>
        )}
      </motion.div>

      {/* Top Categories */}
      {categoryData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-[#333333] mb-4">Top Spending Categories</h3>
          <div className="space-y-3">
            {categoryData.map((item, index) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#2A6F68]/10 rounded-lg flex items-center justify-center">
                    <PieChart className="h-4 w-4 text-[#2A6F68]" />
                  </div>
                  <span className="font-medium text-[#333333]">{item.category}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-[#333333]">
                    {formatCurrency(item.amount)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {((item.amount / totalSpending) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default TransactionsView;