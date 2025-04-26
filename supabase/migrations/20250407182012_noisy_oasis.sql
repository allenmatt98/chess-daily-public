/*
  # Create puzzle tracking tables

  1. New Tables
    - `puzzles`
      - `id` (uuid, primary key)
      - `fen` (text, starting position)
      - `pgn` (text, puzzle moves)
      - `white` (text, white player)
      - `black` (text, black player)
      - `result` (text, game result)
      - `link` (text, optional external link)
      - `created_at` (timestamp)

    - `user_progress`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `puzzle_id` (uuid, references puzzles)
      - `completed` (boolean)
      - `time_taken` (integer, seconds)
      - `attempts` (integer)
      - `completed_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create puzzles table
CREATE TABLE IF NOT EXISTS puzzles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fen text NOT NULL,
  pgn text NOT NULL,
  white text NOT NULL,
  black text NOT NULL,
  result text NOT NULL,
  link text,
  created_at timestamptz DEFAULT now()
);

-- Create user progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  puzzle_id uuid REFERENCES puzzles NOT NULL,
  completed boolean DEFAULT false,
  time_taken integer,
  attempts integer DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, puzzle_id)
);

-- Enable RLS
ALTER TABLE puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policies for puzzles table
CREATE POLICY "Puzzles are viewable by all users"
  ON puzzles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for user_progress table
CREATE POLICY "Users can view their own progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);