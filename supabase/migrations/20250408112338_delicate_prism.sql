/*
  # Add Puzzle Rotation System

  1. New Columns
    - Add puzzle_number column to puzzles table
    - Add time_limit column to puzzles table

  2. Data Changes
    - Safely remove existing data while respecting foreign key constraints
    - Insert new puzzles with rotation numbers and time limits

  3. Function Updates
    - Update get_daily_puzzle to handle puzzle rotation
*/

-- Add new columns
ALTER TABLE puzzles
ADD COLUMN IF NOT EXISTS puzzle_number INTEGER,
ADD COLUMN IF NOT EXISTS time_limit INTEGER DEFAULT 900; -- 15 minutes in seconds

-- Safely remove existing data
DELETE FROM user_progress;
DELETE FROM puzzles;

-- Insert Puzzle #1
INSERT INTO puzzles (
  puzzle_number,
  fen,
  pgn,
  white,
  black,
  result,
  link,
  difficulty,
  theme,
  time_limit
) VALUES (
  1,
  'r2qk2r/pp2ppbp/2p2np1/6B1/3P4/2N1P3/PP3PPP/R2QK2R w KQkq - 0 1',
  '[White "Puzzle #1"]
[Black "Daily Training"]
[Result "1-0"]
[FEN "r2qk2r/pp2ppbp/2p2np1/6B1/3P4/2N1P3/PP3PPP/R2QK2R w KQkq - 0 1"]
[Link "https://www.chess.com/daily-chess-puzzle/2024-04-07"]

1. Bxe7 Qxe7 2. Qd6 1-0',
  'Puzzle #1',
  'Daily Training',
  '1-0',
  'https://www.chess.com/daily-chess-puzzle/2024-04-07',
  3,
  'tactical',
  900
);

-- Insert Puzzle #2
INSERT INTO puzzles (
  puzzle_number,
  fen,
  pgn,
  white,
  black,
  result,
  link,
  difficulty,
  theme,
  time_limit
) VALUES (
  2,
  '1k1r3r/2p1qppp/1pB2b2/p1pP1b2/4p3/4P2P/PPP3P1/1K1R1Q1R w - - 1 22',
  '[White "Puzzle #2"]
[Black "Daily Training"]
[Result "1-0"]
[FEN "1k1r3r/2p1qppp/1pB2b2/p1pP1b2/4p3/4P2P/PPP3P1/1K1R1Q1R w - - 1 22"]
[Link "https://www.chess.com/daily-chess-puzzle/2025-04-07"]

22. Qa6 Bc8 23. Qa8# 1-0',
  'Puzzle #2',
  'Daily Training',
  '1-0',
  'https://www.chess.com/daily-chess-puzzle/2025-04-07',
  3,
  'mate in two',
  900
);

-- Create function to get next puzzle in sequence
CREATE OR REPLACE FUNCTION get_daily_puzzle()
RETURNS SETOF puzzles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_hour INTEGER;
  puzzle_count INTEGER;
  current_puzzle INTEGER;
BEGIN
  -- Get current hour in UTC
  current_hour := EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC');
  
  -- Get total number of puzzles
  SELECT COUNT(*) INTO puzzle_count FROM puzzles;
  
  -- Calculate current puzzle number (changes every hour)
  current_puzzle := MOD(current_hour, puzzle_count) + 1;
  
  -- Return the current puzzle
  RETURN QUERY
  SELECT *
  FROM puzzles
  WHERE puzzle_number = current_puzzle
  LIMIT 1;
END;
$$;