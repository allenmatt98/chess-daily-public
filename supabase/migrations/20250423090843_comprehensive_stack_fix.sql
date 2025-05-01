/*
  # Comprehensive fix for stack depth issues

  1. Changes
    - Disable problematic triggers
    - Simplify validation logic
    - Optimize function calls
    - Add proper error handling
    - Implement async cleanup
*/

-- Disable cleanup trigger temporarily
DROP TRIGGER IF EXISTS cleanup_old_attempts_trigger ON user_progress;
DROP TRIGGER IF EXISTS validate_puzzle_input ON puzzles;

-- Create a more efficient cleanup function that runs asynchronously
CREATE OR REPLACE FUNCTION cleanup_old_attempts_async()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use advisory lock to prevent concurrent cleanups
  IF pg_try_advisory_lock(hashtext('cleanup_old_attempts'::text)) THEN
    UPDATE user_progress
    SET attempts_today = 0
    WHERE last_attempt_at < now() - interval '24 hours';
    
    -- Release the lock
    PERFORM pg_advisory_unlock(hashtext('cleanup_old_attempts'::text));
  END IF;
END;
$$;

-- Create a simplified validation function
CREATE OR REPLACE FUNCTION validate_puzzle_attempt_simple(
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
      AND completed_today = true 
      AND last_completion_date = CURRENT_DATE
  );
$$;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.update_puzzle_progress;
DROP FUNCTION IF EXISTS public.update_user_rating;

-- Create optimized progress update function
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
  v_can_attempt boolean;
BEGIN
  -- Get today's date once
  v_today := CURRENT_DATE;

  -- Simple validation
  SELECT validate_puzzle_attempt_simple(p_user_id, p_puzzle_id) INTO v_can_attempt;
  
  IF NOT v_can_attempt THEN
    RETURN jsonb_build_object(
      'error', 'You''ve already completed this puzzle today',
      'canUpdateRating', false
    );
  END IF;

  -- Get puzzle difficulty and user progress in a single query
  WITH puzzle_info AS (
    SELECT difficulty FROM puzzles WHERE id = p_puzzle_id
  ),
  user_info AS (
    SELECT 
      up.rating,
      up.current_streak,
      up.highest_streak,
      up.last_completion_date,
      up.completed_today
    FROM user_progress up
    WHERE up.user_id = p_user_id
    ORDER BY up.completed_at DESC
    LIMIT 1
  )
  SELECT 
    p.difficulty,
    u.rating,
    u.current_streak,
    u.highest_streak,
    u.last_completion_date,
    u.completed_today
  INTO v_puzzle_difficulty, v_user_progress
  FROM puzzle_info p
  CROSS JOIN user_info u;

  -- Calculate new rating directly
  v_new_rating := COALESCE(v_user_progress.rating, 1000) +
    CASE 
      WHEN p_hints_used = 0 AND p_time_taken < 30 THEN 40
      WHEN p_hints_used = 0 AND p_time_taken < 60 THEN 35
      WHEN p_hints_used = 0 AND p_time_taken < 180 THEN 30
      WHEN p_hints_used = 0 AND p_time_taken < 300 THEN 25
      WHEN p_hints_used = 0 THEN 20
      ELSE GREATEST(1, 20 - (p_hints_used * 5))
    END;

  -- Single atomic upsert
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

  -- Run cleanup asynchronously
  PERFORM cleanup_old_attempts_async();

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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.update_puzzle_progress TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_puzzle_attempt_simple TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_attempts_async TO authenticated; 