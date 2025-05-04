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

    // --- 1. Calculate the current puzzle day (starts at 16:30 UTC = 10 PM IST) ---
    const now = new Date();
    // Shift time to 10 PM IST (16:30 UTC) as the start of the puzzle day
    const puzzleDay = new Date(now.getTime() - (16.5 * 60 * 60 * 1000)); // 16.5 hours in ms
    const yearStart = new Date(Date.UTC(puzzleDay.getUTCFullYear(), 0, 0));
    const dayOfYear = Math.floor((puzzleDay.getTime() - yearStart.getTime()) / 86400000);

    // --- 2. Get all puzzles ordered by puzzle_number ---
    const { data: puzzles, error: puzzlesError } = await supabase
      .from('puzzles')
      .select('id')
      .order('puzzle_number', { ascending: true });

    if (puzzlesError || !puzzles || puzzles.length === 0) throw puzzlesError || new Error('No puzzles found');
    const puzzleIndex = dayOfYear % puzzles.length;
    const puzzleId = puzzles[puzzleIndex].id;

    const { data: puzzle, error: puzzleError } = await supabase
      .from('puzzles')
      .select('*')
      .eq('id', puzzleId)
      .single();
    if (puzzleError) throw puzzleError;

    // --- 3. Calculate next rotation time (next 16:30 UTC) ---
    const nextRotation = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 16, 30, 0, 0));
    if (now >= nextRotation) {
      // If we've already passed today's 16:30 UTC, set to tomorrow
      nextRotation.setUTCDate(nextRotation.getUTCDate() + 1);
    }

    return new Response(
      JSON.stringify({ puzzle, nextRotation: nextRotation.toISOString() }),
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