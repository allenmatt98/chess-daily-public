/*
  # Implement Scheduler-Based Puzzle Rotation

  1. New Tables
    - `current_puzzle`: Track active puzzle and rotation timing
    - `rotation_history`: Track past rotations for auditing/rollback
    - `rotation_failures`: Track failed rotations for monitoring

  2. Changes
    - Add real-time support for puzzle changes
    - Add rollback capabilities
    - Maintain existing functionality during transition
*/

-- Create table for tracking current puzzle
CREATE TABLE IF NOT EXISTS current_puzzle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id uuid REFERENCES puzzles(id) NOT NULL,
  rotation_time timestamptz NOT NULL,
  next_rotation timestamptz NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT single_current_puzzle UNIQUE (version)
);

-- Create table for rotation history
CREATE TABLE IF NOT EXISTS rotation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id uuid REFERENCES puzzles(id) NOT NULL,
  rotation_time timestamptz NOT NULL,
  next_rotation timestamptz NOT NULL,
  version INTEGER NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create table for tracking rotation failures
CREATE TABLE IF NOT EXISTS rotation_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempted_at timestamptz NOT NULL DEFAULT now(),
  error_message text NOT NULL,
  error_detail text,
  metadata jsonb
);

-- Enable RLS
ALTER TABLE current_puzzle ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotation_failures ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Anyone can read current puzzle"
  ON current_puzzle
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admin can manage current puzzle"
  ON current_puzzle
  FOR ALL
  TO admin
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can read rotation history"
  ON rotation_history
  FOR SELECT
  TO admin
  USING (true);

CREATE POLICY "Admin can read rotation failures"
  ON rotation_failures
  FOR SELECT
  TO admin
  USING (true);

-- Enable real-time for current_puzzle
ALTER PUBLICATION supabase_realtime ADD TABLE current_puzzle;

-- Function to update current puzzle with rollback support
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
  
  -- Get puzzle for current period
  SELECT id INTO selected_puzzle_id
  FROM puzzles
  WHERE absolute_number = (MOD(current_period, puzzle_count) + 1)
  LIMIT 1;

  -- Get current version
  SELECT COALESCE(MAX(version), 0) + 1
  INTO current_version
  FROM current_puzzle;

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

EXCEPTION WHEN OTHERS THEN
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
      'version', current_version
    )
  );
  
  -- Re-raise the exception
  RAISE;
END;
$$;

-- Function to rollback to previous puzzle if needed
CREATE OR REPLACE FUNCTION rollback_puzzle_rotation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_rotation rotation_history%ROWTYPE;
BEGIN
  -- Get the most recent rotation
  SELECT *
  INTO last_rotation
  FROM rotation_history
  ORDER BY created_at DESC
  LIMIT 1;

  -- If we found a previous rotation, restore it
  IF FOUND THEN
    DELETE FROM current_puzzle;
    
    INSERT INTO current_puzzle (
      puzzle_id,
      rotation_time,
      next_rotation,
      version
    )
    VALUES (
      last_rotation.puzzle_id,
      last_rotation.rotation_time,
      last_rotation.next_rotation,
      last_rotation.version
    );
  END IF;
END;
$$;

-- Initialize current puzzle if empty
DO $$
DECLARE
  puzzle_exists BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM current_puzzle) INTO puzzle_exists;
  
  IF NOT puzzle_exists THEN
    PERFORM update_current_puzzle();
  END IF;
END
$$;