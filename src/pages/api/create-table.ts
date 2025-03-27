import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabaseClient';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    // First, check if the table exists
    const { data: existingTable, error: checkError } = await supabase
      .from('Aditi_team_members')
      .select('count(*)')
      .limit(1);

    if (existingTable !== null) {
      return res.status(200).json({
        success: true,
        message: 'Table already exists',
        note: 'No action needed'
      });
    }

    // If table doesn't exist, create it with proper constraints
    const { error: createError } = await supabase.rpc(
      'exec_sql',
      {
        sql_query: `
        BEGIN;
        
        -- Create the table with proper constraints
        CREATE TABLE IF NOT EXISTS Aditi_team_members (
          id SERIAL PRIMARY KEY,
          team_name TEXT NOT NULL,
          employee_id TEXT NOT NULL,
          manager_name TEXT NOT NULL,
          team_member_name TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          CONSTRAINT valid_employee_id CHECK (employee_id ~ '^[A-Za-z0-9-]+$'),
          CONSTRAINT valid_team_name CHECK (team_name ~ '^[A-Za-z0-9\\s-]+$')
        );
        
        -- Add unique constraint if it doesn't exist
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'unique_employee_team'
          ) THEN
            ALTER TABLE Aditi_team_members 
              ADD CONSTRAINT unique_employee_team 
              UNIQUE (team_name, employee_id);
          END IF;
        END
        $$;
        
        -- Create indexes if they don't exist
        CREATE INDEX IF NOT EXISTS idx_team_name ON Aditi_team_members (team_name);
        CREATE INDEX IF NOT EXISTS idx_manager_name ON Aditi_team_members (manager_name);
        
        -- Add trigger for updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        DROP TRIGGER IF EXISTS update_Aditi_team_members_updated_at ON Aditi_team_members;
        CREATE TRIGGER update_Aditi_team_members_updated_at
          BEFORE UPDATE ON Aditi_team_members
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        
        COMMIT;
        `
      }
    );

    if (createError) {
      console.error('Error creating table:', createError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create table',
        error: createError.message,
        note: 'Please check your database permissions and try again'
      });
    }

    // Verify table creation with a test insert
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

    if (insertError) {
      console.error('Error inserting test record:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Table created but test insert failed',
        error: insertError.message,
        note: 'Please check the table structure and constraints'
      });
    }

    // Clean up test record
    const { error: deleteError } = await supabase
      .from('Aditi_team_members')
      .delete()
      .eq('employee_id', testRecord.employee_id);

    if (deleteError) {
      console.error('Error cleaning up test record:', deleteError);
      // Don't fail the response, just log the error
    }

    return res.status(200).json({
      success: true,
      message: 'Table created successfully',
      note: 'Table structure verified with test insert'
    });
  } catch (err) {
    const error = err as Error;
    console.error('Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Unexpected error occurred',
      error: error.message,
      note: 'Please check the server logs for more details'
    });
  }
} 