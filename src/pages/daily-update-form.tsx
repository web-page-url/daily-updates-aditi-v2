import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase, DailyUpdate, Team } from '../lib/supabaseClient';
import { useAuth } from '../lib/authContext';
import ProtectedRoute from '../components/ProtectedRoute';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

interface Blocker {
  id: string;
  type: 'Blockers' | 'Risks' | 'Dependencies';
  description: string;
  expected_resolution_date: string;
}

// Key for storing form data in localStorage
const FORM_CACHE_KEY = 'aditi_update_form_data';
const BLOCKERS_CACHE_KEY = 'aditi_update_blockers';

export default function DailyUpdateFormPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [formData, setFormData] = useState({
    employee_name: '',
    employee_id: '',
    email_address: '',
    tasks_completed: '',
    status: 'in-progress',
    additional_notes: '',
  });
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [showBlockerForm, setShowBlockerForm] = useState(false);
  const [currentBlocker, setCurrentBlocker] = useState<Partial<Blocker>>({
    type: 'Blockers',
    description: '',
    expected_resolution_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  // Track if the form has been loaded from cache
  const [formLoaded, setFormLoaded] = useState(false);
  // Track when data is auto-saved
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);

  // Set up beforeunload event listener to warn when navigating away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if there are any meaningful changes to warn about
      const hasContent = 
        formData.tasks_completed.trim() !== '' || 
        formData.additional_notes.trim() !== '' || 
        blockers.length > 0;
      
      if (hasContent) {
        // Standard way to show a confirmation dialog before leaving
        e.preventDefault();
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        e.returnValue = message; // For older browsers
        return message; // For modern browsers
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [formData, blockers]);

  // Show saved indicator briefly whenever data is saved
  const showSavedMessage = () => {
    setLastSaved(new Date());
    setShowSavedIndicator(true);
    setTimeout(() => {
      setShowSavedIndicator(false);
    }, 2000);
  };

  // Load saved form data from localStorage when component mounts
  useEffect(() => {
    try {
      const savedForm = localStorage.getItem(FORM_CACHE_KEY);
      const savedBlockers = localStorage.getItem(BLOCKERS_CACHE_KEY);
      const savedTeam = localStorage.getItem('aditi_selected_team');
      
      if (savedForm) {
        const parsedForm = JSON.parse(savedForm);
        setFormData(parsedForm);
        setFormLoaded(true);
      }
      
      if (savedBlockers) {
        const parsedBlockers = JSON.parse(savedBlockers);
        setBlockers(parsedBlockers);
      }
      
      if (savedTeam) {
        setSelectedTeam(savedTeam);
      }
    } catch (error) {
      console.error('Error loading saved form data:', error);
    }
  }, []);

  // Save form data whenever it changes
  useEffect(() => {
    // Only save after the form has been loaded or changed by the user
    if (formLoaded) {
      try {
        localStorage.setItem(FORM_CACHE_KEY, JSON.stringify(formData));
        showSavedMessage();
      } catch (error) {
        console.error('Error saving form data:', error);
      }
    }
  }, [formData, formLoaded]);

  // Save blockers whenever they change
  useEffect(() => {
    if (formLoaded) {
      try {
        localStorage.setItem(BLOCKERS_CACHE_KEY, JSON.stringify(blockers));
        showSavedMessage();
      } catch (error) {
        console.error('Error saving blockers data:', error);
      }
    }
  }, [blockers, formLoaded]);
  
  // Save selected team whenever it changes
  useEffect(() => {
    if (formLoaded && selectedTeam) {
      try {
        localStorage.setItem('aditi_selected_team', selectedTeam);
        showSavedMessage();
      } catch (error) {
        console.error('Error saving selected team:', error);
      }
    }
  }, [selectedTeam, formLoaded]);

  useEffect(() => {
    if (user && !formLoaded) {
      // Only set user data if we haven't loaded from cache
      setFormData(prev => ({
        ...prev,
        employee_name: user.name || '',
        email_address: user.email || '',
      }));
      
      if (user.teamId && !selectedTeam) {
        setSelectedTeam(user.teamId);
      }
      
      setFormLoaded(true);
    }
    
    fetchUserTeams();
    
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));
  }, [user]);

  const fetchUserTeams = async () => {
    try {
      setLoadingTeams(true);
      
      // First try to get teams the user is a member of
      const { data: teamMemberships, error: membershipError } = await supabase
        .from('aditi_team_members')
        .select('team_id')
        .eq('employee_email', user?.email);

      if (membershipError) {
        console.error('Error fetching team memberships:', membershipError);
      }

      // If user has team memberships, get those teams
      if (teamMemberships && teamMemberships.length > 0) {
        const teamIds = teamMemberships.map(tm => tm.team_id);
        const { data: teamsData, error: teamsError } = await supabase
          .from('aditi_teams')
          .select('*')
          .in('id', teamIds);

        if (teamsError) {
          console.error('Error fetching specific teams:', teamsError);
          throw teamsError;
        }
        setTeams(teamsData || []);
      } else {
        // If no memberships found, fetch all teams
        const { data: allTeams, error: allTeamsError } = await supabase
          .from('aditi_teams')
          .select('*')
          .order('team_name', { ascending: true });

        if (allTeamsError) {
          console.error('Error fetching all teams:', allTeamsError);
          throw allTeamsError;
        }
        
        setTeams(allTeams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoadingTeams(false);
    }
  };

  const handleAddBlocker = () => {
    if (!currentBlocker.description || !currentBlocker.expected_resolution_date) {
      toast.error('Please fill in all blocker fields');
      return;
    }

    const newBlocker: Blocker = {
      id: Date.now().toString(),
      type: currentBlocker.type as 'Blockers' | 'Risks' | 'Dependencies',
      description: currentBlocker.description,
      expected_resolution_date: currentBlocker.expected_resolution_date
    };

    setBlockers([...blockers, newBlocker]);
    setCurrentBlocker({
      type: 'Blockers',
      description: '',
      expected_resolution_date: '',
    });
    setShowBlockerForm(false);
  };

  const handleRemoveBlocker = (id: string) => {
    setBlockers(blockers.filter(blocker => blocker.id !== id));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.employee_name.trim()) {
      errors.employee_name = "Employee name is required";
    }
    
    if (!formData.employee_id.trim()) {
      errors.employee_id = "Employee ID is required";
    }
    
    if (!formData.email_address.trim()) {
      errors.email_address = "Email address is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email_address)) {
      errors.email_address = "Email address is invalid";
    }
    
    if (!selectedTeam) {
      errors.team = "Team selection is required";
    }
    
    if (!formData.tasks_completed.trim()) {
      errors.tasks_completed = "Tasks completed is required";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Clear form data from localStorage after successful submission
  const clearSavedFormData = () => {
    try {
      localStorage.removeItem(FORM_CACHE_KEY);
      localStorage.removeItem(BLOCKERS_CACHE_KEY);
      localStorage.removeItem('aditi_selected_team');
    } catch (error) {
      console.error('Error clearing saved form data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error('Please fill all required fields correctly');
      return;
    }

    setIsSubmitting(true);
    try {
      // If there are no blockers, create a single update without blocker info
      if (blockers.length === 0) {
        const payload = {
          employee_name: formData.employee_name,
          employee_id: formData.employee_id,
          employee_email: formData.email_address,
          team_id: selectedTeam,
          tasks_completed: formData.tasks_completed,
          status: formData.status,
          additional_notes: formData.additional_notes
        };
        
        const { data, error } = await supabase
          .from('aditi_daily_updates')
          .insert([payload])
          .select();

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }
        
        // Clear saved form data after successful submission
        clearSavedFormData();
        
        // Show success animation
        setShowAnimation(true);
        setTimeout(() => {
          setShowAnimation(false);
          router.push('/user-dashboard');
        }, 2000);
      } else {
        // If there are blockers, create an update for each blocker
        const baseDailyUpdate = {
          employee_name: formData.employee_name,
          employee_id: formData.employee_id,
          employee_email: formData.email_address,
          team_id: selectedTeam,
          tasks_completed: formData.tasks_completed,
          status: formData.status,
          additional_notes: formData.additional_notes
        };

        // Create updates for each blocker
        const updates = blockers.map(blocker => ({
          ...baseDailyUpdate,
          blocker_type: blocker.type,
          blocker_description: blocker.description,
          expected_resolution_date: blocker.expected_resolution_date
        }));

        const { data, error } = await supabase
          .from('aditi_daily_updates')
          .insert(updates)
          .select();

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }
        
        // Clear saved form data after successful submission
        clearSavedFormData();

        // Show success animation
        setShowAnimation(true);
        setTimeout(() => {
          setShowAnimation(false);
          router.push('/user-dashboard');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit update');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when field is updated
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleBlockerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentBlocker(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTeam(e.target.value);
    
    if (formErrors.team) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.team;
        return newErrors;
      });
    }
  };

  return (
    <ProtectedRoute allowedRoles={['user', 'manager', 'admin']}>
      <div className="min-h-screen bg-[#1a1f2e] text-white">
        <Head>
          <title>Daily Update | Aditi Task Management</title>
          <meta name="description" content="Submit your daily work progress and updates" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>

        <main className="py-4 sm:py-8 md:py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#1e2538] shadow-xl rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white py-6 px-6 md:px-8">
                <h1 className="text-xl md:text-2xl font-bold mb-2">Daily Update Form</h1>
                <p className="text-purple-100">{currentDate}</p>
                
                {/* Auto-save indicator */}
                <div className="mt-2 flex items-center text-sm">
                  {showSavedIndicator && (
                    <div className="flex items-center text-green-300 animate-pulse">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Auto-saved</span>
                    </div>
                  )}
                  {lastSaved && !showSavedIndicator && (
                    <div className="text-purple-200 text-xs">
                      Last saved: {lastSaved.toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Unsaved changes warning banner */}
              {formLoaded && (formData.tasks_completed.trim() !== '' || blockers.length > 0) && (
                <div className="bg-blue-900 text-blue-100 px-6 py-2 text-sm">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Your work is being saved automatically. You can safely navigate away and come back to continue.</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="p-6 md:p-8">
                {/* Add the Clear Draft button */}
                {formLoaded && (formData.tasks_completed.trim() !== '' || blockers.length > 0) && (
                  <div className="mb-6 flex justify-between items-center">
                    <div className="text-sm text-purple-300">
                      <span className="mr-1">✓</span> Draft saved automatically
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear all draft data? This cannot be undone.')) {
                          clearSavedFormData();
                          setFormData({
                            employee_name: user?.name || '',
                            employee_id: '',
                            email_address: user?.email || '',
                            tasks_completed: '',
                            status: 'in-progress',
                            additional_notes: '',
                          });
                          setBlockers([]);
                          setLastSaved(null);
                          toast.success('Draft cleared successfully');
                        }
                      }}
                      className="text-sm text-red-400 hover:text-red-300 focus:outline-none flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear Draft
                    </button>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Employee Name */}
                  <div>
                    <label htmlFor="employee_name" className="block text-sm font-medium text-gray-200 mb-1">
                      Employee Name*
                    </label>
                    <input
                      type="text"
                      id="employee_name"
                      name="employee_name"
                      value={formData.employee_name}
                      onChange={handleChange}
                      className={`shadow-sm block w-full sm:text-sm rounded-md border bg-[#262d40] text-white ${
                        formErrors.employee_name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-600 focus:ring-purple-500 focus:border-purple-500'
                      } p-2`}
                      placeholder="Your full name"
                    />
                    {formErrors.employee_name && (
                      <p className="mt-1 text-sm text-red-400">{formErrors.employee_name}</p>
                    )}
                  </div>

                  {/* Employee ID */}
                  <div>
                    <label htmlFor="employee_id" className="block text-sm font-medium text-gray-200 mb-1">
                      Employee ID*
                    </label>
                    <input
                      type="text"
                      id="employee_id"
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleChange}
                      className={`shadow-sm block w-full sm:text-sm rounded-md border bg-[#262d40] text-white ${
                        formErrors.employee_id ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-600 focus:ring-purple-500 focus:border-purple-500'
                      } p-2`}
                      placeholder="Your employee ID"
                    />
                    {formErrors.employee_id && (
                      <p className="mt-1 text-sm text-red-400">{formErrors.employee_id}</p>
                    )}
                  </div>

                  {/* Email Address */}
                  <div>
                    <label htmlFor="email_address" className="block text-sm font-medium text-gray-200 mb-1">
                      Email Address*
                    </label>
                    <input
                      type="email"
                      id="email_address"
                      name="email_address"
                      value={formData.email_address}
                      onChange={handleChange}
                      className={`shadow-sm block w-full sm:text-sm rounded-md border bg-[#262d40] text-white ${
                        formErrors.email_address ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-600 focus:ring-purple-500 focus:border-purple-500'
                      } p-2`}
                      placeholder="Your email address"
                      disabled={!!user}
                    />
                    {formErrors.email_address && (
                      <p className="mt-1 text-sm text-red-400">{formErrors.email_address}</p>
                    )}
                  </div>

                  {/* Team Selection */}
                  <div>
                    <label htmlFor="team" className="block text-sm font-medium text-gray-200 mb-1">
                      Team*
                    </label>
                    <select
                      id="team"
                      name="team"
                      value={selectedTeam}
                      onChange={handleTeamChange}
                      className={`shadow-sm block w-full sm:text-sm rounded-md border bg-[#262d40] text-white ${
                        formErrors.team ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-600 focus:ring-purple-500 focus:border-purple-500'
                      } p-2`}
                      disabled={loadingTeams}
                    >
                      <option value="" disabled>Select your team</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.team_name}
                        </option>
                      ))}
                    </select>
                    {formErrors.team && (
                      <p className="mt-1 text-sm text-red-400">{formErrors.team}</p>
                    )}
                  </div>
                </div>

                {/* Tasks Completed */}
                <div className="mt-6">
                  <label htmlFor="tasks_completed" className="block text-sm font-medium text-gray-200 mb-1">
                    Tasks Completed Today*
                  </label>
                  <textarea
                    id="tasks_completed"
                    name="tasks_completed"
                    rows={4}
                    value={formData.tasks_completed}
                    onChange={handleChange}
                    className={`shadow-sm block w-full sm:text-sm rounded-md border bg-[#262d40] text-white ${
                      formErrors.tasks_completed ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-600 focus:ring-purple-500 focus:border-purple-500'
                    } p-2`}
                    placeholder="List the tasks you completed today"
                  />
                  {formErrors.tasks_completed && (
                    <p className="mt-1 text-sm text-red-400">{formErrors.tasks_completed}</p>
                  )}
                </div>

                {/* Status */}
                <div className="mt-6">
                  <label htmlFor="status" className="block text-sm font-medium text-gray-200 mb-1">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-600 bg-[#262d40] text-white rounded-md p-2"
                  >
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>

                {/* Additional Notes */}
                <div className="mt-6">
                  <label htmlFor="additional_notes" className="block text-sm font-medium text-gray-200 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    id="additional_notes"
                    name="additional_notes"
                    rows={3}
                    value={formData.additional_notes}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-600 bg-[#262d40] text-white rounded-md p-2"
                    placeholder="Any additional comments or notes"
                  />
                </div>

                {/* Blockers Section */}
                <div className="mt-8 border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-medium text-white mb-4">Blockers, Risks, or Dependencies</h3>
                  
                  {/* List of added blockers */}
                  {blockers.length > 0 && (
                    <div className="mb-4 space-y-3">
                      {blockers.map(blocker => (
                        <div key={blocker.id} className="bg-[#262d40] p-3 rounded-md flex justify-between items-start">
                          <div>
                            <div className="flex items-center mb-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                blocker.type === 'Blockers' ? 'bg-red-900 text-red-200' :
                                blocker.type === 'Risks' ? 'bg-yellow-900 text-yellow-200' :
                                'bg-blue-900 text-blue-200'
                              }`}>
                                {blocker.type}
                              </span>
                              <span className="ml-2 text-sm text-gray-300">
                                (Expected resolution: {blocker.expected_resolution_date})
                              </span>
                            </div>
                            <p className="text-sm text-gray-200">{blocker.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveBlocker(blocker.id)}
                            className="text-red-400 hover:text-red-300 ml-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add blocker button or form */}
                  {showBlockerForm ? (
                    <div className="bg-[#262d40] p-4 rounded-md">
                      <h4 className="text-md font-medium text-gray-100 mb-3">Add Blocker/Risk/Dependency</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label htmlFor="type" className="block text-sm font-medium text-gray-200 mb-1">
                            Type
                          </label>
                          <select
                            id="type"
                            name="type"
                            value={currentBlocker.type}
                            onChange={handleBlockerChange}
                            className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-600 bg-[#2a3349] text-white rounded-md"
                          >
                            <option value="Blockers">Blocker</option>
                            <option value="Risks">Risk</option>
                            <option value="Dependencies">Dependency</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="expected_resolution_date" className="block text-sm font-medium text-gray-200 mb-1">
                            Expected Resolution Date
                          </label>
                          <input
                            type="date"
                            id="expected_resolution_date"
                            name="expected_resolution_date"
                            value={currentBlocker.expected_resolution_date}
                            onChange={handleBlockerChange}
                            className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-600 bg-[#2a3349] text-white rounded-md"
                          />
                        </div>
                      </div>
                      <div className="mb-4">
                        <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-1">
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          rows={3}
                          value={currentBlocker.description}
                          onChange={handleBlockerChange}
                          className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border-gray-600 bg-[#2a3349] text-white rounded-md"
                          placeholder="Describe the blocker, risk, or dependency"
                        />
                      </div>
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          className="px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-200 bg-[#2a3349] hover:bg-[#313a58] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          onClick={() => setShowBlockerForm(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                          onClick={handleAddBlocker}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowBlockerForm(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-200 bg-[#262d40] hover:bg-[#2a3349] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Add Blocker/Risk/Dependency
                    </button>
                  )}
                </div>

                {/* Form Actions */}
                <div className="mt-8 pt-5 border-t border-gray-700 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => router.push('/user-dashboard')}
                    className="px-4 py-2 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-200 bg-[#262d40] hover:bg-[#2a3349] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${
                      isSubmitting ? 'bg-purple-500 opacity-70 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </>
                    ) : (
                      'Submit Daily Update'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>

        {/* Success animation overlay */}
        {showAnimation && (
          <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
            <div className="text-center p-8 bg-[#1e2538] rounded-lg shadow-xl">
              <div className="w-24 h-24 rounded-full bg-purple-900 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Update Submitted!</h2>
              <p className="text-gray-300">Your daily update has been submitted successfully.</p>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
} 