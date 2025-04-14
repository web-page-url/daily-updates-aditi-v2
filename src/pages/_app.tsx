import { useEffect } from 'react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { AuthProvider } from '../lib/authContext';
import { supabase } from '../lib/supabaseClient';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  // Initialize session persistence
  useEffect(() => {
    // Check for existing session on app load
    const initializeAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error checking auth session:', error);
      } else if (data.session) {
        console.log('Existing session found');
      }
    };

    initializeAuth();

    // Set up listener for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change in _app:', event);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthProvider>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Aditi Daily Updates - Track your work progress" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#1a1f2e" />
      </Head>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#363636',
          color: '#fff',
        },
      }} />
      <Component {...pageProps} />
    </AuthProvider>
  );
}
