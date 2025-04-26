/*
  # Fix ambiguous column references in update_user_rating function

  1. Changes
    - Update the update_user_rating function to properly qualify column references
    - Ensure all table references use proper schema qualification
    - Add explicit column qualifications to avoid ambiguity

  2. Security
    - Function remains accessible to authenticated users only
    - No changes to existing security policies
*/

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
  time_performance float;
  rating_change integer;
  current_user_rating integer;
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

  -- Calculate time performance (lower is better)
  SELECT CASE
    WHEN p.time_limit > 0 THEN 
      GREATEST(0.1, LEAST(1.0, (p.time_limit - completion_time_param)::float / p.time_limit::float))
    ELSE 0.5
  END INTO time_performance
  FROM public.puzzles p
  WHERE p.id = puzzle_id_param;

  -- Calculate rating change based on difficulty and time performance
  rating_change := ROUND(
    (puzzle_difficulty * 50) * time_performance
  );

  -- Return the new rating
  RETURN current_user_rating + rating_change;
END;
$$;