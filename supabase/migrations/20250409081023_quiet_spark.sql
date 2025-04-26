/*
  # Add Hint System and Adjust Ratings

  1. New Columns
    - Add hint_used and solution_used to user_progress
    - Track number of hints used per puzzle

  2. Changes
    - Update rating calculation to handle hints/solutions
    - Adjust base rating points for better progression
    - Maintain existing RLS policies
*/

-- Add new columns to user_progress
ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS hints_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS solution_viewed BOOLEAN DEFAULT false;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.calculate_puzzle_score;
DROP FUNCTION IF EXISTS public.update_user_rating;

-- Create updated score calculation function with hint penalty
CREATE OR REPLACE FUNCTION calculate_puzzle_score(
  completion_time INTEGER,
  hints_used INTEGER,
  solution_viewed BOOLEAN
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- No points if solution was viewed
  IF solution_viewed THEN
    RETURN 0;
  END IF;

  -- Base score calculation
  RETURN CASE
    WHEN completion_time < 30 THEN 40  -- Perfect solve
    WHEN completion_time < 60 THEN 35  -- Very good solve
    WHEN completion_time < 180 THEN 30 -- Good solve
    WHEN completion_time < 300 THEN 25 -- Average solve
    ELSE 20                           -- Slow solve
  END - (hints_used * 10); -- Subtract 10 points per hint used
END;
$$;

-- Create updated rating calculation function
CREATE OR REPLACE FUNCTION public.update_user_rating(
  user_id_param uuid,
  puzzle_id_param uuid,
  completion_time_param integer,
  hints_used_param integer DEFAULT 0,
  solution_viewed_param boolean DEFAULT false
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

  -- Calculate base score from completion time and hints
  base_score := calculate_puzzle_score(completion_time_param, hints_used_param, solution_viewed_param);

  -- Calculate difficulty multiplier (0.6 to 1.0 based on difficulty 1-5)
  difficulty_multiplier := 0.6 + (puzzle_difficulty - 1) * 0.1;

  -- Calculate final rating change
  rating_change := ROUND(base_score * difficulty_multiplier);

  -- Return the new rating
  RETURN current_user_rating + rating_change;
END;
$$;