/*
  # Fix ambiguous column reference in get_daily_puzzle function

  1. Changes
    - Properly qualify puzzle_number column reference
    - Maintain existing 12-hour rotation logic
    - Keep security settings and policies intact

  2. Security
    - Function remains security definer
    - Maintains existing RLS policies
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_daily_puzzle();

-- Create updated function with qualified column references
CREATE OR REPLACE FUNCTION get_daily_puzzle()
RETURNS SETOF puzzles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_hour INTEGER;
  puzzle_count INTEGER;
  selected_number INTEGER;
BEGIN
  -- Get current hour in UTC
  current_hour := EXTRACT(HOUR FROM CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::INTEGER;
  
  -- Get total number of puzzles
  SELECT COUNT(*) INTO puzzle_count 
  FROM public.puzzles;
  
  -- If no puzzles exist, return null
  IF puzzle_count = 0 THEN
    RETURN;
  END IF;
  
  -- Calculate puzzle number (1 or 2 based on 12-hour period)
  selected_number := CASE 
    WHEN current_hour < 12 THEN 1
    ELSE 2
  END;
  
  -- If selected_number is greater than available puzzles, wrap back to 1
  IF selected_number > puzzle_count THEN
    selected_number := 1;
  END IF;
  
  -- Return the selected puzzle with fully qualified column reference
  RETURN QUERY
  SELECT p.*
  FROM public.puzzles p
  WHERE p.puzzle_number = selected_number
  LIMIT 1;
END;
$$;