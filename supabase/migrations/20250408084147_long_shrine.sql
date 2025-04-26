/*
  # Fix puzzle starting position

  1. Changes
    - Update the puzzle with correct starting FEN
    - Ensure moves match the starting position
*/

-- First, delete the incorrect puzzle
DELETE FROM puzzles 
WHERE fen = '4Rk2/1b1r1pp1/pq5p/5N2/2p2P1P/1P1r2P1/P6K/4R3 b - - 1 27';

-- Insert the puzzle with correct starting position
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
  '6k1/1b1r1pp1/pq5p/5N2/2p2P1P/QP1r2P1/P3R2K/4R3 w - - 0 26',
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