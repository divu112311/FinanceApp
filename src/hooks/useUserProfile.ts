import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string | null;
}

interface UserXP {
  id: string;
  user_id: string | null;
  points: number | null;
  badges: string[] | null;
}

export const useUserProfile = (user: User | null) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [xp, setXP] = useState<UserXP | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setProfile(null);
      setXP(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Fetch user XP
      const { data: xpData, error: xpError } = await supabase
        .from('xp')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (xpError) throw xpError;

      setProfile(profileData);
      setXP(xpData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateXP = async (pointsToAdd: number, newBadge?: string) => {
    if (!user || !xp) return;

    const newPoints = (xp.points || 0) + pointsToAdd;
    const newBadges = newBadge 
      ? [...(xp.badges || []), newBadge]
      : xp.badges;

    const { data, error } = await supabase
      .from('xp')
      .update({
        points: newPoints,
        badges: newBadges,
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating XP:', error);
      return;
    }

    setXP(data);
    return data;
  };

  return {
    profile,
    xp,
    loading,
    updateXP,
    refetch: fetchUserData,
  };
};