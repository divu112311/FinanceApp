import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = useCallback(async () => {
    try {
      // Get current session to check if it exists
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      // If there's an error getting the session or no session exists, just clear local state
      if (sessionError || !session) {
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
            setUser(null);
            return;
          }
        } catch (decodeError) {
          // If we can't decode the token, it's likely invalid, so just clear local state
          setUser(null);
          return;
        }
      }

      // Attempt to sign out from server
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
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          // Check if the error is related to invalid refresh token
          if (error.message?.includes('Invalid Refresh Token') || 
              error.message?.includes('refresh_token_not_found')) {
            // Clear invalid session and force clean logout
            await signOut();
            setLoading(false);
            return;
          }
          throw error;
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
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [signOut]);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
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

    if (error) throw error;

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email,
          first_name: firstName,
          last_name: lastName,
          is_active: true,
        });

      if (profileError) throw profileError;

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

      if (userProfileError) throw userProfileError;

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

        if (fallbackXpError) throw fallbackXpError;
      }
    }

    return data;
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
};