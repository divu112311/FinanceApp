/*
  # Add sample financial goals

  1. New Data
    - Sample goals for demonstration purposes
    - Emergency Fund goal (65% complete)
    - Dream Vacation goal (30% complete) 
    - Home Down Payment goal (45% complete)

  2. Changes
    - Insert sample goals only if no goals exist
    - Ensures category column exists with proper default
*/

-- Ensure category column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'category'
  ) THEN
    ALTER TABLE goals ADD COLUMN category text DEFAULT 'savings';
  END IF;
END $$;

-- Insert sample goals only if no goals exist in the table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM goals LIMIT 1) THEN
    INSERT INTO goals (name, target_amount, saved_amount, deadline, category, created_at) VALUES
    ('Emergency Fund', 10000, 6500, '2024-12-31', 'emergency', now()),
    ('Dream Vacation', 5000, 1500, '2024-08-15', 'vacation', now()),
    ('Home Down Payment', 50000, 22500, '2025-06-01', 'house', now());
  END IF;
END $$;