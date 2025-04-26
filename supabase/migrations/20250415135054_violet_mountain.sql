/*
  # Add Puzzle Rotation Trigger

  1. Changes
    - Add trigger to notify clients of puzzle rotations
    - Enable real-time subscriptions for puzzle_intervals
    - Add function to clean up old intervals
*/

-- Enable real-time for puzzle_intervals table
ALTER PUBLICATION supabase_realtime ADD TABLE puzzle_intervals;

-- Add cleanup function for old intervals
CREATE OR REPLACE FUNCTION cleanup_old_intervals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Keep only the last 7 days of intervals
  DELETE FROM puzzle_intervals
  WHERE end_time < NOW() - INTERVAL '7 days';
END;
$$;

-- Create trigger to clean up old intervals
CREATE OR REPLACE FUNCTION trigger_cleanup_old_intervals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM cleanup_old_intervals();
  RETURN NULL;
END;
$$;

CREATE TRIGGER cleanup_old_intervals_trigger
  AFTER INSERT ON puzzle_intervals
  EXECUTE FUNCTION trigger_cleanup_old_intervals();