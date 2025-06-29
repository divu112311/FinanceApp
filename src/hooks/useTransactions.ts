import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Transaction {
  transaction_id: string;
  account_id: string;
  plaid_transaction_id: string;
  amount: number;
  description: string | null;
  merchant_name: string | null;
  category: string | null;
  subcategory: string | null;
  date: string;
  iso_currency_code: string | null;
  is_pending: boolean | null;
  location: any | null;
  payment_meta: any | null;
  created_at: string | null;
  
  // Joined fields from bank_accounts
  account_name?: string;
  account_type?: string;
  account_subtype?: string;
  institution_name?: string;
}

interface TransactionFilter {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
}

export const useTransactions = (user: User | null) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async (filters?: TransactionFilter) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Default to last 30 days if no dates provided
      const defaultEndDate = new Date().toISOString().split('T')[0];
      const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];

      const startDate = filters?.startDate || defaultStartDate;
      const endDate = filters?.endDate || defaultEndDate;
      const accountId = filters?.accountId;

      console.log('Fetching transactions:', {
        userId: user.id,
        startDate,
        endDate,
        accountId: accountId || 'all'
      });

      // Check if we can use the direct transactions table
      const { count, error: countError } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        // We can use the transactions table directly
        console.log('Using transactions table directly');
        
        let query = supabase
          .from('transactions')
          .select(`
            *,
            bank_account:bank_accounts(name, type, account_subtype, institution_name)
          `)
          .gte('date', startDate)
          .lte('date', endDate);

        if (accountId) {
          query = query.eq('account_id', accountId);
        }

        if (filters?.category) {
          query = query.eq('category', filters.category);
        }

        if (filters?.minAmount !== undefined) {
          query = query.gte('amount', filters.minAmount);
        }

        if (filters?.maxAmount !== undefined) {
          query = query.lte('amount', filters.maxAmount);
        }

        if (filters?.searchTerm) {
          query = query.or(`description.ilike.%${filters.searchTerm}%,merchant_name.ilike.%${filters.searchTerm}%`);
        }

        const { data, error } = await query.order('date', { ascending: false });

        if (error) {
          console.error('Error fetching transactions:', error);
          throw error;
        }

        // Format the transactions with account info
        const formattedTransactions = data.map(transaction => ({
          ...transaction,
          account_name: transaction.bank_account?.name || 'Unknown Account',
          account_type: transaction.bank_account?.type || 'unknown',
          account_subtype: transaction.bank_account?.account_subtype || 'unknown',
          institution_name: transaction.bank_account?.institution_name || 'Unknown Institution'
        }));

        setTransactions(formattedTransactions);
      } else {
        // Fallback to edge function
        console.log('Falling back to edge function for transactions');
        
        const { data, error: fetchError } = await supabase.functions.invoke('plaid-get-transactions', {
          body: {
            userId: user.id,
            startDate,
            endDate,
            accountId: accountId || null,
          },
        });

        if (fetchError) {
          console.error('Transactions fetch error:', fetchError);
          throw new Error(fetchError.message || 'Failed to fetch transactions');
        }

        console.log('Transactions fetched:', {
          count: data?.transactions?.length || 0,
          accounts: data?.accounts?.length || 0
        });

        setTransactions(data?.transactions || []);
      }
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionsByCategory = () => {
    const categoryTotals = new Map<string, number>();
    
    transactions.forEach(transaction => {
      const category = transaction.category || 'Other';
      const amount = Math.abs(transaction.amount);
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
    });

    return Array.from(categoryTotals.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const getMonthlySpending = () => {
    const monthlyTotals = new Map<string, number>();
    
    transactions.forEach(transaction => {
      if (transaction.amount > 0) { // Only count expenses (positive amounts in Plaid)
        const month = transaction.date.substring(0, 7); // YYYY-MM format
        monthlyTotals.set(month, (monthlyTotals.get(month) || 0) + transaction.amount);
      }
    });

    return Array.from(monthlyTotals.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const getTotalSpending = () => {
    return transactions
      .filter(t => t.amount > 0) // Only expenses
      .reduce((total, t) => total + t.amount, 0);
  };

  const getTotalIncome = () => {
    return transactions
      .filter(t => t.amount < 0) // Income shows as negative in Plaid
      .reduce((total, t) => total + Math.abs(t.amount), 0);
  };

  const getAccountBalances = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('account_balances')
        .select(`
          *,
          account:bank_accounts(name, type, account_subtype, institution_name)
        `)
        .order('recorded_at', { ascending: false });

      if (error) throw error;

      // Group by account_id and take the most recent balance for each account
      const latestBalances = new Map();
      data.forEach(balance => {
        if (!latestBalances.has(balance.account_id)) {
          latestBalances.set(balance.account_id, {
            ...balance,
            account_name: balance.account?.name,
            account_type: balance.account?.type,
            account_subtype: balance.account?.account_subtype,
            institution_name: balance.account?.institution_name
          });
        }
      });

      return Array.from(latestBalances.values());
    } catch (error) {
      console.error('Error fetching account balances:', error);
      return [];
    }
  };

  const getGoalTransactions = async (goalId: string) => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('goal_transactions')
        .select('*')
        .eq('goal_id', goalId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching goal transactions:', error);
      return [];
    }
  };

  const addGoalTransaction = async (
    goalId: string, 
    amount: number, 
    transactionType: 'contribution' | 'withdrawal' | 'adjustment',
    description?: string,
    transactionId?: string
  ) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('goal_transactions')
        .insert({
          goal_id: goalId,
          transaction_id: transactionId,
          amount,
          transaction_type: transactionType,
          description: description || `${transactionType} of ${amount}`,
          recorded_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding goal transaction:', error);
      return null;
    }
  };

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    getTransactionsByCategory,
    getMonthlySpending,
    getTotalSpending,
    getTotalIncome,
    getAccountBalances,
    getGoalTransactions,
    addGoalTransaction,
    refetch: () => fetchTransactions(),
  };
};