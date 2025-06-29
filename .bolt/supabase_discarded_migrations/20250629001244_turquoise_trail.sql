/*
  # Add Dummy Data for New Tables

  1. Gamification
    - user_xp: Enhanced XP tracking with levels
    - badges: Achievement badges for users
    - user_badges: User-badge relationships

  2. Financial
    - account_balances: Historical account balance tracking
    - transactions: Financial transactions
    - goal_transactions: Transactions related to goals

  3. AI/Chat
    - chat_sessions: Session-based chat system
    - chat_messages: Individual messages within sessions
    - financial_insights: AI-generated financial insights

  4. Health Monitoring
    - financial_health_rules: Rules for monitoring financial health
    - user_health_flags: Triggered health flags for users

  5. Context
    - user_context: User context for personalization
    - ai_insight_feedback: User feedback on AI insights
    - user_actions: User action tracking
*/

-- Create update_modified_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. GAMIFICATION TABLES

-- Add dummy data to user_xp table
INSERT INTO user_xp (user_id, total_xp, current_level, xp_to_next_level, last_xp_earned_at)
SELECT 
  id as user_id,
  COALESCE((SELECT points FROM xp WHERE user_id = id), 0) as total_xp,
  FLOOR(COALESCE((SELECT points FROM xp WHERE user_id = id), 0) / 100) + 1 as current_level,
  (FLOOR(COALESCE((SELECT points FROM xp WHERE user_id = id), 0) / 100) + 1) * 100 - COALESCE((SELECT points FROM xp WHERE user_id = id), 0) as xp_to_next_level,
  now() - (random() * interval '30 days') as last_xp_earned_at
FROM users
WHERE NOT EXISTS (SELECT 1 FROM user_xp WHERE user_xp.user_id = users.id)
ON CONFLICT (user_id) DO NOTHING;

-- Add badges
INSERT INTO badges (name, description, icon_url, category, difficulty_level, xp_reward)
VALUES
  ('Welcome', 'Joined DoughJo and started your financial journey', 'https://images.pexels.com/photos/3943716/pexels-photo-3943716.jpeg?auto=compress&cs=tinysrgb&w=150', 'engagement', 'easy', 100),
  ('Budget Master', 'Created your first budget', 'https://images.pexels.com/photos/4386158/pexels-photo-4386158.jpeg?auto=compress&cs=tinysrgb&w=150', 'financial', 'easy', 150),
  ('Goal Setter', 'Set your first financial goal', 'https://images.pexels.com/photos/3943723/pexels-photo-3943723.jpeg?auto=compress&cs=tinysrgb&w=150', 'financial', 'easy', 150),
  ('Savings Starter', 'Started your emergency fund', 'https://images.pexels.com/photos/4386339/pexels-photo-4386339.jpeg?auto=compress&cs=tinysrgb&w=150', 'financial', 'easy', 200),
  ('Investment Novice', 'Made your first investment', 'https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=150', 'financial', 'medium', 250),
  ('Debt Destroyer', 'Paid off a debt', 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg?auto=compress&cs=tinysrgb&w=150', 'financial', 'medium', 300),
  ('Learning Enthusiast', 'Completed 5 learning modules', 'https://images.pexels.com/photos/4498362/pexels-photo-4498362.jpeg?auto=compress&cs=tinysrgb&w=150', 'learning', 'medium', 250),
  ('Quiz Champion', 'Scored 100% on a financial quiz', 'https://images.pexels.com/photos/4498318/pexels-photo-4498318.jpeg?auto=compress&cs=tinysrgb&w=150', 'learning', 'medium', 200),
  ('Goal Achiever', 'Reached a financial goal', 'https://images.pexels.com/photos/3943730/pexels-photo-3943730.jpeg?auto=compress&cs=tinysrgb&w=150', 'financial', 'hard', 500),
  ('Financial Guru', 'Reached level 30', 'https://images.pexels.com/photos/4386321/pexels-photo-4386321.jpeg?auto=compress&cs=tinysrgb&w=150', 'engagement', 'hard', 1000)
ON CONFLICT DO NOTHING;

-- Add user badges
INSERT INTO user_badges (user_id, badge_id, earned_at, progress_data)
SELECT 
  u.id as user_id,
  b.badge_id,
  now() - (random() * interval '60 days') as earned_at,
  '{}'::jsonb as progress_data
FROM users u
CROSS JOIN badges b
WHERE b.name = 'Welcome'
  AND NOT EXISTS (
    SELECT 1 FROM user_badges ub 
    WHERE ub.user_id = u.id AND ub.badge_id = b.badge_id
  )
ON CONFLICT DO NOTHING;

-- Add some random badges for existing users
INSERT INTO user_badges (user_id, badge_id, earned_at, progress_data)
SELECT 
  u.id as user_id,
  b.badge_id,
  now() - (random() * interval '30 days') as earned_at,
  '{}'::jsonb as progress_data
FROM users u
CROSS JOIN badges b
WHERE b.name IN ('Goal Setter', 'Budget Master')
  AND random() < 0.7 -- 70% chance to get these badges
  AND NOT EXISTS (
    SELECT 1 FROM user_badges ub 
    WHERE ub.user_id = u.id AND ub.badge_id = b.badge_id
  )
ON CONFLICT DO NOTHING;

-- 2. FINANCIAL TABLES

-- Add account balances
INSERT INTO account_balances (account_id, current_balance, available_balance, limit_amount, iso_currency_code, recorded_at)
SELECT 
  id as account_id,
  balance as current_balance,
  balance * 0.95 as available_balance, -- 95% of balance is available
  CASE 
    WHEN type = 'credit' THEN balance * 3 -- Credit limit is 3x balance
    ELSE NULL 
  END as limit_amount,
  'USD' as iso_currency_code,
  now() - (random() * interval '7 days') as recorded_at
FROM bank_accounts
WHERE NOT EXISTS (
  SELECT 1 FROM account_balances ab WHERE ab.account_id = bank_accounts.id
)
ON CONFLICT DO NOTHING;

-- Add historical balances (7 days ago)
INSERT INTO account_balances (account_id, current_balance, available_balance, limit_amount, iso_currency_code, recorded_at)
SELECT 
  id as account_id,
  balance * (0.9 + random() * 0.2) as current_balance, -- Random balance between 90-110% of current
  balance * (0.9 + random() * 0.2) * 0.95 as available_balance,
  CASE 
    WHEN type = 'credit' THEN balance * 3
    ELSE NULL 
  END as limit_amount,
  'USD' as iso_currency_code,
  now() - (random() * interval '14 days') as recorded_at
FROM bank_accounts
ON CONFLICT DO NOTHING;

-- Add transactions
INSERT INTO transactions (
  account_id, 
  plaid_transaction_id, 
  amount, 
  description, 
  merchant_name, 
  category, 
  subcategory, 
  date, 
  is_pending
)
SELECT
  ba.id as account_id,
  'tx_' || md5(random()::text || clock_timestamp()::text)::text as plaid_transaction_id,
  CASE 
    WHEN random() < 0.3 THEN -1 * (random() * 1000 + 100)::numeric(15,2) -- 30% are income (negative amount)
    ELSE (random() * 200 + 10)::numeric(15,2) -- 70% are expenses (positive amount)
  END as amount,
  CASE 
    WHEN random() < 0.3 THEN 'Payroll Deposit'
    WHEN random() < 0.5 THEN 'Grocery Store Purchase'
    WHEN random() < 0.7 THEN 'Restaurant Payment'
    WHEN random() < 0.8 THEN 'Online Shopping'
    WHEN random() < 0.9 THEN 'Utility Bill'
    ELSE 'Miscellaneous Transaction'
  END as description,
  CASE 
    WHEN random() < 0.3 THEN 'Employer Inc'
    WHEN random() < 0.5 THEN 'Whole Foods'
    WHEN random() < 0.7 THEN 'Local Restaurant'
    WHEN random() < 0.8 THEN 'Amazon'
    WHEN random() < 0.9 THEN 'Electric Company'
    ELSE 'Various Merchant'
  END as merchant_name,
  CASE 
    WHEN random() < 0.3 THEN 'Income'
    WHEN random() < 0.5 THEN 'Food and Drink'
    WHEN random() < 0.7 THEN 'Shopping'
    WHEN random() < 0.8 THEN 'Bills and Utilities'
    WHEN random() < 0.9 THEN 'Travel'
    ELSE 'Miscellaneous'
  END as category,
  CASE 
    WHEN random() < 0.3 THEN 'Payroll'
    WHEN random() < 0.5 THEN 'Groceries'
    WHEN random() < 0.7 THEN 'Restaurants'
    WHEN random() < 0.8 THEN 'Online'
    WHEN random() < 0.9 THEN 'Utilities'
    ELSE 'Other'
  END as subcategory,
  (current_date - (random() * 30)::integer) as date,
  CASE WHEN random() < 0.1 THEN true ELSE false END as is_pending
FROM bank_accounts ba
CROSS JOIN generate_series(1, 10) -- 10 transactions per account
ON CONFLICT DO NOTHING;

-- Add goal transactions
INSERT INTO goal_transactions (
  goal_id, 
  transaction_id, 
  amount, 
  transaction_type, 
  description
)
SELECT
  g.id as goal_id,
  t.transaction_id,
  (random() * 500 + 50)::numeric(15,2) as amount,
  CASE 
    WHEN random() < 0.8 THEN 'contribution'
    WHEN random() < 0.9 THEN 'withdrawal'
    ELSE 'adjustment'
  END as transaction_type,
  CASE 
    WHEN random() < 0.8 THEN 'Regular contribution to goal'
    WHEN random() < 0.9 THEN 'Withdrawal for emergency'
    ELSE 'Adjustment to goal amount'
  END as description
FROM goals g
CROSS JOIN (
  SELECT transaction_id FROM transactions 
  WHERE amount < 0 -- Only use income transactions
  ORDER BY random() 
  LIMIT (SELECT count(*) FROM goals)
) t
WHERE NOT EXISTS (
  SELECT 1 FROM goal_transactions gt WHERE gt.goal_id = g.id
)
ON CONFLICT DO NOTHING;

-- 3. AI/CHAT TABLES

-- Add chat sessions
INSERT INTO chat_sessions (user_id, title, context_data, started_at, last_message_at, is_active)
SELECT
  id as user_id,
  'Financial Planning Discussion' as title,
  '{"goals": ["emergency_fund", "retirement"], "focus_areas": ["budgeting", "investing"]}'::jsonb as context_data,
  now() - (random() * interval '30 days') as started_at,
  now() - (random() * interval '7 days') as last_message_at,
  true as is_active
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM chat_sessions cs WHERE cs.user_id = users.id
)
ON CONFLICT DO NOTHING;

-- Add chat messages
WITH sessions AS (
  SELECT session_id, user_id FROM chat_sessions
)
INSERT INTO chat_messages (
  session_id, 
  user_id, 
  message_type, 
  content, 
  metadata, 
  ai_model_used, 
  response_time, 
  created_at
)
SELECT
  s.session_id,
  s.user_id,
  CASE WHEN row_number() % 2 = 1 THEN 'user_message' ELSE 'ai_response' END as message_type,
  CASE 
    WHEN row_number() % 2 = 1 THEN 
      CASE 
        WHEN row_number() = 1 THEN 'Hi, I need help with my finances.'
        WHEN row_number() = 3 THEN 'I want to start saving for an emergency fund. How much should I save?'
        WHEN row_number() = 5 THEN 'That makes sense. What about investing? When should I start?'
        WHEN row_number() = 7 THEN 'What investment options would you recommend for a beginner?'
        ELSE 'Thanks for the advice!'
      END
    ELSE 
      CASE 
        WHEN row_number() = 2 THEN 'Hello! I''d be happy to help with your finances. What specific area would you like to focus on?'
        WHEN row_number() = 4 THEN 'Great question! For an emergency fund, aim to save 3-6 months of essential expenses. Start with a small goal of $1,000, then build from there. Keep it in a high-yield savings account for easy access.'
        WHEN row_number() = 6 THEN 'You should start investing once you have your emergency fund established and any high-interest debt paid off. The best time to start is as early as possible to take advantage of compound growth.'
        WHEN row_number() = 8 THEN 'For beginners, I recommend starting with low-cost index funds or ETFs that track the total market. They provide instant diversification and typically have lower fees. Consider a Roth IRA for tax advantages if you''re eligible.'
        ELSE 'You''re welcome! Let me know if you have any other questions about your financial journey.'
      END
  END as content,
  CASE 
    WHEN row_number() % 2 = 0 THEN '{"model": "gpt-4", "tokens": 150, "processing_time": 0.8}'::jsonb
    ELSE '{}'::jsonb
  END as metadata,
  CASE 
    WHEN row_number() % 2 = 0 THEN 'gpt-4'
    ELSE NULL
  END as ai_model_used,
  CASE 
    WHEN row_number() % 2 = 0 THEN (random() * 2000 + 500)::integer
    ELSE NULL
  END as response_time,
  now() - (interval '30 days' - (row_number() * interval '1 day')) as created_at
FROM sessions s
CROSS JOIN generate_series(1, 10) as row_number
ON CONFLICT DO NOTHING;

-- Add financial insights
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
  id as user_id,
  CASE 
    WHEN random() < 0.3 THEN 'spending_pattern'
    WHEN random() < 0.5 THEN 'goal_recommendation'
    WHEN random() < 0.7 THEN 'budget_advice'
    WHEN random() < 0.9 THEN 'opportunity'
    ELSE 'risk_alert'
  END as insight_type,
  CASE 
    WHEN random() < 0.3 THEN 'Unusual Spending Pattern Detected'
    WHEN random() < 0.5 THEN 'New Goal Recommendation'
    WHEN random() < 0.7 THEN 'Budget Optimization Opportunity'
    WHEN random() < 0.9 THEN 'Investment Opportunity'
    ELSE 'Potential Cash Flow Risk'
  END as title,
  CASE 
    WHEN random() < 0.3 THEN 'We noticed your spending on dining out has increased by 35% this month compared to your 3-month average. This might be an area to review in your budget.'
    WHEN random() < 0.5 THEN 'Based on your savings rate and financial goals, you might consider setting up a dedicated vacation fund. We recommend saving $200/month to reach a $2,400 goal in 12 months.'
    WHEN random() < 0.7 THEN 'Your subscription services total $95/month, which is 15% of your discretionary spending. Consider reviewing these services to identify potential savings.'
    WHEN random() < 0.9 THEN 'You have $3,500 in your checking account that could be earning more interest. Consider moving $2,000 to a high-yield savings account for a potential $70 more in annual interest.'
    ELSE 'Your current spending trajectory may lead to a cash flow shortage next month. Consider reducing discretionary spending by $200 to maintain your emergency fund.'
  END as description,
  '{"transactions": true, "accounts": true, "goals": true}'::jsonb as data_sources,
  (random() * 0.3 + 0.7)::numeric(3,2) as confidence_score,
  CASE 
    WHEN random() < 0.2 THEN 'high'
    WHEN random() < 0.7 THEN 'medium'
    ELSE 'low'
  END as priority_level,
  CASE 
    WHEN random() < 0.3 THEN '[{"action": "review_spending", "description": "Review your dining expenses"}, {"action": "adjust_budget", "description": "Adjust your food budget category"}]'::jsonb
    WHEN random() < 0.5 THEN '[{"action": "create_goal", "description": "Set up a vacation fund"}, {"action": "setup_automation", "description": "Automate monthly transfers"}]'::jsonb
    WHEN random() < 0.7 THEN '[{"action": "review_subscriptions", "description": "Review your subscription services"}, {"action": "cancel_unused", "description": "Cancel unused subscriptions"}]'::jsonb
    WHEN random() < 0.9 THEN '[{"action": "open_hysa", "description": "Open a high-yield savings account"}, {"action": "transfer_funds", "description": "Transfer excess checking funds"}]'::jsonb
    ELSE '[{"action": "reduce_spending", "description": "Reduce discretionary spending temporarily"}, {"action": "review_budget", "description": "Review your monthly budget"}]'::jsonb
  END as action_items,
  CASE WHEN random() < 0.2 THEN true ELSE false END as is_dismissed,
  now() - (random() * interval '30 days') as created_at
FROM users
CROSS JOIN generate_series(1, 3) -- 3 insights per user
ON CONFLICT DO NOTHING;

-- 4. HEALTH MONITORING TABLES

-- Add financial health rules
INSERT INTO financial_health_rules (
  rule_name, 
  rule_category, 
  condition_logic, 
  threshold_values, 
  severity_level, 
  recommended_actions, 
  rule_description, 
  is_active
)
VALUES
  (
    'Emergency Fund Coverage',
    'emergency_fund',
    '{"type": "comparison", "metric": "emergency_fund_months", "operator": "less_than"}',
    '{"min_months": 3, "warning_months": 1}',
    'warning',
    '[{"action": "increase_savings", "description": "Increase monthly savings rate"}, {"action": "reduce_expenses", "description": "Identify non-essential expenses to cut"}]',
    'Checks if emergency fund covers at least 3 months of expenses',
    true
  ),
  (
    'High Credit Utilization',
    'debt',
    '{"type": "comparison", "metric": "credit_utilization", "operator": "greater_than"}',
    '{"max_percent": 30, "critical_percent": 80}',
    'warning',
    '[{"action": "reduce_balance", "description": "Make extra payments to reduce credit card balances"}, {"action": "avoid_new_charges", "description": "Avoid new credit card charges until utilization improves"}]',
    'Alerts when credit utilization exceeds 30% of available credit',
    true
  ),
  (
    'Low Savings Rate',
    'savings',
    '{"type": "comparison", "metric": "savings_rate", "operator": "less_than"}',
    '{"min_percent": 20, "warning_percent": 10}',
    'info',
    '[{"action": "increase_savings", "description": "Increase automatic savings transfers"}, {"action": "review_budget", "description": "Review budget for savings opportunities"}]',
    'Checks if monthly savings rate is below 20% of income',
    true
  ),
  (
    'Negative Cash Flow',
    'cash_flow',
    '{"type": "comparison", "metric": "monthly_cash_flow", "operator": "less_than"}',
    '{"min_amount": 0, "warning_months": 2}',
    'critical',
    '[{"action": "reduce_expenses", "description": "Immediately reduce non-essential spending"}, {"action": "increase_income", "description": "Explore additional income sources"}]',
    'Alerts when expenses exceed income for consecutive months',
    true
  ),
  (
    'High Debt-to-Income Ratio',
    'debt',
    '{"type": "comparison", "metric": "debt_to_income", "operator": "greater_than"}',
    '{"max_percent": 36, "critical_percent": 50}',
    'warning',
    '[{"action": "debt_paydown", "description": "Focus on paying down high-interest debt"}, {"action": "avoid_new_debt", "description": "Avoid taking on new debt"}]',
    'Monitors if debt payments exceed 36% of monthly income',
    true
  )
ON CONFLICT DO NOTHING;

-- Add user health flags
INSERT INTO user_health_flags (
  user_id, 
  rule_id, 
  flag_status, 
  trigger_data, 
  calculated_values, 
  first_triggered_at, 
  last_evaluated_at
)
SELECT
  u.id as user_id,
  r.rule_id,
  CASE WHEN random() < 0.7 THEN 'active' ELSE 'resolved' END as flag_status,
  CASE 
    WHEN r.rule_category = 'emergency_fund' THEN '{"current_months": 1.5, "threshold": 3}'::jsonb
    WHEN r.rule_category = 'debt' THEN '{"current_percent": 42, "threshold": 36}'::jsonb
    WHEN r.rule_category = 'savings' THEN '{"current_percent": 8, "threshold": 20}'::jsonb
    WHEN r.rule_category = 'cash_flow' THEN '{"current_amount": -200, "threshold": 0}'::jsonb
    ELSE '{}'::jsonb
  END as trigger_data,
  CASE 
    WHEN r.rule_category = 'emergency_fund' THEN '{"savings_needed": 4500, "current_savings": 2250}'::jsonb
    WHEN r.rule_category = 'debt' THEN '{"monthly_income": 5000, "monthly_debt": 2100}'::jsonb
    WHEN r.rule_category = 'savings' THEN '{"monthly_income": 5000, "monthly_savings": 400}'::jsonb
    WHEN r.rule_category = 'cash_flow' THEN '{"monthly_income": 5000, "monthly_expenses": 5200}'::jsonb
    ELSE '{}'::jsonb
  END as calculated_values,
  now() - (random() * interval '60 days') as first_triggered_at,
  now() - (random() * interval '7 days') as last_evaluated_at
FROM users u
CROSS JOIN (
  SELECT rule_id, rule_category FROM financial_health_rules
  ORDER BY random()
  LIMIT 2 -- Each user gets 2 random health flags
) r
WHERE NOT EXISTS (
  SELECT 1 FROM user_health_flags uhf 
  WHERE uhf.user_id = u.id AND uhf.rule_id = r.rule_id
)
ON CONFLICT DO NOTHING;

-- 5. CONTEXT TABLES

-- Add user context
INSERT INTO user_context (
  user_id, 
  context_type, 
  context_key, 
  context_value, 
  confidence_score, 
  source, 
  last_reinforced_at
)
SELECT
  id as user_id,
  'financial_habits' as context_type,
  'spending_pattern' as context_key,
  '{"category": "dining", "frequency": "weekly", "average_amount": 120}'::jsonb as context_value,
  0.85 as confidence_score,
  'derived_from_behavior' as source,
  now() - (random() * interval '14 days') as last_reinforced_at
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_context uc 
  WHERE uc.user_id = users.id AND uc.context_type = 'financial_habits' AND uc.context_key = 'spending_pattern'
)
ON CONFLICT DO NOTHING;

INSERT INTO user_context (
  user_id, 
  context_type, 
  context_key, 
  context_value, 
  confidence_score, 
  source, 
  last_reinforced_at
)
SELECT
  id as user_id,
  'preferences' as context_type,
  'investment_risk_tolerance' as context_key,
  '{"level": "moderate", "horizon": "long_term", "focus": "growth"}'::jsonb as context_value,
  0.75 as confidence_score,
  'derived_from_chat' as source,
  now() - (random() * interval '30 days') as last_reinforced_at
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM user_context uc 
  WHERE uc.user_id = users.id AND uc.context_type = 'preferences' AND uc.context_key = 'investment_risk_tolerance'
)
ON CONFLICT DO NOTHING;

-- Add AI insight feedback
INSERT INTO ai_insight_feedback (
  user_id, 
  insight_id, 
  feedback_type, 
  rating, 
  feedback_text, 
  was_acted_upon
)
SELECT
  fi.user_id,
  fi.insight_id,
  CASE 
    WHEN random() < 0.7 THEN 'helpful'
    WHEN random() < 0.8 THEN 'not_helpful'
    WHEN random() < 0.9 THEN 'irrelevant'
    ELSE 'too_complex'
  END as feedback_type,
  CASE 
    WHEN random() < 0.7 THEN 5
    WHEN random() < 0.8 THEN 4
    WHEN random() < 0.9 THEN 3
    WHEN random() < 0.95 THEN 2
    ELSE 1
  END as rating,
  CASE 
    WHEN random() < 0.7 THEN 'This was very helpful, thank you!'
    WHEN random() < 0.8 THEN 'Good insight, I''ll consider this.'
    WHEN random() < 0.9 THEN 'Not really relevant to my situation.'
    ELSE 'This was too complicated for me to understand.'
  END as feedback_text,
  CASE WHEN random() < 0.6 THEN true ELSE false END as was_acted_upon
FROM financial_insights fi
WHERE random() < 0.5 -- Only 50% of insights get feedback
  AND NOT EXISTS (
    SELECT 1 FROM ai_insight_feedback aif 
    WHERE aif.insight_id = fi.insight_id
  )
ON CONFLICT DO NOTHING;

-- Add user actions
INSERT INTO user_actions (
  user_id, 
  insight_id, 
  action_type, 
  action_data, 
  source
)
SELECT
  fi.user_id,
  fi.insight_id,
  CASE 
    WHEN random() < 0.3 THEN 'viewed_insight'
    WHEN random() < 0.6 THEN 'implemented_recommendation'
    WHEN random() < 0.8 THEN 'saved_money'
    ELSE 'adjusted_budget'
  END as action_type,
  CASE 
    WHEN random() < 0.3 THEN '{"viewed_at": "' || (now() - interval '2 days')::text || '"}'::jsonb
    WHEN random() < 0.6 THEN '{"recommendation": "reduce_spending", "implemented_at": "' || (now() - interval '5 days')::text || '"}'::jsonb
    WHEN random() < 0.8 THEN '{"amount": ' || (random() * 500)::integer || ', "category": "groceries"}'::jsonb
    ELSE '{"category": "dining", "old_amount": 400, "new_amount": 300}'::jsonb
  END as action_data,
  CASE 
    WHEN random() < 0.6 THEN 'ai_recommendation'
    ELSE 'user_initiated'
  END as source
FROM financial_insights fi
WHERE EXISTS (
  SELECT 1 FROM ai_insight_feedback aif 
  WHERE aif.insight_id = fi.insight_id AND aif.was_acted_upon = true
)
  AND NOT EXISTS (
    SELECT 1 FROM user_actions ua 
    WHERE ua.insight_id = fi.insight_id
  )
ON CONFLICT DO NOTHING;

-- Add some user actions without insights
INSERT INTO user_actions (
  user_id, 
  action_type, 
  action_data, 
  source
)
SELECT
  id as user_id,
  CASE 
    WHEN random() < 0.3 THEN 'created_goal'
    WHEN random() < 0.6 THEN 'updated_budget'
    WHEN random() < 0.8 THEN 'connected_account'
    ELSE 'completed_module'
  END as action_type,
  CASE 
    WHEN random() < 0.3 THEN '{"goal_type": "emergency_fund", "target_amount": ' || (random() * 10000)::integer || '}'::jsonb
    WHEN random() < 0.6 THEN '{"categories_updated": ["dining", "entertainment"], "total_budget": ' || (random() * 3000 + 1000)::integer || '}'::jsonb
    WHEN random() < 0.8 THEN '{"institution": "Chase Bank", "account_type": "checking"}'::jsonb
    ELSE '{"module_id": "' || md5(random()::text)::text || '", "score": ' || (random() * 100)::integer || '}'::jsonb
  END as action_data,
  'user_initiated' as source
FROM users
CROSS JOIN generate_series(1, 3) -- 3 actions per user
ON CONFLICT DO NOTHING;