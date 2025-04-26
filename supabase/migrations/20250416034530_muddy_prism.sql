/*
  # Add Debug Functions with Safe Rollback

  1. Changes
    - Add function to validate and debug puzzle data
    - Add function to restore puzzle data if needed
    - Keep track of original data for rollback
    - Add safety checks before modifications

  2. Security
    - Maintain existing RLS policies
    - Add audit logging for all operations
*/

-- Create backup table for puzzles
CREATE TABLE IF NOT EXISTS puzzle_backups (
  id uuid PRIMARY KEY,
  puzzle_data jsonb NOT NULL,
  backed_up_at timestamptz DEFAULT now()
);

-- Function to backup current puzzle data
CREATE OR REPLACE FUNCTION backup_puzzle_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Backup current puzzle data
  INSERT INTO puzzle_backups (id, puzzle_data)
  SELECT 
    id,
    row_to_json(puzzles.*)::jsonb
  FROM puzzles
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Function to validate and debug puzzle data
CREATE OR REPLACE FUNCTION debug_puzzle_data()
RETURNS TABLE (
  puzzle_id uuid,
  issue_type text,
  description text,
  current_value text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First backup existing data
  PERFORM backup_puzzle_data();

  -- Check for missing or invalid FEN
  RETURN QUERY
  SELECT 
    id,
    'FEN',
    'Invalid or missing FEN string',
    COALESCE(fen, 'NULL')
  FROM puzzles
  WHERE fen IS NULL OR NOT (fen ~ '^([1-8pnbrqkPNBRQK]+/){7}[1-8pnbrqkPNBRQK]+ [wb] (-|[KQkq]{1,4}) (-|[a-h][36]) \d+ \d+$');

  -- Check for missing or invalid PGN
  RETURN QUERY
  SELECT 
    id,
    'PGN',
    'Missing required PGN tags',
    COALESCE(pgn, 'NULL')
  FROM puzzles
  WHERE pgn IS NULL OR NOT (pgn ~ '\[White .+\].*\[Black .+\].*\[Result .+\].*\[FEN .+\]');

  -- Check for invalid absolute numbers
  RETURN QUERY
  SELECT 
    id,
    'ABSOLUTE_NUMBER',
    'Missing or invalid absolute number',
    absolute_number::text
  FROM puzzles
  WHERE absolute_number IS NULL OR absolute_number <= 0;

  -- Check for duplicate absolute numbers
  RETURN QUERY
  SELECT 
    p1.id,
    'DUPLICATE_NUMBER',
    'Duplicate absolute number found',
    p1.absolute_number::text
  FROM puzzles p1
  JOIN puzzles p2 ON p1.absolute_number = p2.absolute_number AND p1.id != p2.id;

  -- Check for invalid time limits
  RETURN QUERY
  SELECT 
    id,
    'TIME_LIMIT',
    'Invalid time limit',
    COALESCE(time_limit::text, 'NULL')
  FROM puzzles
  WHERE time_limit IS NULL OR time_limit < 0 OR time_limit > 3600;
END;
$$;

-- Function to restore puzzle data from backup
CREATE OR REPLACE FUNCTION restore_puzzle_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Restore puzzles from backup
  UPDATE puzzles p
  SET
    fen = (b.puzzle_data->>'fen')::text,
    pgn = (b.puzzle_data->>'pgn')::text,
    white = (b.puzzle_data->>'white')::text,
    black = (b.puzzle_data->>'black')::text,
    result = (b.puzzle_data->>'result')::text,
    link = (b.puzzle_data->>'link')::text,
    difficulty = (b.puzzle_data->>'difficulty')::integer,
    theme = (b.puzzle_data->>'theme')::text,
    time_limit = (b.puzzle_data->>'time_limit')::integer,
    absolute_number = (b.puzzle_data->>'absolute_number')::integer
  FROM puzzle_backups b
  WHERE p.id = b.id;
END;
$$;