/*
  # Add Password Reset System

  1. New Tables
    - password_reset_tokens: Store reset tokens
    - password_reset_attempts: Track reset attempts

  2. Functions
    - create_reset_token: Generate secure reset tokens
    - validate_reset_token: Verify token validity
    - invalidate_all_sessions: Force logout from all sessions

  3. Security
    - Enable RLS
    - Add rate limiting
    - Add audit logging
*/

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  token text NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  CONSTRAINT token_not_expired CHECK (expires_at > now())
);

-- Create reset attempts tracking table
CREATE TABLE IF NOT EXISTS password_reset_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text NOT NULL,
  attempted_at timestamptz DEFAULT now(),
  success boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_attempts ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_reset_attempts_email ON password_reset_attempts(email, attempted_at);
CREATE INDEX idx_reset_attempts_ip ON password_reset_attempts(ip_address, attempted_at);

-- Function to create reset token
CREATE OR REPLACE FUNCTION create_reset_token(user_id_param uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_token text;
BEGIN
  -- Generate secure token
  new_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert new token
  INSERT INTO password_reset_tokens (
    user_id,
    token,
    expires_at
  )
  VALUES (
    user_id_param,
    new_token,
    now() + interval '15 minutes'
  );
  
  RETURN new_token;
END;
$$;

-- Function to validate reset token
CREATE OR REPLACE FUNCTION validate_reset_token(token_param text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_id_var uuid;
BEGIN
  -- Get and validate token
  SELECT user_id INTO user_id_var
  FROM password_reset_tokens
  WHERE token = token_param
    AND used_at IS NULL
    AND expires_at > now();
    
  IF user_id_var IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Mark token as used
  UPDATE password_reset_tokens
  SET used_at = now()
  WHERE token = token_param;
  
  RETURN user_id_var;
END;
$$;

-- Function to invalidate all sessions
CREATE OR REPLACE FUNCTION invalidate_all_sessions(user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all sessions except current one
  DELETE FROM auth.sessions
  WHERE user_id = user_id_param
    AND id != auth.uid();
    
  -- Log the action
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id
  )
  VALUES (
    user_id_param,
    'INVALIDATE_SESSIONS',
    'USER',
    user_id_param
  );
END;
$$;

-- Add policies
CREATE POLICY "Allow insert reset attempts"
  ON password_reset_attempts
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Function to check reset rate limit
CREATE OR REPLACE FUNCTION check_reset_rate_limit(
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
  -- Count attempts in last hour
  SELECT COUNT(*)
  INTO attempt_count
  FROM password_reset_attempts
  WHERE (email = email_param OR ip_address = ip_param)
    AND attempted_at > now() - interval '1 hour';
    
  -- Allow max 3 attempts per hour
  RETURN attempt_count < 3;
END;
$$;

-- Add cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired tokens
  DELETE FROM password_reset_tokens
  WHERE expires_at < now();
  
  -- Delete old attempts
  DELETE FROM password_reset_attempts
  WHERE attempted_at < now() - interval '24 hours';
END;
$$;

-- Create cleanup trigger
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_tokens()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM cleanup_expired_tokens();
  RETURN NULL;
END;
$$;

CREATE TRIGGER cleanup_expired_tokens_trigger
  AFTER INSERT ON password_reset_tokens
  EXECUTE FUNCTION trigger_cleanup_expired_tokens();