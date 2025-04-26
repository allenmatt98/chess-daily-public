import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface RequestPayload {
  email: string;
  code?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, code }: RequestPayload = await req.json();

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email address');
    }

    if (code) {
      // Verify OTP
      const { data: verified, error: verifyError } = await supabaseClient
        .rpc('verify_otp', { email_param: email, code_param: code });

      if (verifyError) {
        console.error('OTP verification error:', verifyError);
        return new Response(
          JSON.stringify({ error: 'Failed to verify OTP', details: verifyError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!verified) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired OTP' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create or get user
      const { data: { user }, error: userError } = await supabaseClient.auth.admin
        .createUser({
          email,
          email_confirm: true,
          user_metadata: { auth_method: 'otp' }
        });

      if (userError && userError.message !== 'User already registered') {
        console.error('User creation error:', userError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user', details: userError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate session
      const { data: session, error: sessionError } = await supabaseClient.auth.admin
        .createSession({
          user_id: user?.id || '',
          properties: {
            auth_method: 'otp'
          }
        });

      if (sessionError) {
        console.error('Session creation error:', sessionError);
        return new Response(
          JSON.stringify({ error: 'Failed to create session', details: sessionError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ session }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // Generate and send OTP
      const { data: otp, error: otpError } = await supabaseClient
        .rpc('generate_otp', { email_param: email });

      if (otpError) {
        console.error('OTP generation error:', otpError);
        return new Response(
          JSON.stringify({ error: 'Failed to generate OTP', details: otpError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        // Send email with OTP
        const { error: emailError } = await supabaseClient.functions.invoke('send-email', {
          body: {
            to: email,
            subject: 'Your Login Code',
            html: `Your verification code is: <strong>${otp}</strong><br>This code will expire in 5 minutes.`
          }
        });

        if (emailError) {
          console.error('Email sending error:', emailError);
          return new Response(
            JSON.stringify({ error: 'Failed to send email', details: emailError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ message: 'OTP sent successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        return new Response(
          JSON.stringify({ error: 'Failed to send email', details: emailError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});