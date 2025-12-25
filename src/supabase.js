import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://xuqvzlbfqdkfjjhdvzac.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1cXZ6bGJmcWRrZmpqaGR2emFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1ODI2MTMsImV4cCI6MjA4MjE1ODYxM30.akHZLx4HAZwd0qQreDuOhLoh1WhCLjGvelw5CbyuSkU';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
