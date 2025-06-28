import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Bell, 
  Shield, 
  Palette, 
  Save,
  Edit3,
  Check,
  X,
  Settings
} from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useUserProfile } from '../hooks/useUserProfile';

interface UserProfileSettingsProps {
  user: SupabaseUser;
  onClose?: () => void;
}

const UserProfileSettings: React.FC<UserProfileSettingsProps> = ({ user, onClose }) => {
  const { 
    profile, 
    extendedProfile, 
    loading, 
    updateProfile, 
    updateExtendedProfile,
    updateNotificationPreferences,
    updatePrivacySettings,
    updateThemePreference,
    getFullName 
  } = useUserProfile(user);

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'privacy' | 'theme'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    date_of_birth: '',
    age_range: '',
    income_range: '',
    financial_experience: '',
    learning_style: '',
    time_availability: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    marketing_emails: false,
    goal_reminders: true,
    learning_reminders: true,
    weekly_summary: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    profile_visibility: 'private' as 'public' | 'private' | 'friends',
    data_sharing: false,
    analytics_tracking: true,
    third_party_sharing: false
  });

  const [themePreference, setThemePreference] = useState('auto');

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        phone_number: profile.phone_number || '',
        date_of_birth: profile.date_of_birth || '',
        age_range: extendedProfile?.age_range || '',
        income_range: extendedProfile?.income_range || '',
        financial_experience: extendedProfile?.financial_experience || '',
        learning_style: extendedProfile?.learning_style || '',
        time_availability: extendedProfile?.time_availability || ''
      });
    }

    if (extendedProfile?.notification_preferences) {
      setNotificationSettings({
        ...notificationSettings,
        ...extendedProfile.notification_preferences
      });
    }

    if (extendedProfile?.privacy_settings) {
      setPrivacySettings({
        ...privacySettings,
        ...extendedProfile.privacy_settings
      });
    }

    if (extendedProfile?.theme_preferences) {
      setThemePreference(extendedProfile.theme_preferences);
    }
  }, [profile, extendedProfile]);

  const handleSaveProfile = async () => {
    try {
      // Update basic profile
      await updateProfile({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone_number: formData.phone_number,
        date_of_birth: formData.date_of_birth
      });

      // Update extended profile
      await updateExtendedProfile({
        age_range: formData.age_range,
        income_range: formData.income_range,
        financial_experience: formData.financial_experience,
        learning_style: formData.learning_style,
        time_availability: formData.time_availability
      });

      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await updateNotificationPreferences(notificationSettings);
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  };

  const handleSavePrivacy = async () => {
    try {
      await updatePrivacySettings(privacySettings);
    } catch (error) {
      console.error('Error saving privacy settings:', error);
    }
  };

  const handleSaveTheme = async () => {
    try {
      await updateThemePreference(themePreference);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-[#2A6F68] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'theme', label: 'Theme', icon: Palette }
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2A6F68] to-[#B76E79] p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Account Settings</h2>
              <p className="text-white/80">Manage your profile and preferences</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 border-r border-gray-200">
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[#2A6F68] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#333333]">Profile Information</h3>
                  <button
                    onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                    className="flex items-center space-x-2 bg-[#2A6F68] text-white px-4 py-2 rounded-lg hover:bg-[#235A54] transition-colors"
                  >
                    {isEditing ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                    <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Financial Experience
                    </label>
                    <select
                      value={formData.financial_experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, financial_experience: e.target.value }))}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent disabled:bg-gray-50"
                    >
                      <option value="">Select experience level</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#333333]">Notification Preferences</h3>
                  <button
                    onClick={handleSaveNotifications}
                    className="flex items-center space-x-2 bg-[#2A6F68] text-white px-4 py-2 rounded-lg hover:bg-[#235A54] transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {Object.entries(notificationSettings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 capitalize">
                          {key.replace(/_/g, ' ')}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {getNotificationDescription(key)}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNotificationSettings(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2A6F68]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2A6F68]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div
                key="privacy"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#333333]">Privacy Settings</h3>
                  <button
                    onClick={handleSavePrivacy}
                    className="flex items-center space-x-2 bg-[#2A6F68] text-white px-4 py-2 rounded-lg hover:bg-[#235A54] transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Profile Visibility
                    </label>
                    <select
                      value={privacySettings.profile_visibility}
                      onChange={(e) => setPrivacySettings(prev => ({
                        ...prev,
                        profile_visibility: e.target.value as 'public' | 'private' | 'friends'
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2A6F68] focus:border-transparent"
                    >
                      <option value="private">Private</option>
                      <option value="friends">Friends Only</option>
                      <option value="public">Public</option>
                    </select>
                  </div>

                  {Object.entries(privacySettings).filter(([key]) => key !== 'profile_visibility').map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900 capitalize">
                          {key.replace(/_/g, ' ')}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {getPrivacyDescription(key)}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setPrivacySettings(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#2A6F68]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2A6F68]"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'theme' && (
              <motion.div
                key="theme"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[#333333]">Theme Preferences</h3>
                  <button
                    onClick={handleSaveTheme}
                    className="flex items-center space-x-2 bg-[#2A6F68] text-white px-4 py-2 rounded-lg hover:bg-[#235A54] transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['light', 'dark', 'auto'].map((theme) => (
                    <div
                      key={theme}
                      onClick={() => setThemePreference(theme)}
                      className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                        themePreference === theme
                          ? 'border-[#2A6F68] bg-[#2A6F68]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`w-16 h-16 mx-auto mb-4 rounded-lg ${
                          theme === 'light' ? 'bg-white border-2 border-gray-200' :
                          theme === 'dark' ? 'bg-gray-800' :
                          'bg-gradient-to-br from-white to-gray-800'
                        }`}></div>
                        <h4 className="font-medium text-gray-900 capitalize">{theme}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {theme === 'auto' ? 'System preference' : `${theme} mode`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const getNotificationDescription = (key: string): string => {
  const descriptions: Record<string, string> = {
    email_notifications: 'Receive important updates via email',
    push_notifications: 'Get push notifications on your device',
    sms_notifications: 'Receive text messages for urgent updates',
    marketing_emails: 'Get promotional emails and newsletters',
    goal_reminders: 'Reminders about your financial goals',
    learning_reminders: 'Notifications about new learning content',
    weekly_summary: 'Weekly progress and insights summary'
  };
  return descriptions[key] || '';
};

const getPrivacyDescription = (key: string): string => {
  const descriptions: Record<string, string> = {
    data_sharing: 'Share anonymized data to improve our services',
    analytics_tracking: 'Allow analytics to help us improve the app',
    third_party_sharing: 'Share data with trusted third-party partners'
  };
  return descriptions[key] || '';
};

export default UserProfileSettings;