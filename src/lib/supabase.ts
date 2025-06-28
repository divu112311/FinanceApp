import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if we have valid Supabase credentials
const hasValidCredentials = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url_here' &&
  supabaseAnonKey !== 'your_supabase_anon_key_here' &&
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co');

if (!hasValidCredentials) {
  console.warn('Supabase credentials not configured. Using placeholder client.');
  console.log('To connect to Supabase:');
  console.log('1. Click "Connect to Supabase" button in the top right');
  console.log('2. Or manually update your .env file with:');
  console.log('   - VITE_SUPABASE_URL (your project URL)');
  console.log('   - VITE_SUPABASE_ANON_KEY (your anon key)');
}

// Use valid placeholder URL to prevent initialization errors
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.placeholder';

export const supabase = createClient(
  hasValidCredentials ? supabaseUrl : fallbackUrl,
  hasValidCredentials ? supabaseAnonKey : fallbackKey
);

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = hasValidCredentials;

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          created_at?: string | null;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string | null;
          name: string | null;
          target_amount: number | null;
          saved_amount: number | null;
          deadline: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name?: string | null;
          target_amount?: number | null;
          saved_amount?: number | null;
          deadline?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string | null;
          target_amount?: number | null;
          saved_amount?: number | null;
          deadline?: string | null;
          created_at?: string | null;
        };
      };
      chat_logs: {
        Row: {
          id: string;
          user_id: string | null;
          message: string | null;
          sender: string | null;
          timestamp: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          message?: string | null;
          sender?: string | null;
          timestamp?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          message?: string | null;
          sender?: string | null;
          timestamp?: string | null;
        };
      };
      xp: {
        Row: {
          id: string;
          user_id: string | null;
          points: number | null;
          badges: string[] | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          points?: number | null;
          badges?: string[] | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          points?: number | null;
          badges?: string[] | null;
        };
      };
    };
  };
}