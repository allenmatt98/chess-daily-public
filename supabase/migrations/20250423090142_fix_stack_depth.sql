/*
  # Fix stack depth exceeded error in update_puzzle_progress

  1. Changes
    - Optimize function to reduce stack depth
    - Inline rating calculation
    - Simplify queries and logic
    - Remove recursive dependencies
*/

-- Drop existing functions to prevent conflicts
DROP FUNCTION IF EXISTS public.update_puzzle_progress;
DROP FUNCTION IF EXISTS public.update_user_rating;

-- Create optimized function with inlined calculations
CREATE OR REPLACE FUNCTION public.update_puzzle_progress(
  p_user_id uuid,
  p_puzzle_id uuid,
  p_time_taken integer,
  p_hints_used integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today date;
  v_user_progress record;
  v_new_rating integer;
  v_puzzle_difficulty integer;
BEGIN
  -- Get today's date once
  v_today := CURRENT_DATE;

  -- Get puzzle difficulty in a separate query to avoid deep nesting
  SELECT difficulty INTO v_puzzle_difficulty
  FROM puzzles
  WHERE id = p_puzzle_id;

  -- Get all user progress info in a single query
  SELECT 
    up.rating,
    up.current_streak,
    up.highest_streak,
    up.last_completion_date,
    up.completed_today
  INTO v_user_progress
  FROM user_progress up
  WHERE up.user_id = p_user_id
  ORDER BY up.completed_at DESC
  LIMIT 1;

  -- Calculate new rating directly without function calls
  v_new_rating := COALESCE(v_user_progress.rating, 1000) +
    CASE 
      WHEN p_hints_used = 0 AND p_time_taken < 30 THEN 
        GREATEST(5, 40 * COALESCE(v_puzzle_difficulty, 3) / 5)
      WHEN p_hints_used = 0 AND p_time_taken < 60 THEN 
        GREATEST(5, 35 * COALESCE(v_puzzle_difficulty, 3) / 5)
      WHEN p_hints_used = 0 AND p_time_taken < 180 THEN 
        GREATEST(5, 30 * COALESCE(v_puzzle_difficulty, 3) / 5)
      WHEN p_hints_used = 0 AND p_time_taken < 300 THEN 
        GREATEST(5, 25 * COALESCE(v_puzzle_difficulty, 3) / 5)
      WHEN p_hints_used = 0 THEN 
        GREATEST(5, 20 * COALESCE(v_puzzle_difficulty, 3) / 5)
      ELSE 
        GREATEST(1, (20 - (p_hints_used * 5)) * COALESCE(v_puzzle_difficulty, 3) / 5)
    END;

  -- Single atomic upsert with all calculations inline
  INSERT INTO user_progress (
    user_id,
    puzzle_id,
    completed,
    time_taken,
    hints_used,
    rating,
    current_streak,
    highest_streak,
    completed_today,
    last_completion_date,
    completed_at,
    last_attempt_at
  )
  VALUES (
    p_user_id,
    p_puzzle_id,
    true,
    p_time_taken,
    p_hints_used,
    v_new_rating,
    CASE
      WHEN v_user_progress.last_completion_date = v_today - 1 
      THEN COALESCE(v_user_progress.current_streak, 0) + 1
      ELSE 1
    END,
    GREATEST(
      COALESCE(v_user_progress.highest_streak, 0),
      CASE
        WHEN v_user_progress.last_completion_date = v_today - 1 
        THEN COALESCE(v_user_progress.current_streak, 0) + 1
        ELSE 1
      END
    ),
    true,
    v_today,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, puzzle_id) 
  DO UPDATE SET
    completed = EXCLUDED.completed,
    time_taken = LEAST(EXCLUDED.time_taken, user_progress.time_taken),
    hints_used = EXCLUDED.hints_used,
    rating = EXCLUDED.rating,
    current_streak = EXCLUDED.current_streak,
    highest_streak = EXCLUDED.highest_streak,
    completed_today = EXCLUDED.completed_today,
    last_completion_date = EXCLUDED.last_completion_date,
    completed_at = EXCLUDED.completed_at,
    last_attempt_at = EXCLUDED.last_attempt_at;

  -- Return updated stats
  RETURN jsonb_build_object(
    'rating', v_new_rating,
    'previousRating', COALESCE(v_user_progress.rating, 1000),
    'currentStreak', CASE
      WHEN v_user_progress.last_completion_date = v_today - 1 
      THEN COALESCE(v_user_progress.current_streak, 0) + 1
      ELSE 1
    END,
    'highestStreak', GREATEST(
      COALESCE(v_user_progress.highest_streak, 0),
      CASE
        WHEN v_user_progress.last_completion_date = v_today - 1 
        THEN COALESCE(v_user_progress.current_streak, 0) + 1
        ELSE 1
      END
    ),
    'canUpdateRating', true
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_puzzle_progress TO authenticated; 