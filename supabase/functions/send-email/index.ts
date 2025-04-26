import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SmtpClient } from "npm:smtp@0.1.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

interface SmtpConfig {
  hostname: string;
  port: number;
  username: string;
  password: string;
  from: string;
}

// Function to validate SMTP configuration
function validateSmtpConfig(config: Partial<SmtpConfig>): config is SmtpConfig {
  const requiredFields: (keyof SmtpConfig)[] = ['hostname', 'port', 'username', 'password', 'from'];
  const missingFields = requiredFields.filter(field => !config[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing SMTP configuration: ${missingFields.join(', ')}`);
  }

  if (isNaN(config.port!) || config.port! <= 0) {
    throw new Error('Invalid SMTP port');
  }

  return true;
}

// Function to validate email payload
function validateEmailPayload(payload: Partial<EmailPayload>): payload is EmailPayload {
  const requiredFields: (keyof EmailPayload)[] = ['to', 'subject', 'html'];
  const missingFields = requiredFields.filter(field => !payload[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing email fields: ${missingFields.join(', ')}`);
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.to!)) {
    throw new Error('Invalid recipient email address');
  }

  return true;
}

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Received email request`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let client: SmtpClient | null = null;

  try {
    // Get and validate SMTP configuration
    const config: Partial<SmtpConfig> = {
      hostname: Deno.env.get('SMTP_HOST'),
      port: parseInt(Deno.env.get('SMTP_PORT') || ''),
      username: Deno.env.get('SMTP_USER'),
      password: Deno.env.get('SMTP_PASS'),
      from: Deno.env.get('SMTP_FROM')
    };

    validateSmtpConfig(config);
    console.log(`[${new Date().toISOString()}] SMTP configuration validated`);

    // Get and validate email payload
    const payload: Partial<EmailPayload> = await req.json();
    validateEmailPayload(payload);
    console.log(`[${new Date().toISOString()}] Email payload validated for recipient: ${payload.to}`);

    // Initialize SMTP client
    client = new SmtpClient({
      connection: {
        hostname: config.hostname,
        port: config.port,
        tls: true,
        auth: {
          username: config.username,
          password: config.password,
        },
      },
    });

    console.log(`[${new Date().toISOString()}] Attempting SMTP connection`);

    // Test connection
    await client.connect();
    console.log(`[${new Date().toISOString()}] SMTP connection established`);

    // Send email
    await client.send({
      from: config.from,
      to: [payload.to!],
      subject: payload.subject!,
      html: payload.html!,
    });

    console.log(`[${new Date().toISOString()}] Email sent successfully to ${payload.to}`);

    // Close connection
    await client.close();
    console.log(`[${new Date().toISOString()}] SMTP connection closed`);

    return new Response(
      JSON.stringify({ message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // Log the full error details
    console.error(`[${new Date().toISOString()}] Email error:`, {
      message: error.message,
      stack: error.stack,
      cause: error.cause,
    });

    // Attempt to close SMTP connection if it exists
    if (client) {
      try {
        await client.close();
        console.log(`[${new Date().toISOString()}] SMTP connection closed after error`);
      } catch (closeError) {
        console.error(`[${new Date().toISOString()}] Error closing SMTP connection:`, closeError);
      }
    }

    // Determine appropriate error message and status
    let status = 500;
    let message = 'Internal server error';

    if (error.message.includes('Missing SMTP configuration')) {
      status = 500;
      message = 'Server configuration error';
    } else if (error.message.includes('Missing email fields')) {
      status = 400;
      message = 'Invalid request';
    } else if (error.message.includes('Invalid recipient')) {
      status = 400;
      message = 'Invalid email address';
    } else if (error.message.includes('SMTP')) {
      status = 500;
      message = 'Email delivery failed';
    }

    return new Response(
      JSON.stringify({
        error: message,
        details: error.message
      }),
      { 
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});