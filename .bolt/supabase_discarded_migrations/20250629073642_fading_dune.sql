/*
  # Add Financial Insights System

  1. New Tables
    - `financial_insights` - Store AI-generated financial insights
    - `ai_insight_feedback` - Track user feedback on insights

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data
*/

-- Create financial_insights table if it doesn't exist
CREATE TABLE IF NOT EXISTS financial_insights (
  insight_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_type varchar(50) NOT NULL CHECK (insight_type IN ('spending_pattern', 'goal_recommendation', 'risk_alert', 'opportunity', 'budget_advice', 'investment_tip')),
  title varchar(255) NOT NULL,
  description text NOT NULL,
  data_sources jsonb DEFAULT '{}'::jsonb,
  confidence_score numeric(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1) DEFAULT 1.0,
  priority_level varchar(10) NOT NULL CHECK (priority_level IN ('high', 'medium', 'low')) DEFAULT 'medium',
  action_items jsonb DEFAULT '[]'::jsonb,
  is_dismissed boolean DEFAULT false,
  expires_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create ai_insight_feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_insight_feedback (
  feedback_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_id uuid NOT NULL REFERENCES financial_insights(insight_id) ON DELETE CASCADE,
  message_id uuid REFERENCES chat_messages(message_id) ON DELETE SET NULL,
  feedback_type varchar(50) NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful', 'irrelevant', 'too_complex', 'too_simple', 'inaccurate', 'outdated')),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  was_acted_upon boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, insight_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_financial_insights_user_id ON financial_insights (user_id);
CREATE INDEX IF NOT EXISTS idx_financial_insights_type ON financial_insights (insight_type);
CREATE INDEX IF NOT EXISTS idx_financial_insights_priority ON financial_insights (priority_level);
CREATE INDEX IF NOT EXISTS idx_ai_insight_feedback_user_id ON ai_insight_feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insight_feedback_insight_id ON ai_insight_feedback (insight_id);

-- Enable RLS on financial_insights
ALTER TABLE financial_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for financial_insights
CREATE POLICY "Users can read own financial insights"
  ON financial_insights
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own financial insights"
  ON financial_insights
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable RLS on ai_insight_feedback
ALTER TABLE ai_insight_feedback ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for ai_insight_feedback
CREATE POLICY "Users can read own insight feedback"
  ON ai_insight_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own insight feedback"
  ON ai_insight_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to update modified column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add sample insights for testing
INSERT INTO financial_insights (
  user_id,
  insight_type,
  title,
  description,
  data_sources,
  confidence_score,
  priority_level,
  action_items,
  is_dismissed,
  created_at
) 
SELECT 
  id,
  'spending_pattern',
  'High Dining Out Expenses',
  'You spent $450 on dining out last month, which is 25% of your total spending. This is higher than the recommended 10-15% for this category.',
  '{"source": "transaction_analysis", "period": "last_30_days"}',
  0.85,
  'medium',
  '[{"action": "review_spending", "description": "Review your dining expenses and identify opportunities to cook at home more often"}, {"action": "set_budget", "description": "Set a monthly dining budget of $300 (15% of spending)"}]',
  false,
  now() - interval '2 days'
FROM users
WHERE id = '11111111-1111-1111-1111-111111111111'
AND NOT EXISTS (
  SELECT 1 FROM financial_insights 
  WHERE user_id = '11111111-1111-1111-1111-111111111111'
  AND title = 'High Dining Out Expenses'
);

INSERT INTO financial_insights (
  user_id,
  insight_type,
  title,
  description,
  data_sources,
  confidence_score,
  priority_level,
  action_items,
  is_dismissed,
  created_at
) 
SELECT 
  id,
  'opportunity',
  'Savings Account Optimization',
  'Your checking account has $3,500 which exceeds your monthly expenses by $2,000. Moving this excess to a high-yield savings account could earn you an additional $120 per year.',
  '{"source": "account_analysis", "accounts": ["checking"]}',
  0.9,
  'medium',
  '[{"action": "open_hysa", "description": "Open a high-yield savings account with 3-4% APY"}, {"action": "transfer_funds", "description": "Transfer $2,000 from checking to high-yield savings"}]',
  false,
  now() - interval '3 days'
FROM users
WHERE id = '11111111-1111-1111-1111-111111111111'
AND NOT EXISTS (
  SELECT 1 FROM financial_insights 
  WHERE user_id = '11111111-1111-1111-1111-111111111111'
  AND title = 'Savings Account Optimization'
);

INSERT INTO financial_insights (
  user_id,
  insight_type,
  title,
  description,
  data_sources,
  confidence_score,
  priority_level,
  action_items,
  is_dismissed,
  created_at
) 
SELECT 
  id,
  'risk_alert',
  'Emergency Fund Below Target',
  'Your emergency fund is currently at $1,250, which covers only 1.5 months of expenses. Financial experts recommend 3-6 months of coverage.',
  '{"source": "goal_analysis", "goals": ["Emergency Fund"]}',
  0.95,
  'high',
  '[{"action": "increase_contributions", "description": "Increase monthly contributions to your emergency fund by $200"}, {"action": "reduce_expenses", "description": "Find $200 in monthly expenses you can cut temporarily"}]',
  false,
  now() - interval '1 day'
FROM users
WHERE id = '11111111-1111-1111-1111-111111111111'
AND NOT EXISTS (
  SELECT 1 FROM financial_insights 
  WHERE user_id = '11111111-1111-1111-1111-111111111111'
  AND title = 'Emergency Fund Below Target'
);