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

    setIsLoading(true);
    setError(null);

    try {
      // Load Plaid script if not already loaded
      await loadPlaidScript();

      console.log('Creating Plaid link token...');

      // Get link token from our edge function
      const { data: linkTokenData, error: linkTokenError } = await supabase.functions.invoke('plaid-link-token', {
        body: { userId: user.id },
      });

      if (linkTokenError) {
        throw new Error(linkTokenError.message || 'Failed to create link token');
      }

      if (!linkTokenData?.link_token) {
        throw new Error('No link token received');
      }

      console.log('Link token created, opening Plaid Link...');

      // Configure Plaid Link
      const config = {
        token: linkTokenData.link_token,
        onSuccess: async (public_token: string, metadata: any) => {
          console.log('Plaid Link success, exchanging token...');
          
          try {
            // Exchange public token for access token
            const { data: exchangeData, error: exchangeError } = await supabase.functions.invoke('plaid-exchange-token', {
              body: {
                publicToken: public_token,
                userId: user.id,
                institution: metadata.institution,
                accounts: metadata.accounts,
              },
            });

            if (exchangeError) {
              throw new Error(exchangeError.message || 'Failed to exchange token');
            }

            console.log('Token exchange successful, accounts connected:', exchangeData.accounts?.length);

            // Refresh accounts list
            await refetchAccounts();

            setIsLoading(false);
          } catch (err: any) {
            console.error('Token exchange error:', err);
            setError(err.message || 'Failed to connect accounts');
            setIsLoading(false);
          }
        },
        onExit: (err: any, metadata: any) => {
          console.log('Plaid Link exit:', err, metadata);
          setIsLoading(false);
          
          if (err) {
            setError(err.error_message || 'Connection cancelled');
          }
        },
        onEvent: (eventName: string, metadata: any) => {
          console.log('Plaid Link event:', eventName, metadata);
        },
        env: import.meta.env.VITE_PLAID_ENV || 'sandbox', // 'sandbox', 'development', or 'production'
      };

      // Create and open Plaid Link
      const handler = window.Plaid.create(config);
      handler.open();

    } catch (err: any) {
      console.error('Plaid Link error:', err);
      setError(err.message || 'Failed to initialize Plaid Link');
      setIsLoading(false);
    }
  }, [user, refetchAccounts, loadPlaidScript]);

  return {
    openPlaidLink,
    isLoading,
    error,
  };
};