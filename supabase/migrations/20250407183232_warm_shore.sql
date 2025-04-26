/*
  # Daily Puzzle System Enhancement

  1. New Columns
    - Add difficulty rating column to puzzles table
    - Add date_assigned column for scheduling
    - Add theme column for categorization
    - Add times_solved and avg_time columns for statistics

  2. Security
    - Maintain existing RLS policies
    - Add new policy for public access to current daily puzzle
*/

ALTER TABLE puzzles
ADD COLUMN IF NOT EXISTS difficulty INTEGER CHECK (difficulty BETWEEN 1 AND 5) DEFAULT 3,
ADD COLUMN IF NOT EXISTS date_assigned DATE UNIQUE,
ADD COLUMN IF NOT EXISTS theme TEXT,
ADD COLUMN IF NOT EXISTS times_solved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_time INTEGER DEFAULT 0;

-- Index for efficient daily puzzle lookup
CREATE INDEX IF NOT EXISTS idx_puzzles_date_assigned ON puzzles(date_assigned);

-- Function to get current daily puzzle
CREATE OR REPLACE FUNCTION get_daily_puzzle()
RETURNS SETOF puzzles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM puzzles
  WHERE date_assigned = CURRENT_DATE
  LIMIT 1;
END;
$$;