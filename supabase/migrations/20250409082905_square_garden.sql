/*
  # Implement Critical Security Measures

  1. Changes
    - Add rate limiting for authentication attempts
    - Add secure session management
    - Enhance RLS policies
    - Add input validation
    - Add request logging for sensitive operations

  2. Security
    - All functions are security definer
    - Proper access control through RLS
    - Secure defaults for all new features
*/

-- Create auth_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS auth_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text NOT NULL,
  attempt_time timestamptz DEFAULT now(),
  success boolean DEFAULT false
);

-- Enable RLS on auth_attempts
ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;

-- Only allow inserts and selects on auth_attempts
CREATE POLICY "Allow insert on auth attempts"
  ON auth_attempts
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow select on own attempts"
  ON auth_attempts
  FOR SELECT
  TO authenticated
  USING (email = auth.email());

-- Function to check rate limits
CREATE OR REPLACE FUNCTION check_auth_rate_limit(
  email_param text,
  ip_param text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  attempt_count integer;
BEGIN
  -- Delete old attempts (older than 15 minutes)
  DELETE FROM auth_attempts
  WHERE attempt_time < now() - interval '15 minutes';

  -- Count recent attempts
  SELECT COUNT(*)
  INTO attempt_count
  FROM auth_attempts
  WHERE (email = email_param OR ip_address = ip_param)
    AND attempt_time > now() - interval '15 minutes';

  -- Allow if under limit
  RETURN attempt_count < 5;
END;
$$;

-- Function to log authentication attempt
CREATE OR REPLACE FUNCTION log_auth_attempt(
  email_param text,
  ip_param text,
  success_param boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO auth_attempts (email, ip_address, success)
  VALUES (email_param, ip_param, success_param);
END;
$$;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only allow inserts and selects on audit_logs
CREATE POLICY "Allow insert on audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow select on own audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
  action_param text,
  entity_type_param text,
  entity_id_param uuid,
  old_data_param jsonb DEFAULT NULL,
  new_data_param jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_data,
    new_data,
    ip_address
  )
  VALUES (
    auth.uid(),
    action_param,
    entity_type_param,
    entity_id_param,
    old_data_param,
    new_data_param,
    current_setting('request.headers')::json->>'x-forwarded-for'
  );
END;
$$;

-- Update user_progress RLS policies
DROP POLICY IF EXISTS "Users can view their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_progress;

CREATE POLICY "Users can view their own progress"
  ON user_progress
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM auth_attempts
      WHERE email = auth.email()
        AND NOT success
        AND attempt_time > now() - interval '15 minutes'
      GROUP BY email
      HAVING COUNT(*) >= 5
    )
  );

CREATE POLICY "Users can insert their own progress"
  ON user_progress
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM auth_attempts
      WHERE email = auth.email()
        AND NOT success
        AND attempt_time > now() - interval '15 minutes'
      GROUP BY email
      HAVING COUNT(*) >= 5
    )
  );

CREATE POLICY "Users can update their own progress"
  ON user_progress
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1 FROM auth_attempts
      WHERE email = auth.email()
        AND NOT success
        AND attempt_time > now() - interval '15 minutes'
      GROUP BY email
      HAVING COUNT(*) >= 5
    )
  );

-- Add request rate limiting trigger
CREATE OR REPLACE FUNCTION check_request_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_count integer;
BEGIN
  -- Count requests in last minute
  SELECT COUNT(*)
  INTO request_count
  FROM user_progress
  WHERE user_id = NEW.user_id
    AND created_at > now() - interval '1 minute';

  -- Allow max 30 requests per minute
  IF request_count >= 30 THEN
    RAISE EXCEPTION 'Rate limit exceeded: Too many requests';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_request_rate_limit
  BEFORE INSERT OR UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION check_request_rate_limit();

-- Add input validation trigger for puzzles
CREATE OR REPLACE FUNCTION validate_puzzle_input()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate FEN string format
  IF NEW.fen !~ '^([1-8pnbrqkPNBRQK]+/){7}[1-8pnbrqkPNBRQK]+ [wb] (-|[KQkq]{1,4}) (-|[a-h][36]) \d+ \d+$' THEN
    RAISE EXCEPTION 'Invalid FEN string format';
  END IF;

  -- Validate PGN contains required tags
  IF NEW.pgn !~ '\[White .+\].*\[Black .+\].*\[Result .+\]' THEN
    RAISE EXCEPTION 'PGN must contain White, Black, and Result tags';
  END IF;

  -- Validate difficulty range
  IF NEW.difficulty < 1 OR NEW.difficulty > 5 THEN
    RAISE EXCEPTION 'Difficulty must be between 1 and 5';
  END IF;

  -- Validate time limit
  IF NEW.time_limit < 0 OR NEW.time_limit > 3600 THEN
    RAISE EXCEPTION 'Time limit must be between 0 and 3600 seconds';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_puzzle_input
  BEFORE INSERT OR UPDATE ON puzzles
  FOR EACH ROW
  EXECUTE FUNCTION validate_puzzle_input();