import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface UserXP {
  id: string;
  user_id: string | null;
  points: number | null;
  badges: string[] | null;
}

interface EnhancedUserXP {
  xp_id: string;
  user_id: string;
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  last_xp_earned_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UserBadge {
  user_badge_id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  progress_data: any;
}

interface Badge {
  badge_id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  category: string;
  difficulty_level: string;
  xp_reward: number;
  created_at: string;
}

export const useXP = (user: User | null) => {
  const [xp, setXP] = useState<UserXP | null>(null);
  const [enhancedXP, setEnhancedXP] = useState<EnhancedUserXP | null>(null);
  const [userBadges, setUserBadges] = useState<(UserBadge & Badge)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchXPData();
    } else {
      setXP(null);
      setEnhancedXP(null);
      setUserBadges([]);
      setLoading(false);
    }
  }, [user]);

  const fetchXPData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Skip database operations if Supabase is not configured
      if (!isSupabaseConfigured) {
        console.log('Supabase not configured, using fallback XP data');
        
        // Create fallback XP data
        const fallbackXP = {
          id: 'default',
          user_id: user.id,
          points: 100,
          badges: ['Welcome']
        };
        
        setXP(fallbackXP);
        setLoading(false);
        return;
      }

      // Try to fetch from enhanced user_xp table first
      try {
        const { data: enhancedData, error: enhancedError } = await supabase
          .from('user_xp')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!enhancedError && enhancedData) {
          setEnhancedXP(enhancedData);
          
          // For backward compatibility, create an xp object
          setXP({
            id: enhancedData.xp_id,
            user_id: enhancedData.user_id,
            points: enhancedData.total_xp,
            badges: [] // Will be populated from user_badges
          });
        } else {
          // Fallback to original xp table
          const { data: xpData, error: xpError } = await supabase
            .from('xp')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (xpError) {
            console.log('Error fetching from xp table:', xpError.message);
            
            // Try to create a new XP record
            try {
              const { data: newXpData, error: createError } = await supabase
                .from('xp')
                .insert({
                  user_id: user.id,
                  points: 100,
                  badges: ['Welcome']
                })
                .select()
                .single();
                
              if (createError) {
                console.error('Error creating XP record:', createError);
                throw createError;
              }
              
              setXP(newXpData);
            } catch (createErr) {
              console.error('Failed to create XP record:', createErr);
              // Use fallback XP data
              setXP({
                id: 'default',
                user_id: user.id,
                points: 100,
                badges: ['Welcome']
              });
            }
          } else {
            setXP(xpData || {
              id: 'default',
              user_id: user.id,
              points: 100,
              badges: ['Welcome']
            });
          }
        }
      } catch (error) {
        console.error('Error in enhanced XP fetch:', error);
        // Use fallback XP data
        setXP({
          id: 'default',
          user_id: user.id,
          points: 100,
          badges: ['Welcome']
        });
      }

      // Fetch user badges with badge details
      try {
        const { data: badgesData, error: badgesError } = await supabase
          .from('user_badges')
          .select(`
            *,
            badge:badges(*)
          `)
          .eq('user_id', user.id);

        if (!badgesError && badgesData) {
          // Format the badges data
          const formattedBadges = badgesData.map(item => ({
            ...item,
            ...item.badge
          }));
          
          setUserBadges(formattedBadges);
        }
      } catch (badgesError) {
        console.error('Error fetching badges:', badgesError);
        // Continue without badges
      }
    } catch (error) {
      console.error('Error fetching XP data:', error);
      // Use fallback XP data
      setXP({
        id: 'default',
        user_id: user.id,
        points: 100,
        badges: ['Welcome']
      });
    } finally {
      setLoading(false);
    }
  };

  const updateXP = async (pointsToAdd: number, badgeId?: string) => {
    if (!user) return false;

    try {
      // If we're using fallback XP or Supabase is not configured
      if (!isSupabaseConfigured || (xp && xp.id === 'default')) {
        const newPoints = (xp?.points || 0) + pointsToAdd;
        setXP(prev => prev ? {
          ...prev,
          points: newPoints
        } : {
          id: 'default',
          user_id: user.id,
          points: newPoints,
          badges: ['Welcome']
        });
        return true;
      }

      if (enhancedXP) {
        // Update enhanced user_xp table
        const newTotalXP = enhancedXP.total_xp + pointsToAdd;
        const newLevel = Math.floor(newTotalXP / 100) + 1;
        const xpToNextLevel = (newLevel * 100) - newTotalXP;

        try {
          const { data, error } = await supabase
            .from('user_xp')
            .update({
              total_xp: newTotalXP,
              current_level: newLevel,
              xp_to_next_level: xpToNextLevel,
              last_xp_earned_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) throw error;
          setEnhancedXP(data);
          
          // Update local xp state for backward compatibility
          setXP(prev => prev ? {
            ...prev,
            points: newTotalXP
          } : null);
        } catch (error) {
          console.error('Error updating enhanced XP:', error);
          // Update local state even if database update fails
          const newTotalXP = enhancedXP.total_xp + pointsToAdd;
          setEnhancedXP(prev => prev ? {
            ...prev,
            total_xp: newTotalXP,
            current_level: Math.floor(newTotalXP / 100) + 1,
            xp_to_next_level: ((Math.floor(newTotalXP / 100) + 1) * 100) - newTotalXP,
            last_xp_earned_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } : null);
          
          setXP(prev => prev ? {
            ...prev,
            points: newTotalXP
          } : null);
        }

        // Record user action
        try {
          await recordXPAction(pointsToAdd);
        } catch (actionError) {
          console.error('Error recording XP action:', actionError);
          // Continue even if action recording fails
        }
      } else if (xp) {
        // Fallback to original xp table
        const newPoints = (xp.points || 0) + pointsToAdd;
        
        try {
          const { data, error } = await supabase
            .from('xp')
            .update({
              points: newPoints
            })
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) throw error;
          setXP(data);
        } catch (error) {
          console.error('Error updating XP:', error);
          // Update local state even if database update fails
          setXP(prev => prev ? {
            ...prev,
            points: newPoints
          } : null);
        }
      }

      // If a badge ID is provided, award the badge
      if (badgeId) {
        await awardBadge(badgeId);
      }

      return true;
    } catch (error) {
      console.error('Error updating XP:', error);
      
      // Update local state even if database operations fail
      if (enhancedXP) {
        const newTotalXP = enhancedXP.total_xp + pointsToAdd;
        setEnhancedXP(prev => prev ? {
          ...prev,
          total_xp: newTotalXP,
          current_level: Math.floor(newTotalXP / 100) + 1,
          xp_to_next_level: ((Math.floor(newTotalXP / 100) + 1) * 100) - newTotalXP
        } : null);
      } else if (xp) {
        const newPoints = (xp.points || 0) + pointsToAdd;
        setXP(prev => prev ? {
          ...prev,
          points: newPoints
        } : null);
      }
      
      return false;
    }
  };

  const awardBadge = async (badgeId: string) => {
    if (!user || !isSupabaseConfigured) return false;

    try {
      // Check if user already has this badge
      const { data: existingBadge } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id)
        .eq('badge_id', badgeId)
        .maybeSingle();

      if (existingBadge) {
        console.log('User already has this badge:', badgeId);
        return true;
      }

      // Award the badge
      const { data, error } = await supabase
        .from('user_badges')
        .insert({
          user_id: user.id,
          badge_id: badgeId,
          earned_at: new Date().toISOString(),
          progress_data: {}
        })
        .select(`
          *,
          badge:badges(*)
        `)
        .single();

      if (error) throw error;

      // Format the badge data
      const formattedBadge = {
        ...data,
        ...data.badge
      };

      setUserBadges(prev => [...prev, formattedBadge]);

      // Get badge XP reward
      const { data: badgeData } = await supabase
        .from('badges')
        .select('xp_reward')
        .eq('badge_id', badgeId)
        .single();

      if (badgeData && badgeData.xp_reward) {
        // Award XP for the badge
        await updateXP(badgeData.xp_reward);
      }

      return true;
    } catch (error) {
      console.error('Error awarding badge:', error);
      return false;
    }
  };

  const recordXPAction = async (pointsEarned: number) => {
    if (!user || !isSupabaseConfigured) return;

    try {
      // Check if user_actions table exists
      const { count, error } = await supabase
        .from('user_actions')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log('user_actions table not available:', error);
        return;
      }

      // Record the XP action
      await supabase
        .from('user_actions')
        .insert({
          user_id: user.id,
          action_type: 'xp_earned',
          action_data: {
            points: pointsEarned,
            source: 'app_interaction'
          },
          source: 'user_initiated'
        });
    } catch (error) {
      console.error('Error recording XP action:', error);
    }
  };

  const getBeltRank = (level: number) => {
    if (level >= 50) return { name: "Grand Master", color: "from-yellow-400 to-yellow-600", emoji: "🏆" };
    if (level >= 40) return { name: "Master", color: "from-purple-400 to-purple-600", emoji: "👑" };
    if (level >= 30) return { name: "Black Belt", color: "from-gray-800 to-black", emoji: "🥋" };
    if (level >= 20) return { name: "Brown Belt", color: "from-amber-600 to-amber-800", emoji: "🤎" };
    if (level >= 15) return { name: "Blue Belt", color: "from-blue-400 to-blue-600", emoji: "💙" };
    if (level >= 10) return { name: "Green Belt", color: "from-green-400 to-green-600", emoji: "💚" };
    if (level >= 5) return { name: "Yellow Belt", color: "from-yellow-300 to-yellow-500", emoji: "💛" };
    return { name: "White Belt", color: "from-gray-100 to-gray-300", emoji: "🤍" };
  };

  const getCurrentLevel = () => {
    if (enhancedXP) {
      return enhancedXP.current_level;
    }
    return Math.floor((xp?.points || 0) / 100) + 1;
  };

  const getXPToNextLevel = () => {
    if (enhancedXP) {
      return enhancedXP.xp_to_next_level;
    }
    const currentPoints = xp?.points || 0;
    const currentLevel = Math.floor(currentPoints / 100) + 1;
    return (currentLevel * 100) - currentPoints;
  };

  const getTotalXP = () => {
    if (enhancedXP) {
      return enhancedXP.total_xp;
    }
    return xp?.points || 0;
  };

  return {
    xp,
    enhancedXP,
    userBadges,
    loading,
    updateXP,
    awardBadge,
    getBeltRank,
    getCurrentLevel,
    getXPToNextLevel,
    getTotalXP,
    refetch: fetchXPData
  };
};