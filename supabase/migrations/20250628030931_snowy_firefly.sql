/*
  # Create Personalized Learning System

  1. New Tables
    - `learning_modules` - Store all available learning content
    - `user_learning_progress` - Track user progress through modules
    - `learning_paths` - Personalized learning paths for users
    - `user_profiles` - Extended user profile data for personalization

  2. Sample Data
    - Multiple learning modules across different categories
    - Sample users with different profiles and progress
    - Personalized learning paths based on user characteristics

  3. Security
    - Enable RLS on all new tables
    - Add policies for user data access
*/

-- Create learning modules table
CREATE TABLE IF NOT EXISTS learning_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('video', 'article', 'course', 'quiz', 'interactive')),
  difficulty text NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  category text NOT NULL,
  duration_minutes integer NOT NULL,
  xp_reward integer NOT NULL DEFAULT 0,
  required_level integer DEFAULT 1,
  prerequisites uuid[] DEFAULT '{}',
  content_url text,
  thumbnail_url text,
  tags text[] DEFAULT '{}',
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user learning progress table
CREATE TABLE IF NOT EXISTS user_learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  module_id uuid REFERENCES learning_modules(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_spent_minutes integer DEFAULT 0,
  completed_at timestamptz,
  started_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  notes text,
  UNIQUE(user_id, module_id)
);

-- Create learning paths table
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  module_ids uuid[] NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create extended user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  age_range text,
  income_range text,
  financial_experience text CHECK (financial_experience IN ('Beginner', 'Intermediate', 'Advanced')),
  primary_goals text[] DEFAULT '{}',
  learning_style text CHECK (learning_style IN ('Visual', 'Auditory', 'Reading', 'Kinesthetic')),
  time_availability text CHECK (time_availability IN ('15min', '30min', '1hour', '2hours+')),
  interests text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for learning_modules (public read)
CREATE POLICY "Anyone can read learning modules"
  ON learning_modules
  FOR SELECT
  TO public
  USING (true);

-- RLS Policies for user_learning_progress
CREATE POLICY "Users can read own learning progress"
  ON user_learning_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning progress"
  ON user_learning_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning progress"
  ON user_learning_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for learning_paths
CREATE POLICY "Users can read own learning paths"
  ON learning_paths
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning paths"
  ON learning_paths
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning paths"
  ON learning_paths
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_profiles
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert comprehensive learning modules
INSERT INTO learning_modules (title, description, content_type, difficulty, category, duration_minutes, xp_reward, required_level, tags, is_featured) VALUES

-- Beginner Financial Literacy
('Personal Finance 101: Getting Started', 'Learn the fundamental concepts of personal finance including budgeting, saving, and basic investing principles.', 'course', 'Beginner', 'Financial Basics', 45, 100, 1, '{"budgeting", "saving", "basics"}', true),
('Emergency Fund Essentials', 'Understand why emergency funds are crucial and learn step-by-step how to build one that fits your lifestyle.', 'video', 'Beginner', 'Savings', 20, 50, 1, '{"emergency fund", "savings", "security"}', true),
('Budgeting Made Simple', 'Master the art of budgeting with practical strategies that actually work in real life.', 'interactive', 'Beginner', 'Budgeting', 30, 75, 1, '{"budgeting", "planning", "money management"}', false),
('Understanding Credit Scores', 'Demystify credit scores and learn how to build and maintain excellent credit.', 'article', 'Beginner', 'Credit', 15, 40, 1, '{"credit", "credit score", "financial health"}', false),

-- Intermediate Investing & Planning
('Investment Fundamentals', 'Explore different investment vehicles including stocks, bonds, ETFs, and mutual funds.', 'course', 'Intermediate', 'Investing', 60, 150, 5, '{"investing", "stocks", "bonds", "portfolio"}', true),
('Retirement Planning Strategies', 'Learn how to plan for retirement with 401(k)s, IRAs, and other retirement accounts.', 'video', 'Intermediate', 'Retirement', 40, 120, 8, '{"retirement", "401k", "IRA", "planning"}', false),
('Tax Optimization Basics', 'Understand tax-advantaged accounts and basic strategies to minimize your tax burden.', 'article', 'Intermediate', 'Taxes', 25, 80, 6, '{"taxes", "optimization", "deductions"}', false),
('Real Estate Investment Primer', 'Introduction to real estate investing including REITs, rental properties, and house hacking.', 'course', 'Intermediate', 'Real Estate', 50, 130, 10, '{"real estate", "REITs", "property", "investing"}', false),

-- Advanced Wealth Building
('Advanced Portfolio Management', 'Learn sophisticated portfolio strategies including asset allocation and rebalancing.', 'course', 'Advanced', 'Investing', 75, 200, 15, '{"portfolio", "asset allocation", "advanced"}', false),
('Options Trading Fundamentals', 'Understand options trading strategies for income generation and risk management.', 'video', 'Advanced', 'Trading', 55, 180, 20, '{"options", "trading", "derivatives", "risk"}', false),
('Estate Planning Essentials', 'Learn about wills, trusts, and estate planning strategies to protect your wealth.', 'article', 'Advanced', 'Estate Planning', 35, 140, 18, '{"estate planning", "wills", "trusts", "legacy"}', false),
('Business Finance & Entrepreneurship', 'Understand business finances, startup funding, and entrepreneurial finance strategies.', 'course', 'Advanced', 'Business', 90, 250, 25, '{"business", "entrepreneurship", "startup", "funding"}', false),

-- Specialized Topics
('Cryptocurrency Basics', 'Learn about digital currencies, blockchain technology, and crypto investing safely.', 'video', 'Intermediate', 'Cryptocurrency', 35, 100, 12, '{"crypto", "blockchain", "bitcoin", "digital assets"}', false),
('Insurance Planning', 'Understand different types of insurance and how to protect your financial future.', 'article', 'Beginner', 'Insurance', 20, 60, 3, '{"insurance", "protection", "risk management"}', false),
('Debt Management Strategies', 'Learn effective strategies to pay off debt including avalanche and snowball methods.', 'interactive', 'Beginner', 'Debt Management', 25, 70, 2, '{"debt", "payoff", "strategies", "freedom"}', true),
('Side Hustle Finance', 'Manage finances for your side business including taxes, expenses, and growth strategies.', 'course', 'Intermediate', 'Business', 40, 110, 7, '{"side hustle", "business", "taxes", "income"}', false),

-- Interactive & Practical
('Financial Goal Setting Workshop', 'Interactive workshop to set SMART financial goals and create actionable plans.', 'interactive', 'Beginner', 'Goal Setting', 30, 80, 1, '{"goals", "planning", "SMART goals", "workshop"}', true),
('Investment Risk Assessment', 'Take our comprehensive quiz to understand your risk tolerance and investment style.', 'quiz', 'Intermediate', 'Investing', 15, 50, 5, '{"risk assessment", "quiz", "investing", "personality"}', false),
('Retirement Calculator Masterclass', 'Learn to use retirement calculators and plan your retirement timeline effectively.', 'interactive', 'Intermediate', 'Retirement', 25, 90, 8, '{"retirement", "calculator", "planning", "tools"}', false),
('Budget Optimization Challenge', 'Interactive challenge to optimize your budget and find hidden savings opportunities.', 'interactive', 'Beginner', 'Budgeting', 20, 65, 2, '{"budgeting", "optimization", "challenge", "savings"}', false);

-- Create sample users with different profiles
-- Note: In a real app, passwords would be hashed. These are for demo purposes.

-- Sample User 1: Sarah (Young Professional)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'sarah.young@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Sarah Young"}'
);

INSERT INTO users (id, email, full_name, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'sarah.young@example.com', 'Sarah Young', now());

INSERT INTO user_profiles (user_id, age_range, income_range, financial_experience, primary_goals, learning_style, time_availability, interests) VALUES
('11111111-1111-1111-1111-111111111111', '25-30', '50k-75k', 'Beginner', '{"emergency fund", "debt payoff", "investing basics"}', 'Visual', '30min', '{"budgeting", "investing", "career growth"}');

INSERT INTO xp (user_id, points, badges) VALUES
('11111111-1111-1111-1111-111111111111', 250, '{"Welcome", "First Goal", "Learning Starter"}');

-- Sample User 2: Michael (Mid-Career Professional)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'michael.career@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Michael Career"}'
);

INSERT INTO users (id, email, full_name, created_at) VALUES
('22222222-2222-2222-2222-222222222222', 'michael.career@example.com', 'Michael Career', now());

INSERT INTO user_profiles (user_id, age_range, income_range, financial_experience, primary_goals, learning_style, time_availability, interests) VALUES
('22222222-2222-2222-2222-222222222222', '31-35', '75k-100k', 'Intermediate', '{"retirement planning", "investment growth", "tax optimization"}', 'Reading', '1hour', '{"investing", "retirement", "real estate", "taxes"}');

INSERT INTO xp (user_id, points, badges) VALUES
('22222222-2222-2222-2222-222222222222', 850, '{"Welcome", "Investment Explorer", "Goal Achiever", "Learning Champion"}');

-- Sample User 3: Lisa (High Earner)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'lisa.executive@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Lisa Executive"}'
);

INSERT INTO users (id, email, full_name, created_at) VALUES
('33333333-3333-3333-3333-333333333333', 'lisa.executive@example.com', 'Lisa Executive', now());

INSERT INTO user_profiles (user_id, age_range, income_range, financial_experience, primary_goals, learning_style, time_availability, interests) VALUES
('33333333-3333-3333-3333-333333333333', '36-40', '150k+', 'Advanced', '{"wealth building", "estate planning", "business finance", "advanced investing"}', 'Auditory', '2hours+', '{"advanced investing", "business", "estate planning", "cryptocurrency"}');

INSERT INTO xp (user_id, points, badges) VALUES
('33333333-3333-3333-3333-333333333333', 1500, '{"Welcome", "Investment Master", "Goal Crusher", "Learning Expert", "Wealth Builder"}');

-- Sample User 4: David (Recent Graduate)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'david.student@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "David Student"}'
);

INSERT INTO users (id, email, full_name, created_at) VALUES
('44444444-4444-4444-4444-444444444444', 'david.student@example.com', 'David Student', now());

INSERT INTO user_profiles (user_id, age_range, income_range, financial_experience, primary_goals, learning_style, time_availability, interests) VALUES
('44444444-4444-4444-4444-444444444444', '18-24', 'under-30k', 'Beginner', '{"budgeting", "credit building", "student loans", "side hustle"}', 'Kinesthetic', '15min', '{"budgeting", "side hustle", "credit", "basics"}');

INSERT INTO xp (user_id, points, badges) VALUES
('44444444-4444-4444-4444-444444444444', 150, '{"Welcome", "First Steps"}');

-- Add some sample goals for users
INSERT INTO goals (user_id, name, target_amount, saved_amount, deadline, category, created_at) VALUES
-- Sarah's goals
('11111111-1111-1111-1111-111111111111', 'Emergency Fund', 10000, 3500, '2025-12-31', 'emergency', now()),
('11111111-1111-1111-1111-111111111111', 'Pay Off Credit Cards', 5000, 2000, '2025-08-31', 'debt', now()),
('11111111-1111-1111-1111-111111111111', 'Vacation to Europe', 4000, 800, '2025-10-15', 'vacation', now()),

-- Michael's goals
('22222222-2222-2222-2222-222222222222', 'House Down Payment', 50000, 22500, '2026-06-30', 'house', now()),
('22222222-2222-2222-2222-222222222222', 'Retirement Boost', 25000, 8500, '2025-12-31', 'retirement', now()),
('22222222-2222-2222-2222-222222222222', 'Investment Portfolio', 15000, 12000, '2025-09-30', 'investment', now()),

-- Lisa's goals
('33333333-3333-3333-3333-333333333333', 'Investment Property', 100000, 65000, '2025-12-31', 'real_estate', now()),
('33333333-3333-3333-3333-333333333333', 'Business Expansion Fund', 75000, 45000, '2025-11-30', 'business', now()),
('33333333-3333-3333-3333-333333333333', 'Children Education Fund', 50000, 15000, '2030-08-31', 'education', now()),

-- David's goals
('44444444-4444-4444-4444-444444444444', 'Emergency Fund', 2000, 350, '2025-12-31', 'emergency', now()),
('44444444-4444-4444-4444-444444444444', 'Student Loan Payment', 8000, 1200, '2026-05-31', 'debt', now()),
('44444444-4444-4444-4444-444444444444', 'First Car', 12000, 2800, '2025-10-31', 'car', now());

-- Add learning progress for users to show different completion states
-- Sarah's progress (beginner, just starting)
INSERT INTO user_learning_progress (user_id, module_id, status, progress_percentage, time_spent_minutes, completed_at) 
SELECT 
  '11111111-1111-1111-1111-111111111111',
  id,
  CASE 
    WHEN title = 'Personal Finance 101: Getting Started' THEN 'completed'
    WHEN title = 'Emergency Fund Essentials' THEN 'completed'
    WHEN title = 'Budgeting Made Simple' THEN 'in_progress'
    WHEN title = 'Understanding Credit Scores' THEN 'not_started'
    ELSE 'not_started'
  END,
  CASE 
    WHEN title = 'Personal Finance 101: Getting Started' THEN 100
    WHEN title = 'Emergency Fund Essentials' THEN 100
    WHEN title = 'Budgeting Made Simple' THEN 65
    ELSE 0
  END,
  CASE 
    WHEN title = 'Personal Finance 101: Getting Started' THEN 45
    WHEN title = 'Emergency Fund Essentials' THEN 20
    WHEN title = 'Budgeting Made Simple' THEN 20
    ELSE 0
  END,
  CASE 
    WHEN title = 'Personal Finance 101: Getting Started' THEN now() - interval '3 days'
    WHEN title = 'Emergency Fund Essentials' THEN now() - interval '1 day'
    ELSE NULL
  END
FROM learning_modules 
WHERE difficulty = 'Beginner' OR title IN ('Investment Fundamentals', 'Debt Management Strategies');

-- Michael's progress (intermediate, active learner)
INSERT INTO user_learning_progress (user_id, module_id, status, progress_percentage, time_spent_minutes, completed_at)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  id,
  CASE 
    WHEN difficulty = 'Beginner' THEN 'completed'
    WHEN title = 'Investment Fundamentals' THEN 'completed'
    WHEN title = 'Retirement Planning Strategies' THEN 'in_progress'
    WHEN title = 'Tax Optimization Basics' THEN 'not_started'
    WHEN title = 'Real Estate Investment Primer' THEN 'not_started'
    ELSE 'not_started'
  END,
  CASE 
    WHEN difficulty = 'Beginner' THEN 100
    WHEN title = 'Investment Fundamentals' THEN 100
    WHEN title = 'Retirement Planning Strategies' THEN 75
    ELSE 0
  END,
  CASE 
    WHEN difficulty = 'Beginner' THEN duration_minutes
    WHEN title = 'Investment Fundamentals' THEN 60
    WHEN title = 'Retirement Planning Strategies' THEN 30
    ELSE 0
  END,
  CASE 
    WHEN difficulty = 'Beginner' THEN now() - interval '2 weeks'
    WHEN title = 'Investment Fundamentals' THEN now() - interval '5 days'
    ELSE NULL
  END
FROM learning_modules;

-- Lisa's progress (advanced, experienced learner)
INSERT INTO user_learning_progress (user_id, module_id, status, progress_percentage, time_spent_minutes, completed_at)
SELECT 
  '33333333-3333-3333-3333-333333333333',
  id,
  CASE 
    WHEN difficulty IN ('Beginner', 'Intermediate') THEN 'completed'
    WHEN title = 'Advanced Portfolio Management' THEN 'completed'
    WHEN title = 'Options Trading Fundamentals' THEN 'in_progress'
    WHEN title = 'Estate Planning Essentials' THEN 'not_started'
    WHEN title = 'Business Finance & Entrepreneurship' THEN 'not_started'
    ELSE 'completed'
  END,
  CASE 
    WHEN difficulty IN ('Beginner', 'Intermediate') THEN 100
    WHEN title = 'Advanced Portfolio Management' THEN 100
    WHEN title = 'Options Trading Fundamentals' THEN 80
    ELSE 100
  END,
  CASE 
    WHEN difficulty IN ('Beginner', 'Intermediate') THEN duration_minutes
    WHEN title = 'Advanced Portfolio Management' THEN 75
    WHEN title = 'Options Trading Fundamentals' THEN 45
    ELSE duration_minutes
  END,
  CASE 
    WHEN difficulty IN ('Beginner', 'Intermediate') THEN now() - interval '1 month'
    WHEN title = 'Advanced Portfolio Management' THEN now() - interval '1 week'
    ELSE now() - interval '2 weeks'
  END
FROM learning_modules;

-- David's progress (just started)
INSERT INTO user_learning_progress (user_id, module_id, status, progress_percentage, time_spent_minutes, completed_at)
SELECT 
  '44444444-4444-4444-4444-444444444444',
  id,
  CASE 
    WHEN title = 'Personal Finance 101: Getting Started' THEN 'in_progress'
    WHEN title = 'Financial Goal Setting Workshop' THEN 'completed'
    ELSE 'not_started'
  END,
  CASE 
    WHEN title = 'Personal Finance 101: Getting Started' THEN 25
    WHEN title = 'Financial Goal Setting Workshop' THEN 100
    ELSE 0
  END,
  CASE 
    WHEN title = 'Personal Finance 101: Getting Started' THEN 12
    WHEN title = 'Financial Goal Setting Workshop' THEN 30
    ELSE 0
  END,
  CASE 
    WHEN title = 'Financial Goal Setting Workshop' THEN now() - interval '2 days'
    ELSE NULL
  END
FROM learning_modules 
WHERE difficulty = 'Beginner';

-- Create personalized learning paths for each user
-- Sarah's learning path (beginner focused)
INSERT INTO learning_paths (user_id, name, description, module_ids, is_active)
SELECT 
  '11111111-1111-1111-1111-111111111111',
  'Financial Foundation Path',
  'Build a strong foundation in personal finance fundamentals',
  ARRAY(SELECT id FROM learning_modules WHERE difficulty = 'Beginner' ORDER BY created_at LIMIT 6),
  true;

-- Michael's learning path (intermediate focused)
INSERT INTO learning_paths (user_id, name, description, module_ids, is_active)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  'Investment & Retirement Path',
  'Advanced strategies for building wealth and planning retirement',
  ARRAY(SELECT id FROM learning_modules WHERE difficulty IN ('Intermediate', 'Advanced') AND category IN ('Investing', 'Retirement', 'Taxes') ORDER BY created_at LIMIT 8),
  true;

-- Lisa's learning path (advanced focused)
INSERT INTO learning_paths (user_id, name, description, module_ids, is_active)
SELECT 
  '33333333-3333-3333-3333-333333333333',
  'Wealth Mastery Path',
  'Advanced wealth building and business finance strategies',
  ARRAY(SELECT id FROM learning_modules WHERE difficulty = 'Advanced' OR category IN ('Business', 'Estate Planning', 'Cryptocurrency') ORDER BY created_at),
  true;

-- David's learning path (basics focused)
INSERT INTO learning_paths (user_id, name, description, module_ids, is_active)
SELECT 
  '44444444-4444-4444-4444-444444444444',
  'Student Success Path',
  'Essential financial skills for young adults and students',
  ARRAY(SELECT id FROM learning_modules WHERE difficulty = 'Beginner' AND (category IN ('Financial Basics', 'Budgeting', 'Credit', 'Debt Management') OR title LIKE '%Side Hustle%') ORDER BY created_at LIMIT 5),
  true;