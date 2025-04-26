/*
  # Add new puzzle and update rotation system

  1. Changes
    - Add new puzzle to the database
    - Update get_daily_puzzle function to use 5-minute rotation
    - Add fallback logic for puzzle exhaustion

  2. Security
    - Maintain existing RLS policies
    - Keep public access to puzzles
*/

-- Insert new puzzle
INSERT INTO puzzles (
  fen,
  pgn,
  white,
  black,
  result,
  link,
  difficulty,
  theme
) VALUES (
  '4Rk2/1b1r1pp1/pq5p/5N2/2p2P1P/1P1r2P1/P6K/4R3 b - - 1 27',
  '[White "goniners"]
[Black "Daily Puzzle Inspiration"]
[Result "1-0"]
[FEN "6k1/1b1r1pp1/pq5p/5N2/2p2P1P/QP1r2P1/P3R2K/4R3 w - - 0 26"]
[Link "https://www.chess.com/daily-chess-puzzle/2025-04-08"]

26. Qf8+ Kxf8 27. Re8# 1-0',
  'goniners',
  'Daily Puzzle Inspiration',
  '1-0',
  'https://www.chess.com/daily-chess-puzzle/2025-04-08',
  3,
  'mate in two'
);

-- Drop existing function
DROP FUNCTION IF EXISTS get_daily_puzzle();

-- Create updated function with 5-minute rotation
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
  -- Calculate current 5-minute interval since midnight UTC
  current_interval := EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') * 12 +
                     FLOOR(EXTRACT(MINUTE FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC') / 5);

  -- Get total number of puzzles
  SELECT COUNT(*) INTO total_puzzles FROM puzzles;

  -- If no puzzles exist, return null
  IF total_puzzles = 0 THEN
    RETURN;
  END IF;

  -- Select puzzle based on current interval
  -- If we've shown all puzzles, use the modulo to cycle through them again
  SELECT *
  INTO selected_puzzle
  FROM puzzles
  ORDER BY created_at ASC
  OFFSET MOD(current_interval, total_puzzles)
  LIMIT 1;

  RETURN NEXT selected_puzzle;
  RETURN;
END;
$$;