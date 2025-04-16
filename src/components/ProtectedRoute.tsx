import { ReactNode, useEffect } from 'react';
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

  useEffect(() => {
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
  }, [isLoading, user, router, allowedRoles]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // If not logged in or not authorized, don't render children
  if (!user || !allowedRoles.includes(user.role)) {
    return <LoadingSpinner />;
  }
  
  // User is authenticated and authorized
  return <>{children}</>;
} 