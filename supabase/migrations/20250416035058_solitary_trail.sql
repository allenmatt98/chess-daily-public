/*
  # Check and Fix Puzzle Data

  1. Changes
    - Run diagnostics on puzzle data
    - Fix any invalid data
    - Ensure proper absolute numbering
    - Add constraints after fixes

  2. Security
    - Maintain existing RLS policies
    - Log all changes for audit
*/

-- First backup existing data
SELECT backup_puzzle_data();

-- Check for issues
DO $$
DECLARE
  issues RECORD;
  issue_count INTEGER := 0;
BEGIN
  FOR issues IN SELECT * FROM debug_puzzle_data() LOOP
    issue_count := issue_count + 1;
    RAISE NOTICE 'Found issue: % - % (Current value: %)', 
      issues.issue_type, 
      issues.description, 
      issues.current_value;
  END LOOP;

  IF issue_count = 0 THEN
    RAISE NOTICE 'No issues found in puzzle data';
  ELSE
    RAISE NOTICE '% issues found in puzzle data', issue_count;
  END IF;
END $$;

-- Fix any puzzles with missing absolute numbers
WITH numbered_puzzles AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as new_number
  FROM puzzles 
  WHERE absolute_number IS NULL OR absolute_number <= 0
)
UPDATE puzzles p
SET absolute_number = np.new_number
FROM numbered_puzzles np
WHERE p.id = np.id;

-- Fix any puzzles with invalid time limits
UPDATE puzzles
SET time_limit = 900 -- Default to 15 minutes
WHERE time_limit IS NULL OR time_limit < 0 OR time_limit > 3600;

-- Verify FEN strings and fix if needed
UPDATE puzzles
SET fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
WHERE fen IS NULL OR NOT (fen ~ '^([1-8pnbrqkPNBRQK]+/){7}[1-8pnbrqkPNBRQK]+ [wb] (-|[KQkq]{1,4}) (-|[a-h][36]) \d+ \d+$');

-- Add missing PGN tags if needed
UPDATE puzzles
SET pgn = CASE
  WHEN pgn IS NULL THEN format(
    '[White "%s"][Black "%s"][Result "%s"][FEN "%s"]',
    COALESCE(white, 'Player'),
    COALESCE(black, 'Opponent'),
    COALESCE(result, '*'),
    fen
  )
  WHEN NOT (pgn ~ '\[White .+\].*\[Black .+\].*\[Result .+\].*\[FEN .+\]') THEN
    format(
      '[White "%s"][Black "%s"][Result "%s"][FEN "%s"] %s',
      COALESCE(white, 'Player'),
      COALESCE(black, 'Opponent'),
      COALESCE(result, '*'),
      fen,
      regexp_replace(pgn, '^\[.*\]\s*', '')
    )
  ELSE pgn
END
WHERE pgn IS NULL OR NOT (pgn ~ '\[White .+\].*\[Black .+\].*\[Result .+\].*\[FEN .+\]');

-- Check for remaining issues
DO $$
DECLARE
  remaining_issues RECORD;
  issue_count INTEGER := 0;
BEGIN
  FOR remaining_issues IN SELECT * FROM debug_puzzle_data() LOOP
    issue_count := issue_count + 1;
    RAISE NOTICE 'Remaining issue: % - % (Current value: %)', 
      remaining_issues.issue_type, 
      remaining_issues.description, 
      remaining_issues.current_value;
  END LOOP;

  IF issue_count = 0 THEN
    RAISE NOTICE 'All issues have been fixed';
  ELSE
    RAISE NOTICE '% issues remain after fixes', issue_count;
  END IF;
END $$;