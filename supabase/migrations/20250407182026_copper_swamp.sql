/*
  # Seed initial puzzle data
*/

INSERT INTO puzzles (fen, pgn, white, black, result, link)
VALUES (
  '2r3k1/1Q4bp/1p1B1pp1/5b2/P7/6P1/1q4BP/4R2K w - - 0 1',
  '[White "Wouter Bik"]
[Black "Daily Puzzle Inspiration"]
[Result "1-0"]
[FEN "2r3k1/1Q4bp/1p1B1pp1/5b2/P7/6P1/1q4BP/4R2K w - - 0 1"]
[Link "https://www.chess.com/daily-chess-puzzle/2025-04-06"]

1. Qf7+ Kxf7 2. Bd5+ Be6 3. Rxe6 Rc1+ 4. Re1# 1-0',
  'Wouter Bik',
  'Daily Puzzle Inspiration',
  '1-0',
  'https://www.chess.com/daily-chess-puzzle/2025-04-06'
);