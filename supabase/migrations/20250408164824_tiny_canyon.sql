/*
  # Fix rating calculation for quick solves

  1. Changes
    - Update rating calculation to properly handle quick solves
    - Ensure time bonus is correctly applied
    - Fix base rating calculation
    - Add proper difficulty scaling

  2. Security
    - Maintain existing RLS policies
    - Keep function accessible to authenticated users only
*/

-- Drop existing function
DROP FUNCTION IF EXISTS public.update_user_rating;

-- Create updated function with proper quick solve handling
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
  time_bonus integer;
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

  -- Calculate time bonus
  time_bonus := CASE
    WHEN completion_time_param < 30 THEN 125
    WHEN completion_time_param < 60 THEN 100
    WHEN completion_time_param < 180 THEN 75
    WHEN completion_time_param < 300 THEN 50
    ELSE 25
  END;

  -- Calculate rating change based on difficulty and time bonus
  rating_change := ROUND(
    time_bonus * (puzzle_difficulty * 0.5)
  );

  -- Return the new rating
  RETURN current_user_rating + rating_change;
END;
$$;