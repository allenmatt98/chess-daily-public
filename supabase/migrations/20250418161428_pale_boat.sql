/*
  # Update puzzle rotation to 10 PM IST

  1. Changes
    - Modify rotation timing to 4:30 PM UTC (10 PM IST)
    - Update get_daily_puzzle to use new rotation time
    - Maintain existing functionality and security
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS get_current_period();
DROP FUNCTION IF EXISTS get_next_rotation_time();
DROP FUNCTION IF EXISTS get_daily_puzzle();

-- Create function to get current puzzle period
CREATE OR REPLACE FUNCTION get_current_period()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  -- Calculate days since epoch, adjusted for 10 PM IST (4:30 PM UTC) rotation
  SELECT FLOOR(
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' - INTERVAL '16:30' HOUR)) / 
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
      -- If current time is before 4:30 PM UTC (10 PM IST), next rotation is today at 4:30 PM UTC
      WHEN EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') < 16 OR 
           (EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') = 16 AND 
            EXTRACT(MINUTE FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') < 30)
      THEN 
        DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + INTERVAL '16 hours 30 minutes'
      -- Otherwise, next rotation is tomorrow at 4:30 PM UTC
      ELSE 
        DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC' + INTERVAL '1 day') + INTERVAL '16 hours 30 minutes'
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