/*
  # AI Learning Path System

  1. New Tables
    - `learning_paths_new` - Personalized learning paths for users
    - `learning_path_modules` - Junction table for modules in a path
    - `user_xp` - Enhanced XP tracking with levels
    - `badges` - Available achievement badges
    - `user_badges` - User earned badges
    - `ai_insight_feedback` - User feedback on AI insights
    - `user_actions` - Track user activity for personalization
    - `user_context` - Store contextual information about users

  2. Schema Updates
    - Add new fields to existing tables
    - Create proper relationships between tables
    - Set up indexes for performance
*/

-- Create learning_paths_new table (improved version)
CREATE TABLE IF NOT EXISTS learning_paths_new (
  path_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  description text,
  target_audience varchar(20) DEFAULT 'beginner',
  estimated_duration integer,
  completion_badge_id uuid,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create learning_path_modules junction table
CREATE TABLE IF NOT EXISTS learning_path_modules (
  path_module_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid REFERENCES learning_paths_new(path_id) ON DELETE CASCADE,
  module_id uuid REFERENCES learning_modules(id) ON DELETE CASCADE,
  sequence_order integer NOT NULL,
  is_required boolean DEFAULT true,
  unlock_conditions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(path_id, module_id),
  UNIQUE(path_id, sequence_order)
);

-- Create enhanced user_xp table
CREATE TABLE IF NOT EXISTS user_xp (
  xp_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_xp integer NOT NULL DEFAULT 0,
  current_level integer NOT NULL DEFAULT 1,
  xp_to_next_level integer NOT NULL DEFAULT 100,
  last_xp_earned_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create badges table
CREATE TABLE IF NOT EXISTS badges (
  badge_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(100) NOT NULL,
  description text,
  icon_url varchar(500),
  category varchar(20) NOT NULL,
  difficulty_level varchar(10) DEFAULT 'easy' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
  xp_reward integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create user_badges junction table
CREATE TABLE IF NOT EXISTS user_badges (
  user_badge_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES badges(badge_id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  progress_data jsonb DEFAULT '{}'::jsonb,
  UNIQUE(user_id, badge_id)
);

-- Create AI insight feedback table
CREATE TABLE IF NOT EXISTS ai_insight_feedback (
  feedback_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  insight_id uuid NOT NULL,
  message_id uuid,
  feedback_type varchar(50) NOT NULL CHECK (feedback_type IN ('helpful', 'not_helpful', 'irrelevant', 'too_complex', 'too_simple', 'inaccurate', 'outdated')),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  feedback_text text,
  was_acted_upon boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create user_actions table for tracking activity
CREATE TABLE IF NOT EXISTS user_actions (
  action_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  insight_id uuid,
  action_type varchar(100) NOT NULL,
  action_data jsonb DEFAULT '{}'::jsonb,
  source varchar(50) DEFAULT 'user_initiated' CHECK (source IN ('ai_recommendation', 'user_initiated', 'app_guided')),
  completed_at timestamptz DEFAULT now()
);

-- Create user_context table for AI personalization
CREATE TABLE IF NOT EXISTS user_context (
  context_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  context_type varchar(50) NOT NULL CHECK (context_type IN ('financial_habits', 'preferences', 'goals_history', 'communication_style', 'life_events')),
  context_key varchar(255) NOT NULL,
  context_value jsonb NOT NULL,
  confidence_score numeric(3,2) DEFAULT 1.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  source varchar(50) DEFAULT 'derived_from_chat' CHECK (source IN ('derived_from_chat', 'inferred_from_behavior', 'user_provided', 'system_generated')),
  last_reinforced_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, context_type, context_key)
);

-- Create chat_sessions table for better conversation management
CREATE TABLE IF NOT EXISTS chat_sessions (
  session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title varchar(255),
  context_data jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create chat_messages table for improved message storage
CREATE TABLE IF NOT EXISTS chat_messages (
  message_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message_type varchar(20) NOT NULL CHECK (message_type IN ('user_message', 'ai_response', 'system_notification')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  ai_model_used varchar(100),
  response_time integer,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE learning_paths_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insight_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learning_path_modules_path_id ON learning_path_modules (path_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_modules_sequence ON learning_path_modules (sequence_order);
CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON user_xp (user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges (user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges (badge_id);
CREATE INDEX IF NOT EXISTS idx_ai_insight_feedback_user_id ON ai_insight_feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insight_feedback_insight_id ON ai_insight_feedback (insight_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_context_user_id ON user_context (user_id);
CREATE INDEX IF NOT EXISTS idx_user_context_expires_at ON user_context (expires_at);
CREATE INDEX IF NOT EXISTS idx_user_context_type ON user_context (context_type);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages (session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages (created_at);

-- Create RLS policies for learning_paths_new
CREATE POLICY "Anyone can read learning paths"
  ON learning_paths_new
  FOR SELECT
  TO public
  USING (true);

-- Create RLS policies for learning_path_modules
CREATE POLICY "Anyone can read learning path modules"
  ON learning_path_modules
  FOR SELECT
  TO public
  USING (true);

-- Create RLS policies for user_xp
CREATE POLICY "Users can read own XP"
  ON user_xp
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own XP"
  ON user_xp
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for badges
CREATE POLICY "Anyone can read badges"
  ON badges
  FOR SELECT
  TO public
  USING (true);

-- Create RLS policies for user_badges
CREATE POLICY "Users can read own badges"
  ON user_badges
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for ai_insight_feedback
CREATE POLICY "Users can read own feedback"
  ON ai_insight_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own feedback"
  ON ai_insight_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_actions
CREATE POLICY "Users can read own actions"
  ON user_actions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own actions"
  ON user_actions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_context
CREATE POLICY "Users can read own context"
  ON user_context
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own context"
  ON user_context
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own context"
  ON user_context
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for chat_sessions
CREATE POLICY "Users can read own chat sessions"
  ON chat_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
  ON chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON chat_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create RLS policies for chat_messages
CREATE POLICY "Users can read own chat messages"
  ON chat_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert sample badges
INSERT INTO badges (name, description, category, difficulty_level, xp_reward) VALUES
('Learning Novice', 'Complete your first learning module', 'learning', 'easy', 50),
('Quiz Master', 'Score 100% on 3 different quizzes', 'learning', 'medium', 100),
('Financial Scholar', 'Complete 10 learning modules', 'learning', 'hard', 200),
('Budget Warrior', 'Create and maintain a budget for 30 days', 'budgeting', 'easy', 75),
('Savings Champion', 'Reach 50% of a savings goal', 'savings', 'medium', 125),
('Investment Guru', 'Complete all investment learning modules', 'investing', 'hard', 250)
ON CONFLICT DO NOTHING;