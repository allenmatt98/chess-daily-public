/*
  # Add OTP Authentication System

  1. New Tables
    - `otp_codes`: Store OTP codes and their status
      - `id` (uuid, primary key)
      - `email` (text, user's email)
      - `code` (text, 6-digit OTP)
      - `expires_at` (timestamp)
      - `attempts` (integer)
      - `verified` (boolean)
      - `created_at` (timestamp)

    - `auth_sessions`: Track user sessions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `refresh_token` (text)
      - `device_info` (jsonb)
      - `expires_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add rate limiting functions
    - Add security policies
*/

-- Create OTP codes table
CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts integer DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  CHECK (length(code) = 6)
);

-- Create auth sessions table
CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  refresh_token text NOT NULL,
  device_info jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_otp_codes_email ON otp_codes(email);
CREATE INDEX idx_otp_codes_expires_at ON otp_codes(expires_at);
CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX idx_auth_sessions_expires_at ON auth_sessions(expires_at);

-- Function to generate OTP
CREATE OR REPLACE FUNCTION generate_otp(email_param text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_otp text;
  attempt_count integer;
BEGIN
  -- Check rate limit (max 3 attempts per hour)
  SELECT COUNT(*)
  INTO attempt_count
  FROM otp_codes
  WHERE email = email_param
    AND created_at > now() - interval '1 hour';

  IF attempt_count >= 3 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please try again later.';
  END IF;

  -- Generate 6-digit OTP
  new_otp := lpad(floor(random() * 1000000)::text, 6, '0');

  -- Insert new OTP
  INSERT INTO otp_codes (
    email,
    code,
    expires_at
  )
  VALUES (
    email_param,
    new_otp,
    now() + interval '5 minutes'
  );

  RETURN new_otp;
END;
$$;

-- Function to verify OTP
CREATE OR REPLACE FUNCTION verify_otp(
  email_param text,
  code_param text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  otp_record otp_codes%ROWTYPE;
BEGIN
  -- Get the latest unverified OTP for this email
  SELECT *
  INTO otp_record
  FROM otp_codes
  WHERE email = email_param
    AND verified = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  -- Check if OTP exists and is valid
  IF otp_record.id IS NULL THEN
    RETURN false;
  END IF;

  -- Update attempts
  UPDATE otp_codes
  SET attempts = attempts + 1
  WHERE id = otp_record.id;

  -- Check attempts
  IF otp_record.attempts >= 3 THEN
    RETURN false;
  END IF;

  -- Verify OTP
  IF otp_record.code = code_param THEN
    UPDATE otp_codes
    SET verified = true
    WHERE id = otp_record.id;
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Cleanup function for expired OTPs and sessions
CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete expired OTPs
  DELETE FROM otp_codes
  WHERE expires_at < now();

  -- Delete expired sessions
  DELETE FROM auth_sessions
  WHERE expires_at < now();
END;
$$;

-- Create cleanup trigger
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_auth_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM cleanup_expired_auth_data();
  RETURN NULL;
END;
$$;

CREATE TRIGGER cleanup_expired_auth_data_trigger
  AFTER INSERT ON otp_codes
  EXECUTE FUNCTION trigger_cleanup_expired_auth_data();

-- Add RLS policies
CREATE POLICY "Allow insert OTP codes"
  ON otp_codes
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Allow select own OTP codes"
  ON otp_codes
  FOR SELECT
  TO authenticated
  USING (email = auth.email());

CREATE POLICY "Allow select own sessions"
  ON auth_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow delete own sessions"
  ON auth_sessions
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());