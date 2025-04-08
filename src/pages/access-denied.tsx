import { useSession, signOut } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function AccessDenied() {
  const { data: session } = useSession();
  const router = useRouter();
  const { callbackUrl } = router.query;

  return (
    <>
      <Head>
        <title>Access Denied | Aditi Daily Updates</title>
        <meta name="description" content="Access denied page" />
      </Head>

      <div className="min-h-screen bg-[#1a1f2e] flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-[#1e2538] rounded-lg shadow-xl p-8 max-w-md w-full space-y-8 text-center">
          <div className="bg-yellow-500/20 p-4 rounded-full inline-flex mx-auto">
            <svg className="h-16 w-16 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H9.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-white">Access Denied</h1>
          <p className="text-gray-400">
            {session ? 
              "You don't have permission to access this page. Please contact your administrator if you believe this is an error." : 
              "Please sign in to access this page."}
          </p>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center mt-6">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href={`/auth/signin${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl as string)}` : ''}`}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 