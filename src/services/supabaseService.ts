import { supabase } from '@/integrations/supabase/client';

/**
 * Testa a conexão com o Supabase
 * @returns Promise<boolean> - true se conectado, false caso contrário
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    // Test connection by checking auth status
    const { error } = await supabase.auth.getSession();
    return !error;
  } catch (err) {
    console.error('Erro ao testar conexão Supabase:', err);
    return false;
  }
};

/**
 * Obtém a sessão atual do usuário
 */
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Erro ao obter sessão:', error);
    return null;
  }
  return session;
};

/**
 * Obtém o usuário atual
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Erro ao obter usuário:', error);
    return null;
  }
  return user;
};
