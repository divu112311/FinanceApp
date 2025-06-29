import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface UserProfile {
  id: string;
  email: string | null;
  first_name: string;
  last_name: string;
  phone_number: string | null;
  date_of_birth: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ExtendedUserProfile {
  id: string;
  user_id: string | null;
  age_range: string | null;
  income_range: string | null;
  financial_experience: string | null;
  primary_goals: string[] | null;
  learning_style: string | null;
  time_availability: string | null;
  interests: string[] | null;
  notification_preferences: NotificationPreferences | null;
  privacy_settings: PrivacySettings | null;
  theme_preferences: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  marketing_emails: boolean;
  goal_reminders: boolean;
  learning_reminders: boolean;
  weekly_summary: boolean;
}

interface PrivacySettings {
  profile_visibility: 'public' | 'private' | 'friends';
  data_sharing: boolean;
  analytics_tracking: boolean;
  third_party_sharing: boolean;
}

interface UserXP {
  id: string;
  user_id: string | null;
  points: number | null;
  badges: string[] | null;
}

export const useUserProfile = (user: User | null) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [extendedProfile, setExtendedProfile] = useState<ExtendedUserProfile | null>(null);
  const [xp, setXP] = useState<UserXP | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setProfile(null);
      setExtendedProfile(null);
      setXP(null);
      setLoading(false);
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      console.log('=== FETCHING USER PROFILE DATA ===');
      console.log('User ID:', user.id);
      console.log('User email from auth:', user.email);
      console.log('User metadata:', user.user_metadata);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      console.log('Profile query result:', { profileData, profileError });

      if (profileError) {
        console.error('Profile fetch error:', profileError);
      }

      // If no profile exists, create one from auth metadata
      if (!profileData && user.email) {
        console.log('No profile found, creating from auth metadata...');
        
        const firstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || 'User';
        const lastName = user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';
        
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            first_name: firstName,
            last_name: lastName,
            is_active: true,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
        } else {
          console.log('Created new profile:', newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(profileData);
      }

      // Fetch extended user profile
      const { data: extendedProfileData, error: extendedProfileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (extendedProfileError) {
        console.error('Extended profile fetch error:', extendedProfileError);
      } else {
        setExtendedProfile(extendedProfileData);
      }

      // Fetch user XP with better error handling
      try {
        const { data: xpData, error: xpError } = await supabase
          .from('xp')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (xpError) {
          console.error('XP fetch error:', xpError);
          // If XP table doesn't exist or there's an error, create a default XP record
          console.log('Attempting to create default XP record...');
          
          const { data: newXpData, error: createXpError } = await supabase
            .from('xp')
            .insert({
              user_id: user.id,
              points: 0,
              badges: []
            })
            .select()
            .single();

          if (createXpError) {
            console.error('Error creating XP record:', createXpError);
            // Set a default XP object if we can't create one in the database
            setXP({
              id: 'default',
              user_id: user.id,
              points: 0,
              badges: []
            });
          } else {
            console.log('Created new XP record:', newXpData);
            setXP(newXpData);
          }
        } else if (!xpData) {
          // No XP record exists, create one
          console.log('No XP record found, creating one...');
          
          const { data: newXpData, error: createXpError } = await supabase
            .from('xp')
            .insert({
              user_id: user.id,
              points: 0,
              badges: []
            })
            .select()
            .single();

          if (createXpError) {
            console.error('Error creating XP record:', createXpError);
            // Set a default XP object if we can't create one in the database
            setXP({
              id: 'default',
              user_id: user.id,
              points: 0,
              badges: []
            });
          } else {
            console.log('Created new XP record:', newXpData);
            setXP(newXpData);
          }
        } else {
          setXP(xpData);
        }
      } catch (xpFetchError) {
        console.error('XP fetch operation failed:', xpFetchError);
        // Set a default XP object as fallback
        setXP({
          id: 'default',
          user_id: user.id,
          points: 0,
          badges: []
        });
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;

    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return;
    }

    setProfile(data);
    return data;
  };

  const updateExtendedProfile = async (updates: Partial<ExtendedUserProfile>) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        ...updates,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating extended profile:', error);
      return;
    }

    setExtendedProfile(data);
    return data;
  };

  const updateNotificationPreferences = async (preferences: Partial<NotificationPreferences>) => {
    if (!user) return;

    const currentPreferences = extendedProfile?.notification_preferences || {};
    const updatedPreferences = { ...currentPreferences, ...preferences };

    return updateExtendedProfile({
      notification_preferences: updatedPreferences
    });
  };

  const updatePrivacySettings = async (settings: Partial<PrivacySettings>) => {
    if (!user) return;

    const currentSettings = extendedProfile?.privacy_settings || {};
    const updatedSettings = { ...currentSettings, ...settings };

    return updateExtendedProfile({
      privacy_settings: updatedSettings
    });
  };

  const updateThemePreference = async (theme: string) => {
    if (!user) return;

    return updateExtendedProfile({
      theme_preferences: theme
    });
  };

  const updateXP = async (pointsToAdd: number, newBadge?: string) => {
    if (!user || !xp) return;

    const newPoints = (xp.points || 0) + pointsToAdd;
    const newBadges = newBadge 
      ? [...(xp.badges || []), newBadge]
      : xp.badges;

    // If we have a default XP object (not in database), just update local state
    if (xp.id === 'default') {
      const updatedXP = {
        ...xp,
        points: newPoints,
        badges: newBadges
      };
      setXP(updatedXP);
      return updatedXP;
    }

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

  const getFullName = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name} ${profile.last_name}`.trim();
    }
    if (profile?.first_name) {
      return profile.first_name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.user_metadata?.first_name) {
      const lastName = user.user_metadata?.last_name || '';
      return `${user.user_metadata.first_name} ${lastName}`.trim();
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getDisplayName = () => {
    if (profile?.first_name) {
      return profile.first_name;
    }
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name;
    }
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0];
    }
    return user?.email?.split('@')[0] || 'User';
  };

  const getInitials = () => {
    const fullName = getFullName();
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  };

  return {
    profile,
    extendedProfile,
    xp,
    loading,
    updateProfile,
    updateExtendedProfile,
    updateNotificationPreferences,
    updatePrivacySettings,
    updateThemePreference,
    updateXP,
    getFullName,
    getDisplayName,
    getInitials,
    refetch: fetchUserData,
  };
};