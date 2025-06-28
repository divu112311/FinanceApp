import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
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
          full_name: fullName,
        });

      if (profileError) throw profileError;

      // Create user profile entry
      const { error: userProfileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: data.user.id,
          age_range: null,
          income_range: null,
          financial_experience: 'Beginner',
          primary_goals: [],
          learning_style: 'Visual',
          time_availability: '30min',
          interests: [],
        });

      if (userProfileError) throw userProfileError;

      // Create initial XP record
      const { error: xpError } = await supabase
        .from('xp')
        .insert({
          user_id: data.user.id,
          points: 100, // Welcome bonus
          badges: ['Welcome'],
        });

      if (xpError) throw xpError;
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

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        // Check if this is the common 'session_not_found' error
        if (error.message?.includes('session_not_found') || error.message?.includes('Session from session_id claim in JWT does not exist')) {
          // This is expected when the session was already invalid - log as info instead of warning
          console.info('Session was already invalid on server (this is normal):', error.message);
        } else {
          // Log other errors as warnings for debugging
          console.warn('Sign out error (non-critical):', error.message);
        }
      }
    } catch (error: any) {
      // Catch any promise rejections to prevent unhandled promise rejection errors
      if (error?.message?.includes('session_not_found') || error?.message?.includes('Session from session_id claim in JWT does not exist')) {
        console.info('Session was already invalid on server (this is normal):', error.message);
      } else {
        console.warn('Sign out error (non-critical):', error);
      }
    }
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
};