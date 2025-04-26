/*
  # Implement 24-hour puzzle rotation at 9 PM IST

  1. Changes
    - Update puzzle rotation to 24-hour intervals
    - Set rotation time to 9 PM IST (3:30 PM UTC)
    - Use absolute puzzle number for sequential numbering
    - Add function to calculate current puzzle period

  2. Security
    - Maintain existing RLS policies
    - Keep function security definer settings
*/

-- Add absolute_number column if it doesn't exist
ALTER TABLE puzzles
ADD COLUMN IF NOT EXISTS absolute_number SERIAL;

-- Function to get current puzzle period (days since epoch)
CREATE OR REPLACE FUNCTION get_current_puzzle_period()
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

-- Update daily puzzle function
CREATE OR REPLACE FUNCTION get_daily_puzzle()
RETURNS SETOF puzzles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_period INTEGER;
  puzzle_count INTEGER;
  selected_puzzle puzzles%ROWTYPE;
BEGIN
  -- Get current period
  SELECT get_current_puzzle_period() INTO current_period;
  
  -- Get total number of puzzles
  SELECT COUNT(*) INTO puzzle_count 
  FROM public.puzzles;
  
  -- If no puzzles exist, return null
  IF puzzle_count = 0 THEN
    RETURN;
  END IF;
  
  -- Select puzzle based on current period
  -- Use modulo to cycle through puzzles while maintaining absolute ordering
  SELECT *
  INTO selected_puzzle
  FROM public.puzzles
  WHERE absolute_number = (MOD(current_period, puzzle_count) + 1)
  LIMIT 1;
  
  -- Return the selected puzzle
  RETURN NEXT selected_puzzle;
  RETURN;
END;
$$;

-- Update interval recording function
CREATE OR REPLACE FUNCTION record_puzzle_interval()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_period INTEGER;
  interval_start TIMESTAMPTZ;
  interval_end TIMESTAMPTZ;
  selected_puzzle_id uuid;
BEGIN
  -- Get current period information
  current_period := get_current_puzzle_period();
  
  -- Calculate interval start (3:30 PM UTC today or yesterday)
  interval_start := CASE
    WHEN EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') < 15 OR 
         (EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') = 15 AND 
          EXTRACT(MINUTE FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') < 30)
    THEN 
      DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC' - INTERVAL '1 day') + 
      INTERVAL '15 hours 30 minutes'
    ELSE 
      DATE_TRUNC('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + 
      INTERVAL '15 hours 30 minutes'
  END;
  
  -- Interval end is 24 hours after start
  interval_end := interval_start + INTERVAL '24 hours';
  
  -- Get the puzzle ID for this period
  SELECT id INTO selected_puzzle_id
  FROM puzzles
  WHERE absolute_number = (MOD(current_period, (SELECT COUNT(*) FROM puzzles)) + 1)
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
    current_period,
    interval_start,
    interval_end
  )
  ON CONFLICT (interval_number) DO NOTHING;
END;
$$;