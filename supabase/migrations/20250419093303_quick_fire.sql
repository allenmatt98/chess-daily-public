-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job for puzzle rotation
SELECT cron.schedule(
  'rotate-puzzle',           -- job name
  '30 15 * * *',            -- schedule (3:30 PM UTC / 9 PM IST)
  'SELECT update_current_puzzle()'
);