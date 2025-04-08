import { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { getServerSession } from 'next-auth/next';
import NextAuth from '../pages/api/auth/[...nextauth]';
import { Session } from 'next-auth';

// Define ExtendedSession type locally - matching the one in [...nextauth].ts
interface ExtendedSession extends Session {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    roles?: string[];
    accessToken?: string;
  };
}

export const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MANAGER: 'manager',
};

// Helper to check if a user has a specific role
export const hasRole = (session: ExtendedSession | null, role: string): boolean => {
  if (!session || !session.user?.roles) return false;
  return session.user.roles.includes(role);
};

// Helper to check if a user has any of the provided roles
export const hasAnyRole = (session: ExtendedSession | null, roles: string[]): boolean => {
  if (!session || !session.user?.roles) return false;
  return roles.some(role => session.user.roles!.includes(role));
};

// Helper to check if a user has all of the provided roles
export const hasAllRoles = (session: ExtendedSession | null, roles: string[]): boolean => {
  if (!session || !session.user?.roles) return false;
  return roles.every(role => session.user.roles!.includes(role));
};

// Helper to create a withAuth HOC for server-side protected routes
export const withAuth = (
  requiredRoles: string[] = []
): GetServerSideProps => {
  return async (context: GetServerSidePropsContext) => {
    const session = await getServerSession(
      context.req, 
      context.res, 
      NextAuth.authOptions
    ) as ExtendedSession | null;

    // If no session exists, redirect to sign in
    if (!session) {
      return {
        redirect: {
          destination: `/auth/signin?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
          permanent: false,
        },
      };
    }

    // If roles are required and user doesn't have the role
    if (requiredRoles.length > 0 && !hasAnyRole(session, requiredRoles)) {
      return {
        redirect: {
          destination: `/access-denied?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
          permanent: false,
        },
      };
    }

    // If all checks pass, return the session to the page
    return {
      props: { session },
    };
  };
}; 