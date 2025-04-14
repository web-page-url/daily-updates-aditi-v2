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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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