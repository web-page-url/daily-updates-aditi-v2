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
  lastChecked?: number;
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

  // Initialize with cached user data if available
  useEffect(() => {
    // First try to load from localStorage to avoid flash of loading state
    if (typeof window !== 'undefined') {
      try {
        const cachedUser = localStorage.getItem(USER_CACHE_KEY);
        if (cachedUser) {
          const parsedUser = JSON.parse(cachedUser);
          // Only use cached data if it's less than 30 minutes old
          if (parsedUser.lastChecked && Date.now() - parsedUser.lastChecked < 30 * 60 * 1000) {
            setUser(parsedUser);
            // Still check session but don't show loading state
            setTimeout(() => checkCurrentSession(false), 100);
            return;
          }
        }
      } catch (error) {
        console.error('Error loading cached user:', error);
      }
    }
    
    // If no valid cached user, do a full session check
    checkCurrentSession(true);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        await refreshUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        
        // Don't redirect to login if already on login page
        if (router.pathname !== '/') {
          router.push('/');
        }
      }
    });

    // Set a timeout to force-clear loading state in case something hangs
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Forcing loading state to false after timeout');
        setIsLoading(false);
      }
    }, 5000); // 5 second safety timeout

    return () => {
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, [isLoading]);

  const checkCurrentSession = async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        setUser(null);
        return;
      }
      
      if (session) {
        await refreshUser();
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Session check error:', error);
      setUser(null);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  // Silently check session without showing loading state
  const silentSessionCheck = async () => {
    try {
      if (isCheckingSession) return; // Prevent concurrent checks
      setIsCheckingSession(true);
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        setUser(null);
        try {
          localStorage.removeItem(USER_CACHE_KEY);
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
    } finally {
      setIsCheckingSession(false);
    }
  };

  // Update the tab visibility effect to better handle session token issues
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        // Only refresh if it's been more than 60 seconds since last check
        // This prevents too many refreshes on Vercel
        if (now - lastVisibilityCheck > 60000) {
          console.log('Tab became visible, refreshing session...');
          setLastVisibilityCheck(now);
          
          // Force token refresh when returning to tab
          supabase.auth.refreshSession().then(({ data, error }) => {
            if (error) {
              console.error('Failed to refresh session on tab focus:', error);
              // Only redirect if error is significant
              if (error.status === 401 || error.message?.includes('invalid')) {
                setUser(null);
                try {
                  localStorage.removeItem(USER_CACHE_KEY);
                } catch (storageError) {
                  console.error('Error clearing session data:', storageError);
                }
                
                // Redirect to login page if not already there
                if (router.pathname !== '/') {
                  router.push('/');
                }
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
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, lastVisibilityCheck, isCheckingSession, router.pathname]);

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error || !authUser) {
        setUser(null);
        setIsLoading(false);
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
        teamName: userData?.aditi_teams?.team_name,
        lastChecked: Date.now()
      };
      
      setUser(updatedUser);
      
      // Cache the user data
      try {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Error caching user data:', error);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      setUser(null);
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
        console.error('Error clearing cached user data:', error);
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