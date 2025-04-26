/*
  # Add real-time puzzle rotation support

  1. Changes
    - Add current_puzzle table for tracking active puzzle
    - Enable real-time for puzzle changes
    - Add function to update current puzzle
*/

-- Create current puzzle table
CREATE TABLE IF NOT EXISTS current_puzzle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id uuid REFERENCES puzzles(id) NOT NULL,
  rotation_time timestamptz NOT NULL,
  next_rotation timestamptz NOT NULL
);

-- Enable RLS
ALTER TABLE current_puzzle ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can read current puzzle"
  ON current_puzzle
  FOR SELECT
  TO public
  USING (true);

-- Only allow one row
CREATE OR REPLACE FUNCTION ensure_single_current_puzzle()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM current_puzzle;
  RETURN NEW;
END;
$$;

CREATE TRIGGER ensure_single_current_puzzle_trigger
  BEFORE INSERT ON current_puzzle
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_current_puzzle();

-- Enable real-time for current_puzzle table
ALTER PUBLICATION supabase_realtime ADD TABLE current_puzzle;

-- Function to update current puzzle
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
  
  -- Update current puzzle
  INSERT INTO current_puzzle (
    puzzle_id,
    rotation_time,
    next_rotation
  )
  VALUES (
    selected_puzzle_id,
    CURRENT_TIMESTAMP,
    next_rotation_time
  );
END;
$$;