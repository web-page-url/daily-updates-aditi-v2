import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Error() {
  const router = useRouter();
  const { error } = router.query;

  const errors: Record<string, string> = {
    Configuration: "There is a problem with the server configuration. Contact your administrator.",
    AccessDenied: "You don't have access to sign in to this application.",
    Verification: "The verification link was invalid or has expired. Please try signing in again.",
    default: "An unexpected error occurred. Please try again."
  };

  const errorMessage = error && typeof error === 'string' && errors[error] ? errors[error] : errors.default;

  return (
    <>
      <Head>
        <title>Authentication Error | Aditi Daily Updates</title>
        <meta name="description" content="Authentication error page" />
      </Head>

      <div className="min-h-screen bg-[#1a1f2e] flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-[#1e2538] rounded-lg shadow-xl p-8 max-w-md w-full space-y-8 text-center">
          <div className="bg-red-500/20 p-4 rounded-full inline-flex mx-auto">
            <svg className="h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-white">Authentication Error</h1>
          <p className="text-gray-400">{errorMessage}</p>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 justify-center mt-6">
            <Link 
              href="/auth/signin"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Signing In Again
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </>
  );
} 