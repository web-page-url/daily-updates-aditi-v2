import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Log connection details (without exposing full key)
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase key available:', !!supabaseAnonKey);
console.log('Supabase key prefix:', supabaseAnonKey.substring(0, 5) + '...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing. Please check your environment variables.');
}

// Create client with enhanced session persistence options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: {
      getItem: (key) => {
        try {
          return localStorage.getItem(key);
        } catch (error) {
          console.error('localStorage.getItem error:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
        } catch (error) {
          console.error('localStorage.setItem error:', error);
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.error('localStorage.removeItem error:', error);
        }
      },
    },
    autoRefreshToken: true,
    debug: false
  }
});

// Test the connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Supabase connection error:', error);
  } else {
    console.log('Supabase connection successful');
  }
});

// Type definitions for our tables
export interface Team {
  id: string;
  team_name: string;
  manager_email: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  employee_email: string;
  employee_id: string;
  manager_name: string;
  team_member_name: string;
  team_name: string;
  created_at: string;
  aditi_teams?: Team;
}

export interface DailyUpdate {
  id: string;
  employee_name: string;
  employee_id: string;
  employee_email: string;
  team_id: string;
  tasks_completed: string;
  status: 'in-progress' | 'completed' | 'blocked';
  blocker_type: 'Blockers' | 'Risks' | 'Dependencies';
  blocker_description: string;
  expected_resolution_date: string;
  additional_notes: string;
  created_at: string;
  aditi_teams?: Team;
} 