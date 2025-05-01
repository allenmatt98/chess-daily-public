/*
  # Minimal function implementation to identify stack depth issue
*/

-- Drop existing function
DROP FUNCTION IF EXISTS public.update_puzzle_progress;

-- Create minimal function
CREATE OR REPLACE FUNCTION public.update_puzzle_progress(
  p_user_id uuid,
  p_puzzle_id uuid,
  p_time_taken integer,
  p_hints_used integer
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_rating integer := 1000;
  v_current_streak integer := 0;
  v_highest_streak integer := 0;
  v_last_completion_date date := NULL;
  v_rating_change integer;
BEGIN
  -- Simple completion check
  IF EXISTS (
    SELECT 1
    FROM user_progress
    WHERE user_id = p_user_id 
      AND puzzle_id = p_puzzle_id
      AND completed_today = true 
      AND last_completion_date = v_today
  ) THEN
    RETURN jsonb_build_object(
      'error', 'Already completed today',
      'canUpdateRating', false
    );
  END IF;

  -- Get current stats with a single simple query
  SELECT 
    COALESCE(rating, 1000),
    COALESCE(current_streak, 0),
    COALESCE(highest_streak, 0),
    last_completion_date
  INTO 
    v_rating,
    v_current_streak,
    v_highest_streak,
    v_last_completion_date
  FROM user_progress
  WHERE user_id = p_user_id
  ORDER BY completed_at DESC
  LIMIT 1;

  -- Simple rating calculation
  v_rating_change := CASE 
    WHEN p_hints_used = 0 THEN 20
    ELSE 10
  END;

  -- Simple update
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
    v_rating + v_rating_change,
    1,
    GREATEST(1, v_highest_streak),
    true,
    v_today,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id, puzzle_id) 
  DO UPDATE SET
    completed = EXCLUDED.completed,
    time_taken = EXCLUDED.time_taken,
    hints_used = EXCLUDED.hints_used,
    rating = EXCLUDED.rating,
    current_streak = EXCLUDED.current_streak,
    highest_streak = EXCLUDED.highest_streak,
    completed_today = EXCLUDED.completed_today,
    last_completion_date = EXCLUDED.last_completion_date,
    completed_at = EXCLUDED.completed_at,
    last_attempt_at = EXCLUDED.last_attempt_at;

  -- Simple return
  RETURN jsonb_build_object(
    'rating', v_rating + v_rating_change,
    'previousRating', v_rating,
    'currentStreak', 1,
    'highestStreak', GREATEST(1, v_highest_streak),
    'canUpdateRating', true
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_puzzle_progress TO authenticated; 