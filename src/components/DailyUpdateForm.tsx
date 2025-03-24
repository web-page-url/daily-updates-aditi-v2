import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import emailjs from '@emailjs/browser';
import { toast } from 'react-hot-toast';

interface DailyUpdateFormProps {
  reportingManager: string;
  userEmail?: string;
  userName?: string;
  teamName?: string;
  isManager?: boolean;
}

// Blocker type definition
interface Blocker {
  id: string;
  type: 'Risk' | 'Issue' | 'Dependency' | 'Blocker';
  description: string;
  resolutionDate: string;
}

// Google Sheets script URL
const scriptURL = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_SCRIPT_URL || '';

// EmailJS configuration
const EMAILJS_SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '';
const MANAGER_EMAIL = process.env.NEXT_PUBLIC_MANAGER_EMAIL || '';

export default function DailyUpdateForm({ 
  reportingManager, 
  userEmail = '', 
  userName = '', 
  teamName = '',
  isManager = false 
}: DailyUpdateFormProps) {
  // Initialize EmailJS
  useEffect(() => {
    if (EMAILJS_PUBLIC_KEY) {
      emailjs.init(EMAILJS_PUBLIC_KEY);
    } else {
      console.error('EmailJS Public Key is missing. Email functionality will not work.');
    }
  }, []);

  const [currentDate, setCurrentDate] = useState('');
  const [formData, setFormData] = useState({
    time: new Date().toISOString(),
    employeeName: userName || '',
    task: '',
    status: '',
    help: '',
    notes: '',
    team: teamName || '',
  });

  // Add email state with pre-populated value if provided
  const [email, setEmail] = useState(userEmail || '');
  
  // Add blockers state as an array
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  
  // State for showing historical data
  const [showHistoricalData, setShowHistoricalData] = useState(false);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Add animation state
  const [showAnimation, setShowAnimation] = useState(false);
  
  // Add blocker form visibility state
  const [showBlockerForm, setShowBlockerForm] = useState(false);
  const [currentBlocker, setCurrentBlocker] = useState<Partial<Blocker>>({
    type: 'Issue',
    description: '',
    resolutionDate: ''
  });

  useEffect(() => {
    // Format the current date
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));
  }, []);

  // Function to handle adding a new blocker
  const handleAddBlocker = () => {
    if (!currentBlocker.description || !currentBlocker.resolutionDate) {
      toast.error('Please fill in all blocker fields');
      return;
    }

    const newBlocker: Blocker = {
      id: Date.now().toString(),
      type: currentBlocker.type as 'Risk' | 'Issue' | 'Dependency' | 'Blocker',
      description: currentBlocker.description,
      resolutionDate: currentBlocker.resolutionDate
    };

    setBlockers([...blockers, newBlocker]);
    
    // Reset current blocker form
    setCurrentBlocker({
      type: 'Issue',
      description: '',
      resolutionDate: ''
    });
    
    // Hide blocker form after adding
    setShowBlockerForm(false);
  };

  // Function to remove a blocker
  const handleRemoveBlocker = (id: string) => {
    setBlockers(blockers.filter(blocker => blocker.id !== id));
  };

  // Function to fetch historical data
  const fetchHistoricalData = async () => {
    setIsLoadingHistory(true);
    try {
      let query = supabase
        .from('daily_updates')
        .select('*')
        .order('created_at', { ascending: false });
      
      // If not manager, restrict to current user's data
      if (!isManager && email) {
        query = query.eq('email', email);
      } 
      // If manager and team name is provided, restrict to team data
      else if (isManager && teamName) {
        query = query.eq('team', teamName);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setHistoricalData(data || []);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      toast.error('Failed to load historical data');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Function to export data to CSV for managers
  const exportToCSV = () => {
    if (!historicalData.length) return;
    
    const headers = Object.keys(historicalData[0]).join(',');
    const csvRows = [headers];
    
    for (const row of historicalData) {
      const values = Object.values(row).map(value => {
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      });
      csvRows.push(values.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `team_updates_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sendEmail = async (formData: any) => {
    try {
      // Format blockers for email
      const blockersText = blockers.length 
        ? blockers.map(b => `Type: ${b.type}\nDescription: ${b.description}\nResolution Date: ${b.resolutionDate}`).join('\n\n')
        : 'None';

      const templateParams = {
        to_name: reportingManager,
        from_name: formData.employeeName,
        to_email: MANAGER_EMAIL,
        from_email: email,
        employee_name: formData.employeeName,
        manager_email: reportingManager,
        tasks_completed: formData.task,
        blockers: blockersText,
        status: formData.status,
        help_needed: formData.help || 'None',
        notes: formData.notes || 'None',
        date: currentDate,
        reply_to: email,
        team: formData.team || 'Not specified',
        message: `
Dear ${reportingManager},

A new daily update has been submitted:

Employee: ${formData.employeeName}
Date: ${currentDate}
Team: ${formData.team || 'Not specified'}

Tasks Completed:
${formData.task}

Status: ${formData.status}

Blockers:
${blockersText}

Help Needed:
${formData.help || 'None'}

Additional Notes:
${formData.notes || 'None'}

Best regards,
Daily Updates System
      `
      };

      console.log('Starting email send with updated params...');
      console.log('Service ID:', EMAILJS_SERVICE_ID);
      console.log('Template ID:', EMAILJS_TEMPLATE_ID);
      console.log('Template params:', JSON.stringify(templateParams, null, 2));

      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams
      );

      console.log('Email sent successfully. Response:', response);
      toast.success('Email sent successfully to manager!');
      return true;
    } catch (error) {
      console.error('Email sending failed. Full error:', error);
      console.error('Error details:', {
        serviceId: EMAILJS_SERVICE_ID,
        templateId: EMAILJS_TEMPLATE_ID,
        hasPublicKey: !!EMAILJS_PUBLIC_KEY,
        recipientEmail: MANAGER_EMAIL,
        senderEmail: email
      });
      toast.error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setShowAnimation(false);

    try {
      const form = e.target as HTMLFormElement;
      
      // Format blockers for database storage
      const blockersData = blockers.length ? JSON.stringify(blockers) : null;
      
      // Prepare data for Supabase
      const supabaseData = {
        employee_name: formData.employeeName,
        tasks_completed: formData.task,
        blockers: blockersData,
        status: formData.status,
        help_needed: formData.help || null,
        notes: formData.notes || null,
        created_at: new Date().toISOString(),
        email: email,
        team: formData.team || null
      };

      console.log('Sending data to Supabase:', supabaseData);

      // Save to Supabase database
      const { data: supabaseResponse, error: supabaseError } = await supabase
        .from('daily_updates')
        .insert([supabaseData])
        .select();

      if (supabaseError) {
        console.error('Supabase Error:', supabaseError);
        throw new Error('Failed to save to database: ' + supabaseError.message);
      }

      // Send email notification
      await sendEmail(formData);

      console.log('Successfully saved to Supabase:', supabaseResponse);

      // Also save to Google Sheets if needed
      const formDataToSend = new FormData(form);
      formDataToSend.append('time', new Date().toISOString());
      formDataToSend.append('email', email);
      formDataToSend.append('team', formData.team || '');
      
      // Add blockers data to form data
      formDataToSend.append('blockers', blockersData || '');

      const sheetResponse = await fetch(scriptURL, {
        method: 'POST',
        body: formDataToSend
      });

      if (!sheetResponse.ok) {
        throw new Error('Google Sheets Error: ' + sheetResponse.statusText);
      }

      setSubmitStatus({
        type: 'success',
        message: 'Update submitted successfully! Email notification sent.'
      });
      
      // Trigger animation
      setShowAnimation(true);
      
      // Clear form after successful submission
      setFormData({
        time: new Date().toISOString(),
        employeeName: userName || '',
        task: '',
        status: '',
        help: '',
        notes: '',
        team: teamName || '',
      });
      
      // Don't clear email if pre-populated
      if (!userEmail) {
        setEmail('');
      }
      
      // Clear blockers
      setBlockers([]);

      // Hide animation after 5 seconds
      setTimeout(() => {
        setShowAnimation(false);
      }, 5000);

    } catch (error) {
      console.error('Error:', error);
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit update. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle blocker change
  const handleBlockerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setCurrentBlocker({
      ...currentBlocker,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-[#1a1f2e] text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-[#1e2538] rounded-lg p-6 shadow-lg relative hover:shadow-2xl transition-shadow duration-300">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block bg-[#1b1f2e] px-4 py-2 rounded-full mb-4 hover:bg-[#232838] transition-colors duration-300 hover:scale-105 transform">
              <p className="text-sm text-gray-300">
                <span className="text-green-500">•</span> {currentDate} <span className="text-green-500">•</span>
              </p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent hover:from-purple-500 hover:to-purple-700 transition-all duration-300">
              Daily Employee Updates
            </h1>
            <div className="text-gray-400 hover:text-gray-300 transition-colors duration-300">
              <span className="mr-2">Reporting Manager:</span>
              <span className="font-medium">{reportingManager}</span>
            </div>
            
            {/* Manager Controls - Only visible to managers */}
            {isManager && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  onClick={() => {
                    setShowHistoricalData(!showHistoricalData);
                    if (!showHistoricalData) {
                      fetchHistoricalData();
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300"
                >
                  {showHistoricalData ? 'Hide' : 'View'} Team Data
                </button>
                
                {historicalData.length > 0 && (
                  <button
                    onClick={exportToCSV}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-300"
                  >
                    Export Data (CSV)
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Historical Data Section */}
          {showHistoricalData && (
            <div className="mb-8 bg-[#262d40] rounded-lg p-4 overflow-x-auto">
              <h2 className="text-xl font-semibold mb-4 text-purple-400">Historical Data</h2>
              
              {isLoadingHistory ? (
                <div className="flex justify-center items-center p-8">
                  <svg className="animate-spin h-8 w-8 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : historicalData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Employee</th>
                        {isManager && <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Team</th>}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {historicalData.map((entry, index) => (
                        <tr key={index} className="hover:bg-[#2a3347] transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Date(entry.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.employee_name}</td>
                          {isManager && <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.team || '-'}</td>}
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium
                              ${entry.status === 'completed' ? 'bg-green-500/20 text-green-400' : 
                                entry.status === 'in-progress' ? 'bg-blue-500/20 text-blue-400' : 
                                'bg-red-500/20 text-red-400'}`}>
                              {entry.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button 
                              className="text-purple-400 hover:text-purple-300 underline"
                              onClick={() => {
                                // Show details modal or expand row (simplified for this example)
                                alert(`Tasks: ${entry.tasks_completed}\n\nBlockers: ${entry.blockers || 'None'}`);
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-400 py-4">No historical data available.</p>
              )}
            </div>
          )}

          {/* Status Message */}
          {submitStatus && (
            <div className={`mb-6 p-4 rounded-md ${
              submitStatus.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {submitStatus.message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Selection */}
            <div className="group">
              <label htmlFor="team" className="block text-sm font-medium text-gray-300 mb-2 group-hover:text-purple-400 transition-colors duration-300">
                Team <span className="text-red-500">*</span>
              </label>
              <select
                id="team"
                name="team"
                value={formData.team}
                onChange={handleChange}
                disabled={!!teamName} // Disable if team is pre-populated
                className={`w-full bg-[#262d40] border border-gray-600 rounded-md px-4 py-3 text-white 
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                transition-all duration-300 ease-in-out
                hover:bg-[#2a3347] hover:border-purple-500 hover:shadow-lg
                transform hover:-translate-y-0.5
                appearance-none cursor-pointer
                ${teamName ? 'opacity-75 cursor-not-allowed' : ''}`}
                required
              >
                <option value="">Select your team</option>
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="QA">QA</option>
                <option value="Project Management">Project Management</option>
                <option value="Business Analysis">Business Analysis</option>
              </select>
            </div>

            {/* Employee Name */}
            <div className="group">
              <label htmlFor="employeeName" className="block text-sm font-medium text-gray-300 mb-2 group-hover:text-purple-400 transition-colors duration-300">
                Employee Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="employeeName"
                name="employeeName"
                value={formData.employeeName}
                onChange={handleChange}
                placeholder="Enter your full name"
                disabled={!!userName} // Disable if name is pre-populated
                className={`w-full bg-[#262d40] border border-gray-600 rounded-md px-4 py-3 text-white placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                transition-all duration-300 ease-in-out
                hover:bg-[#2a3347] hover:border-purple-500 hover:shadow-lg
                transform hover:-translate-y-0.5
                ${userName ? 'opacity-75 cursor-not-allowed' : ''}`}
                required
                autoComplete="name"
              />
            </div>

            {/* Email Input */}
            <div className="group">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2 group-hover:text-purple-400 transition-colors duration-300">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                disabled={!!userEmail} // Disable if email is pre-populated
                className={`w-full bg-[#262d40] border border-gray-600 rounded-md px-4 py-3 text-white placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                transition-all duration-300 ease-in-out
                hover:bg-[#2a3347] hover:border-purple-500 hover:shadow-lg
                transform hover:-translate-y-0.5
                ${userEmail ? 'opacity-75 cursor-not-allowed' : ''}`}
                required
              />
            </div>

            {/* Tasks Completed */}
            <div className="group">
              <label htmlFor="task" className="block text-sm font-medium text-gray-300 mb-2 group-hover:text-purple-400 transition-colors duration-300">
                Tasks Completed Today <span className="text-red-500">*</span>
              </label>
              <textarea
                id="task"
                name="task"
                value={formData.task}
                onChange={handleChange}
                placeholder="List the tasks you completed today"
                rows={4}
                className="w-full bg-[#262d40] border border-gray-600 rounded-md px-4 py-3 text-white placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                transition-all duration-300 ease-in-out
                hover:bg-[#2a3347] hover:border-purple-500 hover:shadow-lg
                transform hover:-translate-y-0.5
                resize-none"
                required
              />
            </div>

            {/* Blockers Section */}
            <div className="group">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300 group-hover:text-purple-400 transition-colors duration-300">
                  Blockers/Risks/Dependencies
                </label>
                <button
                  type="button"
                  onClick={() => setShowBlockerForm(!showBlockerForm)}
                  className="inline-flex items-center justify-center p-1 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    {showBlockerForm ? (
                      <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                    )}
                  </svg>
                </button>
              </div>

              {/* Display existing blockers */}
              {blockers.length > 0 && (
                <div className="mb-4 space-y-2">
                  {blockers.map(blocker => (
                    <div key={blocker.id} className="flex items-start justify-between bg-[#2a3347] p-3 rounded-md hover:bg-[#313c52] transition-colors duration-200">
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                            blocker.type === 'Risk' ? 'bg-yellow-500/20 text-yellow-400' :
                            blocker.type === 'Issue' ? 'bg-red-500/20 text-red-400' :
                            blocker.type === 'Dependency' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-orange-500/20 text-orange-400'
                          }`}>
                            {blocker.type}
                          </span>
                          <span className="text-xs text-gray-400">Resolution: {new Date(blocker.resolutionDate).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-300">{blocker.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlocker(blocker.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors duration-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Blocker form */}
              {showBlockerForm && (
                <div className="bg-[#262d40] border border-gray-600 rounded-md p-4 mb-4 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label htmlFor="blockerType" className="block text-sm font-medium text-gray-300 mb-2">
                        Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="blockerType"
                        name="type"
                        value={currentBlocker.type}
                        onChange={handleBlockerChange}
                        className="w-full bg-[#2a3347] border border-gray-600 rounded-md px-4 py-2 text-white
                        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                        appearance-none cursor-pointer"
                        required
                      >
                        <option value="Issue">Issue</option>
                        <option value="Risk">Risk</option>
                        <option value="Dependency">Dependency</option>
                        <option value="Blocker">Blocker</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="resolutionDate" className="block text-sm font-medium text-gray-300 mb-2">
                        Expected Resolution Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="resolutionDate"
                        name="resolutionDate"
                        value={currentBlocker.resolutionDate}
                        onChange={handleBlockerChange}
                        className="w-full bg-[#2a3347] border border-gray-600 rounded-md px-4 py-2 text-white
                        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label htmlFor="blockerDescription" className="block text-sm font-medium text-gray-300 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="blockerDescription"
                      name="description"
                      value={currentBlocker.description}
                      onChange={handleBlockerChange}
                      placeholder="Describe the blocker in detail"
                      rows={3}
                      className="w-full bg-[#2a3347] border border-gray-600 rounded-md px-4 py-2 text-white placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                      resize-none"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowBlockerForm(false)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddBlocker}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-300 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Task Status */}
            <div className="group">
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2 group-hover:text-purple-400 transition-colors duration-300">
                Task Status <span className="text-red-500">*</span>
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-[#262d40] border border-gray-600 rounded-md px-4 py-3 text-white 
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                transition-all duration-300 ease-in-out
                hover:bg-[#2a3347] hover:border-purple-500 hover:shadow-lg
                transform hover:-translate-y-0.5
                appearance-none cursor-pointer"
                required
              >
                <option value="">Select status</option>
                <option value="completed">Completed</option>
                <option value="in-progress">In Progress</option>
                <option value="stuck">Stuck</option>
              </select>
            </div>

            {/* Help Needed */}
            <div className="group">
              <label htmlFor="help" className="block text-sm font-medium text-gray-300 mb-2 group-hover:text-purple-400 transition-colors duration-300">
                Help Needed
              </label>
              <textarea
                id="help"
                name="help"
                value={formData.help}
                onChange={handleChange}
                placeholder="Describe what kind of help you need"
                rows={4}
                className="w-full bg-[#262d40] border border-gray-600 rounded-md px-4 py-3 text-white placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                transition-all duration-300 ease-in-out
                hover:bg-[#2a3347] hover:border-purple-500 hover:shadow-lg
                transform hover:-translate-y-0.5
                resize-none"
              />
            </div>

            {/* Additional Notes */}
            <div className="group">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2 group-hover:text-purple-400 transition-colors duration-300">
                Additional Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional comments or notes"
                rows={4}
                className="w-full bg-[#262d40] border border-gray-600 rounded-md px-4 py-3 text-white placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                transition-all duration-300 ease-in-out
                hover:bg-[#2a3347] hover:border-purple-500 hover:shadow-lg
                transform hover:-translate-y-0.5
                resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="relative">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-purple-500 text-white font-medium py-3 px-4 rounded-md 
                transition-all duration-300 ease-in-out
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#1e2538]
                transform hover:-translate-y-1 hover:shadow-lg hover:bg-purple-600
                active:translate-y-0 active:shadow-md
                ${isSubmitting ? 'opacity-75 cursor-not-allowed' : 'hover:bg-purple-600'}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit Update'
                )}
              </button>

              {/* Success Message Animation */}
              <div
                className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg 
                shadow-lg flex items-center space-x-2 transition-all duration-500
                hover:bg-green-600 hover:shadow-xl hover:scale-105 
                ${showAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
              >
                <svg
                  className="w-6 h-6 animate-bounce"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="font-medium text-lg">Update submitted successfully!</span>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-400 hover:text-gray-300 transition-colors duration-300">
            © {new Date().getFullYear()} Aditi Updates. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
} 