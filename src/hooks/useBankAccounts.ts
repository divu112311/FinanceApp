import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface BankAccount {
  id: string;
  user_id: string | null;
  plaid_account_id: string;
  plaid_access_token: string;
  name: string;
  type: string;
  subtype: string | null;
  balance: number | null;
  institution_name: string;
  institution_id: string;
  mask: string | null;
  last_updated: string | null;
  created_at: string | null;
}

export const useBankAccounts = (user: User | null) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    if (user) {
      fetchBankAccounts();
    }
  }, [user]);

  const fetchBankAccounts = async () => {
    if (!user) return;

    console.log('=== FETCHING BANK ACCOUNTS ===');
    console.log('User ID:', user.id);

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching bank accounts:', error);
        return;
      }

      console.log('✅ Bank accounts fetched:', data?.length || 0);
      setBankAccounts(data || []);
      
      // Calculate total balance
      const total = (data || []).reduce((sum, account) => sum + (account.balance || 0), 0);
      setTotalBalance(total);
      console.log('💰 Total balance calculated:', total);
    } catch (error) {
      console.error('❌ Error fetching bank accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const addBankAccount = async (accountData: Omit<BankAccount, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .insert({
          user_id: user.id,
          ...accountData,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding bank account:', error);
        return null;
      }

      setBankAccounts(prev => [data, ...prev]);
      setTotalBalance(prev => prev + (data.balance || 0));
      return data;
    } catch (error) {
      console.error('Error adding bank account:', error);
      return null;
    }
  };

  const updateBankAccount = async (id: string, updates: Partial<BankAccount>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating bank account:', error);
        return null;
      }

      setBankAccounts(prev => prev.map(account => 
        account.id === id ? data : account
      ));
      
      // Recalculate total balance
      const updatedAccounts = bankAccounts.map(account => 
        account.id === id ? data : account
      );
      const total = updatedAccounts.reduce((sum, account) => sum + (account.balance || 0), 0);
      setTotalBalance(total);
      
      return data;
    } catch (error) {
      console.error('Error updating bank account:', error);
      return null;
    }
  };

  const deleteBankAccount = async (id: string) => {
    if (!user) return false;

    try {
      const deletedAccount = bankAccounts.find(account => account.id === id);
      
      const { error } = await supabase
        .from('bank_accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting bank account:', error);
        return false;
      }

      setBankAccounts(prev => prev.filter(account => account.id !== id));
      setTotalBalance(prev => prev - (deletedAccount?.balance || 0));
      
      return true;
    } catch (error) {
      console.error('Error deleting bank account:', error);
      return false;
    }
  };

  const refreshAccounts = async () => {
    console.log('🔄 Refreshing bank accounts...');
    await fetchBankAccounts();
  };

  return {
    bankAccounts,
    loading,
    totalBalance,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    refreshAccounts,
    refetch: fetchBankAccounts,
  };
};