/*
  # Add Password History and Session Management

  1. New Tables
    - `password_history`: Track password changes
    - `user_sessions`: Track active sessions
    - `security_settings`: Store user security preferences

  2. Changes
    - Add password history tracking
    - Add session management
    - Add security settings

  3. Security
    - Enable RLS on new tables
    - Add appropriate access policies
*/

-- Create password history table
CREATE TABLE IF NOT EXISTS password_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  device_fingerprint text NOT NULL,
  ip_address text NOT NULL,
  user_agent text,
  last_active timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- Create security settings table
CREATE TABLE IF NOT EXISTS security_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users,
  require_2fa boolean DEFAULT false,
  password_expires_at timestamptz,
  max_sessions integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can view their own password history"
  ON password_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions"
  ON user_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own security settings"
  ON security_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings"
  ON security_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to check password history
CREATE OR REPLACE FUNCTION check_password_history(
  user_id_param uuid,
  new_password_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  matches integer;
BEGIN
  -- Check last 5 passwords
  SELECT COUNT(*)
  INTO matches
  FROM password_history
  WHERE user_id = user_id_param
    AND password_hash = new_password_hash
    AND created_at > now() - interval '90 days'
  ORDER BY created_at DESC
  LIMIT 5;

  RETURN matches = 0;
END;
$$;

-- Function to manage sessions
CREATE OR REPLACE FUNCTION manage_user_sessions(
  user_id_param uuid,
  device_fingerprint_param text,
  ip_address_param text,
  user_agent_param text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id uuid;
  max_sessions integer;
BEGIN
  -- Get user's max session limit
  SELECT COALESCE(max_sessions, 3)
  INTO max_sessions
  FROM security_settings
  WHERE user_id = user_id_param;

  -- Delete expired sessions
  DELETE FROM user_sessions
  WHERE user_id = user_id_param
    AND expires_at < now();

  -- Delete oldest sessions if limit exceeded
  DELETE FROM user_sessions
  WHERE id IN (
    SELECT id
    FROM user_sessions
    WHERE user_id = user_id_param
    ORDER BY last_active DESC
    OFFSET max_sessions
  );

  -- Create new session
  INSERT INTO user_sessions (
    user_id,
    device_fingerprint,
    ip_address,
    user_agent,
    expires_at
  )
  VALUES (
    user_id_param,
    device_fingerprint_param,
    ip_address_param,
    user_agent_param,
    now() + interval '30 minutes'
  )
  RETURNING id INTO session_id;

  RETURN session_id;
END;
$$;

-- Function to update session activity
CREATE OR REPLACE FUNCTION update_session_activity(
  session_id_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_sessions
  SET 
    last_active = now(),
    expires_at = now() + interval '30 minutes'
  WHERE id = session_id_param;
END;
$$;

-- Add trigger to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM user_sessions
  WHERE expires_at < now();
  RETURN NULL;
END;
$$;

CREATE TRIGGER cleanup_expired_sessions_trigger
  AFTER INSERT OR UPDATE ON user_sessions
  EXECUTE FUNCTION cleanup_expired_sessions();