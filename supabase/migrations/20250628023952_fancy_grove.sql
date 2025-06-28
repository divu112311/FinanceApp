/*
  # Add Sample Financial Goals

  1. Sample Data
    - Add sample goals for demonstration
    - Emergency Fund goal (65% complete)
    - Vacation goal (30% complete) 
    - Home Down Payment goal (45% complete)

  2. Goal Categories
    - Add category field to goals table if not exists
    - Set up proper goal data structure
*/

-- Add category column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'goals' AND column_name = 'category'
  ) THEN
    ALTER TABLE goals ADD COLUMN category text DEFAULT 'savings';
  END IF;
END $$;

-- Insert sample goals (only if no goals exist for demo purposes)
INSERT INTO goals (name, target_amount, saved_amount, deadline, category, created_at)
SELECT 
  'Emergency Fund',
  10000,
  6500,
  '2024-12-31',
  'emergency',
  now()
WHERE NOT EXISTS (SELECT 1 FROM goals WHERE name = 'Emergency Fund');

INSERT INTO goals (name, target_amount, saved_amount, deadline, category, created_at)
SELECT 
  'Dream Vacation',
  5000,
  1500,
  '2024-08-15',
  'vacation',
  now()
WHERE NOT EXISTS (SELECT 1 FROM goals WHERE name = 'Dream Vacation');

INSERT INTO goals (name, target_amount, saved_amount, deadline, category, created_at)
SELECT 
  'Home Down Payment',
  50000,
  22500,
  '2025-06-01',
  'house',
  now()
WHERE NOT EXISTS (SELECT 1 FROM goals WHERE name = 'Home Down Payment');