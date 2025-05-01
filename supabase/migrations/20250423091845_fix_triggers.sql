/*
  # Fix triggers and implement safer update mechanism
*/

-- Drop problematic triggers
DROP TRIGGER IF EXISTS cleanup_old_attempts_trigger ON user_progress;
DROP TRIGGER IF EXISTS enforce_request_rate_limit ON user_progress;

-- Create a function for periodic cleanup instead of trigger-based
CREATE OR REPLACE FUNCTION public.cleanup_old_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_progress
  SET attempts_today = 0
  WHERE last_attempt_at < now() - interval '24 hours';
END;
$$;

-- Create a rate-limiting function that doesn't use recursion
CREATE OR REPLACE FUNCTION public.check_attempt_rate_limit(
  p_user_id uuid,
  p_puzzle_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM user_progress
    WHERE user_id = p_user_id 
      AND puzzle_id = p_puzzle_id
      AND last_attempt_at > now() - interval '5 seconds'
  );
$$;

-- Update the main function to use new rate limiting
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
  v_today date := CURRENT_DATE;
  v_rating integer := 1000;
  v_current_streak integer := 0;
  v_highest_streak integer := 0;
  v_last_completion_date date := NULL;
  v_rating_change integer;
BEGIN
  -- Check rate limit
  IF NOT check_attempt_rate_limit(p_user_id, p_puzzle_id) THEN
    RETURN jsonb_build_object(
      'error', 'Please wait a few seconds between attempts',
      'canUpdateRating', false
    );
  END IF;

  -- Check if already completed today
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

  -- Get current stats
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

  -- Calculate rating change
  v_rating_change := CASE 
    WHEN p_hints_used = 0 AND p_time_taken < 30 THEN 40
    WHEN p_hints_used = 0 AND p_time_taken < 60 THEN 35
    WHEN p_hints_used = 0 AND p_time_taken < 180 THEN 30
    WHEN p_hints_used = 0 AND p_time_taken < 300 THEN 25
    WHEN p_hints_used = 0 THEN 20
    ELSE GREATEST(1, 20 - (p_hints_used * 5))
  END;

  -- Update progress
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
    CASE
      WHEN v_last_completion_date = v_today - 1 THEN v_current_streak + 1
      ELSE 1
    END,
    GREATEST(
      v_highest_streak,
      CASE
        WHEN v_last_completion_date = v_today - 1 THEN v_current_streak + 1
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
    'rating', v_rating + v_rating_change,
    'previousRating', v_rating,
    'currentStreak', CASE
      WHEN v_last_completion_date = v_today - 1 THEN v_current_streak + 1
      ELSE 1
    END,
    'highestStreak', GREATEST(
      v_highest_streak,
      CASE
        WHEN v_last_completion_date = v_today - 1 THEN v_current_streak + 1
        ELSE 1
      END
    ),
    'canUpdateRating', true
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_puzzle_progress TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_attempt_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_attempts TO authenticated; 