import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '@/config/supabase';

const supabaseUrl = 'https://pjolciisxlslkxrmpcrk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqb2xjaWlzeGxzbGt4cm1wY3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3Mzg2NDQsImV4cCI6MjA3NzMxNDY0NH0.SXY32ERhPXqRMDK5eC81hwTykheh1zXFd05r-09rH5Q';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('SUA_SUPABASE')) {
  throw new Error('Por favor, configure suas credenciais do Supabase em src/config/supabase.ts');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
