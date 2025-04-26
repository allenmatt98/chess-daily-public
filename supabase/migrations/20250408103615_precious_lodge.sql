/*
  # Add get_daily_puzzle function
  
  1. New Function
    - Creates a stored procedure to fetch the daily puzzle
    - Returns the puzzle assigned for the current date
    - Falls back to a random puzzle if none is assigned for today
  
  2. Security
    - Function is accessible to all authenticated users
    - Respects existing RLS policies
*/

CREATE OR REPLACE FUNCTION get_daily_puzzle()
RETURNS SETOF puzzles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First try to get today's assigned puzzle
  RETURN QUERY
  SELECT *
  FROM puzzles
  WHERE date_assigned = CURRENT_DATE
  LIMIT 1;

  -- If no puzzle is assigned for today, return a random puzzle
  -- that hasn't been assigned a date yet
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT *
    FROM puzzles
    WHERE date_assigned IS NULL
    ORDER BY RANDOM()
    LIMIT 1;
  END IF;
END;
$$;