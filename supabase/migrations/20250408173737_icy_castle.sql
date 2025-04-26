/*
  # Implement 15-minute puzzle rotation system

  1. Changes
    - Create a new function to handle 15-minute puzzle rotations
    - Add interval tracking for puzzle assignments
    - Ensure consistent puzzle selection across all users
    - Handle timezone-independent rotation

  2. Security
    - Maintain existing RLS policies
    - Keep public access to puzzles
*/

-- Create a function to get the current 15-minute interval number
CREATE OR REPLACE FUNCTION get_current_interval()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  -- Calculate the number of 15-minute intervals since UTC midnight
  SELECT (
    EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') * 4 +
    FLOOR(EXTRACT(MINUTE FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') / 15)
  )::INTEGER;
$$;

-- Create a function to get the next interval change timestamp
CREATE OR REPLACE FUNCTION get_next_interval_change()
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
AS $$
  SELECT date_trunc('hour', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') +
         interval '15 minutes' * (
           CEIL(EXTRACT(MINUTE FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') / 15.0)
         );
$$;

-- Drop existing get_daily_puzzle function
DROP FUNCTION IF EXISTS get_daily_puzzle();

-- Create updated function with 15-minute rotation
CREATE OR REPLACE FUNCTION get_daily_puzzle()
RETURNS SETOF puzzles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_interval INTEGER;
  total_puzzles INTEGER;
  selected_puzzle puzzles%ROWTYPE;
BEGIN
  -- Get current 15-minute interval
  SELECT get_current_interval() INTO current_interval;
  
  -- Get total number of puzzles
  SELECT COUNT(*) INTO total_puzzles FROM puzzles;
  
  -- If no puzzles exist, return null
  IF total_puzzles = 0 THEN
    RETURN;
  END IF;
  
  -- Select puzzle based on current interval
  -- Use modulo to cycle through puzzles
  SELECT *
  INTO selected_puzzle
  FROM puzzles
  WHERE puzzle_number = (MOD(current_interval, total_puzzles) + 1)
  LIMIT 1;
  
  -- Return the selected puzzle
  RETURN NEXT selected_puzzle;
  RETURN;
END;
$$;

-- Create a table to track puzzle intervals
CREATE TABLE IF NOT EXISTS puzzle_intervals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id uuid REFERENCES puzzles(id) NOT NULL,
  interval_number INTEGER NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL
);

-- Create index for efficient interval lookups
CREATE INDEX IF NOT EXISTS idx_puzzle_intervals_time 
ON puzzle_intervals(start_time, end_time);

-- Create unique constraint to prevent duplicate intervals
CREATE UNIQUE INDEX IF NOT EXISTS idx_puzzle_intervals_unique 
ON puzzle_intervals(interval_number);

-- Function to record puzzle intervals
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
  interval_start := date_trunc('hour', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') +
                   interval '15 minutes' * FLOOR(EXTRACT(MINUTE FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') / 15.0);
  interval_end := interval_start + interval '15 minutes';
  
  -- Get the puzzle ID for this interval
  SELECT id INTO selected_puzzle_id
  FROM puzzles
  WHERE puzzle_number = (MOD(current_interval, (SELECT COUNT(*) FROM puzzles)) + 1)
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