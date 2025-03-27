import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import Head from 'next/head';
import Link from 'next/link';

interface TeamMember {
  id?: number;
  team_name: string;
  employee_id: string;
  manager_name: string;
  team_member_name: string;
  created_at?: string;
}

export default function TeamManagement() {
  const [teams, setTeams] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeam, setNewTeam] = useState({
    team_name: '',
    employee_id: '',
    manager_name: '',
    team_member_name: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch existing teams
  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Aditi_team_members')
        .select('*')
        .order('team_name', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        // Don't show database relation errors to users
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          setTeams([]);
        } else {
          toast.error('Unable to load team members');
          setError('Unable to load team members');
        }
        throw error;
      }
      
      setTeams(data || []);
    } catch (error) {
      if (error instanceof Error && !error.message.includes('relation')) {
        toast.error('Failed to load teams');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Validate input data
      const validationErrors = [];
      if (!newTeam.team_name.trim()) validationErrors.push('Team name is required');
      if (!newTeam.employee_id.trim()) validationErrors.push('Employee ID is required');
      if (!newTeam.manager_name.trim()) validationErrors.push('Manager name is required');
      if (!newTeam.team_member_name.trim()) validationErrors.push('Team member name is required');

      // Validate format
      if (!/^[A-Za-z0-9\s-]+$/.test(newTeam.team_name)) {
        validationErrors.push('Team name can only contain letters, numbers, spaces, and hyphens');
      }
      if (!/^[A-Za-z0-9-]+$/.test(newTeam.employee_id)) {
        validationErrors.push('Employee ID can only contain letters, numbers, and hyphens');
      }

      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join('\n'));
      }

      // Check for duplicate entry
      const { data: existingEntry, error: checkError } = await supabase
        .from('Aditi_team_members')
        .select('id')
        .eq('team_name', newTeam.team_name)
        .eq('employee_id', newTeam.employee_id)
        .single();

      if (existingEntry) {
        throw new Error('A team member with this Employee ID already exists in this team');
      }

      // Insert the new team member
      const { data, error } = await supabase
        .from('Aditi_team_members')
        .insert([{
          ...newTeam,
          team_name: newTeam.team_name.trim(),
          employee_id: newTeam.employee_id.trim(),
          manager_name: newTeam.manager_name.trim(),
          team_member_name: newTeam.team_member_name.trim()
        }])
        .select();

      if (error) {
        // Don't show database relation errors to users
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          throw new Error('Unable to add team member at this time');
        }
        throw new Error(error.message);
      }

      // Success
      toast.success('Team member added successfully!');
      setNewTeam({
        team_name: '',
        employee_id: '',
        manager_name: '',
        team_member_name: ''
      });
      await fetchTeams();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add team member';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTeam(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      <Head>
        <title>Team Management | Aditi Daily Updates</title>
        <meta name="description" content="Manage your team members and create new teams" />
      </Head>

      <div className="min-h-screen bg-[#1a1f2e] text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#1e2538] rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
                Team Management
              </h1>
              <div className="flex space-x-3">
                <Link 
                  href="/dashboard"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm transition-colors duration-300"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>

            {/* Add New Team Member Form */}
            <form onSubmit={handleSubmit} className="mb-8 bg-[#262d40] p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Add New Team Member</h2>
              
              {error && (
                <div className="mb-4 p-3 bg-red-500/20 text-red-400 rounded-md">
                  <p className="font-medium">Error:</p>
                  <p>{error}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="team_name" className="block text-sm font-medium text-gray-300 mb-1">
                    Team Name
                  </label>
                  <input
                    type="text"
                    id="team_name"
                    name="team_name"
                    value={newTeam.team_name}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#1e2538] border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter team name"
                  />
                </div>
                <div>
                  <label htmlFor="employee_id" className="block text-sm font-medium text-gray-300 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    id="employee_id"
                    name="employee_id"
                    value={newTeam.employee_id}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#1e2538] border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter employee ID"
                  />
                </div>
                <div>
                  <label htmlFor="manager_name" className="block text-sm font-medium text-gray-300 mb-1">
                    Manager Name
                  </label>
                  <input
                    type="text"
                    id="manager_name"
                    name="manager_name"
                    value={newTeam.manager_name}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#1e2538] border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter manager name"
                  />
                </div>
                <div>
                  <label htmlFor="team_member_name" className="block text-sm font-medium text-gray-300 mb-1">
                    Team Member Name
                  </label>
                  <input
                    type="text"
                    id="team_member_name"
                    name="team_member_name"
                    value={newTeam.team_member_name}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#1e2538] border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter team member name"
                  />
                </div>
              </div>
              <div className="mt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors duration-300 flex items-center ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    'Add Team Member'
                  )}
                </button>
              </div>
            </form>

            {/* Teams List */}
            <div className="bg-[#262d40] rounded-lg overflow-hidden">
              <h2 className="text-xl font-semibold p-4 border-b border-gray-700">Team Members</h2>
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : teams.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Team Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Employee ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Manager Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Team Member Name</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {teams.map((team, index) => (
                        <tr key={index} className="hover:bg-[#2a3347] transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{team.team_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{team.employee_id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{team.manager_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{team.team_member_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-400 py-4">No team members found.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 