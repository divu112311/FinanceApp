/*
  # Create Smart Wins Table for Weekly Financial Opportunities

  1. New Tables
    - `smart_wins` - Store weekly financial opportunities and wins
  
  2. Schema
    - Unique ID for each win
    - User ID for association
    - Title and description
    - Type categorization
    - Impact measurement
    - Action information
    - Creation and expiration timestamps
  
  3. Security
    - Enable RLS on smart_wins table
    - Add policies for authenticated users to manage their own wins
*/

-- Create smart_wins table
CREATE TABLE IF NOT EXISTS smart_wins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  type text NOT NULL CHECK (type IN ('savings', 'spending', 'investment', 'goal', 'opportunity')),
  impact numeric,
  actionable boolean DEFAULT true,
  action_text text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  
  -- Additional metadata
  data_source jsonb DEFAULT '{}'::jsonb,
  priority integer DEFAULT 1
);

-- Enable RLS
ALTER TABLE smart_wins ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_smart_wins_user_id ON smart_wins (user_id);
CREATE INDEX IF NOT EXISTS idx_smart_wins_type ON smart_wins (type);
CREATE INDEX IF NOT EXISTS idx_smart_wins_created_at ON smart_wins (created_at);

-- Create RLS policies
CREATE POLICY "Users can read own smart wins"
  ON smart_wins
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own smart wins"
  ON smart_wins
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own smart wins"
  ON smart_wins
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own smart wins"
  ON smart_wins
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add sample data for testing
INSERT INTO smart_wins (user_id, title, description, type, impact, actionable, action_text, created_at)
SELECT 
  id,
  'Optimize Excess Cash',
  'Move $2,000 from checking to high-yield savings for better returns',
  'opportunity',
  80,
  true,
  'Set up transfer',
  now()
FROM users
WHERE email = 'sarah.johnson@demo.com'
ON CONFLICT DO NOTHING;

INSERT INTO smart_wins (user_id, title, description, type, impact, actionable, action_text, created_at)
SELECT 
  id,
  'Review Subscriptions',
  'Most people save $40-60/month by auditing recurring subscriptions',
  'spending',
  600,
  true,
  'Review subscriptions',
  now()
FROM users
WHERE email = 'sarah.johnson@demo.com'
ON CONFLICT DO NOTHING;

INSERT INTO smart_wins (user_id, title, description, type, impact, actionable, action_text, created_at)
SELECT 
  id,
  'Automate Goal Contributions',
  'Automatically save $300 monthly to reach your goals faster',
  'goal',
  NULL,
  true,
  'Set up automation',
  now()
FROM users
WHERE email = 'sarah.johnson@demo.com'
ON CONFLICT DO NOTHING;

-- Add sample data for Michael
INSERT INTO smart_wins (user_id, title, description, type, impact, actionable, action_text, created_at)
SELECT 
  id,
  'Boost Your Retirement Savings',
  'Increasing your 401(k) contribution by 2% could add $120,000 to your retirement over 30 years',
  'investment',
  4000,
  true,
  'Adjust contribution',
  now()
FROM users
WHERE email = 'michael.chen@demo.com'
ON CONFLICT DO NOTHING;

INSERT INTO smart_wins (user_id, title, description, type, impact, actionable, action_text, created_at)
SELECT 
  id,
  'Refinance Your Mortgage',
  'Current rates are 0.75% lower than your existing mortgage - you could save $230/month',
  'opportunity',
  2760,
  true,
  'Check rates',
  now()
FROM users
WHERE email = 'michael.chen@demo.com'
ON CONFLICT DO NOTHING;

INSERT INTO smart_wins (user_id, title, description, type, impact, actionable, action_text, created_at)
SELECT 
  id,
  'Tax-Loss Harvesting Opportunity',
  'Harvesting losses in your investment portfolio could save $1,200 in taxes this year',
  'investment',
  1200,
  true,
  'Review investments',
  now()
FROM users
WHERE email = 'michael.chen@demo.com'
ON CONFLICT DO NOTHING;