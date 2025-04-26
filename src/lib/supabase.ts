import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  throw new Error('Missing Supabase environment variables');
}

console.debug('Initializing Supabase client:', {
  url: supabaseUrl,
  timestamp: new Date().toISOString()
});

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Test connection
supabase.from('puzzles').select('count').single()
  .then(() => {
    console.debug('Supabase connection successful');
  })
  .catch(error => {
    console.error('Supabase connection error:', error);
  });