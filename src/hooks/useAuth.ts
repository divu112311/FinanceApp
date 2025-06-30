import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const signOut = useCallback(async () => {
    try {
      console.log('=== SIGNING OUT ===');
      
      // Get current session to check if it exists
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // If there's an error getting the session or no session exists, just clear local state
      if (sessionError || !session) {
        console.log('No active session found or error getting session:', sessionError?.message);
        setUser(null);
        return;
      }

      // Check if the token is expired by examining the exp claim
      if (session.access_token) {
        try {
          // Decode JWT payload (base64 decode the middle part)
          const payload = JSON.parse(atob(session.access_token.split('.')[1]));
          const currentTime = Math.floor(Date.now() / 1000);
          
          // If token is expired, just clear local state without calling server
          if (payload.exp && payload.exp < currentTime) {
            console.log('Token is expired, clearing local state');
            setUser(null);
            return;
          }
        } catch (decodeError) {
          // If we can't decode the token, it's likely invalid, so just clear local state
          console.error('Error decoding token:', decodeError);
          setUser(null);
          return;
        }
      }

      // Attempt to sign out from server
      console.log('Signing out from Supabase');
      const { error } = await supabase.auth.signOut();
      
      // Clear local state regardless of server response
      setUser(null);
      
      // Only log actual unexpected errors
      if (error && !error.message?.includes('session_not_found') && !error.message?.includes('Session from session_id claim in JWT does not exist')) {
        console.warn('Unexpected sign out error:', error.message);
      }
      
    } catch (error: any) {
      // Always clear local state even if there's an error
      setUser(null);
      
      // Only log unexpected errors
      if (!error?.message?.includes('session_not_found') && !error?.message?.includes('Session from session_id claim in JWT does not exist')) {
        console.warn('Sign out error:', error);
      }
    }
  }, []);

  useEffect(() => {
    // Get initial session with error handling for invalid refresh tokens
    const initializeAuth = async () => {
      try {
        console.log('=== INITIALIZING AUTH ===');
        
        // Check if Supabase is configured before attempting to get session
        if (!isSupabaseConfigured) {
          console.warn('Supabase is not configured. Auth functionality will be limited.');
          setLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          // Check if the error is related to invalid refresh token
          if (error.message?.includes('Invalid Refresh Token') || 
              error.message?.includes('refresh_token_not_found')) {
            console.warn('Invalid refresh token, forcing clean logout');
            // Clear invalid session and force clean logout
            await signOut();
            setLoading(false);
            return;
          }
          throw error;
        }
        
        console.log('Session found:', !!session);
        if (session?.user) {
          console.log('User authenticated:', session.user.email);
        }
        
        setUser(session?.user ?? null);
        setLoading(false);
      } catch (error: any) {
        console.warn('Session initialization error:', error.message);
        // Clear user state and stop loading on any session error
        setUser(null);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [signOut]);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    if (!isSupabaseConfigured) {
      setAuthError('Supabase is not configured. Please set up your environment variables.');
      throw new Error('Supabase is not configured');
    }

    setAuthError(null);
    try {
      console.log('=== SIGNING UP ===');
      console.log('Signing up user:', email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        console.error('Sign up error:', error);
        setAuthError(error.message);
        throw error;
      }

      console.log('Sign up successful, creating user profile');
      // Create user profile
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              first_name: firstName,
              last_name: lastName,
              is_active: true,
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
            setAuthError(profileError.message);
            throw profileError;
          }

          console.log('User profile created, creating user_profiles entry');
          // Create user profile entry with default preferences
          const { error: userProfileError } = await supabase
            .from('user_profiles')
            .insert({
              user_id: data.user.id,
              age_range: null,
              income_range: null,
              financial_experience: 'beginner',
              primary_goals: [],
              learning_style: 'visual',
              time_availability: '30min',
              interests: [],
              notification_preferences: {
                email_notifications: true,
                push_notifications: true,
                sms_notifications: false,
                marketing_emails: false,
                goal_reminders: true,
                learning_reminders: true,
                weekly_summary: true
              },
              privacy_settings: {
                profile_visibility: 'private',
                data_sharing: false,
                analytics_tracking: true,
                third_party_sharing: false
              },
              theme_preferences: 'auto'
            });

          if (userProfileError) {
            console.error('Error creating user profile details:', userProfileError);
            setAuthError(userProfileError.message);
            throw userProfileError;
          }

          console.log('User profile details created, creating XP record');
          // Try to create user_xp record first (new schema)
          try {
            await supabase
              .from('user_xp')
              .insert({
                user_id: data.user.id,
                total_xp: 100,
                current_level: 1,
                xp_to_next_level: 0,
                last_xp_earned_at: new Date().toISOString()
              });
            console.log('Created user_xp record');
          } catch (xpError) {
            console.log('Could not create user_xp record, falling back to xp table');
            
            // Fallback to original xp table
            const { error: fallbackXpError } = await supabase
              .from('xp')
              .insert({
                user_id: data.user.id,
                points: 100, // Welcome bonus
                badges: ['Welcome'],
              });

            if (fallbackXpError) {
              console.error('Error creating XP record:', fallbackXpError);
              setAuthError(fallbackXpError.message);
              throw fallbackXpError;
            }
            console.log('Created xp record');
          }
        } catch (profileCreationError) {
          console.error('Error creating user profile:', profileCreationError);
          // Continue with sign-up even if profile creation fails
          // The user can still use the app, and we can try to create the profile later
        }
      }

      return data;
    } catch (error: any) {
      console.error('Sign up process error:', error);
      setAuthError(error.message || 'An error occurred during sign up');
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      setAuthError('Supabase is not configured. Please set up your environment variables.');
      throw new Error('Supabase is not configured');
    }

    setAuthError(null);
    try {
      console.log('=== SIGNING IN ===');
      console.log('Signing in user:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        setAuthError(error.message);
        throw error;
      }

      console.log('Sign in successful');
      return data;
    } catch (error: any) {
      console.error('Sign in error:', error);
      setAuthError(error.message || 'An error occurred during sign in');
      throw error;
    }
  };

  return {
    user,
    loading,
    authError,
    signUp,
    signIn,
    signOut,
  };
};