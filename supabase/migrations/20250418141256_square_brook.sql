/*
  # Update puzzle rotation to 24 hours at 9 PM IST

  1. Changes
    - Modify rotation timing to 24-hour intervals at 3:30 PM UTC (9 PM IST)
    - Update get_daily_puzzle to return next rotation time
    - Maintain existing RLS policies and security
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS get_current_interval();
DROP FUNCTION IF EXISTS get_next_rotation_time();
DROP FUNCTION IF EXISTS get_daily_puzzle();

-- Create function to get current puzzle period
CREATE OR REPLACE FUNCTION get_current_period()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  -- Calculate days since epoch, adjusted for 9 PM IST (3:30 PM UTC) rotation
  SELECT FLOOR(
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' - INTERVAL '15:30' HOUR)) / 
    (24 * 60 * 60)  -- seconds in a day
  )::INTEGER;
$$;

-- Function to get next rotation time
CREATE OR REPLACE FUNCTION get_next_rotation_time()
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
AS $$
  SELECT 
    CASE
      -- If current time is before 3:30 PM UTC (9 PM IST), next rotation is today at 3:30 PM UTC
      WHEN EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') < 15 OR 
           (EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') = 15 AND 
            EXTRACT(MINUTE FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') < 30)
      THEN 
        DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + INTERVAL '15 hours 30 minutes'
      -- Otherwise, next rotation is tomorrow at 3:30 PM UTC
      ELSE 
        DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC' + INTERVAL '1 day') + INTERVAL '15 hours 30 minutes'
    END;
$$;

-- Create updated daily puzzle function
CREATE OR REPLACE FUNCTION get_daily_puzzle()
RETURNS TABLE (
  puzzle puzzles,
  next_rotation TIMESTAMPTZ,
  seconds_until_rotation INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_period INTEGER;
  puzzle_count INTEGER;
  selected_puzzle puzzles%ROWTYPE;
  next_rotation_time TIMESTAMPTZ;
BEGIN
  -- Get current period and next rotation time
  current_period := get_current_period();
  next_rotation_time := get_next_rotation_time();
  
  -- Get total number of puzzles
  SELECT COUNT(*) INTO puzzle_count 
  FROM public.puzzles;
  
  -- If no puzzles exist, return null
  IF puzzle_count = 0 THEN
    RETURN;
  END IF;
  
  -- Select puzzle based on current period
  SELECT *
  INTO selected_puzzle
  FROM public.puzzles
  WHERE absolute_number = (MOD(current_period, puzzle_count) + 1)
  LIMIT 1;
  
  -- Return the puzzle and timing information
  puzzle := selected_puzzle;
  next_rotation := next_rotation_time;
  seconds_until_rotation := 
    EXTRACT(EPOCH FROM (next_rotation_time - CURRENT_TIMESTAMP))::INTEGER;
  
  RETURN NEXT;
END;
$$;