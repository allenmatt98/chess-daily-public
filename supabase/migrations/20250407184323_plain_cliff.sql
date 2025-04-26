/*
  # Enable public access to puzzles

  1. Security Changes
    - Add policy for public read access to puzzles table
    - Keep existing authenticated user policies
    - Add RLS policy for public access to get_daily_puzzle function

  2. Function Updates
    - Modify get_daily_puzzle to be accessible by anonymous users
*/

-- Enable public read access to puzzles
CREATE POLICY "Puzzles are viewable by everyone"
  ON puzzles
  FOR SELECT
  TO public
  USING (true);

-- Allow public access to get_daily_puzzle function
REVOKE EXECUTE ON FUNCTION get_daily_puzzle() FROM public;
GRANT EXECUTE ON FUNCTION get_daily_puzzle() TO anon;
GRANT EXECUTE ON FUNCTION get_daily_puzzle() TO authenticated;