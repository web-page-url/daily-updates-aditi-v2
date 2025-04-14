import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

export type UserRole = 'user' | 'manager' | 'admin';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  teamId?: string;
  teamName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  checkUserRole: () => Promise<UserRole>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache key for storing user data
const USER_CACHE_KEY = 'aditi_user_cache';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load cached user on mount
  useEffect(() => {
    try {
      const cachedUser = localStorage.getItem(USER_CACHE_KEY);
      if (cachedUser) {
        setUser(JSON.parse(cachedUser));
      }
    } catch (error) {
      console.error('Error loading cached user:', error);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
      
      if (event === 'SIGNED_IN' && session) {
        await refreshUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        try {
          localStorage.removeItem(USER_CACHE_KEY);
        } catch (error) {
          console.error('Error removing cached user:', error);
        }
        
        // Don't redirect to login if already on login page
        if (router.pathname !== '/') {
          router.push('/');
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // When token is refreshed, we don't need to do a full user refresh
        // Just update the session status
        console.log('Token refreshed successfully');
      }
    });

    // Initial session check only if we don't have a user already
    if (!user) {
      checkCurrentSession();
    } else {
      setIsLoading(false);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkCurrentSession = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Check if we have cached user data
        try {
          const cachedUser = localStorage.getItem(USER_CACHE_KEY);
          if (cachedUser) {
            // If we have cached user data and a valid session, use the cached data
            setUser(JSON.parse(cachedUser));
            setIsLoading(false);
            
            // Refresh user data in the background without blocking the UI
            refreshUser().catch(error => {
              console.error('Background refresh error:', error);
            });
            return;
          }
        } catch (error) {
          console.error('Error checking cached user:', error);
        }
        
        // If no cached data, do a full refresh
        await refreshUser();
      } else {
        setUser(null);
        try {
          localStorage.removeItem(USER_CACHE_KEY);
        } catch (error) {
          console.error('Error removing cached user:', error);
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setUser(null);
        try {
          localStorage.removeItem(USER_CACHE_KEY);
        } catch (error) {
          console.error('Error removing cached user:', error);
        }
        return;
      }
      
      // Get user role and team info
      const role = await checkUserRole();
      
      // Get additional user information
      const { data: userData, error: userError } = await supabase
        .from('aditi_team_members')
        .select('*, aditi_teams(*)')
        .eq('employee_email', authUser.email)
        .single();
      
      if (userError && userError.code !== 'PGRST116') {
        console.error('User data fetch error:', userError);
      }
      
      const updatedUser = {
        id: authUser.id,
        email: authUser.email || '',
        name: userData?.team_member_name || authUser.email?.split('@')[0] || 'User',
        role,
        teamId: userData?.team_id,
        teamName: userData?.aditi_teams?.team_name
      };
      
      setUser(updatedUser);
      
      // Cache the user data for future use
      try {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Error caching user data:', error);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      toast.error('Failed to load user data');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUserRole = async (): Promise<UserRole> => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser?.email) return 'user';
      
      // Check if user is admin
      const { data: adminData } = await supabase
        .from('aditi_admins')
        .select('*')
        .eq('email', authUser.email)
        .single();
      
      if (adminData) return 'admin';
      
      // Check if user is a team manager
      const { data: managerData } = await supabase
        .from('aditi_teams')
        .select('*')
        .eq('manager_email', authUser.email);
      
      if (managerData && managerData.length > 0) return 'manager';
      
      // Default role is user
      return 'user';
    } catch (error) {
      console.error('Role check error:', error);
      return 'user';
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      
      // Clear cached user data
      try {
        localStorage.removeItem(USER_CACHE_KEY);
      } catch (error) {
        console.error('Error removing cached user:', error);
      }
      
      toast.success('Successfully signed out');
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signOut, checkUserRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 