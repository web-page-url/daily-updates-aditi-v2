import React, { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Navigation from './Navigation';
import LoadingSpinner from './LoadingSpinner';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  requireAuth?: boolean;
}

export default function Layout({
  children,
  title = 'Aditi Daily Updates',
  description = 'Track and manage daily updates for your team',
  requireAuth = true,
}: LayoutProps) {
  const { status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1a1f2e" />
      </Head>
      
      <div className="min-h-screen bg-[#1a1f2e] flex flex-col">
        {/* Show navigation only for authenticated users */}
        {isAuthenticated && <Navigation />}
        
        {/* Show loading spinner while checking auth status */}
        {isLoading && requireAuth ? (
          <div className="flex-grow flex items-center justify-center">
            <LoadingSpinner size="lg" color="white" />
          </div>
        ) : (
          /* Main content */
          <main className="flex-grow">{children}</main>
        )}
        
        {/* Footer */}
        <footer className="bg-[#1e2538] py-3 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-400 text-sm">
              © {new Date().getFullYear()} Aditi Daily Updates. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
} 