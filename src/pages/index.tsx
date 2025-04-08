import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
        <LoadingSpinner size="lg" color="white" />
      </div>
    );
  }

  // Main landing page for unauthenticated users
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        
        {/* SEO Meta Tags */}
        <title>Daily Employee Updates | Task Management System</title>
        <meta name="description" content="Official Aditi employee daily update portal. Submit your daily work progress, completed tasks, blockers, and status updates directly to your reporting manager. Streamline your daily reporting with our efficient task tracking system." />
        <meta name="keywords" content="Aditi employee updates, Aditi daily tasks, Aditi work tracking, Aditi project management, employee daily status, reporting manager, Aditi task management, Aditi employee portal, daily work updates Aditi, Aditi progress tracking" />
        <meta name="author" content="Aditi" />
        
        {/* Open Graph Meta Tags for Social Media */}
        <meta property="og:title" content="Aditi Daily Employee Updates" />
        <meta property="og:description" content="Efficient employee task tracking and management system" />
        <meta property="og:image" content="/aditi.png" />
        <meta property="og:url" content="https://aditi-daily-updates-v2.netlify.app/" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Aditi Daily Employee Updates" />
        <meta name="twitter:description" content="Streamline your daily employee updates and task management" />
        <meta name="twitter:image" content="/aditi.png" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://aditi-daily-updates-v2.netlify.app/" />
      </Head>

      <div className="min-h-screen bg-[#1a1f2e] flex flex-col">
        {/* Header */}
        <header className="bg-[#1e2538] shadow-lg py-4">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <svg className="h-8 w-8 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <h1 className="text-xl font-bold text-white">Aditi Daily Updates</h1>
            </div>
            <Link 
              href="/auth/signin"
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-grow">
          <div className="container mx-auto px-4 py-12 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Track & Manage Your Team's Daily Updates</h2>
              <p className="text-lg text-gray-300 mb-8">
                A simple and efficient way to manage daily stand-ups, track blockers, and ensure team alignment.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link 
                  href="/auth/signin"
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  Get Started
                </Link>
                <Link 
                  href="mailto:support@aditi.com"
                  className="px-6 py-3 bg-[#1e2538] text-white rounded-md hover:bg-[#252c40] transition-colors font-medium border border-gray-700"
                >
                  Contact Support
                </Link>
              </div>
            </div>

            {/* Features Section */}
            <div className="mt-20 grid md:grid-cols-3 gap-8">
              <div className="bg-[#1e2538] rounded-lg p-6 shadow-lg border border-gray-800">
                <div className="h-12 w-12 bg-blue-500/20 text-blue-400 flex items-center justify-center rounded-lg mb-4">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Daily Updates</h3>
                <p className="text-gray-400">
                  Streamline the process of collecting daily status updates from your team members.
                </p>
              </div>
              
              <div className="bg-[#1e2538] rounded-lg p-6 shadow-lg border border-gray-800">
                <div className="h-12 w-12 bg-purple-500/20 text-purple-400 flex items-center justify-center rounded-lg mb-4">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H9.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Blocker Tracking</h3>
                <p className="text-gray-400">
                  Identify and monitor blockers, dependencies, and risks that may impact your project's progress.
                </p>
              </div>
              
              <div className="bg-[#1e2538] rounded-lg p-6 shadow-lg border border-gray-800">
                <div className="h-12 w-12 bg-green-500/20 text-green-400 flex items-center justify-center rounded-lg mb-4">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Team Management</h3>
                <p className="text-gray-400">
                  Manage team structure, add team members, and configure permissions for different roles.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-[#1e2538] py-6 border-t border-gray-800">
          <div className="container mx-auto px-4 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Aditi Consulting. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
