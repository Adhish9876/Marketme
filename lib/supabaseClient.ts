// Supabase client initialization
import { createClient } from '@supabase/supabase-js';

// For Vercel builds, use placeholder values - real values will be set at runtime
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);