/*
  # Simplify update function to eliminate stack depth issues
*/

-- Drop existing functions
DROP FUNCTION IF EXISTS public.update_puzzle_progress;

-- Create simplified update function
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
  v_rating integer;
  v_current_streak integer;
  v_highest_streak integer;
  v_last_completion_date date;
  v_already_completed boolean;
BEGIN
  -- Get today's date
  v_today := CURRENT_DATE;

  -- Check if already completed today
  SELECT EXISTS (
    SELECT 1
    FROM user_progress
    WHERE user_id = p_user_id 
      AND puzzle_id = p_puzzle_id
      AND completed_today = true 
      AND last_completion_date = v_today
  ) INTO v_already_completed;

  IF v_already_completed THEN
    RETURN jsonb_build_object(
      'error', 'You''ve already completed this puzzle today',
      'canUpdateRating', false
    );
  END IF;

  -- Get current user stats
  SELECT 
    rating,
    current_streak,
    highest_streak,
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
  v_rating := COALESCE(v_rating, 1000);
  
  -- Store previous rating for return value
  DECLARE v_previous_rating integer := v_rating;
  
  -- Update rating based on performance
  v_rating := v_rating + (
    CASE 
      WHEN p_hints_used = 0 AND p_time_taken < 30 THEN 40
      WHEN p_hints_used = 0 AND p_time_taken < 60 THEN 35
      WHEN p_hints_used = 0 AND p_time_taken < 180 THEN 30
      WHEN p_hints_used = 0 AND p_time_taken < 300 THEN 25
      WHEN p_hints_used = 0 THEN 20
      ELSE GREATEST(1, 20 - (p_hints_used * 5))
    END
  );

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
    v_rating,
    CASE
      WHEN v_last_completion_date = v_today - 1 THEN COALESCE(v_current_streak, 0) + 1
      ELSE 1
    END,
    GREATEST(
      COALESCE(v_highest_streak, 0),
      CASE
        WHEN v_last_completion_date = v_today - 1 THEN COALESCE(v_current_streak, 0) + 1
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
    'rating', v_rating,
    'previousRating', v_previous_rating,
    'currentStreak', CASE
      WHEN v_last_completion_date = v_today - 1 THEN COALESCE(v_current_streak, 0) + 1
      ELSE 1
    END,
    'highestStreak', GREATEST(
      COALESCE(v_highest_streak, 0),
      CASE
        WHEN v_last_completion_date = v_today - 1 THEN COALESCE(v_current_streak, 0) + 1
        ELSE 1
      END
    ),
    'canUpdateRating', true
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_puzzle_progress TO authenticated; 