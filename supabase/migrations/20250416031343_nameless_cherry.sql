/*
  # Rollback rotation timing to 8-hour intervals

  1. Changes
    - Revert to 8-hour rotation system (00:00, 08:00, 16:00 UTC)
    - Remove IST-specific timing logic
    - Maintain absolute number functionality
    - Keep existing RLS policies and security

  2. Notes
    - Puzzles will rotate at 00:00, 08:00, and 16:00 UTC
    - Each puzzle shows for exactly 8 hours
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS get_current_puzzle_period();
DROP FUNCTION IF EXISTS get_next_rotation_time();
DROP FUNCTION IF EXISTS get_seconds_until_rotation();
DROP FUNCTION IF EXISTS get_daily_puzzle();
DROP FUNCTION IF EXISTS record_puzzle_interval();

-- Create function to get current 8-hour interval
CREATE OR REPLACE FUNCTION get_current_interval()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  SELECT EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::INTEGER / 8;
$$;

-- Create function to get next interval change
CREATE OR REPLACE FUNCTION get_next_interval_change()
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
AS $$
  SELECT 
    date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + 
    interval '8 hours' * (
      CEIL(EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::DECIMAL / 8)
    );
$$;

-- Create updated daily puzzle function for 8-hour intervals
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
  current_hour INTEGER;
  puzzle_count INTEGER;
  selected_number INTEGER;
  next_rotation_time TIMESTAMPTZ;
  selected_puzzle puzzles%ROWTYPE;
BEGIN
  -- Get current hour in UTC
  current_hour := EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::INTEGER;
  
  -- Get total number of puzzles
  SELECT COUNT(*) INTO puzzle_count 
  FROM public.puzzles;
  
  -- If no puzzles exist, return null
  IF puzzle_count = 0 THEN
    RETURN;
  END IF;
  
  -- Calculate puzzle number based on 8-hour period
  selected_number := CASE 
    WHEN current_hour < 8 THEN 1
    WHEN current_hour < 16 THEN 2
    ELSE 3
  END;
  
  -- If selected_number is greater than available puzzles, wrap back to 1
  IF selected_number > puzzle_count THEN
    selected_number := 1;
  END IF;
  
  -- Get next rotation time
  next_rotation_time := get_next_interval_change();
  
  -- Select the puzzle
  SELECT *
  INTO selected_puzzle
  FROM public.puzzles p
  WHERE p.absolute_number = selected_number
  LIMIT 1;
  
  -- Calculate seconds until next rotation
  puzzle := selected_puzzle;
  next_rotation := next_rotation_time;
  seconds_until_rotation := 
    EXTRACT(EPOCH FROM (next_rotation_time - CURRENT_TIMESTAMP))::INTEGER;
  
  RETURN NEXT;
  RETURN;
END;
$$;

-- Create updated interval recording function
CREATE OR REPLACE FUNCTION record_puzzle_interval()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_interval INTEGER;
  interval_start TIMESTAMPTZ;
  interval_end TIMESTAMPTZ;
  selected_puzzle_id uuid;
BEGIN
  -- Get current interval information
  current_interval := get_current_interval();
  interval_start := date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') +
                   interval '8 hours' * FLOOR(
                     EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::DECIMAL / 8
                   );
  interval_end := interval_start + interval '8 hours';
  
  -- Get the puzzle ID for this interval
  SELECT id INTO selected_puzzle_id
  FROM puzzles
  WHERE absolute_number = (
    CASE 
      WHEN EXTRACT(HOUR FROM interval_start) < 8 THEN 1
      WHEN EXTRACT(HOUR FROM interval_start) < 16 THEN 2
      ELSE 3
    END
  )
  LIMIT 1;
  
  -- Record the interval if it doesn't exist
  INSERT INTO puzzle_intervals (
    puzzle_id,
    interval_number,
    start_time,
    end_time
  )
  VALUES (
    selected_puzzle_id,
    current_interval,
    interval_start,
    interval_end
  )
  ON CONFLICT (interval_number) DO NOTHING;
END;
$$;