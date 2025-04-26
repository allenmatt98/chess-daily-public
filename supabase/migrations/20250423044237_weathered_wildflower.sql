/*
  # Fix stack depth limit in update_puzzle_progress function

  1. Changes
    - Refactor update_puzzle_progress to use an iterative approach instead of recursion
    - Add better error handling and validation
    - Optimize performance by using a single update statement
    
  2. Security
    - Maintain existing security context and permissions
    - Add input validation to prevent invalid data
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS update_puzzle_progress;

-- Create the new iterative version of the function
CREATE OR REPLACE FUNCTION update_puzzle_progress(
  p_user_id UUID,
  p_puzzle_id UUID,
  p_completed BOOLEAN,
  p_time_taken INTEGER,
  p_hints_used INTEGER DEFAULT 0,
  p_solution_viewed BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
DECLARE
  v_current_date DATE := CURRENT_DATE;
  v_last_completion_date DATE;
  v_current_streak INTEGER;
  v_highest_streak INTEGER;
  v_rating INTEGER;
BEGIN
  -- Input validation
  IF p_user_id IS NULL OR p_puzzle_id IS NULL THEN
    RAISE EXCEPTION 'User ID and puzzle ID cannot be null';
  END IF;

  -- Lock the row to prevent concurrent updates
  SELECT 
    last_completion_date,
    current_streak,
    highest_streak,
    rating
  INTO 
    v_last_completion_date,
    v_current_streak,
    v_highest_streak,
    v_rating
  FROM user_progress
  WHERE user_id = p_user_id AND puzzle_id = p_puzzle_id
  FOR UPDATE;

  -- Calculate new streak values
  IF p_completed THEN
    IF v_last_completion_date IS NULL OR v_last_completion_date < v_current_date - INTERVAL '1 day' THEN
      -- Streak was broken or this is the first completion
      v_current_streak := 1;
    ELSIF v_last_completion_date = v_current_date - INTERVAL '1 day' THEN
      -- Continuing the streak
      v_current_streak := COALESCE(v_current_streak, 0) + 1;
    END IF;
    
    -- Update highest streak if current streak is higher
    v_highest_streak := GREATEST(COALESCE(v_highest_streak, 0), v_current_streak);
  END IF;

  -- Calculate rating adjustment based on performance
  IF p_completed THEN
    v_rating := COALESCE(v_rating, 1000) + 
      CASE 
        WHEN p_hints_used = 0 AND p_time_taken < 300 THEN 25  -- Fast solve, no hints
        WHEN p_hints_used = 0 THEN 15                         -- Solved without hints
        WHEN p_hints_used <= 2 THEN 5                         -- Used some hints
        ELSE 0                                                -- Used many hints
      END;
  ELSE
    v_rating := GREATEST(900, COALESCE(v_rating, 1000) - 10); -- Minimum rating of 900
  END IF;

  -- Single atomic update
  INSERT INTO user_progress (
    user_id,
    puzzle_id,
    completed,
    time_taken,
    hints_used,
    solution_viewed,
    current_streak,
    highest_streak,
    rating,
    completed_today,
    last_completion_date,
    last_attempt_at,
    attempts_today,
    attempts
  )
  VALUES (
    p_user_id,
    p_puzzle_id,
    p_completed,
    p_time_taken,
    p_hints_used,
    p_solution_viewed,
    v_current_streak,
    v_highest_streak,
    v_rating,
    p_completed,
    CASE WHEN p_completed THEN v_current_date ELSE v_last_completion_date END,
    NOW(),
    1,
    1
  )
  ON CONFLICT (user_id, puzzle_id) DO UPDATE SET
    completed = EXCLUDED.completed,
    time_taken = CASE 
      WHEN user_progress.completed = false AND EXCLUDED.completed = true 
      THEN EXCLUDED.time_taken 
      WHEN user_progress.completed = true AND user_progress.time_taken > EXCLUDED.time_taken 
      THEN EXCLUDED.time_taken
      ELSE user_progress.time_taken
    END,
    hints_used = user_progress.hints_used + EXCLUDED.hints_used,
    solution_viewed = user_progress.solution_viewed OR EXCLUDED.solution_viewed,
    current_streak = EXCLUDED.current_streak,
    highest_streak = EXCLUDED.highest_streak,
    rating = EXCLUDED.rating,
    completed_today = EXCLUDED.completed_today,
    last_completion_date = EXCLUDED.last_completion_date,
    last_attempt_at = EXCLUDED.last_attempt_at,
    attempts_today = user_progress.attempts_today + 1,
    attempts = user_progress.attempts + 1;

  -- Update puzzle statistics
  IF p_completed THEN
    UPDATE puzzles
    SET 
      times_solved = times_solved + 1,
      avg_time = (avg_time * times_solved + p_time_taken) / (times_solved + 1)
    WHERE id = p_puzzle_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;