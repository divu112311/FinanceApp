/*
  # Add Sample Learning Data and Fix User Profiles

  1. Learning Modules
    - 6 comprehensive learning modules with proper content
    - Covers budgeting, savings, investing, credit, retirement, debt
    - Different difficulty levels and content types

  2. Quiz Questions
    - 2 questions per learning module (12 total)
    - Multiple choice format with explanations
    - Proper scoring system

  3. Sample User Data
    - Sample user profiles for testing
    - XP records and financial goals
    - Realistic demographic data
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
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Introduction to Budgeting',
  'Learn the fundamentals of creating and maintaining a personal budget. This module covers the 50/30/20 rule, tracking expenses, and setting realistic financial goals.',
  'course',
  'Beginner',
  'Budgeting',
  30,
  50,
  1,
  '{}',
  'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg',
  'https://images.pexels.com/photos/4386431/pexels-photo-4386431.jpeg',
  ARRAY['budgeting', 'basics', 'money-management'],
  true
),
(
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'Emergency Fund Essentials',
  'Understand the importance of emergency funds and learn how to build one. Discover how much you need and where to keep your emergency savings.',
  'article',
  'Beginner',
  'Savings',
  20,
  40,
  1,
  '{}',
  'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg',
  'https://images.pexels.com/photos/4386370/pexels-photo-4386370.jpeg',
  ARRAY['emergency-fund', 'savings', 'financial-security'],
  true
),
(
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'Investment Basics',
  'Get started with investing by learning about different asset classes, risk tolerance, and diversification strategies.',
  'video',
  'Intermediate',
  'Investing',
  45,
  75,
  2,
  ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
  'https://images.pexels.com/photos/4386433/pexels-photo-4386433.jpeg',
  'https://images.pexels.com/photos/4386433/pexels-photo-4386433.jpeg',
  ARRAY['investing', 'stocks', 'portfolio'],
  false
),
(
  'd4e5f6a7-b8c9-0123-defb-456789012345',
  'Credit Score Fundamentals',
  'Learn what affects your credit score and how to improve it. Understand credit reports, payment history, and credit utilization.',
  'interactive',
  'Beginner',
  'Credit',
  25,
  45,
  1,
  '{}',
  'https://images.pexels.com/photos/4386372/pexels-photo-4386372.jpeg',
  'https://images.pexels.com/photos/4386372/pexels-photo-4386372.jpeg',
  ARRAY['credit-score', 'credit-report', 'financial-health'],
  true
),
(
  'e5f6a7b8-c9d0-1234-efab-567890123456',
  'Retirement Planning 101',
  'Start planning for retirement with this comprehensive guide to 401(k)s, IRAs, and retirement savings strategies.',
  'course',
  'Intermediate',
  'Retirement',
  60,
  100,
  3,
  ARRAY['c3d4e5f6-a7b8-9012-cdef-345678901234'],
  'https://images.pexels.com/photos/4386434/pexels-photo-4386434.jpeg',
  'https://images.pexels.com/photos/4386434/pexels-photo-4386434.jpeg',
  ARRAY['retirement', '401k', 'ira', 'long-term-planning'],
  false
),
(
  'f6a7b8c9-d0e1-2345-fabc-678901234567',
  'Debt Management Strategies',
  'Learn effective strategies for paying off debt, including the debt snowball and avalanche methods.',
  'article',
  'Intermediate',
  'Debt',
  35,
  60,
  2,
  ARRAY['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
  'https://images.pexels.com/photos/4386371/pexels-photo-4386371.jpeg',
  'https://images.pexels.com/photos/4386371/pexels-photo-4386371.jpeg',
  ARRAY['debt', 'debt-payoff', 'financial-freedom'],
  true
);

-- Create a table for quiz questions (since they're not in the schema but needed for learning modules)
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL DEFAULT 'multiple_choice',
  options jsonb DEFAULT '[]',
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

-- Insert quiz questions for each learning module (2 questions each as requested)
INSERT INTO quiz_questions (module_id, question_text, question_type, options, correct_answer, explanation, points) VALUES
-- Questions for Introduction to Budgeting
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'What does the 50/30/20 budgeting rule recommend for needs?',
  'multiple_choice',
  '["30% of income", "50% of income", "20% of income", "70% of income"]',
  '50% of income',
  'The 50/30/20 rule suggests allocating 50% of your after-tax income to needs, 30% to wants, and 20% to savings and debt repayment.',
  10
),
(
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Which of the following is considered a "need" in budgeting?',
  'multiple_choice',
  '["Netflix subscription", "Housing costs", "Dining out", "New clothes"]',
  'Housing costs',
  'Housing costs (rent/mortgage, utilities) are essential needs, while entertainment subscriptions and dining out are typically categorized as wants.',
  10
),

-- Questions for Emergency Fund Essentials
(
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'How many months of expenses should an emergency fund typically cover?',
  'multiple_choice',
  '["1-2 months", "3-6 months", "12 months", "24 months"]',
  '3-6 months',
  'Financial experts generally recommend having 3-6 months of living expenses saved in an emergency fund to cover unexpected situations.',
  10
),
(
  'b2c3d4e5-f6a7-8901-bcde-f23456789012',
  'Where should you keep your emergency fund?',
  'multiple_choice',
  '["Stock market", "High-yield savings account", "Under your mattress", "Cryptocurrency"]',
  'High-yield savings account',
  'Emergency funds should be easily accessible and safe, making high-yield savings accounts ideal due to their liquidity and FDIC protection.',
  10
),

-- Questions for Investment Basics
(
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'What is diversification in investing?',
  'multiple_choice',
  '["Buying only one stock", "Spreading investments across different assets", "Investing only in bonds", "Day trading"]',
  'Spreading investments across different assets',
  'Diversification means spreading your investments across different asset classes, sectors, and securities to reduce risk.',
  10
),
(
  'c3d4e5f6-a7b8-9012-cdef-345678901234',
  'Which investment typically has higher risk but potentially higher returns?',
  'multiple_choice',
  '["Savings account", "Government bonds", "Stocks", "CDs"]',
  'Stocks',
  'Stocks generally offer higher potential returns than bonds or savings accounts, but they also come with higher volatility and risk.',
  10
),

-- Questions for Credit Score Fundamentals
(
  'd4e5f6a7-b8c9-0123-defb-456789012345',
  'What factor has the biggest impact on your credit score?',
  'multiple_choice',
  '["Credit utilization", "Payment history", "Length of credit history", "Types of credit"]',
  'Payment history',
  'Payment history accounts for about 35% of your credit score, making it the most important factor in determining your creditworthiness.',
  10
),
(
  'd4e5f6a7-b8c9-0123-defb-456789012345',
  'What is the recommended credit utilization ratio?',
  'multiple_choice',
  '["Below 10%", "Below 30%", "Below 50%", "Below 70%"]',
  'Below 30%',
  'Credit experts recommend keeping your credit utilization below 30% of your available credit limit, with below 10% being even better.',
  10
),

-- Questions for Retirement Planning 101
(
  'e5f6a7b8-c9d0-1234-efab-567890123456',
  'What is the main advantage of a 401(k) plan?',
  'multiple_choice',
  '["No contribution limits", "Employer matching", "No taxes ever", "Immediate access to funds"]',
  'Employer matching',
  'Many employers offer matching contributions to 401(k) plans, which is essentially free money toward your retirement savings.',
  10
),
(
  'e5f6a7b8-c9d0-1234-efab-567890123456',
  'At what age can you typically withdraw from a 401(k) without penalties?',
  'multiple_choice',
  '["55", "59½", "62", "65"]',
  '59½',
  'You can generally withdraw from a 401(k) without the 10% early withdrawal penalty starting at age 59½, though you''ll still pay income taxes.',
  10
),

-- Questions for Debt Management Strategies
(
  'f6a7b8c9-d0e1-2345-fabc-678901234567',
  'What is the debt snowball method?',
  'multiple_choice',
  '["Pay minimums on all debts", "Pay off highest interest debt first", "Pay off smallest debt first", "Consolidate all debts"]',
  'Pay off smallest debt first',
  'The debt snowball method focuses on paying off the smallest debt first while making minimum payments on others, building momentum and motivation.',
  10
),
(
  'f6a7b8c9-d0e1-2345-fabc-678901234567',
  'What is the debt avalanche method?',
  'multiple_choice',
  '["Pay off smallest debt first", "Pay off highest interest debt first", "Pay equal amounts on all debts", "Ignore debt completely"]',
  'Pay off highest interest debt first',
  'The debt avalanche method prioritizes paying off debts with the highest interest rates first, which can save more money in the long run.',
  10
);

-- Insert sample users with proper auth integration
-- Note: These are demo credentials for testing purposes
-- Password for all demo users: "demo123!"

-- Demo User 1: Sarah Johnson (Beginner)
DO $$
DECLARE
    demo_user_id_1 uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
    -- Insert into auth.users (this simulates what would happen during signup)
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
    ) VALUES (
        demo_user_id_1,
        '00000000-0000-0000-0000-000000000000',
        'sarah.johnson@demo.com',
        '$2a$10$demo.encrypted.password.hash.for.demo123!',
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Sarah Johnson"}',
        false,
        'authenticated'
    ) ON CONFLICT (id) DO NOTHING;

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
    );

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
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'completed',
        100,
        30,
        now() - INTERVAL '2 days',
        now() - INTERVAL '5 days',
        now() - INTERVAL '2 days'
    ),
    (
        demo_user_id_1,
        'b2c3d4e5-f6a7-8901-bcde-f23456789012',
        'in_progress',
        60,
        12,
        null,
        now() - INTERVAL '1 day',
        now() - INTERVAL '1 hour'
    );
END $$;

-- Demo User 2: Michael Chen (Intermediate)
DO $$
DECLARE
    demo_user_id_2 uuid := '22222222-2222-2222-2222-222222222222';
BEGIN
    -- Insert into auth.users
    INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
    ) VALUES (
        demo_user_id_2,
        '00000000-0000-0000-0000-000000000000',
        'michael.chen@demo.com',
        '$2a$10$demo.encrypted.password.hash.for.demo123!',
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Michael Chen"}',
        false,
        'authenticated'
    ) ON CONFLICT (id) DO NOTHING;

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
    );

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
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'completed',
        100,
        30,
        now() - INTERVAL '10 days',
        now() - INTERVAL '15 days',
        now() - INTERVAL '10 days'
    ),
    (
        demo_user_id_2,
        'c3d4e5f6-a7b8-9012-cdef-345678901234',
        'completed',
        100,
        45,
        now() - INTERVAL '5 days',
        now() - INTERVAL '8 days',
        now() - INTERVAL '5 days'
    ),
    (
        demo_user_id_2,
        'e5f6a7b8-c9d0-1234-efab-567890123456',
        'in_progress',
        75,
        45,
        null,
        now() - INTERVAL '3 days',
        now() - INTERVAL '2 hours'
    );
END $$;