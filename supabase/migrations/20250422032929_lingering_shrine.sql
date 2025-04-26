/*
  # Add attempt tracking to prevent rating manipulation

  1. Changes
    - Add last_attempt_at and attempts_today columns
    - Add function to validate attempts
    - Update progress update function
    - Add cleanup function for old attempts

  2. Security
    - Maintain existing RLS policies
    - Add rate limiting
*/

-- Add attempt tracking columns
ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz,
ADD COLUMN IF NOT EXISTS attempts_today integer DEFAULT 0;

-- Create function to validate attempt
CREATE OR REPLACE FUNCTION validate_puzzle_attempt(
  p_user_id uuid,
  p_puzzle_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_attempt timestamptz;
  today_start timestamptz;
  attempt_count integer;
BEGIN
  -- Get today's start in UTC
  today_start := date_trunc('day', now());
  
  -- Get last attempt info
  SELECT 
    last_attempt_at,
    attempts_today
  INTO 
    last_attempt,
    attempt_count
  FROM user_progress
  WHERE user_id = p_user_id 
    AND puzzle_id = p_puzzle_id;
    
  -- If no previous attempts, allow it
  IF last_attempt IS NULL THEN
    RETURN true;
  END IF;
  
  -- Reset attempts if it's a new day
  IF last_attempt < today_start THEN
    UPDATE user_progress
    SET attempts_today = 0
    WHERE user_id = p_user_id 
      AND puzzle_id = p_puzzle_id;
    RETURN true;
  END IF;
  
  -- Check attempt limit (max 3 per day)
  IF attempt_count >= 3 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Update the puzzle progress function
CREATE OR REPLACE FUNCTION update_puzzle_progress(
  p_user_id uuid,
  p_puzzle_id uuid,
  p_time_taken integer,
  p_hints_used integer DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_rating integer;
  v_current_streak integer;
  v_highest_streak integer;
  v_last_completed_at timestamptz;
  v_new_rating integer;
  v_previous_rating integer;
  v_streak_broken boolean;
  v_can_update boolean;
BEGIN
  -- Validate attempt
  SELECT validate_puzzle_attempt(p_user_id, p_puzzle_id)
  INTO v_can_update;
  
  IF NOT v_can_update THEN
    RETURN jsonb_build_object(
      'error', 'Daily attempt limit reached',
      'canUpdateRating', false
    );
  END IF;

  -- Get current user stats
  SELECT 
    rating,
    current_streak,
    highest_streak,
    MAX(completed_at)
  INTO 
    v_current_rating,
    v_current_streak,
    v_highest_streak,
    v_last_completed_at
  FROM user_progress
  WHERE user_id = p_user_id
  GROUP BY rating, current_streak, highest_streak
  ORDER BY MAX(completed_at) DESC
  LIMIT 1;

  -- Set defaults if no previous progress
  v_current_rating := COALESCE(v_current_rating, 1000);
  v_current_streak := COALESCE(v_current_streak, 0);
  v_highest_streak := COALESCE(v_highest_streak, 0);
  
  -- Store previous rating for return value
  v_previous_rating := v_current_rating;

  -- Calculate new rating
  v_new_rating := update_user_rating(
    p_user_id,
    p_puzzle_id,
    p_time_taken,
    p_hints_used
  );

  -- Check if streak is broken (more than 48 hours since last completion)
  v_streak_broken := v_last_completed_at IS NOT NULL AND 
                    v_last_completed_at < CURRENT_TIMESTAMP - INTERVAL '48 hours';

  -- Update streak
  IF v_streak_broken THEN
    v_current_streak := 1;
  ELSE
    v_current_streak := v_current_streak + 1;
  END IF;

  -- Update highest streak if needed
  v_highest_streak := GREATEST(v_highest_streak, v_current_streak);

  -- Insert or update progress
  INSERT INTO user_progress (
    user_id,
    puzzle_id,
    completed,
    time_taken,
    attempts_today,
    last_attempt_at,
    completed_at,
    rating,
    current_streak,
    highest_streak,
    hints_used
  )
  VALUES (
    p_user_id,
    p_puzzle_id,
    true,
    p_time_taken,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    v_new_rating,
    v_current_streak,
    v_highest_streak,
    p_hints_used
  )
  ON CONFLICT (user_id, puzzle_id) 
  DO UPDATE SET
    completed = true,
    time_taken = p_time_taken,
    attempts_today = user_progress.attempts_today + 1,
    last_attempt_at = CURRENT_TIMESTAMP,
    completed_at = CURRENT_TIMESTAMP,
    rating = v_new_rating,
    current_streak = v_current_streak,
    highest_streak = v_highest_streak,
    hints_used = p_hints_used;

  -- Return updated stats
  RETURN jsonb_build_object(
    'rating', v_new_rating,
    'previousRating', v_previous_rating,
    'currentStreak', v_current_streak,
    'highestStreak', v_highest_streak,
    'canUpdateRating', true
  );
END;
$$;

-- Create cleanup function for old attempts
CREATE OR REPLACE FUNCTION cleanup_old_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset attempts_today for attempts older than 24 hours
  UPDATE user_progress
  SET attempts_today = 0
  WHERE last_attempt_at < now() - interval '24 hours';
END;
$$;

-- Create cleanup trigger
CREATE OR REPLACE FUNCTION trigger_cleanup_old_attempts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM cleanup_old_attempts();
  RETURN NULL;
END;
$$;

CREATE TRIGGER cleanup_old_attempts_trigger
  AFTER INSERT OR UPDATE ON user_progress
  EXECUTE FUNCTION trigger_cleanup_old_attempts();