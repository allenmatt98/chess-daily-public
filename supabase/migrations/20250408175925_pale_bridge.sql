/*
  # Update Puzzle Rotation and Security Policies

  1. Changes
    - Modify puzzle rotation to 12-hour intervals
    - Add comprehensive RLS policies
    - Create admin role and privileges
    - Update existing functions for new rotation system

  2. Security
    - Enable RLS on all tables
    - Add granular policies for each user role
    - Ensure proper access control for all operations
*/

-- Create admin role if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'admin') THEN
    CREATE ROLE admin;
  END IF;
END
$$;

-- Revoke existing policies
DROP POLICY IF EXISTS "Puzzles are viewable by all users" ON puzzles;
DROP POLICY IF EXISTS "Puzzles are viewable by everyone" ON puzzles;
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;

-- Enable RLS on all tables
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_intervals ENABLE ROW LEVEL SECURITY;

-- Grant admin full access to all tables
GRANT ALL ON puzzles TO admin;
GRANT ALL ON user_progress TO admin;
GRANT ALL ON puzzle_intervals TO admin;

-- Puzzles table policies
CREATE POLICY "Puzzles are viewable by authenticated users"
  ON puzzles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin full access to puzzles"
  ON puzzles
  FOR ALL
  TO admin
  USING (true)
  WITH CHECK (true);

-- User progress policies
CREATE POLICY "Users can view their own progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin full access to user progress"
  ON user_progress
  FOR ALL
  TO admin
  USING (true)
  WITH CHECK (true);

-- Puzzle intervals policies
CREATE POLICY "Intervals are viewable by authenticated users"
  ON puzzle_intervals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin full access to intervals"
  ON puzzle_intervals
  FOR ALL
  TO admin
  USING (true)
  WITH CHECK (true);

-- Update interval calculation function for 12-hour rotation
CREATE OR REPLACE FUNCTION get_current_interval()
RETURNS INTEGER
LANGUAGE sql
STABLE
AS $$
  -- Calculate the number of 12-hour intervals since UTC midnight
  SELECT (
    FLOOR(
      EXTRACT(EPOCH FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') / 
      (12 * 3600) -- 12 hours in seconds
    )
  )::INTEGER;
$$;

-- Update next interval change function
CREATE OR REPLACE FUNCTION get_next_interval_change()
RETURNS TIMESTAMPTZ
LANGUAGE sql
STABLE
AS $$
  SELECT date_trunc('day', CURRENT_TIMESTAMP AT TIME ZONE 'UTC') +
         interval '12 hours' * (
           CEIL(
             EXTRACT(EPOCH FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') / 
             (12 * 3600)
           )
         );
$$;

-- Update daily puzzle function for 12-hour rotation
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
  -- Get current 12-hour interval
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

-- Update interval recording function
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
                   interval '12 hours' * FLOOR(
                     EXTRACT(EPOCH FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') / 
                     (12 * 3600)
                   );
  interval_end := interval_start + interval '12 hours';
  
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