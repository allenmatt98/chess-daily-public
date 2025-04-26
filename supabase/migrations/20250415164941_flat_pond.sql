/*
  # Fix absolute number sequence and defaults

  1. Changes
    - Ensure absolute_number column exists and has proper sequence
    - Update existing puzzles with sequential absolute numbers
    - Add NOT NULL constraint
*/

-- First ensure the column exists
ALTER TABLE puzzles
ADD COLUMN IF NOT EXISTS absolute_number INTEGER;

-- Create sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS puzzles_absolute_number_seq;

-- Set the column default to use the sequence
ALTER TABLE puzzles 
ALTER COLUMN absolute_number SET DEFAULT nextval('puzzles_absolute_number_seq');

-- Make absolute_number NOT NULL
ALTER TABLE puzzles 
ALTER COLUMN absolute_number SET NOT NULL;

-- Update existing puzzles with sequential numbers if they don't have them
WITH numbered_puzzles AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM puzzles
  WHERE absolute_number IS NULL
)
UPDATE puzzles p
SET absolute_number = np.rn
FROM numbered_puzzles np
WHERE p.id = np.id;

-- Set the sequence to the next value after the highest absolute_number
SELECT setval('puzzles_absolute_number_seq', COALESCE((SELECT MAX(absolute_number) FROM puzzles), 0));