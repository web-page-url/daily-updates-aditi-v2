import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Test connection by trying to query the table
    const { data, error, count } = await supabase
      .from('Aditi_team_members')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Supabase connection error',
        error: error.message,
        details: error
      });
    }

    // Try to insert a test record
    const testRecord = {
      team_name: 'TEST_TEAM',
      employee_id: 'TEST_' + Date.now(),
      manager_name: 'TEST_MANAGER',
      team_member_name: 'TEST_EMPLOYEE'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('Aditi_team_members')
      .insert([testRecord])
      .select();

    // Respond with the results
    return res.status(200).json({
      success: true,
      message: 'Connection to Supabase successful',
      connectionDetails: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set'
      },
      existingData: {
        count,
        records: data
      },
      testInsert: {
        success: !insertError,
        error: insertError ? insertError.message : null,
        data: insertData
      }
    });
  } catch (err) {
    const error = err as Error;
    return res.status(500).json({
      success: false,
      message: 'Failed to test Supabase connection',
      error: error.message
    });
  }
} 