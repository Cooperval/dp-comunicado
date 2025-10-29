import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '@/config/supabase';

const supabaseUrl = supabaseConfig.url;
const supabaseAnonKey = supabaseConfig.anonKey;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('SUA_SUPABASE')) {
  throw new Error('Por favor, configure suas credenciais do Supabase em src/config/supabase.ts');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
