import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth, UserRole } from '../lib/authContext';
import LoadingSpinner from './LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export default function ProtectedRoute({ children, allowedRoles = ['user', 'manager', 'admin'] }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  useEffect(() => {
    // Only attempt redirects if not already redirecting and not loading
    if (!isLoading && !isRedirecting) {
      // If authentication is done loading and there's no user, redirect to login
      if (!user) {
        setIsRedirecting(true);
        router.replace('/').then(() => setIsRedirecting(false));
        return;
      }
      
      // If user exists but doesn't have required role, redirect to appropriate page
      if (user && !allowedRoles.includes(user.role)) {
        setIsRedirecting(true);
        // Redirect based on role
        switch(user.role) {
          case 'admin':
          case 'manager':
            router.replace('/dashboard').then(() => setIsRedirecting(false));
            break;
          case 'user':
            router.replace('/user-dashboard').then(() => setIsRedirecting(false));
            break;
          default:
            router.replace('/').then(() => setIsRedirecting(false));
        }
      }
    }
  }, [isLoading, user, router, allowedRoles, isRedirecting]);

  // Show loading spinner while checking authentication or redirecting
  // if (isLoading || isRedirecting) {
  //   return <LoadingSpinner />;
  // }

  if (isLoading ) {
    return <LoadingSpinner />;
  }

  // If not logged in or not authorized, don't render children
  if (!user || !allowedRoles.includes(user.role)) {
    return <LoadingSpinner />;
  }
  
  // User is authenticated and authorized
  return <>{children}</>;
} 