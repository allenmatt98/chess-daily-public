-- Drop existing functions
DROP FUNCTION IF EXISTS get_current_period();
DROP FUNCTION IF EXISTS get_next_rotation_time();
DROP FUNCTION IF EXISTS update_current_puzzle();

-- Create function to get current period
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

-- Function to update current puzzle with improved error handling
CREATE OR REPLACE FUNCTION update_current_puzzle()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_period INTEGER;
  puzzle_count INTEGER;
  next_rotation_time TIMESTAMPTZ;
  selected_puzzle_id uuid;
  current_version INTEGER;
BEGIN
  -- Get timing information
  current_period := get_current_period();
  next_rotation_time := get_next_rotation_time();
  
  -- Get total puzzles
  SELECT COUNT(*) INTO puzzle_count FROM puzzles;
  
  IF puzzle_count = 0 THEN
    RAISE EXCEPTION 'No puzzles available';
  END IF;
  
  -- Get puzzle for current period
  SELECT id INTO selected_puzzle_id
  FROM puzzles
  WHERE absolute_number = (MOD(current_period, puzzle_count) + 1)
  LIMIT 1;

  IF selected_puzzle_id IS NULL THEN
    RAISE EXCEPTION 'Failed to select puzzle for period %', current_period;
  END IF;

  -- Get current version
  SELECT COALESCE(MAX(version), 0) + 1
  INTO current_version
  FROM current_puzzle;

  -- Begin transaction
  BEGIN
    -- Save current state to history
    INSERT INTO rotation_history (
      puzzle_id,
      rotation_time,
      next_rotation,
      version
    )
    SELECT 
      puzzle_id,
      rotation_time,
      next_rotation,
      version
    FROM current_puzzle;

    -- Update current puzzle
    DELETE FROM current_puzzle;
    
    INSERT INTO current_puzzle (
      puzzle_id,
      rotation_time,
      next_rotation,
      version
    )
    VALUES (
      selected_puzzle_id,
      CURRENT_TIMESTAMP,
      next_rotation_time,
      current_version
    );

    -- Commit transaction
    COMMIT;
  EXCEPTION WHEN OTHERS THEN
    -- Rollback transaction
    ROLLBACK;
    
    -- Log the failure
    INSERT INTO rotation_failures (
      error_message,
      error_detail,
      metadata
    )
    VALUES (
      SQLERRM,
      SQLSTATE,
      jsonb_build_object(
        'puzzle_id', selected_puzzle_id,
        'rotation_time', CURRENT_TIMESTAMP,
        'next_rotation', next_rotation_time,
        'version', current_version,
        'period', current_period
      )
    );
    
    -- Re-raise the exception
    RAISE;
  END;
END;
$$;

-- Update cron job to ensure correct timing
SELECT cron.unschedule('rotate-puzzle');
SELECT cron.schedule(
  'rotate-puzzle',           -- job name
  '30 15 * * *',            -- schedule (3:30 PM UTC / 9 PM IST)
  $$
  BEGIN
    PERFORM update_current_puzzle();
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO rotation_failures (error_message, error_detail)
    VALUES (SQLERRM, SQLSTATE);
  END;
  $$
);