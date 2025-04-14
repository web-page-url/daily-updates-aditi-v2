import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase, DailyUpdate } from '../lib/supabaseClient';
import { useAuth } from '../lib/authContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

export default function UserDashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [userUpdates, setUserUpdates] = useState<DailyUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user) {
      fetchUserUpdates();
    }
  }, [user, dateRange]);

  const fetchUserUpdates = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('aditi_daily_updates')
        .select('*, aditi_teams(*)')
        .eq('employee_email', user?.email)
        .gte('created_at', `${dateRange.start}T00:00:00.000Z`)
        .lte('created_at', `${dateRange.end}T23:59:59.999Z`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setUserUpdates(data || []);
    } catch (error) {
      console.error('Error fetching user updates:', error);
      toast.error('Failed to load your updates');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in-progress':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-900 text-blue-200">In Progress</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-900 text-green-200">Completed</span>;
      case 'blocked':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-900 text-red-200">Blocked</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-700 text-gray-300">{status}</span>;
    }
  };

  const getBlockerBadge = (blockerType: string) => {
    switch (blockerType) {
      case 'Blockers':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-900 text-red-200">Blockers</span>;
      case 'Risks':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-800 text-yellow-200">Risks</span>;
      case 'Dependencies':
        return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-200">Dependencies</span>;
      default:
        return <span className="text-gray-400">None</span>;
    }
  };

  const goToDailyUpdateForm = () => {
    router.push('/daily-update-form');
  };

  return (
    <ProtectedRoute allowedRoles={['user', 'manager', 'admin']}>
      <div className="min-h-screen bg-[#1a1f2e] text-white">
        <Head>
          <title>Your Updates | Aditi Daily Updates</title>
          <meta name="description" content="View your submitted daily updates and status reports" />
        </Head>

        {/* Header */}
        <header className="bg-[#1e2538] shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-white">Your Daily Updates</h1>
              <p className="text-sm text-gray-300">
                {user?.name} ({user?.email})
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={goToDailyUpdateForm}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                New Update
              </button>
              
              <button
                onClick={signOut}
                className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-200 bg-[#262d40] hover:bg-[#2a3349] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Date range filter */}
          <div className="bg-[#1e2538] rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-lg font-medium text-white mb-4">Filter by Date</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="start" className="block text-sm font-medium text-gray-200 mb-1">Start Date</label>
                <input
                  type="date"
                  id="start"
                  name="start"
                  value={dateRange.start}
                  onChange={handleDateChange}
                  className="bg-[#262d40] shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-600 rounded-md text-white"
                />
              </div>
              <div>
                <label htmlFor="end" className="block text-sm font-medium text-gray-200 mb-1">End Date</label>
                <input
                  type="date"
                  id="end"
                  name="end"
                  value={dateRange.end}
                  onChange={handleDateChange}
                  className="bg-[#262d40] shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-600 rounded-md text-white"
                />
              </div>
            </div>
          </div>

          {/* Updates table */}
          <div className="bg-[#1e2538] shadow-lg rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-700 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-white">
                Your Submitted Updates
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-300">
                {userUpdates.length} updates found
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : userUpdates.length === 0 ? (
              <div className="text-center py-16 px-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-white">No updates found</h3>
                <p className="mt-1 text-sm text-gray-300">
                  You haven't submitted any updates in the selected date range.
                </p>
                <div className="mt-6">
                  <button
                    onClick={goToDailyUpdateForm}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Create your first update
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-[#262d40]">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Team
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Tasks
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Blockers
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-[#1e2538] divide-y divide-gray-700">
                    {userUpdates.map((update) => (
                      <>
                        <tr 
                          key={update.id} 
                          onClick={() => toggleRowExpansion(update.id)}
                          className={`transition-colors duration-200 ${
                            expandedRows[update.id] 
                              ? 'bg-[#2a3347] shadow-md' 
                              : 'hover:bg-[#262d40] cursor-pointer'
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {formatDate(update.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">
                            {update.aditi_teams?.team_name || 'Unknown Team'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(update.status)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-200 max-w-xs">
                            <div className={expandedRows[update.id] ? "" : "truncate"}>
                              {expandedRows[update.id] ? "" : update.tasks_completed}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {update.blocker_type ? getBlockerBadge(update.blocker_type) : <span className="text-gray-400">None</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleRowExpansion(update.id);
                              }}
                              className="flex items-center px-3 py-1 rounded-md text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 transition-colors duration-200"
                            >
                              {expandedRows[update.id] ? (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                                  </svg>
                                  <span>Collapse</span>
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                  </svg>
                                  <span>Expand</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                        {expandedRows[update.id] && (
                          <tr className="bg-[#1e2538] border-b border-gray-700">
                            <td colSpan={6} className="px-6 py-4">
                              <div className="rounded-md bg-[#262d40] p-4 shadow-inner animate-fadeIn">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div>
                                    <h4 className="text-sm font-medium text-purple-300 mb-2 flex items-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                      </svg>
                                      Tasks Completed
                                    </h4>
                                    <div className="bg-[#1e2538] p-3 rounded-md text-sm text-white whitespace-pre-wrap">
                                      {update.tasks_completed || 'No tasks recorded'}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    {update.blocker_type ? (
                                      <>
                                        <h4 className="text-sm font-medium text-purple-300 mb-2 flex items-center">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                          </svg>
                                          {update.blocker_type}
                                        </h4>
                                        <div className="bg-[#1e2538] p-3 rounded-md text-sm text-white">
                                          <p className="whitespace-pre-wrap mb-2">{update.blocker_description || 'No description provided'}</p>
                                          {update.expected_resolution_date && (
                                            <div className="mt-2 text-xs text-gray-300">
                                              <span className="font-medium">Expected Resolution:</span> {new Date(update.expected_resolution_date).toLocaleDateString()}
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <h4 className="text-sm font-medium text-purple-300 mb-2 flex items-center">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                          Additional Notes
                                        </h4>
                                        <div className="bg-[#1e2538] p-3 rounded-md text-sm text-white whitespace-pre-wrap">
                                          {update.additional_notes || 'No additional notes provided'}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
} 