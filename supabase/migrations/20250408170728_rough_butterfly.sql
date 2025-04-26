/*
  # Fix puzzle rotation and starting position

  1. Changes
    - Update get_daily_puzzle function to always show Puzzle #1
    - Remove puzzle #3 with incorrect position
    - Add proper starting position for Puzzle #1
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_daily_puzzle();

-- Create updated function to always return Puzzle #1
CREATE OR REPLACE FUNCTION get_daily_puzzle()
RETURNS SETOF puzzles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM puzzles
  WHERE puzzle_number = 1
  LIMIT 1;
END;
$$;

-- First, delete any incorrect puzzles
DELETE FROM user_progress WHERE puzzle_id IN (SELECT id FROM puzzles WHERE puzzle_number > 2);
DELETE FROM puzzles WHERE puzzle_number > 2;

-- Update Puzzle #1 with correct starting position
UPDATE puzzles
SET fen = 'r1bqk2r/pp2bppp/2n2n2/2pp4/3P4/2N2NP1/PP2PPBP/R1BQ1RK1 w kq - 0 1',
    pgn = '[White "Puzzle #1"]
[Black "Daily Training"]
[Result "1-0"]
[FEN "r1bqk2r/pp2bppp/2n2n2/2pp4/3P4/2N2NP1/PP2PPBP/R1BQ1RK1 w kq - 0 1"]
[Link "https://www.chess.com/daily-chess-puzzle/2024-04-07"]

1. Nxd5 Nxd5 2. Bxc6+ 1-0'
WHERE puzzle_number = 1;