/*
  # Add rotation failure tracking

  1. Changes
    - Create rotation_failures table if it doesn't exist
    - Add RLS policy if it doesn't exist
    - Add logging function
*/

-- Create table for tracking rotation failures if it doesn't exist
CREATE TABLE IF NOT EXISTS rotation_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempted_at timestamptz NOT NULL DEFAULT now(),
  error_message text NOT NULL,
  error_detail text,
  metadata jsonb
);

-- Enable RLS
ALTER TABLE rotation_failures ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and create new one
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admin can read rotation failures" ON rotation_failures;
    
    CREATE POLICY "Admin can read rotation failures"
      ON rotation_failures
      FOR SELECT
      TO admin
      USING (true);
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Function to log rotation failures
CREATE OR REPLACE FUNCTION log_rotation_failure(
  error_message_param text,
  error_detail_param text DEFAULT NULL,
  metadata_param jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO rotation_failures (
    error_message,
    error_detail,
    metadata
  )
  VALUES (
    error_message_param,
    error_detail_param,
    metadata_param
  );
END;
$$;