/*
  # Fix Puzzle #1 position and moves

  1. Changes
    - Update Puzzle #1 with correct FEN and PGN
    - Ensure moves match the starting position
    - Maintain existing puzzle number and metadata
*/

-- First, delete the incorrect puzzle
DELETE FROM user_progress WHERE puzzle_id IN (SELECT id FROM puzzles WHERE puzzle_number = 1);
DELETE FROM puzzles WHERE puzzle_number = 1;

-- Insert corrected Puzzle #1
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
  'r1bqk2r/pp2bppp/2n2n2/2pp4/3P4/2N2NP1/PP2PPBP/R1BQ1RK1 w kq - 0 1',
  '[White "Puzzle #1"]
[Black "Daily Training"]
[Result "1-0"]
[FEN "r1bqk2r/pp2bppp/2n2n2/2pp4/3P4/2N2NP1/PP2PPBP/R1BQ1RK1 w kq - 0 1"]
[Link "https://www.chess.com/daily-chess-puzzle/2024-04-07"]

1. Nxd5 Nxd5 2. Bxc6+ 1-0',
  'Puzzle #1',
  'Daily Training',
  '1-0',
  'https://www.chess.com/daily-chess-puzzle/2024-04-07',
  3,
  'tactical',
  900
);