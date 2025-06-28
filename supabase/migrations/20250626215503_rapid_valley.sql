/*
  # Create chat_logs table for conversation history

  1. New Tables
    - `chat_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `message` (text)
      - `sender` (text) - 'user' or 'assistant'
      - `timestamp` (timestamp)

  2. Security
    - Enable RLS on `chat_logs` table
    - Add policies for authenticated users to manage their own chat history
*/

CREATE TABLE IF NOT EXISTS chat_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  message text,
  sender text DEFAULT 'user',
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own chat logs
CREATE POLICY "Users can read own chat logs"
  ON chat_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own chat logs
CREATE POLICY "Users can insert own chat logs"
  ON chat_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own chat logs
CREATE POLICY "Users can update own chat logs"
  ON chat_logs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to delete their own chat logs
CREATE POLICY "Users can delete own chat logs"
  ON chat_logs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);