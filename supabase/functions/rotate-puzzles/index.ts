import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current 8-hour interval (0, 1, or 2)
    const currentHour = new Date().getUTCHours();
    const interval = Math.floor(currentHour / 8);

    // Get total number of puzzles
    const { count } = await supabase
      .from('puzzles')
      .select('*', { count: 'exact', head: true });

    if (!count) {
      throw new Error('No puzzles found');
    }

    // Calculate puzzle number for this interval
    const puzzleNumber = (interval % count) + 1;

    // Get the puzzle for this interval
    const { data: puzzle, error: puzzleError } = await supabase
      .from('puzzles')
      .select('*')
      .eq('puzzle_number', puzzleNumber)
      .single();

    if (puzzleError) throw puzzleError;

    // Record this interval
    const { error: intervalError } = await supabase
      .from('puzzle_intervals')
      .insert({
        puzzle_id: puzzle.id,
        interval_number: interval,
        start_time: new Date(new Date().setUTCHours(interval * 8, 0, 0, 0)).toISOString(),
        end_time: new Date(new Date().setUTCHours((interval + 1) * 8, 0, 0, 0)).toISOString()
      });

    if (intervalError) throw intervalError;

    return new Response(
      JSON.stringify({ puzzle, nextRotation: (interval + 1) * 8 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error rotating puzzles:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});