import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserData();
    } else {
      setProfile(null);
      setExtendedProfile(null);
      setXP(null);
      setLoading(false);
      setError(null);
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      console.log('=== FETCHING USER PROFILE DATA ===');
      console.log('User ID:', user.id);
      console.log('User email from auth:', user.email);
      console.log('User metadata:', user.user_metadata);

      // Check if Supabase is configured before attempting to fetch data
      if (!isSupabaseConfigured) {
        console.warn('Supabase is not configured. Using default profile data.');
        
        // Set default profile data for development/testing
        setProfile({
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || 'User',
          last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          phone_number: null,
          date_of_birth: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: null
        });
        
        setExtendedProfile({
          id: crypto.randomUUID(),
          user_id: user.id,
          age_range: null,
          income_range: null,
          financial_experience: 'Beginner',
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
          theme_preferences: 'auto',
          created_at: new Date().toISOString(),
          updated_at: null
        });
        
        setXP({
          id: crypto.randomUUID(),
          user_id: user.id,
          points: 100,
          badges: ['Welcome']
        });
        
        setLoading(false);
        return;
      }

      // Fetch user profile with error handling
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        console.log('Profile query result:', { 
          hasData: !!profileData, 
          error: profileError?.message || 'none' 
        });

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          throw profileError;
        }

        // If no profile exists, create one from auth metadata
        if (!profileData && user.email) {
          console.log('No profile found, creating from auth metadata...');
          
          const firstName = user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || 'User';
          const lastName = user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '';
          
          try {
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
              console.error('Error creating user profile:', createError);
              // Use fallback profile
              setProfile({
                id: user.id,
                email: user.email,
                first_name: firstName,
                last_name: lastName,
                phone_number: null,
                date_of_birth: null,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: null
              });
            } else {
              console.log('Created new profile:', newProfile);
              setProfile(newProfile);
            }
          } catch (err) {
            console.error('Error in profile creation:', err);
            // Use fallback profile
            setProfile({
              id: user.id,
              email: user.email,
              first_name: firstName,
              last_name: lastName,
              phone_number: null,
              date_of_birth: null,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: null
            });
          }
        } else {
          setProfile(profileData);
        }
      } catch (profileErr) {
        console.error('Error fetching user profile:', profileErr);
        // Set fallback profile
        setProfile({
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || 'User',
          last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          phone_number: null,
          date_of_birth: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: null
        });
      }

      // Fetch extended user profile with error handling
      try {
        const { data: extendedProfileData, error: extendedProfileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        console.log('Extended profile query result:', { 
          hasData: !!extendedProfileData, 
          error: extendedProfileError?.message || 'none' 
        });

        if (extendedProfileError) {
          console.error('Extended profile fetch error:', extendedProfileError);
          throw extendedProfileError;
        }

        if (!extendedProfileData) {
          // Create default extended profile
          try {
            const { data: newExtendedProfile, error: createExtendedError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: user.id,
                financial_experience: 'Beginner',
                learning_style: 'visual',
                time_availability: '30min',
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
              })
              .select()
              .single();

            if (createExtendedError) {
              console.error('Error creating extended profile:', createExtendedError);
              // Use fallback extended profile
              setExtendedProfile({
                id: crypto.randomUUID(),
                user_id: user.id,
                age_range: null,
                income_range: null,
                financial_experience: 'Beginner',
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
                theme_preferences: 'auto',
                created_at: new Date().toISOString(),
                updated_at: null
              });
            } else {
              console.log('Created new extended profile:', newExtendedProfile);
              setExtendedProfile(newExtendedProfile);
            }
          } catch (createErr) {
            console.error('Error creating extended profile:', createErr);
            // Use fallback extended profile
            setExtendedProfile({
              id: crypto.randomUUID(),
              user_id: user.id,
              age_range: null,
              income_range: null,
              financial_experience: 'Beginner',
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
              theme_preferences: 'auto',
              created_at: new Date().toISOString(),
              updated_at: null
            });
          }
        } else {
          setExtendedProfile(extendedProfileData);
        }
      } catch (extendedErr) {
        console.error('Error fetching extended profile:', extendedErr);
        // Use fallback extended profile
        setExtendedProfile({
          id: crypto.randomUUID(),
          user_id: user.id,
          age_range: null,
          income_range: null,
          financial_experience: 'Beginner',
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
          theme_preferences: 'auto',
          created_at: new Date().toISOString(),
          updated_at: null
        });
      }

      // Fetch user XP with error handling
      try {
        // Try to fetch from enhanced user_xp table first
        const { data: enhancedXpData, error: enhancedXpError } = await supabase
          .from('user_xp')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
          
        console.log('Enhanced XP query result:', { 
          hasData: !!enhancedXpData, 
          error: enhancedXpError?.message || 'none' 
        });

        if (!enhancedXpError && enhancedXpData) {
          // Convert to compatible format for backward compatibility
          setXP({
            id: enhancedXpData.xp_id,
            user_id: enhancedXpData.user_id,
            points: enhancedXpData.total_xp,
            badges: []
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
            console.error('XP fetch error:', xpError);
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
                // Use fallback XP data
                setXP({
                  id: crypto.randomUUID(),
                  user_id: user.id,
                  points: 100,
                  badges: ['Welcome']
                });
              } else {
                setXP(newXP);
              }
            } catch (createXPErr) {
              console.error('Error creating XP record:', createXPErr);
              // Use fallback XP data
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
      } catch (xpErr) {
        console.error('Error fetching XP data:', xpErr);
        // Use fallback XP data
        setXP({
          id: crypto.randomUUID(),
          user_id: user.id,
          points: 100,
          badges: ['Welcome']
        });
      }

    } catch (error: any) {
      console.error('Error fetching user data:', error);
      setError(error.message || 'Failed to fetch user data');
      
      // Set fallback data for all profile components
      setProfile({
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || 'User',
        last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        phone_number: null,
        date_of_birth: null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: null
      });
      
      setExtendedProfile({
        id: crypto.randomUUID(),
        user_id: user.id,
        age_range: null,
        income_range: null,
        financial_experience: 'Beginner',
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
        theme_preferences: 'auto',
        created_at: new Date().toISOString(),
        updated_at: null
      });
      
      setXP({
        id: crypto.randomUUID(),
        user_id: user.id,
        points: 100,
        badges: ['Welcome']
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return null;

    try {
      if (!isSupabaseConfigured) {
        // Update local state only if Supabase is not configured
        setProfile(prev => prev ? { ...prev, ...updates } : null);
        return { ...profile, ...updates };
      }

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
        // Update local state even if DB update fails
        setProfile(prev => prev ? { ...prev, ...updates } : null);
        return { ...profile, ...updates };
      }

      setProfile(data);
      return data;
    } catch (error) {
      console.error('Error in updateProfile:', error);
      // Update local state even if DB update fails
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      return { ...profile, ...updates };
    }
  };

  const updateExtendedProfile = async (updates: Partial<ExtendedUserProfile>) => {
    if (!user) return null;

    try {
      if (!isSupabaseConfigured) {
        // Update local state only if Supabase is not configured
        setExtendedProfile(prev => prev ? { ...prev, ...updates } : null);
        return extendedProfile ? { ...extendedProfile, ...updates } : null;
      }

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
        // Update local state even if DB update fails
        setExtendedProfile(prev => prev ? { ...prev, ...updates } : null);
        return extendedProfile ? { ...extendedProfile, ...updates } : null;
      }

      setExtendedProfile(data);
      return data;
    } catch (error) {
      console.error('Error in updateExtendedProfile:', error);
      // Update local state even if DB update fails
      setExtendedProfile(prev => prev ? { ...prev, ...updates } : null);
      return extendedProfile ? { ...extendedProfile, ...updates } : null;
    }
  };

  const updateNotificationPreferences = async (preferences: Partial<NotificationPreferences>) => {
    if (!user) return null;

    const currentPreferences = extendedProfile?.notification_preferences || {};
    const updatedPreferences = { ...currentPreferences, ...preferences };

    return updateExtendedProfile({
      notification_preferences: updatedPreferences
    });
  };

  const updatePrivacySettings = async (settings: Partial<PrivacySettings>) => {
    if (!user) return null;

    const currentSettings = extendedProfile?.privacy_settings || {};
    const updatedSettings = { ...currentSettings, ...settings };

    return updateExtendedProfile({
      privacy_settings: updatedSettings
    });
  };

  const updateThemePreference = async (theme: string) => {
    if (!user) return null;

    return updateExtendedProfile({
      theme_preferences: theme
    });
  };

  const updateXP = async (pointsToAdd: number, newBadge?: string) => {
    if (!user || !xp) return null;

    try {
      const newPoints = (xp.points || 0) + pointsToAdd;
      const newBadges = newBadge 
        ? [...(xp.badges || []), newBadge]
        : xp.badges;

      if (!isSupabaseConfigured) {
        // Update local state only if Supabase is not configured
        setXP(prev => prev ? {
          ...prev,
          points: newPoints,
          badges: newBadges
        } : null);
        return;
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
        // Update local state even if DB update fails
        setXP(prev => prev ? {
          ...prev,
          points: newPoints,
          badges: newBadges
        } : null);
        return;
      }

      setXP(data);
      return data;
    } catch (error) {
      console.error('Error in updateXP:', error);
      // Update local state even if DB update fails
      setXP(prev => prev ? {
        ...prev,
        points: (xp.points || 0) + pointsToAdd,
        badges: newBadge ? [...(xp.badges || []), newBadge] : xp.badges
      } : null);
      return null;
    }
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
    error,
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