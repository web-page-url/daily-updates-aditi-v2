import { useState, useEffect } from 'react';
import { supabase, DailyUpdate, Team } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface DailyUpdateFormProps {
  userEmail: string;
  userName: string;
  reportingManager: string;
  teamName: string;
  isManager: boolean;
}

interface Blocker {
  id: string;
  type: 'Blockers' | 'Risks' | 'Dependencies';
  description: string;
  expected_resolution_date: string;
}

export default function DailyUpdateForm({ 
  userEmail, 
  userName, 
  reportingManager,
  teamName,
  isManager 
}: DailyUpdateFormProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [formData, setFormData] = useState({
    employee_name: userName || '',
    employee_id: '',
    email_address: userEmail || '',
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

  useEffect(() => {
    fetchUserTeams();
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));
  }, [userEmail]);

  const fetchUserTeams = async () => {
    try {
      const { data: teamMemberships, error: membershipError } = await supabase
        .from('aditi_team_members')
        .select('team_id')
        .eq('employee_email', userEmail);

      if (membershipError) throw membershipError;

      if (teamMemberships && teamMemberships.length > 0) {
        const teamIds = teamMemberships.map(tm => tm.team_id);
        const { data: teamsData, error: teamsError } = await supabase
          .from('aditi_teams')
          .select('*')
          .in('id', teamIds);

        if (teamsError) throw teamsError;
        setTeams(teamsData || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to load teams');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) {
      toast.error('Please select a team');
      return;
    }

    setIsSubmitting(true);
    try {
      // If there are no blockers, create a single update without blocker info
      if (blockers.length === 0) {
        const { error } = await supabase
          .from('aditi_daily_updates')
          .insert([{
            employee_name: formData.employee_name,
            employee_id: formData.employee_id,
            employee_email: formData.email_address,
            team_id: selectedTeam,
            tasks_completed: formData.tasks_completed,
            status: formData.status,
            additional_notes: formData.additional_notes
          }]);

        if (error) throw error;
      } else {
        // Insert each blocker as a separate daily update
        const updates = blockers.map(blocker => ({
          employee_name: formData.employee_name,
          employee_id: formData.employee_id,
          employee_email: formData.email_address,
          team_id: selectedTeam,
          tasks_completed: formData.tasks_completed,
          status: formData.status,
          additional_notes: formData.additional_notes,
          blocker_type: blocker.type,
          blocker_description: blocker.description,
          expected_resolution_date: blocker.expected_resolution_date,
        }));

        const { error } = await supabase
          .from('aditi_daily_updates')
          .insert(updates);

        if (error) throw error;
      }

      toast.success('Daily update submitted successfully!');
      setFormData({
        employee_name: userName || '',
        employee_id: '',
        email_address: userEmail || '',
        tasks_completed: '',
        status: 'in-progress',
        additional_notes: '',
      });
      setBlockers([]);
      
      setShowAnimation(true);
      setTimeout(() => setShowAnimation(false), 5000);
    } catch (error) {
      console.error('Error submitting update:', error);
      toast.error('Failed to submit update');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBlockerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentBlocker(prev => ({
      ...prev,
      [name]: value
    }));
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
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Employee Information Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group">
                <label htmlFor="employee_name" className="block text-sm font-medium text-gray-300 mb-2 group-hover:text-purple-400 transition-colors duration-300">
                  Employee Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="employee_name"
                  name="employee_name"
                  value={formData.employee_name}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#262d40] border border-gray-600 rounded-md px-4 py-3 text-white 
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                  transition-all duration-300 ease-in-out
                  hover:bg-[#2a3347] hover:border-purple-500 hover:shadow-lg
                  transform hover:-translate-y-0.5"
                  placeholder="Enter your name"
                />
              </div>

              <div className="group">
                <label htmlFor="employee_id" className="block text-sm font-medium text-gray-300 mb-2 group-hover:text-purple-400 transition-colors duration-300">
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="employee_id"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#262d40] border border-gray-600 rounded-md px-4 py-3 text-white 
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                  transition-all duration-300 ease-in-out
                  hover:bg-[#2a3347] hover:border-purple-500 hover:shadow-lg
                  transform hover:-translate-y-0.5"
                  placeholder="Enter your employee ID"
                />
              </div>

              <div className="group">
                <label htmlFor="email_address" className="block text-sm font-medium text-gray-300 mb-2 group-hover:text-purple-400 transition-colors duration-300">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email_address"
                  name="email_address"
                  value={formData.email_address}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#262d40] border border-gray-600 rounded-md px-4 py-3 text-white 
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                  transition-all duration-300 ease-in-out
                  hover:bg-[#2a3347] hover:border-purple-500 hover:shadow-lg
                  transform hover:-translate-y-0.5"
                  placeholder="Enter your email address"
                />
              </div>

              <div className="group">
                <label htmlFor="team" className="block text-sm font-medium text-gray-300 mb-2 group-hover:text-purple-400 transition-colors duration-300">
                  Team <span className="text-red-500">*</span>
                </label>
                <select
                  id="team"
                  name="team"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="w-full bg-[#262d40] border border-gray-600 rounded-md px-4 py-3 text-white 
                  focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                  transition-all duration-300 ease-in-out
                  hover:bg-[#2a3347] hover:border-purple-500 hover:shadow-lg
                  transform hover:-translate-y-0.5
                  appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select your team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.team_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tasks Completed Section */}
            <div className="group">
              <label htmlFor="tasks_completed" className="block text-sm font-medium text-gray-300 mb-2 group-hover:text-purple-400 transition-colors duration-300">
                Tasks Completed <span className="text-red-500">*</span>
              </label>
              <textarea
                id="tasks_completed"
                name="tasks_completed"
                value={formData.tasks_completed}
                onChange={handleChange}
                className="w-full bg-[#262d40] border border-gray-600 rounded-md px-4 py-3 text-white placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                transition-all duration-300 ease-in-out
                hover:bg-[#2a3347] hover:border-purple-500 hover:shadow-lg
                transform hover:-translate-y-0.5
                resize-none"
                rows={4}
                required
                placeholder="Describe the tasks you completed today"
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
                            blocker.type === 'Risks' ? 'bg-yellow-500/20 text-yellow-400' :
                            blocker.type === 'Blockers' ? 'bg-red-500/20 text-red-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {blocker.type}
                          </span>
                          <span className="text-xs text-gray-400">Resolution: {new Date(blocker.expected_resolution_date).toLocaleDateString()}</span>
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
                        <option value="Blockers">Blockers</option>
                        <option value="Risks">Risks</option>
                        <option value="Dependencies">Dependencies</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="resolutionDate" className="block text-sm font-medium text-gray-300 mb-2">
                        Expected Resolution Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        id="resolutionDate"
                        name="expected_resolution_date"
                        value={currentBlocker.expected_resolution_date}
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

            <div className="group">
              <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-2 group-hover:text-purple-400 transition-colors duration-300">
                Status <span className="text-red-500">*</span>
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
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div className="group">
              <label htmlFor="additional_notes" className="block text-sm font-medium text-gray-300 mb-2 group-hover:text-purple-400 transition-colors duration-300">
                Additional Notes
              </label>
              <textarea
                id="additional_notes"
                name="additional_notes"
                value={formData.additional_notes}
                onChange={handleChange}
                className="w-full bg-[#262d40] border border-gray-600 rounded-md px-4 py-3 text-white placeholder-gray-400 
                focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent 
                transition-all duration-300 ease-in-out
                hover:bg-[#2a3347] hover:border-purple-500 hover:shadow-lg
                transform hover:-translate-y-0.5
                resize-none"
                rows={3}
              />
            </div>

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
                  'Submit'
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