/*
  # Learning Path System Setup

  1. New Tables
    - `learning_paths_new` - Store personalized learning paths
    - `learning_path_modules` - Junction table for path-module relationships
    - `user_xp` - Enhanced XP tracking system
    - `badges` - Achievement badges
    - `user_badges` - User-badge relationships
    - `ai_insight_feedback` - Feedback on AI-generated insights
    - `user_actions` - Track user activity
    - `user_context` - Store AI personalization context
    - `chat_sessions` - Improved chat session management
    - `chat_messages` - Enhanced message storage

  2. Schema Updates
    - Add content_data to learning_modules for AI-generated content
    - Add is_active flag to learning_modules
    - Add updated_at to user_learning_progress

  3. Security
    - Enable RLS on all tables
    - Add appropriate policies
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

-- Create learning_paths_new table if it doesn't exist
CREATE TABLE IF NOT EXISTS learning_paths_new (
  path_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  target_audience text,
  estimated_duration integer,
  completion_badge_id uuid,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create learning_path_modules junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS learning_path_modules (
  path_module_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid REFERENCES learning_paths_new(path_id) ON DELETE CASCADE,
  module_id uuid REFERENCES learning_modules(id) ON DELETE CASCADE,
  sequence_order integer NOT NULL,
  is_required boolean DEFAULT true,
  unlock_conditions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(path_id, module_id)
);

-- Create enhanced user_xp table if it doesn't exist
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

-- Create badges table if it doesn't exist
CREATE TABLE IF NOT EXISTS badges (
  badge_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_url text,
  category text NOT NULL,
  difficulty_level text NOT NULL,
  xp_reward integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create user_badges junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_badges (
  user_badge_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  badge_id uuid REFERENCES badges(badge_id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  progress_data jsonb DEFAULT '{}'::jsonb,
  UNIQUE(user_id, badge_id)
);

-- Create AI insight feedback table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_insight_feedback (
  feedback_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  insight_id uuid NOT NULL,
  feedback_type text NOT NULL,
  rating integer,
  feedback_text text,
  was_acted_upon boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create user_actions table for tracking activity if it doesn't exist
CREATE TABLE IF NOT EXISTS user_actions (
  action_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  action_data jsonb DEFAULT '{}'::jsonb,
  source text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_context table for AI personalization if it doesn't exist
CREATE TABLE IF NOT EXISTS user_context (
  context_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  context_type text NOT NULL,
  context_key text NOT NULL,
  context_value jsonb NOT NULL,
  confidence_score numeric(3,2) DEFAULT 1.0,
  source text NOT NULL,
  last_reinforced_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, context_type, context_key)
);

-- Create chat_sessions table for better conversation management if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_sessions (
  session_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text,
  context_data jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz DEFAULT now(),
  last_message_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create chat_messages table for improved message storage if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_messages (
  message_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES chat_sessions(session_id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message_type text NOT NULL CHECK (message_type IN ('user_message', 'ai_response', 'system_message')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  ai_model_used text,
  response_time integer,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_learning_modules_generated_by ON learning_modules USING gin ((content_data->'generated_by'));
CREATE INDEX IF NOT EXISTS idx_learning_modules_is_active ON learning_modules (is_active);
CREATE INDEX IF NOT EXISTS idx_learning_path_modules_path_id ON learning_path_modules (path_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_modules_module_id ON learning_path_modules (module_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_modules_sequence ON learning_path_modules (sequence_order);
CREATE INDEX IF NOT EXISTS idx_user_xp_user_id ON user_xp (user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges (user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges (badge_id);
CREATE INDEX IF NOT EXISTS idx_ai_insight_feedback_user_id ON ai_insight_feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insight_feedback_insight_id ON ai_insight_feedback (insight_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_action_type ON user_actions (action_type);
CREATE INDEX IF NOT EXISTS idx_user_context_user_id ON user_context (user_id);
CREATE INDEX IF NOT EXISTS idx_user_context_type_key ON user_context (context_type, context_key);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages (session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages (user_id);

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

-- Enable RLS on all tables
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
('Learning Novice', 'Complete your first learning module', 'learning', 'beginner', 50),
('Quiz Master', 'Score 100% on 3 different quizzes', 'learning', 'intermediate', 100),
('Financial Scholar', 'Complete 10 learning modules', 'learning', 'advanced', 200),
('Budget Warrior', 'Create and maintain a budget for 30 days', 'budgeting', 'beginner', 75),
('Savings Champion', 'Reach 50% of a savings goal', 'savings', 'intermediate', 125),
('Investment Guru', 'Complete all investment learning modules', 'investing', 'advanced', 250)
ON CONFLICT DO NOTHING;