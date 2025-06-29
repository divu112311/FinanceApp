/*
  # Add dummy profile data for all users

  1. Updates
    - Add default profile data for existing users
    - Ensure all users have complete profiles with dummy data
    - Set default notification and privacy preferences

  2. Data
    - Complete user profiles with realistic dummy data
    - Default notification preferences
    - Default privacy settings
    - Default theme preferences
*/

-- Update existing users with dummy profile data if they don't have extended profiles
INSERT INTO user_profiles (
  user_id,
  age_range,
  income_range,
  financial_experience,
  primary_goals,
  learning_style,
  time_availability,
  interests,
  notification_preferences,
  privacy_settings,
  theme_preferences,
  created_at,
  updated_at
)
SELECT 
  u.id,
  CASE 
    WHEN u.id = '11111111-1111-1111-1111-111111111111'::uuid THEN '25-34'
    WHEN u.id = '22222222-2222-2222-2222-222222222222'::uuid THEN '35-44'
    ELSE '25-34'
  END as age_range,
  CASE 
    WHEN u.id = '11111111-1111-1111-1111-111111111111'::uuid THEN '$50,000-$75,000'
    WHEN u.id = '22222222-2222-2222-2222-222222222222'::uuid THEN '$75,000-$100,000'
    ELSE '$50,000-$75,000'
  END as income_range,
  CASE 
    WHEN u.id = '11111111-1111-1111-1111-111111111111'::uuid THEN 'Beginner'
    WHEN u.id = '22222222-2222-2222-2222-222222222222'::uuid THEN 'Intermediate'
    ELSE 'Beginner'
  END as financial_experience,
  CASE 
    WHEN u.id = '11111111-1111-1111-1111-111111111111'::uuid THEN ARRAY['Build emergency fund', 'Start investing', 'Improve credit score']
    WHEN u.id = '22222222-2222-2222-2222-222222222222'::uuid THEN ARRAY['Retirement planning', 'Pay off debt', 'Save for house']
    ELSE ARRAY['Build emergency fund', 'Start investing']
  END as primary_goals,
  CASE 
    WHEN u.id = '11111111-1111-1111-1111-111111111111'::uuid THEN 'Visual'
    WHEN u.id = '22222222-2222-2222-2222-222222222222'::uuid THEN 'Reading'
    ELSE 'Visual'
  END as learning_style,
  CASE 
    WHEN u.id = '11111111-1111-1111-1111-111111111111'::uuid THEN '30min'
    WHEN u.id = '22222222-2222-2222-2222-222222222222'::uuid THEN '1hour'
    ELSE '30min'
  END as time_availability,
  CASE 
    WHEN u.id = '11111111-1111-1111-1111-111111111111'::uuid THEN ARRAY['budgeting', 'investing', 'credit']
    WHEN u.id = '22222222-2222-2222-2222-222222222222'::uuid THEN ARRAY['retirement', 'real-estate', 'debt-management']
    ELSE ARRAY['budgeting', 'investing']
  END as interests,
  '{
    "email_notifications": true,
    "push_notifications": true,
    "sms_notifications": false,
    "marketing_emails": false,
    "goal_reminders": true,
    "learning_reminders": true,
    "weekly_summary": true
  }'::jsonb as notification_preferences,
  '{
    "profile_visibility": "private",
    "data_sharing": false,
    "analytics_tracking": true,
    "third_party_sharing": false
  }'::jsonb as privacy_settings,
  'auto' as theme_preferences,
  now() as created_at,
  now() as updated_at
FROM users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.user_id = u.id
)
ON CONFLICT (user_id) DO UPDATE SET
  notification_preferences = EXCLUDED.notification_preferences,
  privacy_settings = EXCLUDED.privacy_settings,
  theme_preferences = EXCLUDED.theme_preferences,
  updated_at = now();

-- Update existing user_profiles that might be missing the new fields
UPDATE user_profiles 
SET 
  notification_preferences = COALESCE(
    notification_preferences,
    '{
      "email_notifications": true,
      "push_notifications": true,
      "sms_notifications": false,
      "marketing_emails": false,
      "goal_reminders": true,
      "learning_reminders": true,
      "weekly_summary": true
    }'::jsonb
  ),
  privacy_settings = COALESCE(
    privacy_settings,
    '{
      "profile_visibility": "private",
      "data_sharing": false,
      "analytics_tracking": true,
      "third_party_sharing": false
    }'::jsonb
  ),
  theme_preferences = COALESCE(theme_preferences, 'auto'),
  updated_at = now()
WHERE notification_preferences IS NULL 
   OR privacy_settings IS NULL 
   OR theme_preferences IS NULL;

-- Add dummy phone numbers and dates of birth for existing users
UPDATE users 
SET 
  phone_number = CASE 
    WHEN id = '11111111-1111-1111-1111-111111111111'::uuid THEN '+1-555-0123'
    WHEN id = '22222222-2222-2222-2222-222222222222'::uuid THEN '+1-555-0456'
    ELSE '+1-555-0000'
  END,
  date_of_birth = CASE 
    WHEN id = '11111111-1111-1111-1111-111111111111'::uuid THEN '1995-03-15'
    WHEN id = '22222222-2222-2222-2222-222222222222'::uuid THEN '1985-07-22'
    ELSE '1990-01-01'
  END,
  is_active = true,
  updated_at = now()
WHERE phone_number IS NULL 
   OR date_of_birth IS NULL 
   OR is_active IS NULL;