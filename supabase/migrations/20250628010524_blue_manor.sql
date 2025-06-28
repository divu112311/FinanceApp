/*
  # Add unique constraint to XP table

  1. Changes
    - Add unique constraint on user_id in xp table
    - Add index for better performance

  2. Security
    - Ensures one XP record per user
*/

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'xp_user_id_unique' 
    AND table_name = 'xp'
  ) THEN
    ALTER TABLE xp ADD CONSTRAINT xp_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_xp_user_id_unique ON xp (user_id);