/*
  # Learning System Setup with Sample Data

  1. New Tables
    - `quiz_questions` - Questions for learning module quizzes
      - `id` (uuid, primary key)
      - `module_id` (uuid, foreign key to learning_modules)
      - `question_text` (text)
      - `question_type` (text, default 'multiple_choice')
      - `options` (jsonb, default '[]')
      - `correct_answer` (text)
      - `explanation` (text)
      - `points` (integer, default 10)
      - `created_at` (timestamptz, default now())

  2. Sample Data
    - Learning modules with proper content
    - Quiz questions for each module (2 questions each)
    - Demo users with learning progress
    - User profiles and goals

  3. Security
    - Enable RLS on quiz_questions table
    - Add policy for public read access to quiz questions
*/

-- Insert sample learning modules with comprehensive content
INSERT INTO learning_modules (
  id,
  title,
  description,
  content_type,
  difficulty,
  category,
  duration_minutes,
  xp_reward,
  required_level,
  prerequisites,
  content_url,
  thumbnail_url,
  tags,
  is_featured
) VALUES 
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'Introduction to Budgeting',
  'Learn the fundamentals of creating and maintaining a personal budget. This module covers the 50/30/20 rule, tracking expenses, and setting realistic financial goals.',
  'course',
  'Beginner',
  'Budgeting',
  30,
  50,
  1,
  ARRAY[]::uuid[],
  'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg',
  'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg',
  ARRAY['budgeting', 'basics', 'money-management'],
  true
),
(
  'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid,
  'Emergency Fund Essentials',
  'Understand the importance of emergency funds and learn how to build one. Discover how much you need and where to keep your emergency savings.',
  'article',
  'Beginner',
  'Savings',
  20,
  40,
  1,
  ARRAY[]::uuid[],
  'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg',
  'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg',
  ARRAY['emergency-fund', 'savings', 'financial-security'],
  true
),
(
  'c3d4e5f6-a7b8-9012-cdef-345678901234'::uuid,
  'Investment Basics',
  'Get started with investing by learning about different asset classes, risk tolerance, and diversification strategies.',
  'video',
  'Intermediate',
  'Investing',
  45,
  75,
  2,
  ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid],
  'https://images.pexels.com/photos/4386433/pexels-photo-4386433.jpeg',
  'https://images.pexels.com/photos/4386433/pexels-photo-4386433.jpeg',
  ARRAY['investing', 'stocks', 'portfolio'],
  false
),
(
  'd4e5f6a7-b8c9-0123-defb-456789012345'::uuid,
  'Credit Score Fundamentals',
  'Learn what affects your credit score and how to improve it. Understand credit reports, payment history, and credit utilization.',
  'quiz',
  'Beginner',
  'Credit',
  25,
  45,
  1,
  ARRAY[]::uuid[],
  'https://images.pexels.com/photos/4386372/pexels-photo-4386372.jpeg',
  'https://images.pexels.com/photos/4386372/pexels-photo-4386372.jpeg',
  ARRAY['credit-score', 'credit-report', 'financial-health'],
  true
),
(
  'e5f6a7b8-c9d0-1234-efab-567890123456'::uuid,
  'Retirement Planning 101',
  'Start planning for retirement with this comprehensive guide to 401(k)s, IRAs, and retirement savings strategies.',
  'course',
  'Intermediate',
  'Retirement',
  60,
  100,
  3,
  ARRAY['c3d4e5f6-a7b8-9012-cdef-345678901234'::uuid],
  'https://images.pexels.com/photos/4386434/pexels-photo-4386434.jpeg',
  'https://images.pexels.com/photos/4386434/pexels-photo-4386434.jpeg',
  ARRAY['retirement', '401k', 'ira', 'long-term-planning'],
  false
),
(
  'f6a7b8c9-d0e1-2345-fabc-678901234567'::uuid,
  'Debt Management Strategies',
  'Learn effective strategies for paying off debt, including the debt snowball and avalanche methods.',
  'article',
  'Intermediate',
  'Debt',
  35,
  60,
  2,
  ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid],
  'https://images.pexels.com/photos/4386371/pexels-photo-4386371.jpeg',
  'https://images.pexels.com/photos/4386371/pexels-photo-4386371.jpeg',
  ARRAY['debt', 'debt-payoff', 'financial-freedom'],
  true
),
(
  'g7h8i9j0-k1l2-3456-mnop-789012345678'::uuid,
  'Personal Finance Quiz',
  'Test your knowledge of basic personal finance concepts including budgeting, saving, and investing.',
  'quiz',
  'Beginner',
  'General',
  15,
  30,
  1,
  ARRAY[]::uuid[],
  'https://images.pexels.com/photos/4386435/pexels-photo-4386435.jpeg',
  'https://images.pexels.com/photos/4386435/pexels-photo-4386435.jpeg',
  ARRAY['quiz', 'assessment', 'basics'],
  true
),
(
  'h8i9j0k1-l2m3-4567-nopq-890123456789'::uuid,
  'Investment Strategy Quiz',
  'Challenge yourself with questions about investment strategies, portfolio management, and risk assessment.',
  'quiz',
  'Intermediate',
  'Investing',
  20,
  50,
  2,
  ARRAY['c3d4e5f6-a7b8-9012-cdef-345678901234'::uuid],
  'https://images.pexels.com/photos/4386436/pexels-photo-4386436.jpeg',
  'https://images.pexels.com/photos/4386436/pexels-photo-4386436.jpeg',
  ARRAY['quiz', 'investing', 'strategy'],
  false
);

-- Create quiz questions table if it doesn't exist
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice',
  options jsonb DEFAULT '[]'::jsonb,
  correct_answer text NOT NULL,
  explanation text,
  points integer DEFAULT 10,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for quiz questions
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Create policy for quiz questions (public read access since learning modules are public)
CREATE POLICY "Anyone can read quiz questions"
  ON quiz_questions
  FOR SELECT
  TO public
  USING (true);

-- Insert quiz questions for each learning module
INSERT INTO quiz_questions (module_id, question_text, question_type, options, correct_answer, explanation, points) VALUES
-- Questions for Introduction to Budgeting
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'What does the 50/30/20 budgeting rule recommend for needs?',
  'multiple_choice',
  '["30% of income", "50% of income", "20% of income", "70% of income"]'::jsonb,
  '50% of income',
  'The 50/30/20 rule suggests allocating 50% of your after-tax income to needs, 30% to wants, and 20% to savings and debt repayment.',
  10
),
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
  'Which of the following is considered a "need" in budgeting?',
  'multiple_choice',
  '["Netflix subscription", "Housing costs", "Dining out", "New clothes"]'::jsonb,
  'Housing costs',
  'Housing costs (rent/mortgage, utilities) are essential needs, while entertainment subscriptions and dining out are typically categorized as wants.',
  10
),

-- Questions for Emergency Fund Essentials
(
  'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid,
  'How many months of expenses should an emergency fund typically cover?',
  'multiple_choice',
  '["1-2 months", "3-6 months", "12 months", "24 months"]'::jsonb,
  '3-6 months',
  'Financial experts generally recommend having 3-6 months of living expenses saved in an emergency fund to cover unexpected situations.',
  10
),
(
  'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid,
  'Where should you keep your emergency fund?',
  'multiple_choice',
  '["Stock market", "High-yield savings account", "Under your mattress", "Cryptocurrency"]'::jsonb,
  'High-yield savings account',
  'Emergency funds should be easily accessible and safe, making high-yield savings accounts ideal due to their liquidity and FDIC protection.',
  10
),

-- Questions for Investment Basics
(
  'c3d4e5f6-a7b8-9012-cdef-345678901234'::uuid,
  'What is diversification in investing?',
  'multiple_choice',
  '["Buying only one stock", "Spreading investments across different assets", "Investing only in bonds", "Day trading"]'::jsonb,
  'Spreading investments across different assets',
  'Diversification means spreading your investments across different asset classes, sectors, and securities to reduce risk.',
  10
),
(
  'c3d4e5f6-a7b8-9012-cdef-345678901234'::uuid,
  'Which investment typically has higher risk but potentially higher returns?',
  'multiple_choice',
  '["Savings account", "Government bonds", "Stocks", "CDs"]'::jsonb,
  'Stocks',
  'Stocks generally offer higher potential returns than bonds or savings accounts, but they also come with higher volatility and risk.',
  10
),

-- Questions for Credit Score Fundamentals (Quiz Module)
(
  'd4e5f6a7-b8c9-0123-defb-456789012345'::uuid,
  'What factor has the biggest impact on your credit score?',
  'multiple_choice',
  '["Credit utilization", "Payment history", "Length of credit history", "Types of credit"]'::jsonb,
  'Payment history',
  'Payment history accounts for about 35% of your credit score, making it the most important factor in determining your creditworthiness.',
  10
),
(
  'd4e5f6a7-b8c9-0123-defb-456789012345'::uuid,
  'What is the recommended credit utilization ratio?',
  'multiple_choice',
  '["Below 10%", "Below 30%", "Below 50%", "Below 70%"]'::jsonb,
  'Below 30%',
  'Credit experts recommend keeping your credit utilization below 30% of your available credit limit, with below 10% being even better.',
  10
),

-- Questions for Retirement Planning 101
(
  'e5f6a7b8-c9d0-1234-efab-567890123456'::uuid,
  'What is the main advantage of a 401(k) plan?',
  'multiple_choice',
  '["No contribution limits", "Employer matching", "No taxes ever", "Immediate access to funds"]'::jsonb,
  'Employer matching',
  'Many employers offer matching contributions to 401(k) plans, which is essentially free money toward your retirement savings.',
  10
),
(
  'e5f6a7b8-c9d0-1234-efab-567890123456'::uuid,
  'At what age can you typically withdraw from a 401(k) without penalties?',
  'multiple_choice',
  '["55", "59½", "62", "65"]'::jsonb,
  '59½',
  'You can generally withdraw from a 401(k) without the 10% early withdrawal penalty starting at age 59½, though you will still pay income taxes.',
  10
),

-- Questions for Debt Management Strategies
(
  'f6a7b8c9-d0e1-2345-fabc-678901234567'::uuid,
  'What is the debt snowball method?',
  'multiple_choice',
  '["Pay minimums on all debts", "Pay off highest interest debt first", "Pay off smallest debt first", "Consolidate all debts"]'::jsonb,
  'Pay off smallest debt first',
  'The debt snowball method focuses on paying off the smallest debt first while making minimum payments on others, building momentum and motivation.',
  10
),
(
  'f6a7b8c9-d0e1-2345-fabc-678901234567'::uuid,
  'What is the debt avalanche method?',
  'multiple_choice',
  '["Pay off smallest debt first", "Pay off highest interest debt first", "Pay equal amounts on all debts", "Ignore debt completely"]'::jsonb,
  'Pay off highest interest debt first',
  'The debt avalanche method prioritizes paying off debts with the highest interest rates first, which can save more money in the long run.',
  10
),

-- Questions for Personal Finance Quiz (Quiz Module)
(
  'g7h8i9j0-k1l2-3456-mnop-789012345678'::uuid,
  'What percentage of your income should you aim to save each month?',
  'multiple_choice',
  '["5%", "10%", "20%", "50%"]'::jsonb,
  '20%',
  'Financial experts typically recommend saving at least 20% of your income, which includes both emergency savings and retirement contributions.',
  15
),
(
  'g7h8i9j0-k1l2-3456-mnop-789012345678'::uuid,
  'Which of these is the best first step in financial planning?',
  'multiple_choice',
  '["Investing in stocks", "Creating a budget", "Buying insurance", "Getting a credit card"]'::jsonb,
  'Creating a budget',
  'Creating a budget is the foundation of financial planning as it helps you understand your income, expenses, and spending patterns.',
  15
),

-- Questions for Investment Strategy Quiz (Quiz Module)
(
  'h8i9j0k1-l2m3-4567-nopq-890123456789'::uuid,
  'What is dollar-cost averaging?',
  'multiple_choice',
  '["Buying stocks at the lowest price", "Investing the same amount regularly", "Selling when prices are high", "Only investing in expensive stocks"]'::jsonb,
  'Investing the same amount regularly',
  'Dollar-cost averaging involves investing a fixed amount of money at regular intervals, regardless of market conditions, which can help reduce the impact of market volatility.',
  25
),
(
  'h8i9j0k1-l2m3-4567-nopq-890123456789'::uuid,
  'What does "risk tolerance" mean in investing?',
  'multiple_choice',
  '["How much money you can invest", "How much volatility you can handle", "How long you plan to invest", "How many stocks you own"]'::jsonb,
  'How much volatility you can handle',
  'Risk tolerance refers to your ability and willingness to handle fluctuations in the value of your investments without making emotional decisions.',
  25
);

-- Insert sample users with proper structure
-- Note: These are demo credentials for testing purposes

-- Demo User 1: Sarah Johnson (Beginner)
DO $$
DECLARE
    demo_user_id_1 uuid := '11111111-1111-1111-1111-111111111111'::uuid;
BEGIN
    -- Insert user profile
    INSERT INTO users (
        id,
        email,
        full_name,
        created_at
    ) VALUES (
        demo_user_id_1,
        'sarah.johnson@demo.com',
        'Sarah Johnson',
        now()
    ) ON CONFLICT (id) DO NOTHING;

    -- Insert user profile details
    INSERT INTO user_profiles (
        user_id,
        age_range,
        income_range,
        financial_experience,
        primary_goals,
        learning_style,
        time_availability,
        interests,
        created_at
    ) VALUES (
        demo_user_id_1,
        '25-34',
        '$50,000-$75,000',
        'Beginner',
        ARRAY['Build emergency fund', 'Start investing', 'Improve credit score'],
        'Visual',
        '30min',
        ARRAY['budgeting', 'investing', 'credit'],
        now()
    ) ON CONFLICT (user_id) DO NOTHING;

    -- Insert XP record
    INSERT INTO xp (
        user_id,
        points,
        badges
    ) VALUES (
        demo_user_id_1,
        150,
        ARRAY['Welcome', 'First Module Complete']
    ) ON CONFLICT (user_id) DO NOTHING;

    -- Insert goals
    INSERT INTO goals (
        user_id,
        name,
        target_amount,
        saved_amount,
        deadline,
        category,
        created_at
    ) VALUES 
    (
        demo_user_id_1,
        'Emergency Fund',
        5000.00,
        1250.00,
        CURRENT_DATE + INTERVAL '6 months',
        'emergency',
        now()
    ),
    (
        demo_user_id_1,
        'Vacation Fund',
        3000.00,
        800.00,
        CURRENT_DATE + INTERVAL '12 months',
        'vacation',
        now()
    ) ON CONFLICT DO NOTHING;

    -- Insert learning progress
    INSERT INTO user_learning_progress (
        user_id,
        module_id,
        status,
        progress_percentage,
        time_spent_minutes,
        completed_at,
        started_at,
        last_accessed_at
    ) VALUES 
    (
        demo_user_id_1,
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
        'completed',
        100,
        30,
        now() - INTERVAL '2 days',
        now() - INTERVAL '5 days',
        now() - INTERVAL '2 days'
    ),
    (
        demo_user_id_1,
        'b2c3d4e5-f6a7-8901-bcde-f23456789012'::uuid,
        'in_progress',
        60,
        12,
        null,
        now() - INTERVAL '1 day',
        now() - INTERVAL '1 hour'
    ) ON CONFLICT (user_id, module_id) DO NOTHING;
END $$;

-- Demo User 2: Michael Chen (Intermediate)
DO $$
DECLARE
    demo_user_id_2 uuid := '22222222-2222-2222-2222-222222222222'::uuid;
BEGIN
    -- Insert user profile
    INSERT INTO users (
        id,
        email,
        full_name,
        created_at
    ) VALUES (
        demo_user_id_2,
        'michael.chen@demo.com',
        'Michael Chen',
        now()
    ) ON CONFLICT (id) DO NOTHING;

    -- Insert user profile details
    INSERT INTO user_profiles (
        user_id,
        age_range,
        income_range,
        financial_experience,
        primary_goals,
        learning_style,
        time_availability,
        interests,
        created_at
    ) VALUES (
        demo_user_id_2,
        '35-44',
        '$75,000-$100,000',
        'Intermediate',
        ARRAY['Retirement planning', 'Pay off debt', 'Save for house'],
        'Reading',
        '1hour',
        ARRAY['retirement', 'real-estate', 'debt-management'],
        now()
    ) ON CONFLICT (user_id) DO NOTHING;

    -- Insert XP record
    INSERT INTO xp (
        user_id,
        points,
        badges
    ) VALUES (
        demo_user_id_2,
        420,
        ARRAY['Welcome', 'First Module Complete', 'Quiz Master', 'Investment Explorer']
    ) ON CONFLICT (user_id) DO NOTHING;

    -- Insert goals
    INSERT INTO goals (
        user_id,
        name,
        target_amount,
        saved_amount,
        deadline,
        category,
        created_at
    ) VALUES 
    (
        demo_user_id_2,
        'House Down Payment',
        50000.00,
        22500.00,
        CURRENT_DATE + INTERVAL '18 months',
        'house',
        now()
    ),
    (
        demo_user_id_2,
        'Retirement Fund',
        100000.00,
        35000.00,
        CURRENT_DATE + INTERVAL '5 years',
        'savings',
        now()
    ) ON CONFLICT DO NOTHING;

    -- Insert learning progress
    INSERT INTO user_learning_progress (
        user_id,
        module_id,
        status,
        progress_percentage,
        time_spent_minutes,
        completed_at,
        started_at,
        last_accessed_at
    ) VALUES 
    (
        demo_user_id_2,
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::uuid,
        'completed',
        100,
        30,
        now() - INTERVAL '10 days',
        now() - INTERVAL '15 days',
        now() - INTERVAL '10 days'
    ),
    (
        demo_user_id_2,
        'c3d4e5f6-a7b8-9012-cdef-345678901234'::uuid,
        'completed',
        100,
        45,
        now() - INTERVAL '5 days',
        now() - INTERVAL '8 days',
        now() - INTERVAL '5 days'
    ),
    (
        demo_user_id_2,
        'e5f6a7b8-c9d0-1234-efab-567890123456'::uuid,
        'in_progress',
        75,
        45,
        null,
        now() - INTERVAL '3 days',
        now() - INTERVAL '2 hours'
    ) ON CONFLICT (user_id, module_id) DO NOTHING;
END $$;