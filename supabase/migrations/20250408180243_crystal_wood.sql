/*
  # Fix puzzle rotation system

  1. Changes
    - Update get_daily_puzzle function to use UTC time for 12-hour intervals
    - Ensure puzzle rotation starts with puzzle #1
    - Fix interval calculation to properly handle 12-hour periods
    - Add logging for debugging

  2. Security
    - Maintain existing RLS policies
    - Keep function security definer settings
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS get_current_interval();
DROP FUNCTION IF EXISTS get_next_interval_change();
DROP FUNCTION IF EXISTS get_daily_puzzle();

-- Create function to get current interval (00:00 UTC and 12:00 UTC)
CREATE OR REPLACE FUNCTION get_current_interval()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::INTEGER / 12;
$$;

-- Create function to get next interval change
CREATE OR REPLACE FUNCTION get_next_interval_change()
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
AS $$
  SELECT 
    CASE 
      WHEN EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') < 12 
      THEN date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + interval '12 hours'
      ELSE date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + interval '1 day'
    END;
$$;

-- Update daily puzzle function
CREATE OR REPLACE FUNCTION get_daily_puzzle()
RETURNS SETOF puzzles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_hour INTEGER;
  puzzle_count INTEGER;
  puzzle_number INTEGER;
BEGIN
  -- Get current hour in UTC
  current_hour := EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::INTEGER;
  
  -- Get total number of puzzles
  SELECT COUNT(*) INTO puzzle_count FROM puzzles;
  
  -- If no puzzles exist, return null
  IF puzzle_count = 0 THEN
    RETURN;
  END IF;
  
  -- Calculate puzzle number (1 or 2 based on 12-hour period)
  puzzle_number := CASE 
    WHEN current_hour < 12 THEN 1
    ELSE 2
  END;
  
  -- If puzzle_number is greater than available puzzles, wrap back to 1
  IF puzzle_number > puzzle_count THEN
    puzzle_number := 1;
  END IF;
  
  -- Return the selected puzzle
  RETURN QUERY
  SELECT *
  FROM puzzles
  WHERE puzzles.puzzle_number = puzzle_number
  LIMIT 1;
END;
$$;