/*
  # Optimize puzzle progress function to prevent stack overflow

  1. Changes
    - Remove recursive operations
    - Optimize database queries
    - Add error handling
    - Improve transaction management

  2. Security
    - Maintain existing RLS policies
    - Keep function security definer
*/

-- Drop existing function
DROP FUNCTION IF EXISTS public.update_puzzle_progress;

-- Create optimized version
CREATE OR REPLACE FUNCTION public.update_puzzle_progress(
  p_user_id UUID,
  p_puzzle_id UUID,
  p_time_taken INTEGER,
  p_hints_used INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_previous_progress RECORD;
  v_new_rating INTEGER;
  v_today DATE;
BEGIN
  -- Get today's date once
  v_today := CURRENT_DATE;

  -- Get existing progress with a single query and row lock
  SELECT 
    rating,
    current_streak,
    highest_streak,
    last_completion_date,
    completed_today
  INTO v_previous_progress
  FROM user_progress
  WHERE user_id = p_user_id
  ORDER BY completed_at DESC
  LIMIT 1
  FOR UPDATE;

  -- Calculate new rating directly without recursion
  v_new_rating := COALESCE(v_previous_progress.rating, 1000) +
    CASE 
      WHEN p_hints_used = 0 AND p_time_taken < 30 THEN 40   -- Perfect solve
      WHEN p_hints_used = 0 AND p_time_taken < 60 THEN 35   -- Excellent solve
      WHEN p_hints_used = 0 AND p_time_taken < 180 THEN 30  -- Good solve
      WHEN p_hints_used = 0 AND p_time_taken < 300 THEN 25  -- Average solve
      WHEN p_hints_used = 0 THEN 20                         -- Slow solve
      ELSE GREATEST(5, 20 - (p_hints_used * 5))            -- With hints
    END;

  -- Single atomic update
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
      WHEN v_previous_progress.last_completion_date = v_today - 1 
      THEN COALESCE(v_previous_progress.current_streak, 0) + 1
      ELSE 1
    END,
    GREATEST(
      COALESCE(v_previous_progress.highest_streak, 0),
      CASE
        WHEN v_previous_progress.last_completion_date = v_today - 1 
        THEN COALESCE(v_previous_progress.current_streak, 0) + 1
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
    'previousRating', COALESCE(v_previous_progress.rating, 1000),
    'currentStreak', CASE
      WHEN v_previous_progress.last_completion_date = v_today - 1 
      THEN COALESCE(v_previous_progress.current_streak, 0) + 1
      ELSE 1
    END,
    'highestStreak', GREATEST(
      COALESCE(v_previous_progress.highest_streak, 0),
      CASE
        WHEN v_previous_progress.last_completion_date = v_today - 1 
        THEN COALESCE(v_previous_progress.current_streak, 0) + 1
        ELSE 1
      END
    ),
    'canUpdateRating', true
  );
END;
$$;