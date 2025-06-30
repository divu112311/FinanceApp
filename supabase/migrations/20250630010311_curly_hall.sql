-- Create table for financial concepts first since it's referenced by other tables
CREATE TABLE IF NOT EXISTS financial_concepts (
  concept_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_name TEXT NOT NULL,
  concept_category TEXT NOT NULL,
  difficulty_level INTEGER NOT NULL DEFAULT 1, -- 1-10 scale
  description TEXT NOT NULL,
  prerequisites JSONB DEFAULT '[]'::jsonb, -- Array of concept_ids that should be understood first
  related_concepts JSONB DEFAULT '[]'::jsonb, -- Array of related concept_ids
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table to track user's knowledge of financial concepts
CREATE TABLE IF NOT EXISTS user_knowledge_areas (
  knowledge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES financial_concepts(concept_id),
  proficiency_level INTEGER NOT NULL DEFAULT 1, -- 1-10 scale
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.5, -- 0-1 scale
  last_assessed TIMESTAMPTZ NOT NULL DEFAULT now(),
  times_encountered INTEGER NOT NULL DEFAULT 1,
  times_answered_correctly INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create table for default learning modules (for new users)
CREATE TABLE IF NOT EXISTS default_learning_modules (
  default_module_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('article', 'quiz', 'video', 'interactive', 'course')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  category TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 15,
  xp_reward INTEGER NOT NULL DEFAULT 25,
  content_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_hash TEXT NOT NULL, -- For deduplication
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add knowledge tracking fields to learning_content_queue
ALTER TABLE learning_content_queue ADD COLUMN IF NOT EXISTS target_concepts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE learning_content_queue ADD COLUMN IF NOT EXISTS knowledge_requirements JSONB DEFAULT '{}'::jsonb;
ALTER TABLE learning_content_queue ADD COLUMN IF NOT EXISTS knowledge_gain JSONB DEFAULT '{}'::jsonb;

-- Add knowledge tracking fields to learning_modules
ALTER TABLE learning_modules ADD COLUMN IF NOT EXISTS target_concepts JSONB DEFAULT '[]'::jsonb;
ALTER TABLE learning_modules ADD COLUMN IF NOT EXISTS knowledge_requirements JSONB DEFAULT '{}'::jsonb;
ALTER TABLE learning_modules ADD COLUMN IF NOT EXISTS knowledge_gain JSONB DEFAULT '{}'::jsonb;

-- Add knowledge tracking fields to learning_content_history
ALTER TABLE learning_content_history ADD COLUMN IF NOT EXISTS knowledge_gained JSONB DEFAULT '{}'::jsonb;
ALTER TABLE learning_content_history ADD COLUMN IF NOT EXISTS concepts_mastered JSONB DEFAULT '[]'::jsonb;

-- Add knowledge tracking fields to user_profiles
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS knowledge_areas JSONB DEFAULT '{}'::jsonb;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS learning_progression JSONB DEFAULT '{
  "current_difficulty": 1,
  "max_difficulty": 10,
  "progression_rate": 1.0,
  "mastered_concepts": [],
  "struggling_concepts": [],
  "preferred_learning_pace": "normal"
}'::jsonb;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_knowledge_areas_user_id ON user_knowledge_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_knowledge_areas_concept_id ON user_knowledge_areas(concept_id);
CREATE INDEX IF NOT EXISTS idx_financial_concepts_category ON financial_concepts(concept_category);
CREATE INDEX IF NOT EXISTS idx_financial_concepts_difficulty ON financial_concepts(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_default_learning_modules_difficulty ON default_learning_modules(difficulty);
CREATE INDEX IF NOT EXISTS idx_default_learning_modules_category ON default_learning_modules(category);
CREATE INDEX IF NOT EXISTS idx_learning_modules_generated_by ON learning_modules USING gin ((content_data -> 'generated_by'));

-- Enable RLS on new tables
ALTER TABLE user_knowledge_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE default_learning_modules ENABLE ROW LEVEL SECURITY;

-- Create policies for user_knowledge_areas
CREATE POLICY "Users can read their own knowledge areas" 
  ON user_knowledge_areas
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for financial_concepts
CREATE POLICY "Anyone can read financial concepts" 
  ON financial_concepts
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for default_learning_modules
CREATE POLICY "Anyone can read default learning modules" 
  ON default_learning_modules
  FOR SELECT
  TO authenticated
  USING (true);

-- Create function to initialize default content for new users
CREATE OR REPLACE FUNCTION initialize_user_content(user_id UUID) 
RETURNS INTEGER AS $$
DECLARE
  deployed_count INTEGER := 0;
  default_module RECORD;
  new_module_id UUID;
BEGIN
  -- Check if user already has modules
  IF EXISTS (
    SELECT 1 FROM learning_modules lm
    JOIN user_learning_progress ulp ON lm.id = ulp.module_id
    WHERE ulp.user_id = user_id
  ) THEN
    RETURN 0; -- User already has modules
  END IF;
  
  -- Deploy default modules for new user
  FOR default_module IN 
    SELECT * FROM default_learning_modules
    WHERE is_active = true
    ORDER BY difficulty, created_at
    LIMIT 10
  LOOP
    -- Insert into learning_modules
    INSERT INTO learning_modules (
      title, description, content_type, difficulty, category,
      duration_minutes, xp_reward, content_data, is_active,
      tags, content_hash, required_level
    ) VALUES (
      default_module.title, default_module.description, default_module.content_type,
      default_module.difficulty, default_module.category, default_module.duration_minutes,
      default_module.xp_reward, default_module.content_data, true,
      ARRAY[default_module.category, default_module.difficulty, default_module.content_type],
      default_module.content_hash, 1
    ) RETURNING id INTO new_module_id;
    
    deployed_count := deployed_count + 1;
  END LOOP;
  
  RETURN deployed_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to assess user knowledge level
CREATE OR REPLACE FUNCTION assess_user_knowledge(user_id UUID, concept_id UUID, correct BOOLEAN) 
RETURNS VOID AS $$
DECLARE
  knowledge_record RECORD;
  new_proficiency INTEGER;
  new_confidence NUMERIC(3,2);
BEGIN
  -- Get current knowledge record
  SELECT * INTO knowledge_record 
  FROM user_knowledge_areas 
  WHERE user_id = user_id AND concept_id = concept_id;
  
  IF knowledge_record IS NULL THEN
    -- Create new knowledge record
    INSERT INTO user_knowledge_areas (
      user_id, concept_id, times_encountered,
      times_answered_correctly, proficiency_level, confidence_score
    ) VALUES (
      user_id, concept_id, 1,
      CASE WHEN correct THEN 1 ELSE 0 END,
      CASE WHEN correct THEN 2 ELSE 1 END,
      CASE WHEN correct THEN 0.6 ELSE 0.4 END
    );
  ELSE
    -- Update existing knowledge record
    new_proficiency := knowledge_record.proficiency_level;
    new_confidence := knowledge_record.confidence_score;
    
    -- Adjust proficiency based on answer
    IF correct THEN
      new_proficiency := LEAST(10, knowledge_record.proficiency_level + 1);
      new_confidence := LEAST(1.0, knowledge_record.confidence_score + 0.1);
    ELSE
      new_proficiency := GREATEST(1, knowledge_record.proficiency_level - 1);
      new_confidence := GREATEST(0.1, knowledge_record.confidence_score - 0.1);
    END IF;
    
    -- Update record
    UPDATE user_knowledge_areas
    SET proficiency_level = new_proficiency,
        confidence_score = new_confidence,
        times_encountered = knowledge_record.times_encountered + 1,
        times_answered_correctly = knowledge_record.times_answered_correctly + (CASE WHEN correct THEN 1 ELSE 0 END),
        last_assessed = now(),
        updated_at = now()
    WHERE knowledge_id = knowledge_record.knowledge_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get appropriate difficulty level for user
CREATE OR REPLACE FUNCTION get_user_difficulty_level(user_id UUID) 
RETURNS INTEGER AS $$
DECLARE
  avg_proficiency NUMERIC;
  progression_rate NUMERIC;
  current_difficulty INTEGER;
  profile_record RECORD;
BEGIN
  -- Get user's average proficiency across all knowledge areas
  SELECT COALESCE(AVG(proficiency_level), 1) INTO avg_proficiency
  FROM user_knowledge_areas
  WHERE user_id = user_id;
  
  -- Get user's progression settings
  SELECT * INTO profile_record
  FROM user_profiles
  WHERE user_id = user_id;
  
  IF profile_record IS NULL THEN
    RETURN 1; -- Default to beginner if no profile
  END IF;
  
  -- Extract progression settings
  current_difficulty := (profile_record.learning_progression->>'current_difficulty')::INTEGER;
  IF current_difficulty IS NULL THEN current_difficulty := 1; END IF;
  
  progression_rate := (profile_record.learning_progression->>'progression_rate')::NUMERIC;
  IF progression_rate IS NULL THEN progression_rate := 1.0; END IF;
  
  -- Calculate new difficulty level based on proficiency and progression rate
  RETURN GREATEST(1, LEAST(10, 
    CASE 
      WHEN avg_proficiency IS NULL THEN current_difficulty
      ELSE CEIL(avg_proficiency * progression_rate)
    END
  ));
END;
$$ LANGUAGE plpgsql;

-- Create function to update user's learning progression
CREATE OR REPLACE FUNCTION update_learning_progression(user_id UUID) 
RETURNS VOID AS $$
DECLARE
  new_difficulty INTEGER;
  profile_record RECORD;
  mastered_concepts JSONB;
  struggling_concepts JSONB;
BEGIN
  -- Get new difficulty level
  new_difficulty := get_user_difficulty_level(user_id);
  
  -- Get mastered concepts (proficiency >= 8)
  SELECT COALESCE(jsonb_agg(concept_id), '[]'::jsonb) INTO mastered_concepts
  FROM user_knowledge_areas
  WHERE user_id = user_id AND proficiency_level >= 8;
  
  -- Get struggling concepts (proficiency <= 3 and encountered >= 3 times)
  SELECT COALESCE(jsonb_agg(concept_id), '[]'::jsonb) INTO struggling_concepts
  FROM user_knowledge_areas
  WHERE user_id = user_id AND proficiency_level <= 3 AND times_encountered >= 3;
  
  -- Update user profile
  UPDATE user_profiles
  SET learning_progression = jsonb_set(
    jsonb_set(
      jsonb_set(
        COALESCE(learning_progression, '{}'::jsonb),
        '{current_difficulty}',
        to_jsonb(new_difficulty)
      ),
      '{mastered_concepts}',
      mastered_concepts
    ),
    '{struggling_concepts}',
    struggling_concepts
  ),
  updated_at = now()
  WHERE user_id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Insert some initial financial concepts
INSERT INTO financial_concepts (concept_name, concept_category, difficulty_level, description)
VALUES
  ('Budgeting Basics', 'Budgeting', 1, 'Understanding the fundamentals of creating and maintaining a budget'),
  ('50/30/20 Rule', 'Budgeting', 2, 'Allocating 50% to needs, 30% to wants, and 20% to savings and debt repayment'),
  ('Zero-Based Budgeting', 'Budgeting', 3, 'Assigning every dollar a purpose until income minus expenses equals zero'),
  ('Emergency Fund', 'Savings', 1, 'Setting aside 3-6 months of expenses for unexpected situations'),
  ('High-Yield Savings', 'Savings', 2, 'Utilizing accounts with higher interest rates for better returns'),
  ('Debt-to-Income Ratio', 'Debt Management', 3, 'The percentage of gross monthly income that goes to paying debts'),
  ('Credit Utilization', 'Credit', 2, 'The ratio of current credit card balances to credit limits'),
  ('Compound Interest', 'Investing', 2, 'Interest calculated on initial principal and accumulated interest'),
  ('Index Funds', 'Investing', 3, 'Investment funds that track market indexes like S&P 500'),
  ('Asset Allocation', 'Investing', 4, 'Distribution of investments across different asset classes'),
  ('Tax-Advantaged Accounts', 'Retirement', 4, 'Accounts with tax benefits for retirement savings'),
  ('Dollar-Cost Averaging', 'Investing', 3, 'Investing a fixed amount regularly regardless of market conditions'),
  ('Debt Avalanche', 'Debt Management', 2, 'Paying off debts with highest interest rates first'),
  ('Debt Snowball', 'Debt Management', 2, 'Paying off smallest debts first for psychological wins'),
  ('Sinking Funds', 'Budgeting', 3, 'Saving regularly for specific planned expenses'),
  ('Net Worth', 'Financial Health', 2, 'Total assets minus total liabilities'),
  ('Expense Ratio', 'Investing', 4, 'Annual fee charged by investment funds as percentage of assets'),
  ('Risk Tolerance', 'Investing', 3, 'Ability to endure market volatility and investment losses'),
  ('Diversification', 'Investing', 3, 'Spreading investments across different assets to reduce risk'),
  ('Inflation', 'Economics', 2, 'The rate at which the general level of prices rises'),
  ('Opportunity Cost', 'Economics', 3, 'The loss of potential gain from other alternatives when one is chosen'),
  ('Liquidity', 'Financial Planning', 2, 'How quickly an asset can be converted to cash without affecting its price'),
  ('Capital Gains', 'Taxes', 4, 'Profit from selling an asset that has increased in value'),
  ('Tax-Loss Harvesting', 'Taxes', 5, 'Selling investments at a loss to offset capital gains tax liability'),
  ('Rebalancing', 'Investing', 4, 'Adjusting portfolio allocations back to target percentages');

-- Insert some default learning modules for new users
INSERT INTO default_learning_modules (title, description, content_type, difficulty, category, duration_minutes, xp_reward, content_data, content_hash)
VALUES
  ('Budgeting 101: Getting Started', 'Learn the fundamentals of creating a budget that works for your lifestyle', 'article', 'Beginner', 'Budgeting', 15, 25, 
   jsonb_build_object(
     'sections', jsonb_build_array(
       jsonb_build_object(
         'title', 'Why Budgeting Matters',
         'content', 'Budgeting is the foundation of financial success. It helps you understand where your money goes, ensures you live within your means, and enables you to prioritize your spending according to your values and goals.'
       ),
       jsonb_build_object(
         'title', 'The 50/30/20 Rule',
         'content', 'A simple way to start budgeting is the 50/30/20 rule. Allocate 50% of your income to needs (housing, food, utilities), 30% to wants (entertainment, dining out), and 20% to savings and debt repayment.'
       ),
       jsonb_build_object(
         'title', 'Tracking Your Expenses',
         'content', 'The first step in creating a budget is understanding your current spending. Track all expenses for at least 30 days, categorizing each transaction to identify patterns and areas for improvement.'
       ),
       jsonb_build_object(
         'title', 'Setting Realistic Goals',
         'content', 'Your budget should reflect your financial goals. Whether you''re saving for a vacation, paying off debt, or building an emergency fund, your budget is the roadmap to get there.'
       )
     ),
     'generated_by', 'default_content',
     'generated_at', '2025-06-30T00:00:00Z'
   ), 
   'budget-101-default'),
   
  ('Emergency Fund Essentials', 'Discover why emergency funds are crucial and how to build one', 'article', 'Beginner', 'Savings', 12, 20, 
   jsonb_build_object(
     'sections', jsonb_build_array(
       jsonb_build_object(
         'title', 'What Is an Emergency Fund?',
         'content', 'An emergency fund is money set aside specifically for unexpected expenses or financial emergencies, such as medical bills, car repairs, or job loss.'
       ),
       jsonb_build_object(
         'title', 'How Much Should You Save?',
         'content', 'Financial experts typically recommend saving 3-6 months of essential expenses. Start with a mini emergency fund of $1,000 while paying off high-interest debt, then build toward your full target.'
       ),
       jsonb_build_object(
         'title', 'Where to Keep Your Emergency Fund',
         'content', 'Your emergency fund should be liquid (easily accessible) but not too accessible (to avoid temptation). High-yield savings accounts are ideal - they offer better returns than traditional savings accounts while maintaining FDIC insurance and liquidity.'
       ),
       jsonb_build_object(
         'title', 'Building Your Fund Gradually',
         'content', 'Start small and be consistent. Even $25-50 per week adds up over time. Consider automating transfers to your emergency fund on payday to make saving effortless.'
       )
     ),
     'generated_by', 'default_content',
     'generated_at', '2025-06-30T00:00:00Z'
   ), 
   'emergency-fund-default'),
   
  ('Understanding Credit Scores', 'Learn what makes up your credit score and how to improve it', 'article', 'Beginner', 'Credit', 15, 25, 
   jsonb_build_object(
     'sections', jsonb_build_array(
       jsonb_build_object(
         'title', 'What Is a Credit Score?',
         'content', 'A credit score is a three-digit number that represents your creditworthiness. Lenders use this score to determine whether to approve you for loans and credit cards, and what interest rates to charge.'
       ),
       jsonb_build_object(
         'title', 'Factors That Affect Your Score',
         'content', 'Your FICO credit score is determined by: Payment History (35%), Credit Utilization (30%), Length of Credit History (15%), New Credit (10%), and Credit Mix (10%).'
       ),
       jsonb_build_object(
         'title', 'Checking Your Credit Report',
         'content', 'You can get free credit reports from all three major bureaus (Equifax, Experian, and TransUnion) at AnnualCreditReport.com. Review them regularly for errors or fraudulent activity.'
       ),
       jsonb_build_object(
         'title', 'Simple Ways to Improve Your Score',
         'content', 'Pay all bills on time, keep credit card balances below 30% of your limits, avoid opening multiple new accounts in a short period, and keep old accounts open to maintain a longer credit history.'
       )
     ),
     'generated_by', 'default_content',
     'generated_at', '2025-06-30T00:00:00Z'
   ), 
   'credit-scores-default'),
   
  ('Debt Payoff Strategies', 'Compare different methods for eliminating debt efficiently', 'article', 'Beginner', 'Debt Management', 18, 30, 
   jsonb_build_object(
     'sections', jsonb_build_array(
       jsonb_build_object(
         'title', 'Debt Avalanche Method',
         'content', 'The debt avalanche method involves paying minimum payments on all debts, then putting extra money toward the debt with the highest interest rate. This approach saves the most money in interest over time.'
       ),
       jsonb_build_object(
         'title', 'Debt Snowball Method',
         'content', 'The debt snowball method focuses on paying off your smallest debts first, regardless of interest rate. This creates psychological wins that can help maintain motivation throughout your debt payoff journey.'
       ),
       jsonb_build_object(
         'title', 'Debt Consolidation Options',
         'content', 'Consolidating multiple debts into a single loan with a lower interest rate can simplify payments and reduce interest costs. Options include balance transfer credit cards, personal loans, and home equity loans.'
       ),
       jsonb_build_object(
         'title', 'Creating a Debt Payoff Plan',
         'content', 'List all your debts with their balances, interest rates, and minimum payments. Choose a strategy, determine how much extra you can put toward debt each month, and track your progress to stay motivated.'
       )
     ),
     'generated_by', 'default_content',
     'generated_at', '2025-06-30T00:00:00Z'
   ), 
   'debt-payoff-default'),
   
  ('Investing Basics', 'Learn the fundamentals of investing and building wealth', 'article', 'Beginner', 'Investing', 20, 35, 
   jsonb_build_object(
     'sections', jsonb_build_array(
       jsonb_build_object(
         'title', 'Why Invest?',
         'content', 'Investing allows your money to grow through compound interest and appreciation, helping you build wealth and beat inflation over time. While saving is important for short-term goals, investing is crucial for long-term financial success.'
       ),
       jsonb_build_object(
         'title', 'Types of Investments',
         'content', 'Common investment types include stocks (ownership in companies), bonds (loans to companies or governments), mutual funds and ETFs (collections of stocks or bonds), and real estate. Each has different risk and return characteristics.'
       ),
       jsonb_build_object(
         'title', 'Understanding Risk and Return',
         'content', 'Generally, higher potential returns come with higher risk. Your risk tolerance depends on your financial goals, time horizon, and personal comfort with market fluctuations.'
       ),
       jsonb_build_object(
         'title', 'Getting Started with Small Amounts',
         'content', 'You don''t need a lot of money to start investing. Many brokerages offer commission-free trades and no minimum investments. Consider starting with a broad-market index fund that provides instant diversification.'
       )
     ),
     'generated_by', 'default_content',
     'generated_at', '2025-06-30T00:00:00Z'
   ), 
   'investing-basics-default'),
   
  ('Financial Fundamentals Quiz', 'Test your knowledge of essential financial concepts', 'quiz', 'Beginner', 'General', 10, 50, 
   jsonb_build_object(
     'questions', jsonb_build_array(
       jsonb_build_object(
         'question_text', 'What does the 50/30/20 budgeting rule recommend for needs?',
         'options', jsonb_build_array('30% of income', '50% of income', '20% of income', '70% of income'),
         'correct_answer', '50% of income',
         'explanation', 'The 50/30/20 rule suggests allocating 50% of your after-tax income to needs, 30% to wants, and 20% to savings and debt repayment.'
       ),
       jsonb_build_object(
         'question_text', 'Which of these is typically considered a ''need'' in budgeting?',
         'options', jsonb_build_array('Netflix subscription', 'Housing costs', 'Dining out', 'New clothes'),
         'correct_answer', 'Housing costs',
         'explanation', 'Needs are expenses that are essential for living, such as housing, utilities, groceries, and basic transportation.'
       ),
       jsonb_build_object(
         'question_text', 'What is the recommended minimum amount for an emergency fund?',
         'options', jsonb_build_array('$100', '$500', '1 month of expenses', '3-6 months of expenses'),
         'correct_answer', '3-6 months of expenses',
         'explanation', 'Financial experts generally recommend having 3-6 months of essential expenses saved in an emergency fund.'
       ),
       jsonb_build_object(
         'question_text', 'Which type of account typically offers the highest interest rate?',
         'options', jsonb_build_array('Checking account', 'Traditional savings account', 'High-yield savings account', 'Money market account'),
         'correct_answer', 'High-yield savings account',
         'explanation', 'High-yield savings accounts, often offered by online banks, typically provide much higher interest rates than traditional bank accounts.'
       ),
       jsonb_build_object(
         'question_text', 'What is the first recommended step in creating a financial plan?',
         'options', jsonb_build_array('Investing in stocks', 'Creating a budget', 'Opening a credit card', 'Taking out a loan'),
         'correct_answer', 'Creating a budget',
         'explanation', 'A budget is the foundation of any financial plan, as it helps you understand your income, expenses, and where your money is going.'
       )
     ),
     'generated_by', 'default_content',
     'generated_at', '2025-06-30T00:00:00Z'
   ), 
   'financial-quiz-default'),
   
  ('Setting SMART Financial Goals', 'Learn how to create effective, achievable financial goals', 'article', 'Beginner', 'Goal Setting', 15, 25, 
   jsonb_build_object(
     'sections', jsonb_build_array(
       jsonb_build_object(
         'title', 'What Makes a Goal SMART?',
         'content', 'SMART goals are Specific, Measurable, Achievable, Relevant, and Time-bound. Instead of ''save more money,'' a SMART goal would be ''save $5,000 for an emergency fund by December 31st by setting aside $500 monthly.'''
       ),
       jsonb_build_object(
         'title', 'Aligning Goals with Your Values',
         'content', 'The most motivating financial goals connect to your personal values and vision for the future. Consider what truly matters to you when setting goals, whether it''s security, freedom, family, or experiences.'
       ),
       jsonb_build_object(
         'title', 'Short, Medium, and Long-Term Goals',
         'content', 'Balance your financial plan with goals across different time horizons. Short-term (under 1 year), medium-term (1-5 years), and long-term (5+ years) goals work together to create a comprehensive financial strategy.'
       ),
       jsonb_build_object(
         'title', 'Tracking Progress and Staying Motivated',
         'content', 'Regularly review your goals, track your progress visually, celebrate milestones, and adjust as needed. Consider sharing goals with an accountability partner or financial advisor for additional support.'
       )
     ),
     'generated_by', 'default_content',
     'generated_at', '2025-06-30T00:00:00Z'
   ), 
   'smart-goals-default'),
   
  ('Understanding Compound Interest', 'Discover how compound interest can work for or against you', 'article', 'Beginner', 'Investing', 12, 20, 
   jsonb_build_object(
     'sections', jsonb_build_array(
       jsonb_build_object(
         'title', 'The Eighth Wonder of the World',
         'content', 'Albert Einstein allegedly called compound interest the eighth wonder of the world, saying ''He who understands it, earns it; he who doesn''t, pays it.'' Compound interest is interest calculated on both the initial principal and the accumulated interest from previous periods.'
       ),
       jsonb_build_object(
         'title', 'The Rule of 72',
         'content', 'To estimate how long it will take for your money to double, divide 72 by your annual interest rate. For example, at 8% interest, your money will double in approximately 9 years (72 ÷ 8 = 9).'
       ),
       jsonb_build_object(
         'title', 'The Power of Time',
         'content', 'Starting early is crucial with compound interest. Even small amounts invested over long periods can grow substantially. For example, $1,000 invested at 8% for 40 years would grow to about $21,725, while the same amount invested for 20 years would only reach $4,661.'
       ),
       jsonb_build_object(
         'title', 'The Dark Side: Debt',
         'content', 'Compound interest works against you with debt, especially high-interest debt like credit cards. A $5,000 credit card balance at 18% interest would take over 30 years to pay off making only minimum payments, costing over $13,000 in interest.'
       )
     ),
     'generated_by', 'default_content',
     'generated_at', '2025-06-30T00:00:00Z'
   ), 
   'compound-interest-default'),
   
  ('Automating Your Finances', 'Learn how to set up systems that make good financial habits effortless', 'article', 'Beginner', 'Financial Planning', 15, 25, 
   jsonb_build_object(
     'sections', jsonb_build_array(
       jsonb_build_object(
         'title', 'Why Automation Works',
         'content', 'Automation removes the willpower element from financial decisions, ensuring consistency even when motivation wanes. It also eliminates the risk of forgetting payments or savings contributions.'
       ),
       jsonb_build_object(
         'title', 'Setting Up Direct Deposit Splits',
         'content', 'Many employers allow you to split your direct deposit between multiple accounts. Consider automatically directing a percentage of your paycheck to savings or investment accounts before it hits your checking account.'
       ),
       jsonb_build_object(
         'title', 'Automating Bill Payments',
         'content', 'Set up automatic payments for recurring bills to avoid late fees and protect your credit score. Schedule these shortly after your regular payday to ensure sufficient funds are available.'
       ),
       jsonb_build_object(
         'title', 'Creating a System of Savings Buckets',
         'content', 'Use multiple savings accounts or ''buckets'' within one account for different goals. Automatically transfer money to these accounts on payday, treating savings as a non-negotiable expense.'
       )
     ),
     'generated_by', 'default_content',
     'generated_at', '2025-06-30T00:00:00Z'
   ), 
   'automating-finances-default'),
   
  ('Understanding Your Net Worth', 'Learn how to calculate and track your net worth over time', 'article', 'Beginner', 'Financial Health', 10, 20, 
   jsonb_build_object(
     'sections', jsonb_build_array(
       jsonb_build_object(
         'title', 'What Is Net Worth?',
         'content', 'Net worth is the difference between your assets (what you own) and your liabilities (what you owe). It provides a snapshot of your overall financial health at a point in time.'
       ),
       jsonb_build_object(
         'title', 'Calculating Your Net Worth',
         'content', 'List all your assets (cash, investments, property, vehicles, etc.) and their current values. Then list all your liabilities (mortgages, loans, credit card debt, etc.). Subtract total liabilities from total assets to find your net worth.'
       ),
       jsonb_build_object(
         'title', 'Tracking Net Worth Over Time',
         'content', 'Your net worth will fluctuate, but the trend over time is what matters most. Calculate your net worth quarterly or semi-annually to track your financial progress.'
       ),
       jsonb_build_object(
         'title', 'Improving Your Net Worth',
         'content', 'Increase your net worth by growing assets (saving and investing more, increasing income) and reducing liabilities (paying down debt). Focus on high-impact actions like increasing retirement contributions or accelerating debt payments.'
       )
     ),
     'generated_by', 'default_content',
     'generated_at', '2025-06-30T00:00:00Z'
   ), 
   'net-worth-default'),
   
  ('Credit Cards: Friend or Foe?', 'Learn how to use credit cards responsibly and avoid common pitfalls', 'article', 'Beginner', 'Credit', 15, 25, 
   jsonb_build_object(
     'sections', jsonb_build_array(
       jsonb_build_object(
         'title', 'The Benefits of Credit Cards',
         'content', 'When used responsibly, credit cards offer convenience, fraud protection, rewards, and credit-building benefits. Some cards provide cash back, travel points, or other perks that can be valuable.'
       ),
       jsonb_build_object(
         'title', 'The Dangers of Credit Card Debt',
         'content', 'Credit cards typically charge high interest rates (often 15-25% APR). Carrying a balance can lead to a debt spiral that''s difficult to escape, as interest compounds on both the principal and previous interest.'
       ),
       jsonb_build_object(
         'title', 'Best Practices for Credit Card Use',
         'content', 'Pay your balance in full each month, keep utilization below 30% of your credit limit, avoid cash advances, and choose cards with rewards that match your spending patterns. Set up automatic payments for at least the minimum due.'
       ),
       jsonb_build_object(
         'title', 'Selecting the Right Card',
         'content', 'Consider your spending habits, credit score, and financial goals when choosing a card. If you carry a balance, prioritize a low APR over rewards. If you pay in full, focus on rewards that align with your spending.'
       )
     ),
     'generated_by', 'default_content',
     'generated_at', '2025-06-30T00:00:00Z'
   ), 
   'credit-cards-default');