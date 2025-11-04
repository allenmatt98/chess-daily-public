-- Script to manually set current puzzle to puzzle #102
-- This updates the current_puzzle table to point to the puzzle with absolute_number = 102

DO $$
DECLARE
  puzzle_102_id uuid;
  next_rotation_time TIMESTAMPTZ;
  current_version INTEGER;
BEGIN
  -- Find the puzzle with absolute_number = 102
  SELECT id INTO puzzle_102_id
  FROM puzzles
  WHERE absolute_number = 102
  LIMIT 1;

  -- Check if puzzle 102 exists
  IF puzzle_102_id IS NULL THEN
    RAISE EXCEPTION 'Puzzle with absolute_number = 102 not found';
  END IF;

  -- Calculate next rotation time (using same logic as get_next_rotation_time)
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
    END
  INTO next_rotation_time;

  -- Get current version and increment
  SELECT COALESCE(MAX(version), 0) + 1
  INTO current_version
  FROM current_puzzle;

  -- Save current state to history (if exists)
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
    puzzle_102_id,
    CURRENT_TIMESTAMP,
    next_rotation_time,
    current_version
  );

  RAISE NOTICE 'Successfully set current puzzle to puzzle #102 (ID: %)', puzzle_102_id;
END $$;

