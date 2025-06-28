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
  };

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };
};