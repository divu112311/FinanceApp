/*
  # Create XP table for gamification system

  1. New Tables
    - `xp`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `points` (integer, default 0)
      - `badges` (text array)

  2. Security
    - Enable RLS on `xp` table
    - Add policies for authenticated users to manage their own XP data
*/

CREATE TABLE IF NOT EXISTS xp (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  points integer DEFAULT 0,
  badges text[] DEFAULT '{}'
);

ALTER TABLE xp ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own XP data
CREATE POLICY "Users can read own xp"
  ON xp
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to insert their own XP data
CREATE POLICY "Users can insert own xp"
  ON xp
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own XP data
CREATE POLICY "Users can update own xp"
  ON xp
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for users to delete their own XP data
CREATE POLICY "Users can delete own xp"
  ON xp
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);