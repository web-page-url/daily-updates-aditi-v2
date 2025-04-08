import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface RoleProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  loading?: ReactNode;
  redirectTo?: string;
}

// Extended Session user type for proper TypeScript support
interface ExtendedUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles?: string[];
  accessToken?: string;
}

interface ExtendedSession {
  user?: ExtendedUser;
  expires: string;
}

export default function RoleProtectedRoute({
  children,
  requiredRoles = [],
  loading = <LoadingSpinner />,
  redirectTo = '/access-denied',
}: RoleProtectedRouteProps) {
  const router = useRouter();
  const { data: session, status } = useSession() as {
    data: ExtendedSession | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
  };
  
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated' && !!session?.user;
  
  // Function to check if the user has any of the required roles
  const hasRequiredRole = (): boolean => {
    if (requiredRoles.length === 0) return true; // No roles required
    if (!session?.user?.roles) return false;
    
    return requiredRoles.some(role => {
      if (!session.user || !session.user.roles) return false;
      return session.user.roles.includes(role);
    });
  };
  
  useEffect(() => {
    // If auth is finished loading and there's no user, redirect to sign-in
    if (!isLoading && !isAuthenticated) {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(router.asPath)}`);
    } 
    // If user is authenticated but doesn't have the required role, redirect to access denied
    else if (!isLoading && isAuthenticated && !hasRequiredRole()) {
      router.push(`${redirectTo}?callbackUrl=${encodeURIComponent(router.asPath)}`);
    }
  }, [isLoading, isAuthenticated, router, redirectTo]);
  
  // Show loading indicator while checking authentication
  if (isLoading) {
    return <>{loading}</>;
  }
  
  // If authenticated and has required role, render the children
  if (isAuthenticated && hasRequiredRole()) {
    return <>{children}</>;
  }
  
  // Don't render anything while redirecting
  return <>{loading}</>;
} 