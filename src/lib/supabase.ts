import { createClient } from '@supabase/supabase-js';

// ============================================================
// SETUP INSTRUCTIONS:
// 1. Create a free Supabase project at https://supabase.com
// 2. Run the SQL from supabase-schema.sql in the Supabase SQL Editor
// 3. Replace the placeholder values below with your project credentials
// 4. For production, use environment variables:
//    - VITE_SUPABASE_URL
//    - VITE_SUPABASE_ANON_KEY
// ============================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://awfzmyuyanedlbcgoigi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZnpteXV5YW5lZGxiY2dvaWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4OTU0ODgsImV4cCI6MjEwNzQ3MTQ4OH0.HPVWs1hm3csoHbVWinpaJUx1uzThPptUsoyKQauVz7I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'https://YOUR_PROJECT_ID.supabase.co' && supabaseAnonKey !== 'YOUR_ANON_KEY';
};
