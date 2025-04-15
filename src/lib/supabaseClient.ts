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

// Helper to check if window is available (client-side)
const isBrowser = typeof window !== 'undefined';

// Create client with enhanced session persistence options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'aditi_supabase_auth',
    storage: {
      getItem: (key) => {
        if (!isBrowser) return null;
        try {
          const item = localStorage.getItem(key);
          // Also check sessionStorage as fallback
          if (!item && key.includes('supabase_auth')) {
            const sessionItem = sessionStorage.getItem(key);
            if (sessionItem) {
              // If found in sessionStorage but not localStorage, sync it
              localStorage.setItem(key, sessionItem);
              return sessionItem;
            }
          }
          return item;
        } catch (error) {
          console.error('Storage getItem error:', error);
          return null;
        }
      },
      setItem: (key, value) => {
        if (!isBrowser) return;
        try {
          localStorage.setItem(key, value);
          // Also store in sessionStorage for tab-specific availability
          if (key.includes('supabase_auth')) {
            sessionStorage.setItem(key, value);
          }
        } catch (error) {
          console.error('Storage setItem error:', error);
        }
      },
      removeItem: (key) => {
        if (!isBrowser) return;
        try {
          localStorage.removeItem(key);
          // Also remove from sessionStorage
          if (key.includes('supabase_auth')) {
            sessionStorage.removeItem(key);
          }
        } catch (error) {
          console.error('Storage removeItem error:', error);
        }
      },
    },
    autoRefreshToken: true,
    debug: process.env.NODE_ENV === 'development'
  }
});

// Test the connection
if (isBrowser) {
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('Supabase connection error:', error);
    } else {
      console.log('Supabase connection successful');
    }
  });
}

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