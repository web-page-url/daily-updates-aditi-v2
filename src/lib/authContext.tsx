import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from './supabaseClient';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

// User cache key for localStorage
export const USER_CACHE_KEY = 'aditi_user_cache';

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const [lastVisibilityCheck, setLastVisibilityCheck] = useState(0);
  const [isCheckingSession, setIsCheckingSession] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsLoading(true);
      
      if (event === 'SIGNED_IN' && session) {
        await refreshUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        
        // Don't redirect to login if already on login page
        if (router.pathname !== '/') {
          router.push('/');
        }
      }
      
      setIsLoading(false);
    });

    // Initial session check
    checkCurrentSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkCurrentSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await refreshUser();
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Silently check session without showing loading state
  const silentSessionCheck = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        
        // Clear user state if there's a session error
        setUser(null);
        try {
          localStorage.removeItem(USER_CACHE_KEY);
          sessionStorage.removeItem('aditi_supabase_auth');
        } catch (storageError) {
          console.error('Error clearing cached user after session error:', storageError);
        }
        
        // If not on the login page, redirect
        if (router.pathname !== '/') {
          router.push('/');
        }
        return;
      }
      
      if (session) {
        // Update the lastChecked timestamp without showing loading state
        if (user) {
          const updatedUser = { ...user, lastChecked: Date.now() };
          setUser(updatedUser);
          try {
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
          } catch (error) {
            console.error('Error updating user cache:', error);
          }
        }
      } else {
        // Session is invalid, clear user and redirect
        setUser(null);
        try {
          localStorage.removeItem(USER_CACHE_KEY);
          sessionStorage.removeItem('aditi_supabase_auth');
          
          // Also clear Supabase session in localStorage
          const supabaseItems = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('sb-')) {
              supabaseItems.push(key);
            }
          }
          
          // Clear all Supabase-related items
          supabaseItems.forEach(key => {
            localStorage.removeItem(key);
          });
        } catch (error) {
          console.error('Error removing cached user:', error);
        }
        
        // If not on the login page, redirect
        if (router.pathname !== '/') {
          router.push('/');
        }
      }
    } catch (error) {
      console.error('Silent session check error:', error);
      // Don't show error toast for silent checks
    }
  };

  // Update the tab visibility effect to better handle session token issues
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        
        // When tab becomes visible, always check session validity
        // This helps prevent 406 errors when switching tabs
        console.log('Tab became visible, refreshing session...');
        setLastVisibilityCheck(now);
        
        // Force token refresh when returning to tab 
        supabase.auth.refreshSession().then(({ data, error }) => {
          if (error) {
            console.error('Failed to refresh session on tab focus:', error);
            // Session is invalid, redirect to login
            setUser(null);
            try {
              // Clean up local storage to prevent stale data
              localStorage.removeItem(USER_CACHE_KEY);
              sessionStorage.removeItem('aditi_supabase_auth');
            } catch (storageError) {
              console.error('Error clearing session data:', storageError);
            }
            
            // Redirect to login page if not already there
            if (router.pathname !== '/') {
              router.push('/');
            }
          } else if (data.session) {
            console.log('Session refreshed successfully on tab focus');
            // Only update the lastChecked timestamp to avoid full reload
            if (user) {
              const updatedUser = { ...user, lastChecked: now };
              setUser(updatedUser);
              try {
                localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
              } catch (storageError) {
                console.error('Error updating user data:', storageError);
              }
            }
          }
        }).catch(error => {
          console.error('Error during session refresh:', error);
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for storage events to sync auth state across tabs
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === USER_CACHE_KEY) {
        if (!event.newValue) {
          // User was logged out in another tab
          setUser(null);
          router.push('/');
        } else if (event.newValue !== JSON.stringify(user)) {
          // User data was updated in another tab
          try {
            setUser(JSON.parse(event.newValue));
          } catch (error) {
            console.error('Error parsing user data from storage event:', error);
          }
        }
      }
      
      // Handle changes to Supabase auth storage
      if (event.key && event.key.startsWith('sb-')) {
        // Force session check when Supabase auth storage changes
        silentSessionCheck();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, lastVisibilityCheck, isCheckingSession]);

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        setUser(null);
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
      
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: userData?.team_member_name || authUser.email?.split('@')[0] || 'User',
        role,
        teamId: userData?.team_id,
        teamName: userData?.aditi_teams?.team_name
      });
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