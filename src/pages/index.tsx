import Head from 'next/head';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DailyUpdateForm from '../components/DailyUpdateForm';

export default function Home() {
  // Mock user data - in a real app, this would come from authentication
  const [userData, setUserData] = useState({
    userName: '',
    userEmail: '',
    teamName: '',
    isManager: false,
    reportingManager: ''
  });

  // Simulate fetching user data
  useEffect(() => {
    // In a real app, this would be fetched from an API or auth service
    // For demo purposes, this is hardcoded
    setTimeout(() => {
      setUserData({
        userName: 'John Doe',
        userEmail: 'john.doe@example.com',
        teamName: 'Development',
        isManager: true, // Set to true to see manager controls
        reportingManager: 'Indira'
      });
    }, 1000);
  }, []);

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
        <meta property="og:url" content="https://aditi-daily-updates-v1.netlify.app/" />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Aditi Daily Employee Updates" />
        <meta name="twitter:description" content="Streamline your daily employee updates and task management" />
        <meta name="twitter:image" content="/aditi.png" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://aditi-daily-updates-v1.netlify.app/" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "http://schema.org",
            "@type": "SoftwareApplication",
            "name": "Aditi Daily Employee Updates",
            "description": "Employee task management and daily updates tracking system",
            "image": "/aditi.png",
            "url": "https://aditi-daily-updates-v1.netlify.app/",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web"
          })}
        </script>
      </Head>
      
      {/* Manager Dashboard Link */}
      {userData.isManager && (
        <div className="fixed top-4 right-4 z-10">
          <Link 
            href="/dashboard"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300 shadow-md hover:shadow-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Manager Dashboard
          </Link>
        </div>
      )}
      
      <DailyUpdateForm 
        userName={userData.userName}
        userEmail={userData.userEmail}
        reportingManager={userData.reportingManager || 'Indira'}
        teamName={userData.teamName}
        isManager={userData.isManager}
      />
    </>
  );
}
