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

      console.log('🔗 Creating Plaid link token...');

      // Get link token from our edge function
      const { data: linkTokenData, error: linkTokenError } = await supabase.functions.invoke('plaid-link-token', {
        body: { userId: user.id },
      });

      console.log('Link token response:', { 
        hasData: !!linkTokenData, 
        hasError: !!linkTokenError,
        errorMessage: linkTokenError?.message 
      });

      if (linkTokenError) {
        console.error('Link token error:', linkTokenError);
        throw new Error(linkTokenError.message || 'Failed to create link token');
      }

      if (!linkTokenData?.link_token) {
        console.error('No link token in response:', linkTokenData);
        throw new Error('No link token received');
      }

      console.log('Link token created successfully, opening Plaid Link...');

      // Configure Plaid Link
      const config = {
        token: linkTokenData.link_token,
        onSuccess: async (public_token: string, metadata: any) => {
          console.log('Plaid Link success, exchanging token for user:', user.id);
          console.log('Metadata:', metadata);
          
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

            console.log('Exchange response:', { 
              hasData: !!exchangeData, 
              hasError: !!exchangeError,
              errorMessage: exchangeError?.message 
            });

            if (exchangeError) {
              console.error('Token exchange error:', exchangeError);
              throw new Error(exchangeError.message || 'Failed to exchange token');
            }

            if (!exchangeData?.success) {
              console.error('Exchange failed:', exchangeData);
              throw new Error('Token exchange was not successful');
            }

            console.log('Token exchange successful, accounts connected:', exchangeData.accounts?.length);

            // Refresh accounts list
            await refetchAccounts();

            setIsLoading(false);
            setShowCredentialsModal(false);
          } catch (err: any) {
            console.error('Token exchange error:', err);
            setError(err.message || 'Failed to connect accounts');
            setIsLoading(false);
          }
        },
        onExit: (err: any, metadata: any) => {
          console.log('Plaid Link exit:', { error: err, metadata });
          setIsLoading(false);
          
          if (err) {
            console.error('Plaid Link exit error:', err);
            setError(err.error_message || 'Connection cancelled');
          }
        },
        onEvent: (eventName: string, metadata: any) => {
          console.log('Plaid Link event:', eventName, metadata);
        },
        env: import.meta.env.VITE_PLAID_ENV || 'sandbox',
      };

      // Create and open Plaid Link
      const handler = window.Plaid.create(config);
      handler.open();

    } catch (err: any) {
      console.error('Plaid Link initialization error:', err);
      setError(err.message || 'Failed to initialize Plaid Link');
      setIsLoading(false);
      
      // If there's an error with the real Plaid integration, show the credentials modal as fallback
      setShowCredentialsModal(true);
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
      // Load Plaid script if not already loaded
      await loadPlaidScript();

      console.log('Creating Plaid link token with custom credentials...');

      // Get link token from our edge function with custom credentials
      const { data: linkTokenData, error: linkTokenError } = await supabase.functions.invoke('plaid-link-token', {
        body: { 
          userId: user.id,
          username: username,
          password: password
        },
      });

      console.log('Link token response:', { 
        hasData: !!linkTokenData, 
        hasError: !!linkTokenError,
        errorMessage: linkTokenError?.message 
      });

      if (linkTokenError) {
        console.error('Link token error:', linkTokenError);
        throw new Error(linkTokenError.message || 'Failed to create link token');
      }

      if (!linkTokenData?.link_token) {
        console.error('No link token in response:', linkTokenData);
        throw new Error('No link token received');
      }

      console.log('Link token created successfully, opening Plaid Link...');

      // Configure Plaid Link
      const config = {
        token: linkTokenData.link_token,
        onSuccess: async (public_token: string, metadata: any) => {
          console.log('Plaid Link success, exchanging token for user:', user.id);
          console.log('Metadata:', metadata);
          
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

            console.log('Exchange response:', { 
              hasData: !!exchangeData, 
              hasError: !!exchangeError,
              errorMessage: exchangeError?.message 
            });

            if (exchangeError) {
              console.error('Token exchange error:', exchangeError);
              throw new Error(exchangeError.message || 'Failed to exchange token');
            }

            if (!exchangeData?.success) {
              console.error('Exchange failed:', exchangeData);
              throw new Error('Token exchange was not successful');
            }

            console.log('Token exchange successful, accounts connected:', exchangeData.accounts?.length);

            // Refresh accounts list
            await refetchAccounts();

            setIsLoading(false);
            setShowCredentialsModal(false);
          } catch (err: any) {
            console.error('Token exchange error:', err);
            setError(err.message || 'Failed to connect accounts');
            setIsLoading(false);
          }
        },
        onExit: (err: any, metadata: any) => {
          console.log('Plaid Link exit:', { error: err, metadata });
          setIsLoading(false);
          
          if (err) {
            console.error('Plaid Link exit error:', err);
            setError(err.error_message || 'Connection cancelled');
          }
        },
        onEvent: (eventName: string, metadata: any) => {
          console.log('Plaid Link event:', eventName, metadata);
        },
        env: import.meta.env.VITE_PLAID_ENV || 'sandbox',
      };

      // Create and open Plaid Link
      const handler = window.Plaid.create(config);
      handler.open();

    } catch (err: any) {
      console.error('Plaid Link initialization error:', err);
      setError(err.message || 'Failed to initialize Plaid Link');
      setIsLoading(false);
    }
  }, [user, refetchAccounts, loadPlaidScript]);

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