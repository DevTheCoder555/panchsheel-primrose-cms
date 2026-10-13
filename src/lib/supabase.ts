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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return supabaseUrl !== 'https://YOUR_PROJECT_ID.supabase.co' && supabaseAnonKey !== 'YOUR_ANON_KEY';
};
