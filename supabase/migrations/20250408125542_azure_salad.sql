/*
  # Add scoring system

  1. New Columns
    - Add rating and streak columns to user_progress table
    - Add base rating default of 1000

  2. Changes
    - Modify user_progress table to track scoring metrics
    - Add function to calculate score based on time and streak
*/

-- Add new columns to user_progress
ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS rating INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS highest_streak INTEGER DEFAULT 0;

-- Create function to calculate score based on time
CREATE OR REPLACE FUNCTION calculate_puzzle_score(completion_time INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN CASE
    WHEN completion_time < 30 THEN 125
    WHEN completion_time < 60 THEN 100
    WHEN completion_time < 180 THEN 75
    WHEN completion_time < 300 THEN 50
    ELSE 25
  END;
END;
$$;

-- Create function to calculate streak multiplier
CREATE OR REPLACE FUNCTION calculate_streak_multiplier(streak INTEGER)
RETURNS DECIMAL
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN CASE
    WHEN streak >= 5 THEN 1.3
    WHEN streak >= 3 THEN 1.2
    WHEN streak >= 2 THEN 1.1
    ELSE 1.0
  END;
END;
$$;

-- Create function to update user rating
CREATE OR REPLACE FUNCTION update_user_rating(
  user_id_param UUID,
  puzzle_id_param UUID,
  completion_time_param INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  base_score INTEGER;
  streak_multiplier DECIMAL;
  current_streak INTEGER;
  current_rating INTEGER;
  final_score INTEGER;
BEGIN
  -- Get current streak and rating
  SELECT rating, current_streak INTO current_rating, current_streak
  FROM user_progress
  WHERE user_id = user_id_param
  ORDER BY completed_at DESC
  LIMIT 1;

  -- If no previous record exists, use defaults
  IF current_rating IS NULL THEN
    current_rating := 1000;
    current_streak := 0;
  END IF;

  -- Calculate base score and multiplier
  base_score := calculate_puzzle_score(completion_time_param);
  streak_multiplier := calculate_streak_multiplier(current_streak + 1);

  -- Calculate final score
  final_score := current_rating + ROUND(base_score * streak_multiplier);

  RETURN final_score;
END;
$$;