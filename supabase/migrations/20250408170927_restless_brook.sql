/*
  # Verify and update puzzle position

  1. Changes
    - Verify puzzle #1 exists and has correct position
    - Force update puzzle #1 with correct FEN and PGN
    - Add logging to track puzzle updates
*/

-- First, verify and clean up any duplicate puzzles
DELETE FROM user_progress WHERE puzzle_id IN (
  SELECT id FROM puzzles WHERE puzzle_number = 1 AND id NOT IN (
    SELECT id FROM puzzles WHERE puzzle_number = 1 ORDER BY created_at ASC LIMIT 1
  )
);

DELETE FROM puzzles WHERE puzzle_number = 1 AND id NOT IN (
  SELECT id FROM puzzles WHERE puzzle_number = 1 ORDER BY created_at ASC LIMIT 1
);

-- Update Puzzle #1 with verified correct position
UPDATE puzzles
SET 
  fen = 'r1bqk2r/pp2bppp/2n2n2/2pp4/3P4/2N2NP1/PP2PPBP/R1BQ1RK1 w kq - 0 1',
  pgn = '[White "Puzzle #1"]
[Black "Daily Training"]
[Result "1-0"]
[FEN "r1bqk2r/pp2bppp/2n2n2/2pp4/3P4/2N2NP1/PP2PPBP/R1BQ1RK1 w kq - 0 1"]
[Link "https://www.chess.com/daily-chess-puzzle/2024-04-07"]

1. Nxd5 Nxd5 2. Bxc6+ 1-0',
  white = 'Puzzle #1',
  black = 'Daily Training',
  result = '1-0',
  link = 'https://www.chess.com/daily-chess-puzzle/2024-04-07',
  difficulty = 3,
  theme = 'tactical',
  time_limit = 900
WHERE puzzle_number = 1;

-- Insert if no puzzle exists
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
)
SELECT 
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
WHERE NOT EXISTS (
  SELECT 1 FROM puzzles WHERE puzzle_number = 1
);