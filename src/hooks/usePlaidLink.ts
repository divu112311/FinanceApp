import { useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useBankAccounts } from './useBankAccounts';

declare global {
  interface Window {
    Plaid: {
      create: (config: any) => {
        open: () => void;
        exit: () => void;
        destroy: () => void;
      };
    };
  }
}

export const usePlaidLink = (user: User | null) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const { refetch: refetchAccounts } = useBankAccounts(user);

  const loadPlaidScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Plaid) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Plaid script'));
      document.head.appendChild(script);
    });
  }, []);

  const openPlaidLink = useCallback(async () => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    console.log('=== OPENING PLAID LINK ===');
    console.log('User ID:', user.id);

    setIsLoading(true);
    setError(null);

    try {
      // Load Plaid script if not already loaded
      await loadPlaidScript();
      console.log('✅ Plaid script loaded');

      // For demo purposes, we'll simulate a successful connection
      // In production, you would call your Plaid link token endpoint
      console.log('🔗 Creating demo bank account connection...');

      // Simulate successful account connection
      const demoAccounts = [
        {
          plaid_account_id: `demo_checking_${Date.now()}`,
          plaid_access_token: `demo_token_${user.id}_${Date.now()}`,
          name: 'Primary Checking',
          type: 'depository',
          subtype: 'checking',
          balance: Math.floor(Math.random() * 5000) + 1000,
          institution_name: 'Demo Bank',
          institution_id: 'ins_demo',
          mask: '1234'
        },
        {
          plaid_account_id: `demo_savings_${Date.now() + 1}`,
          plaid_access_token: `demo_token_${user.id}_${Date.now() + 1}`,
          name: 'High Yield Savings',
          type: 'depository',
          subtype: 'savings',
          balance: Math.floor(Math.random() * 10000) + 2000,
          institution_name: 'Demo Bank',
          institution_id: 'ins_demo',
          mask: '5678'
        }
      ];

      console.log('💾 Saving demo accounts to database...');

      // Insert demo accounts into database
      const { data: insertedAccounts, error: insertError } = await supabase
        .from('bank_accounts')
        .insert(
          demoAccounts.map(account => ({
            user_id: user.id,
            ...account
          }))
        )
        .select();

      if (insertError) {
        console.error('❌ Database insert error:', insertError);
        throw new Error(`Failed to save account data: ${insertError.message}`);
      }

      console.log('✅ Demo accounts saved:', insertedAccounts?.length);

      // Refresh accounts list
      await refetchAccounts();

      setIsLoading(false);
      setError(null);

      console.log('🎉 Demo connection completed successfully!');

    } catch (err: any) {
      console.error('❌ Plaid Link error:', err);
      setError(err.message || 'Failed to connect accounts');
      setIsLoading(false);
    }
  }, [user, refetchAccounts, loadPlaidScript]);

  const connectWithCredentials = useCallback(async (username: string, password: string) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    console.log('Connecting with credentials:', { username, password: '***' });

    setIsLoading(true);
    setError(null);

    try {
      // For demo purposes, simulate connection with any credentials
      await openPlaidLink();
      setShowCredentialsModal(false);
    } catch (err: any) {
      console.error('Credentials connection error:', err);
      setError(err.message || 'Failed to connect with credentials');
      setIsLoading(false);
    }
  }, [user, openPlaidLink]);

  const closeCredentialsModal = useCallback(() => {
    setShowCredentialsModal(false);
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    openPlaidLink,
    connectWithCredentials,
    closeCredentialsModal,
    isLoading,
    error,
    showCredentialsModal,
  };
};