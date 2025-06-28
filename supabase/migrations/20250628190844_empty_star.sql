/*
  # Create Bank Accounts and Quiz Results Tables

  1. New Tables
    - `bank_accounts` - Store connected bank account information
    - `quiz_results` - Store quiz completion results

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
    - Use correct auth.uid() function for Supabase
*/

-- Create bank_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  plaid_account_id text NOT NULL,
  plaid_access_token text NOT NULL,
  name text NOT NULL,
  type text NOT NULL,
  subtype text,
  balance numeric DEFAULT 0,
  institution_name text NOT NULL,
  institution_id text NOT NULL,
  mask text,
  last_updated timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, plaid_account_id)
);

-- Enable RLS on bank_accounts if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'bank_accounts' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_plaid_account_id ON bank_accounts (plaid_account_id);

-- Drop existing policies if they exist and recreate them
DO $$
BEGIN
  -- Drop existing policies for bank_accounts
  DROP POLICY IF EXISTS "Users can read own bank accounts" ON bank_accounts;
  DROP POLICY IF EXISTS "Users can insert own bank accounts" ON bank_accounts;
  DROP POLICY IF EXISTS "Users can update own bank accounts" ON bank_accounts;
  DROP POLICY IF EXISTS "Users can delete own bank accounts" ON bank_accounts;
  DROP POLICY IF EXISTS "Users can read own data" ON bank_accounts;
  DROP POLICY IF EXISTS "Users can insert their own bank accounts" ON bank_accounts;
  DROP POLICY IF EXISTS "Users can update their own bank accounts" ON bank_accounts;
  DROP POLICY IF EXISTS "Users can delete their own bank accounts" ON bank_accounts;
END $$;

-- Create RLS policies for bank_accounts
CREATE POLICY "Users can read own bank accounts"
  ON bank_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank accounts"
  ON bank_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank accounts"
  ON bank_accounts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank accounts"
  ON bank_accounts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Additional policies for public access (needed for edge functions)
CREATE POLICY "Users can read own data"
  ON bank_accounts
  FOR SELECT
  TO public
  USING (id = auth.uid());

CREATE POLICY "Users can insert their own bank accounts"
  ON bank_accounts
  FOR INSERT
  TO public
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own bank accounts"
  ON bank_accounts
  FOR UPDATE
  TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own bank accounts"
  ON bank_accounts
  FOR DELETE
  TO public
  USING (user_id = auth.uid());

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

-- Enable RLS on quiz_results if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'quiz_results' AND n.nspname = 'public' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create indexes for quiz results
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_category ON quiz_results (category);
CREATE INDEX IF NOT EXISTS idx_quiz_results_completed_at ON quiz_results (completed_at DESC);

-- Drop existing policies for quiz_results if they exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can read own quiz results" ON quiz_results;
  DROP POLICY IF EXISTS "Users can insert own quiz results" ON quiz_results;
  DROP POLICY IF EXISTS "Users can update own quiz results" ON quiz_results;
  DROP POLICY IF EXISTS "Users can delete own quiz results" ON quiz_results;
END $$;

-- Create RLS policies for quiz_results
CREATE POLICY "Users can read own quiz results"
  ON quiz_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz results"
  ON quiz_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz results"
  ON quiz_results
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quiz results"
  ON quiz_results
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);