import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Extended Session user type
interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles?: string[];
  accessToken?: string;
}

// Extending the Session type from next-auth
interface ExtendedSession {
  user?: ExtendedUser;
  expires: string;
}

interface UseRoleCheckOptions {
  requiredRoles?: string[];
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function useRoleCheck({ 
  requiredRoles = [], 
  redirectTo = '/access-denied', 
  fallback = null 
}: UseRoleCheckOptions = {}) {
  const { data: session, status } = useSession() as { 
    data: ExtendedSession | null; 
    status: 'loading' | 'authenticated' | 'unauthenticated' 
  };
  const loading = status === 'loading';
  const router = useRouter();

  // Function to check if user has any of the required roles
  const hasRequiredRole = (): boolean => {
    // Check if session exists, user exists, and user has roles
    if (!session || !session.user || !session.user.roles) return false;
    
    // If no roles are required, return false
    if (requiredRoles.length === 0) return false;
    
    // Check if user has any of the required roles
    return requiredRoles.some(role => {
      return session.user.roles!.includes(role);
    });
  };

  // Check if user is authenticated
  const isAuthenticated = !!session && !!session.user;

  // Check if user meets role requirements
  const meetsRoleRequirements = requiredRoles.length === 0 || hasRequiredRole();

  // Handle redirect if needed
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`);
    } else if (!loading && isAuthenticated && !meetsRoleRequirements) {
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(router.asPath)}`);
    }
  }, [loading, isAuthenticated, meetsRoleRequirements, redirectTo, router]);

  return {
    isAuthenticated,
    isAuthorized: isAuthenticated && meetsRoleRequirements,
    isLoading: loading,
    session,
    fallback,
  };
} 