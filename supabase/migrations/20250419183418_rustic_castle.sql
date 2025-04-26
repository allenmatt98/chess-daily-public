/*
  # Add update_puzzle_progress function

  1. New Function
    - Creates update_puzzle_progress function to handle:
      - Progress tracking
      - Rating updates
      - Streak management
      - Hint penalties
    - Returns updated user stats

  2. Security
    - Function is security definer
    - Respects existing RLS policies
*/

-- Create function to update puzzle progress
CREATE OR REPLACE FUNCTION update_puzzle_progress(
  p_user_id uuid,
  p_puzzle_id uuid,
  p_time_taken integer,
  p_hints_used integer DEFAULT 0
)
RETURNS jsonb
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
BEGIN
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
    attempts,
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
    v_new_rating,
    v_current_streak,
    v_highest_streak,
    p_hints_used
  )
  ON CONFLICT (user_id, puzzle_id) 
  DO UPDATE SET
    completed = true,
    time_taken = p_time_taken,
    attempts = user_progress.attempts + 1,
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
    'highestStreak', v_highest_streak
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_puzzle_progress TO authenticated;