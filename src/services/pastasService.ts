import { supabase } from '@/integrations/supabase/client';

export interface Pasta {
  id: string;
  nome: string;
  pasta_parent_id?: string | null;
  cor?: string;
  icone?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePastaInput {
  nome: string;
  pasta_parent_id?: string;
  cor?: string;
  icone?: string;
}

export interface UpdatePastaInput {
  nome?: string;
  pasta_parent_id?: string | null;
  cor?: string;
  icone?: string;
}

/**
 * Buscar todas as pastas (com hierarquia)
 */
export const getPastas = async (): Promise<Pasta[]> => {
  const { data, error } = await supabase
    .from('pastas')
    .select('*')
    .order('nome');

  if (error) {
    console.error('Erro ao buscar pastas:', error);
    throw error;
  }

  return data || [];
};

/**
 * Buscar pasta por ID
 */
export const getPastaById = async (id: string): Promise<Pasta | null> => {
  const { data, error } = await supabase
    .from('pastas')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Erro ao buscar pasta:', error);
    throw error;
  }

  return data;
};

/**
 * Criar nova pasta
 */
export const createPasta = async (pasta: CreatePastaInput): Promise<Pasta> => {
  console.log('=== PASTAS SERVICE - createPasta ===');
  console.log('Dados de entrada:', pasta);
  
  console.log('🔍 Verificando autenticação (opcional)...');
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Usuário atual:', user ? {
    id: user.id,
    email: user.email,
    role: user.role
  } : 'NENHUM USUÁRIO AUTENTICADO - Continuando mesmo assim');

  const dadosParaInserir = {
    nome: pasta.nome,
    pasta_parent_id: pasta.pasta_parent_id || null,
    cor: pasta.cor || '#3B82F6',
    icone: pasta.icone,
    created_by: user?.id || null,
  };
  
  console.log('📤 Inserindo no Supabase:', dadosParaInserir);

  const { data, error } = await supabase
    .from('pastas')
    .insert([dadosParaInserir])
    .select()
    .single();

  if (error) {
    console.error('❌ Erro do Supabase:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    
    if (error.code === '42501') {
      throw new Error('Permissão negada: Você precisa estar logado para criar pastas');
    }
    
    throw new Error(error.message || 'Erro ao criar pasta');
  }

  console.log('✅ Pasta criada com sucesso:', data);
  return data;
};

/**
 * Atualizar pasta existente
 */
export const updatePasta = async (
  id: string,
  updates: UpdatePastaInput
): Promise<Pasta> => {
  const { data, error } = await supabase
    .from('pastas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar pasta:', error);
    throw error;
  }

  return data;
};

/**
 * Deletar pasta (e todas as subpastas em cascata)
 */
export const deletePasta = async (id: string): Promise<void> => {
  // Verificar se há documentos nesta pasta
  const { count: docCount } = await supabase
    .from('documentos')
    .select('*', { count: 'exact', head: true })
    .eq('pasta_id', id);

  if (docCount && docCount > 0) {
    throw new Error(
      `Não é possível deletar esta pasta pois ela contém ${docCount} documento(s). Mova ou delete os documentos primeiro.`
    );
  }

  const { error } = await supabase.from('pastas').delete().eq('id', id);

  if (error) {
    console.error('Erro ao deletar pasta:', error);
    throw error;
  }
};

/**
 * Obter caminho completo da pasta (breadcrumb)
 */
export const getPastaPath = async (id: string): Promise<string> => {
  const { data, error } = await supabase.rpc('get_pasta_path', {
    pasta_id: id,
  });

  if (error) {
    console.error('Erro ao buscar caminho da pasta:', error);
    return '';
  }

  return data || '';
};

/**
 * Verificar se pasta tem filhas
 */
export const hasChildFolders = async (id: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('has_child_folders', {
    pasta_id: id,
  });

  if (error) {
    console.error('Erro ao verificar pastas filhas:', error);
    return false;
  }

  return data || false;
};

/**
 * Obter pastas raiz (sem pai)
 */
export const getPastasRaiz = async (): Promise<Pasta[]> => {
  const { data, error } = await supabase
    .from('pastas')
    .select('*')
    .is('pasta_parent_id', null)
    .order('nome');

  if (error) {
    console.error('Erro ao buscar pastas raiz:', error);
    throw error;
  }

  return data || [];
};

/**
 * Obter subpastas de uma pasta
 */
export const getSubPastas = async (parentId: string): Promise<Pasta[]> => {
  const { data, error } = await supabase
    .from('pastas')
    .select('*')
    .eq('pasta_parent_id', parentId)
    .order('nome');

  if (error) {
    console.error('Erro ao buscar subpastas:', error);
    throw error;
  }

  return data || [];
};
