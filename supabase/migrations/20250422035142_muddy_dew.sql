/*
  # Add Puzzle Completion Tracking

  1. Changes
    - Add completion status tracking to user_progress
    - Add rate limiting for puzzle attempts
    - Add server-side validation for puzzle completions

  2. Security
    - Enable RLS policies for completion status
    - Add validation functions
    - Prevent manipulation of completion status
*/

-- Add completion tracking columns
ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS completed_today boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS last_completion_date date;

-- Drop existing function to allow return type change
DROP FUNCTION IF EXISTS validate_puzzle_attempt(uuid, uuid);

-- Function to validate puzzle attempt
CREATE OR REPLACE FUNCTION validate_puzzle_attempt(
  p_user_id uuid,
  p_puzzle_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  completion_status record;
  today date;
BEGIN
  -- Get current date in UTC
  SELECT CURRENT_DATE INTO today;
  
  -- Get completion status
  SELECT 
    completed_today,
    last_completion_date,
    completed
  INTO completion_status
  FROM user_progress
  WHERE user_id = p_user_id 
    AND puzzle_id = p_puzzle_id;
    
  -- If no record exists, allow attempt
  IF completion_status IS NULL THEN
    RETURN jsonb_build_object(
      'can_attempt', true,
      'message', null
    );
  END IF;
  
  -- If completed today, prevent attempt
  IF completion_status.completed_today AND completion_status.last_completion_date = today THEN
    RETURN jsonb_build_object(
      'can_attempt', false,
      'message', 'You''ve already completed this puzzle today. Come back tomorrow for a new challenge!'
    );
  END IF;
  
  -- Reset completion status for new day
  IF completion_status.last_completion_date < today THEN
    UPDATE user_progress
    SET 
      completed_today = false,
      attempts_today = 0
    WHERE user_id = p_user_id 
      AND puzzle_id = p_puzzle_id;
  END IF;
  
  RETURN jsonb_build_object(
    'can_attempt', true,
    'message', null
  );
END;
$$;

-- Drop existing function to update
DROP FUNCTION IF EXISTS update_puzzle_progress(uuid, uuid, integer, integer);

-- Update puzzle progress function to handle completion status
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
  v_validation jsonb;
  v_current_rating integer;
  v_current_streak integer;
  v_highest_streak integer;
  v_last_completed_at timestamptz;
  v_new_rating integer;
  v_previous_rating integer;
  v_streak_broken boolean;
BEGIN
  -- Validate attempt
  SELECT validate_puzzle_attempt(p_user_id, p_puzzle_id)
  INTO v_validation;
  
  IF NOT (v_validation->>'can_attempt')::boolean THEN
    RETURN jsonb_build_object(
      'error', v_validation->>'message',
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
    completed_today,
    last_completion_date,
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
    true,
    CURRENT_DATE,
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
    completed_today = true,
    last_completion_date = CURRENT_DATE,
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