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
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    // Set a safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Protected route timeout reached, showing fallback UI');
        setTimeoutReached(true);
      }
    }, 5000);

    // If authentication is done loading and there's no user, redirect to login
    if (!isLoading && !user) {
      router.replace('/');
    }
    
    // If user exists but doesn't have required role, redirect to appropriate page
    if (!isLoading && user && !allowedRoles.includes(user.role)) {
      // Redirect based on role
      switch(user.role) {
        case 'admin':
          router.replace('/dashboard');
          break;
        case 'manager':
          router.replace('/dashboard');
          break;
        case 'user':
          router.replace('/user-dashboard');
          break;
        default:
          router.replace('/');
      }
    }

    return () => clearTimeout(safetyTimeout);
  }, [isLoading, user, router, allowedRoles]);

  // If we've been loading too long, assume we're not authenticated
  if (timeoutReached) {
    console.log('Timeout reached on protected route, redirecting to login');
    router.replace('/');
    return <LoadingSpinner message="Redirecting to login..." />;
  }

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner message="Checking permissions..." />;
  }

  // If not logged in or not authorized, don't render children
  if (!user || !allowedRoles.includes(user.role)) {
    return <LoadingSpinner message="Redirecting..." />;
  }
  
  // User is authenticated and authorized
  return <>{children}</>;
} 