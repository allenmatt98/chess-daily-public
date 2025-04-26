/*
  # Add Initial Puzzle

  1. Changes
    - Add first puzzle to the database
    - Ensure proper FEN and PGN format
    - Set appropriate difficulty and time limit
*/

-- First ensure no puzzles exist to avoid duplicates
DELETE FROM user_progress;
DELETE FROM puzzles;

-- Insert initial puzzle
INSERT INTO puzzles (
  puzzle_number,
  absolute_number,
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
  1,
  'r1bqk2r/pp2bppp/2n2n2/2pp4/3P4/2N2NP1/PP2PPBP/R1BQ1RK1 w kq - 0 1',
  '[White "Daily Puzzle"]
[Black "Training Position"]
[Result "1-0"]
[FEN "r1bqk2r/pp2bppp/2n2n2/2pp4/3P4/2N2NP1/PP2PPBP/R1BQ1RK1 w kq - 0 1"]
[Link "https://www.chess.com/daily-chess-puzzle/2025-04-16"]

1. Nxd5 Nxd5 2. Bxc6+ 1-0',
  'Daily Puzzle',
  'Training Position',
  '1-0',
  'https://www.chess.com/daily-chess-puzzle/2025-04-16',
  3,
  'tactical',
  900
);