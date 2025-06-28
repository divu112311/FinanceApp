/*
  # Add Bank Accounts Table for Plaid Integration

  1. New Tables
    - `bank_accounts` - Store connected bank account information
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `plaid_account_id` (text, unique account identifier from Plaid)
      - `plaid_access_token` (text, encrypted access token)
      - `name` (text, account name)
      - `type` (text, account type: depository, investment, credit, loan)
      - `subtype` (text, account subtype: checking, savings, etc.)
      - `balance` (numeric, current balance)
      - `institution_name` (text, bank/institution name)
      - `institution_id` (text, Plaid institution ID)
      - `mask` (text, last 4 digits of account)
      - `last_updated` (timestamptz, when balance was last updated)
      - `created_at` (timestamptz, when account was connected)

  2. Security
    - Enable RLS on `bank_accounts` table
    - Add policies for users to manage their own bank accounts
    - Add unique constraint on user_id + plaid_account_id
*/

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

-- Enable RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_plaid_account_id ON bank_accounts (plaid_account_id);

-- RLS Policies for bank_accounts
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
  USING (id = (SELECT uid()));

CREATE POLICY "Users can insert their own bank accounts"
  ON bank_accounts
  FOR INSERT
  TO public
  WITH CHECK (user_id = (SELECT uid()));

CREATE POLICY "Users can update their own bank accounts"
  ON bank_accounts
  FOR UPDATE
  TO public
  USING (user_id = (SELECT uid()))
  WITH CHECK (user_id = (SELECT uid()));

CREATE POLICY "Users can delete their own bank accounts"
  ON bank_accounts
  FOR DELETE
  TO public
  USING (user_id = (SELECT uid()));

-- Add quiz results table for learning system
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

-- Enable RLS for quiz results
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Create indexes for quiz results
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_category ON quiz_results (category);
CREATE INDEX IF NOT EXISTS idx_quiz_results_completed_at ON quiz_results (completed_at DESC);

-- RLS Policies for quiz_results
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