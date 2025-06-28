/*
  # Add Dynamic Sample Data for All Users

  1. Sample Data
    - Chat logs with realistic conversations
    - Goals with varied progress
    - User profiles with different experience levels
    - XP records with appropriate points and badges

  2. Data Variety
    - Different financial situations
    - Various goal types and progress levels
    - Realistic chat conversations
    - Diverse user profiles
*/

-- Insert sample chat logs for existing users to show conversation history
INSERT INTO chat_logs (user_id, message, sender, timestamp) VALUES
-- Sample conversations for demo users
('11111111-1111-1111-1111-111111111111'::uuid, 'Hi! I need help creating my first budget. Where should I start?', 'user', now() - INTERVAL '2 hours'),
('11111111-1111-1111-1111-111111111111'::uuid, 'Great question! Let''s start with the 50/30/20 rule. Track your monthly income first, then allocate 50% to needs like rent and groceries, 30% to wants like entertainment, and 20% to savings and debt payments. What''s your monthly take-home income?', 'assistant', now() - INTERVAL '2 hours'),
('11111111-1111-1111-1111-111111111111'::uuid, 'My take-home is about $4,200 per month. So that means $2,100 for needs, $1,260 for wants, and $840 for savings?', 'user', now() - INTERVAL '1 hour 45 minutes'),
('11111111-1111-1111-1111-111111111111'::uuid, 'Exactly! You''ve got it. Now let''s look at your current expenses. Do you know roughly how much you spend on rent, utilities, groceries, and other necessities each month?', 'assistant', now() - INTERVAL '1 hour 45 minutes'),
('11111111-1111-1111-1111-111111111111'::uuid, 'My rent is $1,400, utilities about $150, groceries around $400, and car payment $300. That''s already $2,250 - over my needs budget!', 'user', now() - INTERVAL '1 hour 30 minutes'),
('11111111-1111-1111-1111-111111111111'::uuid, 'Good catch! This is common when starting budgeting. Let''s adjust: your true needs are $2,250, which is 53.5% of income. Try reducing wants to 26.5% ($1,113) and savings to 20% ($840). Can you identify any wants that could be cut to make room?', 'assistant', now() - INTERVAL '1 hour 30 minutes'),

('22222222-2222-2222-2222-222222222222'::uuid, 'I want to optimize my investment portfolio. I currently have $35k in my 401k but I''m not sure about my allocation.', 'user', now() - INTERVAL '3 hours'),
('22222222-2222-2222-2222-222222222222'::uuid, 'Excellent! At your age and income level, let''s review your current allocation. What''s your current mix of stocks vs bonds in your 401k? Also, are you maximizing your employer match?', 'assistant', now() - INTERVAL '3 hours'),
('22222222-2222-2222-2222-222222222222'::uuid, 'I think it''s about 70% stocks, 30% bonds. My company matches up to 6% and I''m contributing 8%, so I''m getting the full match.', 'user', now() - INTERVAL '2 hours 30 minutes'),
('22222222-2222-2222-2222-222222222222'::uuid, 'Perfect on the employer match! Your 70/30 allocation is reasonable for your age. Given your 18-month house goal, consider this strategy: keep 401k aggressive (maybe 80/20), but start a separate high-yield savings for your down payment. How much are you saving monthly toward the house?', 'assistant', now() - INTERVAL '2 hours 30 minutes'),
('22222222-2222-2222-2222-222222222222'::uuid, 'About $1,200 per month for the house fund. Should I put some of that in conservative investments instead of just savings?', 'user', now() - INTERVAL '2 hours'),
('22222222-2222-2222-2222-222222222222'::uuid, 'For an 18-month timeline, I''d recommend keeping most in high-yield savings (currently 4-5% APY). Maybe put 20-30% in conservative bond funds or CDs, but prioritize capital preservation over growth for this short-term goal.', 'assistant', now() - INTERVAL '2 hours');

-- Add more varied goals for existing users
INSERT INTO goals (user_id, name, target_amount, saved_amount, deadline, category, created_at) VALUES
-- Additional goals for Sarah (Beginner)
('11111111-1111-1111-1111-111111111111'::uuid, 'New Car Fund', 15000.00, 2500.00, CURRENT_DATE + INTERVAL '24 months', 'car', now() - INTERVAL '1 month'),
('11111111-1111-1111-1111-111111111111'::uuid, 'Credit Card Payoff', 3500.00, 1200.00, CURRENT_DATE + INTERVAL '8 months', 'other', now() - INTERVAL '2 weeks'),

-- Additional goals for Michael (Intermediate)  
('22222222-2222-2222-2222-222222222222'::uuid, 'Kids College Fund', 75000.00, 8500.00, CURRENT_DATE + INTERVAL '10 years', 'education', now() - INTERVAL '6 months'),
('22222222-2222-2222-2222-222222222222'::uuid, 'Investment Property', 80000.00, 15000.00, CURRENT_DATE + INTERVAL '3 years', 'house', now() - INTERVAL '3 months')
ON CONFLICT DO NOTHING;

-- Update existing goals with more realistic progress
UPDATE goals SET 
  saved_amount = 4375.00,
  target_amount = 5000.00
WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid 
  AND name = 'Emergency Fund';

UPDATE goals SET 
  saved_amount = 27500.00,
  target_amount = 50000.00  
WHERE user_id = '22222222-2222-2222-2222-222222222222'::uuid 
  AND name = 'House Down Payment';

-- Add sample bank accounts for demo users
INSERT INTO bank_accounts (
  user_id,
  plaid_account_id,
  plaid_access_token,
  name,
  type,
  subtype,
  balance,
  institution_name,
  institution_id,
  mask,
  last_updated,
  created_at
) VALUES
-- Sarah's accounts
('11111111-1111-1111-1111-111111111111'::uuid, 'demo_checking_sarah', 'demo_token_sarah_1', 'Primary Checking', 'depository', 'checking', 2850.00, 'Chase Bank', 'ins_chase', '1234', now(), now()),
('11111111-1111-1111-1111-111111111111'::uuid, 'demo_savings_sarah', 'demo_token_sarah_2', 'High Yield Savings', 'depository', 'savings', 4375.00, 'Ally Bank', 'ins_ally', '5678', now(), now()),

-- Michael's accounts  
('22222222-2222-2222-2222-222222222222'::uuid, 'demo_checking_michael', 'demo_token_michael_1', 'Business Checking', 'depository', 'checking', 5200.00, 'Bank of America', 'ins_boa', '9876', now(), now()),
('22222222-2222-2222-2222-222222222222'::uuid, 'demo_savings_michael', 'demo_token_michael_2', 'Money Market', 'depository', 'savings', 27500.00, 'Capital One', 'ins_capital_one', '5432', now(), now()),
('22222222-2222-2222-2222-222222222222'::uuid, 'demo_investment_michael', 'demo_token_michael_3', '401(k) Plan', 'investment', '401k', 35000.00, 'Fidelity', 'ins_fidelity', '1111', now(), now())
ON CONFLICT DO NOTHING;

-- Add quiz results for users
INSERT INTO quiz_results (
  user_id,
  category,
  difficulty,
  score,
  correct_answers,
  total_questions,
  xp_earned,
  completed_at
) VALUES
('11111111-1111-1111-1111-111111111111'::uuid, 'Budgeting', 'Beginner', 85, 17, 20, 45, now() - INTERVAL '3 days'),
('11111111-1111-1111-1111-111111111111'::uuid, 'Credit', 'Beginner', 75, 15, 20, 35, now() - INTERVAL '1 day'),
('22222222-2222-2222-2222-222222222222'::uuid, 'Investing', 'Intermediate', 92, 23, 25, 75, now() - INTERVAL '5 days'),
('22222222-2222-2222-2222-222222222222'::uuid, 'Retirement', 'Intermediate', 88, 22, 25, 65, now() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;