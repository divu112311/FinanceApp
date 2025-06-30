/*
  # AI Learning System Setup

  1. New Tables
    - Add content_data column to learning_modules for AI-generated content
    - Add is_active column to learning_modules for enabling/disabling modules
    - Add updated_at column to user_learning_progress for tracking last update

  2. Schema Updates
    - Add new columns to existing tables
    - Create indexes for better performance
    - Update constraints for new columns
*/

-- Add content_data column to learning_modules if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_modules' AND column_name = 'content_data'
  ) THEN
    ALTER TABLE learning_modules ADD COLUMN content_data jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add is_active column to learning_modules if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_modules' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE learning_modules ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Add updated_at column to user_learning_progress if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_learning_progress' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE user_learning_progress ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create index for content_data->generated_by to quickly find AI-generated content
CREATE INDEX IF NOT EXISTS idx_learning_modules_generated_by ON learning_modules USING gin ((content_data->'generated_by'));

-- Create index for is_active to quickly filter active modules
CREATE INDEX IF NOT EXISTS idx_learning_modules_is_active ON learning_modules (is_active);

-- Create trigger function to update updated_at column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_learning_progress if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_user_learning_progress_modtime'
  ) THEN
    CREATE TRIGGER update_user_learning_progress_modtime
    BEFORE UPDATE ON user_learning_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;

-- Create financial_insights table if it doesn't exist
CREATE TABLE IF NOT EXISTS financial_insights (
  insight_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_type varchar(50) NOT NULL CHECK (insight_type IN ('spending_pattern', 'goal_recommendation', 'risk_alert', 'opportunity', 'budget_advice', 'investment_tip')),
  title varchar(255) NOT NULL,
  description text NOT NULL,
  data_sources jsonb DEFAULT '{}'::jsonb,
  confidence_score numeric(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  priority_level varchar(10) DEFAULT 'medium' CHECK (priority_level IN ('high', 'medium', 'low')),
  action_items jsonb DEFAULT '[]'::jsonb,
  is_dismissed boolean DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for financial_insights
CREATE INDEX IF NOT EXISTS idx_financial_insights_user_id ON financial_insights (user_id);
CREATE INDEX IF NOT EXISTS idx_financial_insights_type ON financial_insights (insight_type);
CREATE INDEX IF NOT EXISTS idx_financial_insights_priority ON financial_insights (priority_level);

-- Create quiz_results table if it doesn't exist
CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  category text NOT NULL,
  difficulty text NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  correct_answers integer NOT NULL CHECK (correct_answers >= 0),
  total_questions integer NOT NULL CHECK (total_questions > 0),
  xp_earned integer NOT NULL DEFAULT 0,
  completed_at timestamptz DEFAULT now()
);

-- Create indexes for quiz_results
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_category ON quiz_results (category);
CREATE INDEX IF NOT EXISTS idx_quiz_results_completed_at ON quiz_results (completed_at DESC);

-- Add sample AI-generated modules for testing
INSERT INTO learning_modules (
  title,
  description,
  content_type,
  difficulty,
  category,
  duration_minutes,
  xp_reward,
  required_level,
  content_data,
  is_active,
  created_at,
  updated_at
) VALUES 
(
  'Smart Budgeting Strategies',
  'Learn practical budgeting methods that fit your lifestyle, including the 50/30/20 rule and zero-based budgeting techniques.',
  'article',
  'Beginner',
  'Budgeting',
  15,
  25,
  1,
  '{
    "generated_by": "ai",
    "generated_at": "2025-06-29T08:00:00Z",
    "sections": [
      {
        "title": "Understanding the 50/30/20 Rule",
        "content": "The 50/30/20 rule is a simple budgeting method that allocates 50% of your income to needs, 30% to wants, and 20% to savings and debt repayment. This balanced approach ensures you''re covering essentials while still enjoying life and building financial security."
      },
      {
        "title": "Zero-Based Budgeting",
        "content": "Zero-based budgeting means giving every dollar a purpose until your income minus expenses equals zero. This doesn''t mean spending everything – it means allocating all income to categories including savings and investments."
      },
      {
        "title": "Tracking Your Spending",
        "content": "The foundation of any budget is tracking your spending. Use categories that make sense for your lifestyle and review your spending weekly to stay on track."
      },
      {
        "title": "Making Your Budget Work",
        "content": "The best budget is one you''ll actually use. Choose a method that fits your personality and lifestyle, whether that''s an app, spreadsheet, or the envelope system."
      }
    ]
  }'::jsonb,
  true,
  now() - interval '2 days',
  now() - interval '2 days'
),
(
  'Emergency Fund Essentials',
  'Learn why emergency funds are crucial and how to build one that fits your lifestyle, even on a tight budget.',
  'article',
  'Beginner',
  'Savings',
  12,
  20,
  1,
  '{
    "generated_by": "ai",
    "generated_at": "2025-06-29T08:00:00Z",
    "sections": [
      {
        "title": "Why You Need an Emergency Fund",
        "content": "An emergency fund is your financial buffer against unexpected events like job loss, medical emergencies, or car repairs. Without this safety net, you''re forced to rely on credit cards or loans, potentially creating a cycle of debt."
      },
      {
        "title": "How Much to Save",
        "content": "The general recommendation is 3-6 months of essential expenses. Start with a mini emergency fund of $1,000 while paying off high-interest debt, then build toward your full target."
      },
      {
        "title": "Where to Keep Your Emergency Fund",
        "content": "Your emergency fund should be liquid (easily accessible) but not too accessible (to avoid temptation). High-yield savings accounts are ideal - they offer better returns than traditional savings accounts while maintaining FDIC insurance and liquidity."
      },
      {
        "title": "Building Your Fund Strategically",
        "content": "Treat your emergency fund contribution like a bill - automate it on payday before you can spend the money elsewhere. Start with whatever you can afford, even if it''s just $25 per paycheck."
      }
    ]
  }'::jsonb,
  true,
  now() - interval '1 day',
  now() - interval '1 day'
),
(
  'Financial Fundamentals Quiz',
  'Test your knowledge of essential financial concepts and identify areas for further learning.',
  'quiz',
  'Beginner',
  'General',
  10,
  50,
  1,
  '{
    "generated_by": "ai",
    "generated_at": "2025-06-29T08:00:00Z",
    "questions": [
      {
        "question_text": "What does the 50/30/20 budgeting rule recommend for needs?",
        "options": ["30% of income", "50% of income", "20% of income", "70% of income"],
        "correct_answer": "50% of income",
        "explanation": "The 50/30/20 rule suggests allocating 50% of your after-tax income to needs, 30% to wants, and 20% to savings and debt repayment."
      },
      {
        "question_text": "Which of these is typically considered a ''need'' in budgeting?",
        "options": ["Netflix subscription", "Housing costs", "Dining out", "New clothes"],
        "correct_answer": "Housing costs",
        "explanation": "Needs are expenses that are essential for living, such as housing, utilities, groceries, and basic transportation."
      },
      {
        "question_text": "What is the recommended minimum amount for an emergency fund?",
        "options": ["$100", "$500", "1 month of expenses", "3-6 months of expenses"],
        "correct_answer": "3-6 months of expenses",
        "explanation": "Financial experts generally recommend having 3-6 months of essential expenses saved in an emergency fund."
      },
      {
        "question_text": "Which type of account typically offers the highest interest rate?",
        "options": ["Checking account", "Traditional savings account", "High-yield savings account", "Money market account"],
        "correct_answer": "High-yield savings account",
        "explanation": "High-yield savings accounts, often offered by online banks, typically provide much higher interest rates than traditional bank accounts."
      },
      {
        "question_text": "What is the first recommended step in creating a financial plan?",
        "options": ["Investing in stocks", "Creating a budget", "Opening a credit card", "Taking out a loan"],
        "correct_answer": "Creating a budget",
        "explanation": "A budget is the foundation of any financial plan, as it helps you understand your income, expenses, and where your money is going."
      }
    ]
  }'::jsonb,
  true,
  now(),
  now()
)
ON CONFLICT DO NOTHING;