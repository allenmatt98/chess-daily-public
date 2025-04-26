/*
  # Balance Rating System

  1. Changes
    - Update rating calculation to require ~50 perfect solves for 2000 rating
    - Scale down time bonuses
    - Adjust difficulty multiplier
    - Maintain existing RLS policies and security

  2. Notes
    - Perfect solve (under 30s) now gives 20 points base
    - Difficulty multiplier scaled to 0.2-1.0
    - Maximum points per solve: 20 * 1.0 = 20 points
    - Minimum 50 perfect solves needed to reach 2000 from 1000
*/

-- Drop existing function
DROP FUNCTION IF EXISTS public.calculate_puzzle_score;
DROP FUNCTION IF EXISTS public.update_user_rating;

-- Create updated score calculation function
CREATE OR REPLACE FUNCTION calculate_puzzle_score(completion_time INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN CASE
    WHEN completion_time < 30 THEN 20  -- Perfect solve
    WHEN completion_time < 60 THEN 15  -- Very good solve
    WHEN completion_time < 180 THEN 10 -- Good solve
    WHEN completion_time < 300 THEN 5  -- Average solve
    ELSE 2                            -- Slow solve
  END;
END;
$$;

-- Create updated rating calculation function
CREATE OR REPLACE FUNCTION public.update_user_rating(
  user_id_param uuid,
  puzzle_id_param uuid,
  completion_time_param integer
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

  -- Calculate base score from completion time
  base_score := calculate_puzzle_score(completion_time_param);

  -- Calculate difficulty multiplier (0.2 to 1.0 based on difficulty 1-5)
  difficulty_multiplier := 0.2 + (puzzle_difficulty - 1) * 0.2;

  -- Calculate final rating change
  rating_change := ROUND(base_score * difficulty_multiplier);

  -- Return the new rating
  RETURN current_user_rating + rating_change;
END;
$$;