import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Transaction {
  transaction_id: string;
  account_id: string;
  account_name: string;
  account_type: string;
  account_subtype: string;
  institution_name: string;
  amount: number;
  date: string;
  name: string;
  merchant_name?: string;
  category: string[];
  category_id: string;
  transaction_type: string;
  pending: boolean;
  iso_currency_code: string;
}

export const useTransactions = (user: User | null) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (
    startDate?: string, 
    endDate?: string, 
    accountId?: string
  ) => {
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

      console.log('Fetching transactions:', {
        userId: user.id,
        startDate: startDate || defaultStartDate,
        endDate: endDate || defaultEndDate,
        accountId: accountId || 'all'
      });

      const { data, error: fetchError } = await supabase.functions.invoke('plaid-get-transactions', {
        body: {
          userId: user.id,
          startDate: startDate || defaultStartDate,
          endDate: endDate || defaultEndDate,
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
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch transactions when user changes
  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const getTransactionsByCategory = () => {
    const categoryTotals = new Map<string, number>();
    
    transactions.forEach(transaction => {
      const category = transaction.category?.[0] || 'Other';
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

  return {
    transactions,
    loading,
    error,
    fetchTransactions,
    getTransactionsByCategory,
    getMonthlySpending,
    getTotalSpending,
    getTotalIncome,
    refetch: () => fetchTransactions(),
  };
};