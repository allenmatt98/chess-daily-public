/*
  # Add Achievement System

  1. New Tables
    - `achievements`: Defines available achievements
    - `user_achievements`: Tracks user progress and unlocks
    
  2. Changes
    - Add achievement tracking columns to user_progress
    - Add functions for achievement checks
    
  3. Security
    - Enable RLS on new tables
    - Add appropriate access policies
*/

-- Create achievements table
CREATE TABLE achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon_name text NOT NULL,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user achievements table
CREATE TABLE user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  achievement_id uuid REFERENCES achievements NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Achievements are viewable by all users"
  ON achievements
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can view their own achievements"
  ON user_achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert initial achievements
INSERT INTO achievements (name, description, icon_name, requirement_type, requirement_value) VALUES
  ('Speed Demon', 'Solve a puzzle in under 30 seconds', 'timer', 'fastest_solve', 30),
  ('Consistency King', 'Maintain a 7-day solving streak', 'trophy', 'streak', 7),
  ('Rising Star', 'Reach a rating of 1500', 'trending-up', 'rating', 1500),
  ('Grandmaster', 'Reach a rating of 2000', 'crown', 'rating', 2000),
  ('Early Bird', 'Solve 10 puzzles within the first hour of their release', 'sun', 'early_solves', 10),
  ('Perfect Week', 'Complete all puzzles in a week with no failed attempts', 'target', 'perfect_week', 1),
  ('Quick Learner', 'Solve 5 puzzles in under 60 seconds each', 'zap', 'quick_solves', 5),
  ('Elite Solver', 'Maintain a 2000+ rating for 30 days', 'shield', 'rating_duration', 30);

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_achievements(user_id_param uuid)
RETURNS TABLE (
  achievement_id uuid,
  name text,
  description text,
  icon_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_rating integer;
  current_streak integer;
  fastest_solve integer;
  perfect_days integer;
BEGIN
  -- Get user stats
  SELECT 
    up.rating,
    up.current_streak,
    MIN(up.time_taken)
  INTO
    user_rating,
    current_streak,
    fastest_solve
  FROM user_progress up
  WHERE up.user_id = user_id_param
  GROUP BY up.rating, up.current_streak;

  RETURN QUERY
  WITH new_achievements AS (
    SELECT 
      a.id,
      a.name,
      a.description,
      a.icon_name
    FROM achievements a
    LEFT JOIN user_achievements ua 
      ON ua.achievement_id = a.id 
      AND ua.user_id = user_id_param
    WHERE 
      ua.id IS NULL -- Not already unlocked
      AND (
        (a.requirement_type = 'rating' AND user_rating >= a.requirement_value)
        OR (a.requirement_type = 'streak' AND current_streak >= a.requirement_value)
        OR (a.requirement_type = 'fastest_solve' AND fastest_solve <= a.requirement_value)
      )
  )
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT user_id_param, na.id
  FROM new_achievements na
  RETURNING 
    achievement_id,
    na.name,
    na.description,
    na.icon_name;
END;
$$;