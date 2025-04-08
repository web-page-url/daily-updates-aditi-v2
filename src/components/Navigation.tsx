import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { hasRole, ROLES } from '../utils/roleChecks';

export default function Navigation() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';
  
  // Don't render anything while checking session
  if (isLoading) return null;
  
  // Only show navigation if authenticated
  if (!session) return null;
  
  // Cast session to include roles
  const extendedSession = session as any;
  
  return (
    <nav className="bg-[#1e2538] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0 flex items-center">
              <svg className="h-8 w-8 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span className="ml-2 text-white font-semibold text-lg">Aditi Updates</span>
            </Link>
            
            <div className="hidden md:ml-6 md:flex md:space-x-4">
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  router.pathname === '/dashboard'
                    ? 'bg-purple-700 text-white'
                    : 'text-gray-300 hover:bg-purple-600/30 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              
              <Link
                href="/"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  router.pathname === '/'
                    ? 'bg-purple-700 text-white'
                    : 'text-gray-300 hover:bg-purple-600/30 hover:text-white'
                }`}
              >
                Daily Update
              </Link>
              
              {/* Show team management only for admin and manager roles */}
              {hasRole(extendedSession, ROLES.ADMIN) || hasRole(extendedSession, ROLES.MANAGER) ? (
                <Link
                  href="/team-management"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    router.pathname === '/team-management'
                      ? 'bg-purple-700 text-white'
                      : 'text-gray-300 hover:bg-purple-600/30 hover:text-white'
                  }`}
                >
                  Team Management
                </Link>
              ) : null}
              
              {/* Show admin panel only for admin role */}
              {hasRole(extendedSession, ROLES.ADMIN) && (
                <Link
                  href="/admin"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    router.pathname === '/admin'
                      ? 'bg-purple-700 text-white'
                      : 'text-gray-300 hover:bg-purple-600/30 hover:text-white'
                  }`}
                >
                  Admin Panel
                </Link>
              )}
            </div>
          </div>
          
          <div className="flex items-center">
            <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
              <div className="ml-3 relative group">
                <div className="flex items-center">
                  <button
                    type="button"
                    className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white items-center"
                    id="user-menu-button"
                    aria-expanded="false"
                    aria-haspopup="true"
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center text-white">
                      {session.user?.name ? session.user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="ml-2 text-gray-300 text-sm">
                      {session.user?.name || session.user?.email || 'User'}
                    </span>
                    <svg className="ml-1 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <div
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-[#1e2538] ring-1 ring-black ring-opacity-5 focus:outline-none hidden group-hover:block z-10"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu-button"
                  tabIndex={-1}
                >
                  <div className="px-4 py-2 text-xs text-gray-400">
                    {extendedSession.user?.roles?.length > 0 && (
                      <div>Role: {extendedSession.user.roles.join(', ')}</div>
                    )}
                  </div>
                  <div className="border-t border-gray-700"></div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-purple-600/30"
                    role="menuitem"
                    tabIndex={-1}
                    id="user-menu-item-2"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                type="button"
                className="ml-auto flex-shrink-0 bg-gray-800 p-1 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <span className="sr-only">Sign out</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="md:hidden border-t border-gray-700">
        <div className="px-2 pt-2 pb-3 space-y-1">
          <Link
            href="/dashboard"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              router.pathname === '/dashboard'
                ? 'bg-purple-700 text-white'
                : 'text-gray-300 hover:bg-purple-600/30 hover:text-white'
            }`}
          >
            Dashboard
          </Link>
          
          <Link
            href="/"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              router.pathname === '/'
                ? 'bg-purple-700 text-white'
                : 'text-gray-300 hover:bg-purple-600/30 hover:text-white'
            }`}
          >
            Daily Update
          </Link>
          
          {/* Show team management only for admin and manager roles */}
          {hasRole(extendedSession, ROLES.ADMIN) || hasRole(extendedSession, ROLES.MANAGER) ? (
            <Link
              href="/team-management"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                router.pathname === '/team-management'
                  ? 'bg-purple-700 text-white'
                  : 'text-gray-300 hover:bg-purple-600/30 hover:text-white'
              }`}
            >
              Team Management
            </Link>
          ) : null}
          
          {/* Show admin panel only for admin role */}
          {hasRole(extendedSession, ROLES.ADMIN) && (
            <Link
              href="/admin"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                router.pathname === '/admin'
                  ? 'bg-purple-700 text-white'
                  : 'text-gray-300 hover:bg-purple-600/30 hover:text-white'
              }`}
            >
              Admin Panel
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
} 