/*
  # Update Rating System for Hints

  1. Changes
    - Modify rating calculation to handle hints
    - Add penalty for using hints
    - No rating increase or streak for hint-only solves
    - Update existing functions

  2. Security
    - Maintain existing RLS policies
    - Keep function security settings
*/

-- Drop existing function
DROP FUNCTION IF EXISTS public.update_user_rating;

-- Create updated rating calculation function
CREATE OR REPLACE FUNCTION public.update_user_rating(
  user_id_param uuid,
  puzzle_id_param uuid,
  completion_time_param integer,
  hints_used_param integer DEFAULT 0
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  puzzle_difficulty integer;
  base_score integer;
  difficulty_multiplier float;
  current_user_rating integer;
  rating_change integer;
  hint_penalty integer;
BEGIN
  -- Get the puzzle difficulty
  SELECT difficulty INTO puzzle_difficulty
  FROM public.puzzles
  WHERE id = puzzle_id_param;

  -- Get the current user rating
  SELECT COALESCE(up.rating, 1000) INTO current_user_rating
  FROM public.user_progress up
  WHERE up.user_id = user_id_param
  ORDER BY up.completed_at DESC
  LIMIT 1;

  -- If solved only using hints, return current rating (no increase)
  IF hints_used_param >= (
    SELECT COUNT(*)
    FROM unnest(string_to_array(pgn, ' ')) AS moves
    WHERE moves ~ '^[1-9]'
  ) * 2 FROM puzzles WHERE id = puzzle_id_param THEN
    RETURN current_user_rating;
  END IF;

  -- Calculate base score from completion time
  base_score := CASE
    WHEN completion_time_param < 30 THEN 40  -- Perfect solve
    WHEN completion_time_param < 60 THEN 35  -- Very good solve
    WHEN completion_time_param < 180 THEN 30 -- Good solve
    WHEN completion_time_param < 300 THEN 25 -- Average solve
    ELSE 20                                 -- Slow solve
  END;

  -- Calculate hint penalty (10 points per hint)
  hint_penalty := hints_used_param * 10;

  -- Calculate difficulty multiplier (0.6 to 1.0 based on difficulty 1-5)
  difficulty_multiplier := 0.6 + (puzzle_difficulty - 1) * 0.1;

  -- Calculate final rating change with hint penalty
  rating_change := ROUND((base_score - hint_penalty) * difficulty_multiplier);

  -- Ensure minimum rating change of 1 if any moves were made without hints
  IF rating_change < 1 AND hints_used_param < (
    SELECT COUNT(*)
    FROM unnest(string_to_array(pgn, ' ')) AS moves
    WHERE moves ~ '^[1-9]'
  ) * 2 FROM puzzles WHERE id = puzzle_id_param THEN
    rating_change := 1;
  END IF;

  -- Return the new rating
  RETURN current_user_rating + rating_change;
END;
$$;