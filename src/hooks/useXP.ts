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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchXPData();
    } else {
      setXP(null);
      setEnhancedXP(null);
      setUserBadges([]);
      setLoading(false);
      setError(null);
    }
  }, [user]);

  const fetchXPData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      console.log('=== FETCHING XP DATA ===');
      console.log('User ID:', user.id);

      // Check if Supabase is configured
      if (!isSupabaseConfigured) {
        console.warn('Supabase is not configured. Using default XP data.');
        
        // Set default XP data for development/testing
        setXP({
          id: crypto.randomUUID(),
          user_id: user.id,
          points: 100,
          badges: ['Welcome']
        });
        
        setEnhancedXP({
          xp_id: crypto.randomUUID(),
          user_id: user.id,
          total_xp: 100,
          current_level: 2,
          xp_to_next_level: 100,
          last_xp_earned_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        setUserBadges([]);
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

        console.log('Enhanced XP query result:', { 
          hasData: !!enhancedData, 
          error: enhancedError?.message || 'none' 
        });

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

          console.log('Original XP query result:', { 
            hasData: !!xpData, 
            error: xpError?.message || 'none' 
          });

          if (xpError) {
            console.warn('XP fetch error:', xpError);
            
            // Try to create XP record
            try {
              const { data: newXP, error: createXPError } = await supabase
                .from('xp')
                .insert({
                  user_id: user.id,
                  points: 100,
                  badges: ['Welcome']
                })
                .select()
                .single();

              if (createXPError) {
                console.error('Error creating XP record:', createXPError);
                throw createXPError;
              }

              setXP(newXP);
            } catch (createError) {
              console.error('Error creating XP record:', createError);
              // Use default XP data
              setXP({
                id: crypto.randomUUID(),
                user_id: user.id,
                points: 100,
                badges: ['Welcome']
              });
            }
          } else {
            setXP(xpData || {
              id: crypto.randomUUID(),
              user_id: user.id,
              points: 100,
              badges: ['Welcome']
            });
          }
        }
      } catch (xpError) {
        console.error('Error fetching XP data:', xpError);
        // Use default XP data
        setXP({
          id: crypto.randomUUID(),
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

        console.log('User badges query result:', { 
          hasData: !!badgesData, 
          count: badgesData?.length || 0,
          error: badgesError?.message || 'none' 
        });

        if (!badgesError && badgesData) {
          // Format the badges data
          const formattedBadges = badgesData.map(item => ({
            ...item,
            ...item.badge
          }));
          
          setUserBadges(formattedBadges);
        } else {
          setUserBadges([]);
        }
      } catch (badgesError) {
        console.error('Error fetching badges:', badgesError);
        setUserBadges([]);
      }
    } catch (error: any) {
      console.error('Error fetching XP data:', error);
      setError(error.message || 'Failed to fetch XP data');
      
      // Use default XP data
      setXP({
        id: crypto.randomUUID(),
        user_id: user.id,
        points: 100,
        badges: ['Welcome']
      });
      
      setUserBadges([]);
    } finally {
      setLoading(false);
    }
  };

  const updateXP = async (pointsToAdd: number, badgeId?: string) => {
    if (!user) return;

    try {
      console.log('=== UPDATING XP ===');
      console.log('Points to add:', pointsToAdd);
      console.log('Badge ID:', badgeId || 'none');

      if (enhancedXP) {
        // Update enhanced user_xp table
        const newTotalXP = enhancedXP.total_xp + pointsToAdd;
        const newLevel = Math.floor(newTotalXP / 100) + 1;
        const xpToNextLevel = (newLevel * 100) - newTotalXP;

        if (!isSupabaseConfigured) {
          // Update local state only
          setEnhancedXP(prev => prev ? {
            ...prev,
            total_xp: newTotalXP,
            current_level: newLevel,
            xp_to_next_level: xpToNextLevel,
            last_xp_earned_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } : null);
          
          setXP(prev => prev ? {
            ...prev,
            points: newTotalXP
          } : null);
          
          return true;
        }

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

          if (error) {
            console.warn('Error updating user_xp:', error);
            // Update local state even if DB update fails
            setEnhancedXP(prev => prev ? {
              ...prev,
              total_xp: newTotalXP,
              current_level: newLevel,
              xp_to_next_level: xpToNextLevel,
              last_xp_earned_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } : null);
          } else {
            setEnhancedXP(data);
          }
          
          // Update local xp state for backward compatibility
          setXP(prev => prev ? {
            ...prev,
            points: newTotalXP
          } : null);
        } catch (error) {
          console.error('Error updating user_xp:', error);
          // Update local state even if DB update fails
          setEnhancedXP(prev => prev ? {
            ...prev,
            total_xp: newTotalXP,
            current_level: newLevel,
            xp_to_next_level: xpToNextLevel,
            last_xp_earned_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } : null);
          
          setXP(prev => prev ? {
            ...prev,
            points: newTotalXP
          } : null);
        }
      } else if (xp) {
        // Fallback to original xp table
        const newPoints = (xp.points || 0) + pointsToAdd;
        
        if (!isSupabaseConfigured) {
          // Update local state only
          setXP(prev => prev ? {
            ...prev,
            points: newPoints
          } : null);
          
          return true;
        }
        
        try {
          const { data, error } = await supabase
            .from('xp')
            .update({
              points: newPoints
            })
            .eq('user_id', user.id)
            .select()
            .single();

          if (error) {
            console.warn('Error updating xp:', error);
            // Update local state even if DB update fails
            setXP(prev => prev ? {
              ...prev,
              points: newPoints
            } : null);
          } else {
            setXP(data);
          }
        } catch (error) {
          console.error('Error updating xp:', error);
          // Update local state even if DB update fails
          setXP(prev => prev ? {
            ...prev,
            points: newPoints
          } : null);
        }
      } else {
        // No XP record exists, create one
        const newXP = {
          user_id: user.id,
          points: pointsToAdd,
          badges: ['Welcome']
        };
        
        if (!isSupabaseConfigured) {
          // Update local state only
          setXP({
            id: crypto.randomUUID(),
            ...newXP
          });
          
          return true;
        }
        
        try {
          // Try to create in user_xp first
          const { data: newEnhancedXP, error: newXPError } = await supabase
            .from('user_xp')
            .insert({
              user_id: user.id,
              total_xp: pointsToAdd,
              current_level: Math.floor(pointsToAdd / 100) + 1,
              xp_to_next_level: 100 - (pointsToAdd % 100),
              last_xp_earned_at: new Date().toISOString()
            })
            .select()
            .single();
            
          if (newXPError) {
            console.warn('Error creating user_xp:', newXPError);
            
            // Fallback to original xp table
            const { data: fallbackXP, error: fallbackError } = await supabase
              .from('xp')
              .insert(newXP)
              .select()
              .single();
              
            if (fallbackError) {
              console.error('Error creating xp:', fallbackError);
              // Use local state only
              setXP({
                id: crypto.randomUUID(),
                ...newXP
              });
            } else {
              setXP(fallbackXP);
            }
          } else {
            setEnhancedXP(newEnhancedXP);
            setXP({
              id: newEnhancedXP.xp_id,
              user_id: newEnhancedXP.user_id,
              points: newEnhancedXP.total_xp,
              badges: []
            });
          }
        } catch (error) {
          console.error('Error creating XP record:', error);
          // Use local state only
          setXP({
            id: crypto.randomUUID(),
            ...newXP
          });
        }
      }

      // If a badge ID is provided, award the badge
      if (badgeId) {
        await awardBadge(badgeId);
      }

      return true;
    } catch (error) {
      console.error('Error updating XP:', error);
      
      // Update local state even if everything fails
      if (enhancedXP) {
        const newTotalXP = enhancedXP.total_xp + pointsToAdd;
        const newLevel = Math.floor(newTotalXP / 100) + 1;
        const xpToNextLevel = (newLevel * 100) - newTotalXP;
        
        setEnhancedXP(prev => prev ? {
          ...prev,
          total_xp: newTotalXP,
          current_level: newLevel,
          xp_to_next_level: xpToNextLevel,
          last_xp_earned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } : null);
      }
      
      if (xp) {
        setXP(prev => prev ? {
          ...prev,
          points: (prev.points || 0) + pointsToAdd
        } : null);
      } else {
        setXP({
          id: crypto.randomUUID(),
          user_id: user.id,
          points: pointsToAdd,
          badges: []
        });
      }
      
      return false;
    }
  };

  const awardBadge = async (badgeId: string) => {
    if (!user) return false;

    try {
      console.log('=== AWARDING BADGE ===');
      console.log('Badge ID:', badgeId);

      if (!isSupabaseConfigured) {
        console.warn('Supabase not configured, skipping badge award');
        return false;
      }

      // Check if user already has this badge
      const { data: existingBadge, error: checkError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id)
        .eq('badge_id', badgeId)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking existing badge:', checkError);
        return false;
      }

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

      if (error) {
        console.error('Error awarding badge:', error);
        return false;
      }

      // Format the badge data
      const formattedBadge = {
        ...data,
        ...data.badge
      };

      setUserBadges(prev => [...prev, formattedBadge]);

      // Get badge XP reward
      const { data: badgeData, error: badgeError } = await supabase
        .from('badges')
        .select('xp_reward')
        .eq('badge_id', badgeId)
        .single();

      if (badgeError) {
        console.error('Error fetching badge data:', badgeError);
        return true;
      }

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
    if (!user || !isSupabaseConfigured) return false;

    try {
      // Check if user_actions table exists
      const { count, error } = await supabase
        .from('user_actions')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log('user_actions table not available:', error);
        return false;
      }

      // Record the XP action
      const { error: actionError } = await supabase
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

      if (actionError) {
        console.error('Error recording XP action:', actionError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error recording XP action:', error);
      return false;
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
    error,
    updateXP,
    awardBadge,
    getBeltRank,
    getCurrentLevel,
    getXPToNextLevel,
    getTotalXP,
    refetch: fetchXPData
  };
};