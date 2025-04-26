/*
  # Add Puzzle Validation Constraints

  1. Changes
    - Add CHECK constraints for required fields
    - Add validation for FEN and PGN formats
    - Ensure proper data types and ranges
    - Add helpful error messages

  2. Security
    - Maintain existing RLS policies
    - Keep function security settings
*/

-- Add CHECK constraints for required fields
ALTER TABLE puzzles
ADD CONSTRAINT puzzles_fen_check 
  CHECK (fen ~ '^([1-8pnbrqkPNBRQK]+/){7}[1-8pnbrqkPNBRQK]+ [wb] (-|[KQkq]{1,4}) (-|[a-h][36]) \d+ \d+$'),
ADD CONSTRAINT puzzles_pgn_check
  CHECK (pgn ~ '\[White .+\].*\[Black .+\].*\[Result .+\].*\[FEN .+\]'),
ADD CONSTRAINT puzzles_white_check
  CHECK (length(white) > 0),
ADD CONSTRAINT puzzles_black_check
  CHECK (length(black) > 0),
ADD CONSTRAINT puzzles_result_check
  CHECK (result IN ('1-0', '0-1', '1/2-1/2')),
ADD CONSTRAINT puzzles_time_limit_check
  CHECK (time_limit >= 0 AND time_limit <= 3600),
ADD CONSTRAINT puzzles_absolute_number_check
  CHECK (absolute_number > 0);

-- Add constraints for optional fields
ALTER TABLE puzzles
ADD CONSTRAINT puzzles_difficulty_check
  CHECK (difficulty IS NULL OR (difficulty >= 1 AND difficulty <= 5)),
ADD CONSTRAINT puzzles_link_check
  CHECK (link IS NULL OR link ~ '^https?://');

-- Create function to validate puzzle data
CREATE OR REPLACE FUNCTION validate_puzzle_data(
  fen_param text,
  pgn_param text,
  white_param text,
  black_param text,
  result_param text,
  time_limit_param integer,
  difficulty_param integer DEFAULT NULL,
  link_param text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate FEN
  IF NOT (fen_param ~ '^([1-8pnbrqkPNBRQK]+/){7}[1-8pnbrqkPNBRQK]+ [wb] (-|[KQkq]{1,4}) (-|[a-h][36]) \d+ \d+$') THEN
    RAISE EXCEPTION 'Invalid FEN format';
  END IF;

  -- Validate PGN
  IF NOT (pgn_param ~ '\[White .+\].*\[Black .+\].*\[Result .+\].*\[FEN .+\]') THEN
    RAISE EXCEPTION 'PGN must contain White, Black, Result, and FEN tags';
  END IF;

  -- Validate player names
  IF length(white_param) = 0 THEN
    RAISE EXCEPTION 'White player name is required';
  END IF;

  IF length(black_param) = 0 THEN
    RAISE EXCEPTION 'Black player name is required';
  END IF;

  -- Validate result
  IF result_param NOT IN ('1-0', '0-1', '1/2-1/2') THEN
    RAISE EXCEPTION 'Invalid result format. Must be 1-0, 0-1, or 1/2-1/2';
  END IF;

  -- Validate time limit
  IF time_limit_param < 0 OR time_limit_param > 3600 THEN
    RAISE EXCEPTION 'Time limit must be between 0 and 3600 seconds';
  END IF;

  -- Validate optional fields
  IF difficulty_param IS NOT NULL AND (difficulty_param < 1 OR difficulty_param > 5) THEN
    RAISE EXCEPTION 'Difficulty must be between 1 and 5';
  END IF;

  IF link_param IS NOT NULL AND NOT (link_param ~ '^https?://') THEN
    RAISE EXCEPTION 'Link must be a valid HTTP(S) URL';
  END IF;

  RETURN true;
END;
$$;

-- Create trigger to validate puzzle data before insert/update
CREATE OR REPLACE FUNCTION trigger_validate_puzzle_data()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM validate_puzzle_data(
    NEW.fen,
    NEW.pgn,
    NEW.white,
    NEW.black,
    NEW.result,
    NEW.time_limit,
    NEW.difficulty,
    NEW.link
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_puzzle_data_trigger
  BEFORE INSERT OR UPDATE ON puzzles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_validate_puzzle_data();