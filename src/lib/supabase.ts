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

// Updated Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          first_name: string;
          last_name: string;
          phone_number: string | null;
          date_of_birth: string | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          email?: string | null;
          first_name: string;
          last_name: string;
          phone_number?: string | null;
          date_of_birth?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          first_name?: string;
          last_name?: string;
          phone_number?: string | null;
          date_of_birth?: string | null;
          is_active?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string | null;
          age_range: string | null;
          income_range: string | null;
          financial_experience: string | null;
          primary_goals: string[] | null;
          learning_style: string | null;
          time_availability: string | null;
          interests: string[] | null;
          notification_preferences: any | null;
          privacy_settings: any | null;
          theme_preferences: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          age_range?: string | null;
          income_range?: string | null;
          financial_experience?: string | null;
          primary_goals?: string[] | null;
          learning_style?: string | null;
          time_availability?: string | null;
          interests?: string[] | null;
          notification_preferences?: any | null;
          privacy_settings?: any | null;
          theme_preferences?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          age_range?: string | null;
          income_range?: string | null;
          financial_experience?: string | null;
          primary_goals?: string[] | null;
          learning_style?: string | null;
          time_availability?: string | null;
          interests?: string[] | null;
          notification_preferences?: any | null;
          privacy_settings?: any | null;
          theme_preferences?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string | null;
          name: string | null;
          description: string | null; // New field
          target_amount: number | null;
          saved_amount: number | null;
          current_amount: number | null; // New field
          deadline: string | null;
          target_date: string | null; // New field
          goal_type: string | null; // New field
          priority_level: string | null; // New field
          status: string | null; // New field
          created_at: string | null;
          updated_at: string | null; // New field
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name?: string | null;
          description?: string | null;
          target_amount?: number | null;
          saved_amount?: number | null;
          current_amount?: number | null;
          deadline?: string | null;
          target_date?: string | null;
          goal_type?: string | null;
          priority_level?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string | null;
          description?: string | null;
          target_amount?: number | null;
          saved_amount?: number | null;
          current_amount?: number | null;
          deadline?: string | null;
          target_date?: string | null;
          goal_type?: string | null;
          priority_level?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      learning_modules: {
        Row: {
          id: string;
          title: string;
          description: string;
          content_type: string;
          difficulty: string;
          category: string;
          duration_minutes: number;
          xp_reward: number;
          required_level: number;
          prerequisites: string[];
          prerequisites_new: any; // New field
          content_data: any; // New field
          is_active: boolean; // New field
          tags: string[];
          is_featured: boolean;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          content_type: string;
          difficulty: string;
          category: string;
          duration_minutes: number;
          xp_reward?: number;
          required_level?: number;
          prerequisites?: string[];
          prerequisites_new?: any;
          content_data?: any;
          is_active?: boolean;
          tags?: string[];
          is_featured?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          content_type?: string;
          difficulty?: string;
          category?: string;
          duration_minutes?: number;
          xp_reward?: number;
          required_level?: number;
          prerequisites?: string[];
          prerequisites_new?: any;
          content_data?: any;
          is_active?: boolean;
          tags?: string[];
          is_featured?: boolean;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      user_learning_progress: {
        Row: {
          id: string;
          user_id: string | null;
          module_id: string | null;
          status: string;
          progress_percentage: number;
          time_spent_minutes: number;
          completed_at: string | null;
          started_at: string | null;
          last_accessed_at: string | null;
          path_id: string | null; // New field
          updated_at: string | null; // New field
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          module_id?: string | null;
          status?: string;
          progress_percentage?: number;
          time_spent_minutes?: number;
          completed_at?: string | null;
          started_at?: string | null;
          last_accessed_at?: string | null;
          path_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          module_id?: string | null;
          status?: string;
          progress_percentage?: number;
          time_spent_minutes?: number;
          completed_at?: string | null;
          started_at?: string | null;
          last_accessed_at?: string | null;
          path_id?: string | null;
          updated_at?: string | null;
        };
      };
      learning_paths_new: {
        Row: {
          path_id: string;
          name: string;
          description: string | null;
          target_audience: string | null;
          estimated_duration: number | null;
          completion_badge_id: string | null;
          is_featured: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          path_id?: string;
          name: string;
          description?: string | null;
          target_audience?: string | null;
          estimated_duration?: number | null;
          completion_badge_id?: string | null;
          is_featured?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          path_id?: string;
          name?: string;
          description?: string | null;
          target_audience?: string | null;
          estimated_duration?: number | null;
          completion_badge_id?: string | null;
          is_featured?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      learning_path_modules: {
        Row: {
          path_module_id: string;
          path_id: string;
          module_id: string;
          sequence_order: number;
          is_required: boolean | null;
          unlock_conditions: any | null;
          created_at: string | null;
        };
        Insert: {
          path_module_id?: string;
          path_id: string;
          module_id: string;
          sequence_order: number;
          is_required?: boolean | null;
          unlock_conditions?: any | null;
          created_at?: string | null;
        };
        Update: {
          path_module_id?: string;
          path_id?: string;
          module_id?: string;
          sequence_order?: number;
          is_required?: boolean | null;
          unlock_conditions?: any | null;
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