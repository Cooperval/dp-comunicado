const STORAGE_KEY = 'controle-ponto-parametros';

export interface TipoOcorrencia {
  id: string;
  nome: string;
  descricao?: string;
  cor: string;
  ordem: number;
  ativo: boolean;
}

export interface MotivoOcorrencia {
  id: string;
  tipoId: string;
  nome: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
}

interface ParametrosData {
  tipos: TipoOcorrencia[];
  motivos: MotivoOcorrencia[];
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const dadosIniciais: ParametrosData = {
  tipos: [
    { id: 'tipo-1', nome: 'Mudança de Escala', descricao: '', cor: '#6366f1', ordem: 1, ativo: true },
    { id: 'tipo-2', nome: 'Compensação', descricao: '', cor: '#10b981', ordem: 2, ativo: true },
    { id: 'tipo-3', nome: 'Dispensa', descricao: '', cor: '#f59e0b', ordem: 3, ativo: true },
    { id: 'tipo-4', nome: 'Entrada/Saída', descricao: '', cor: '#3b82f6', ordem: 4, ativo: true },
    { id: 'tipo-5', nome: 'Falta Justificada', descricao: '', cor: '#8b5cf6', ordem: 5, ativo: true },
    { id: 'tipo-6', nome: 'Prêmio', descricao: '', cor: '#ec4899', ordem: 6, ativo: true },
    { id: 'tipo-7', nome: 'Banco de Horas', descricao: '', cor: '#06b6d4', ordem: 7, ativo: true },
  ],
  motivos: [
    // Mudança de Escala
    { id: 'mot-1', tipoId: 'tipo-1', nome: 'Cobertura de ausência', descricao: '', ordem: 1, ativo: true },
    { id: 'mot-2', tipoId: 'tipo-1', nome: 'Demanda operacional', descricao: '', ordem: 2, ativo: true },
    { id: 'mot-3', tipoId: 'tipo-1', nome: 'Solicitação do gestor', descricao: '', ordem: 3, ativo: true },
    { id: 'mot-4', tipoId: 'tipo-1', nome: 'Ajuste de carga horária', descricao: '', ordem: 4, ativo: true },
    // Compensação
    { id: 'mot-5', tipoId: 'tipo-2', nome: 'Horas extras trabalhadas', descricao: '', ordem: 1, ativo: true },
    { id: 'mot-6', tipoId: 'tipo-2', nome: 'Trabalho em feriado', descricao: '', ordem: 2, ativo: true },
    { id: 'mot-7', tipoId: 'tipo-2', nome: 'Plantão extraordinário', descricao: '', ordem: 3, ativo: true },
    { id: 'mot-8', tipoId: 'tipo-2', nome: 'Hora extra programada', descricao: '', ordem: 4, ativo: true },
    // Dispensa
    { id: 'mot-9', tipoId: 'tipo-3', nome: 'Aniversário', descricao: '', ordem: 1, ativo: true },
    { id: 'mot-10', tipoId: 'tipo-3', nome: 'Doação de sangue', descricao: '', ordem: 2, ativo: true },
    { id: 'mot-11', tipoId: 'tipo-3', nome: 'Casamento', descricao: '', ordem: 3, ativo: true },
    { id: 'mot-12', tipoId: 'tipo-3', nome: 'Dispensa médica', descricao: '', ordem: 4, ativo: true },
    // Entrada/Saída
    { id: 'mot-13', tipoId: 'tipo-4', nome: 'Consulta médica', descricao: '', ordem: 1, ativo: true },
    { id: 'mot-14', tipoId: 'tipo-4', nome: 'Compromisso pessoal', descricao: '', ordem: 2, ativo: true },
    { id: 'mot-15', tipoId: 'tipo-4', nome: 'Emergência familiar', descricao: '', ordem: 3, ativo: true },
    { id: 'mot-16', tipoId: 'tipo-4', nome: 'Assunto particular', descricao: '', ordem: 4, ativo: true },
    // Falta Justificada
    { id: 'mot-17', tipoId: 'tipo-5', nome: 'Atestado médico', descricao: '', ordem: 1, ativo: true },
    { id: 'mot-18', tipoId: 'tipo-5', nome: 'Luto', descricao: '', ordem: 2, ativo: true },
    { id: 'mot-19', tipoId: 'tipo-5', nome: 'Licença paternidade/maternidade', descricao: '', ordem: 3, ativo: true },
    { id: 'mot-20', tipoId: 'tipo-5', nome: 'Convocação judicial', descricao: '', ordem: 4, ativo: true },
    // Prêmio
    { id: 'mot-21', tipoId: 'tipo-6', nome: 'Assiduidade', descricao: '', ordem: 1, ativo: true },
    { id: 'mot-22', tipoId: 'tipo-6', nome: 'Pontualidade', descricao: '', ordem: 2, ativo: true },
    { id: 'mot-23', tipoId: 'tipo-6', nome: 'Desempenho excepcional', descricao: '', ordem: 3, ativo: true },
    { id: 'mot-24', tipoId: 'tipo-6', nome: 'Meta atingida', descricao: '', ordem: 4, ativo: true },
    // Banco de Horas
    { id: 'mot-25', tipoId: 'tipo-7', nome: 'Acúmulo de horas', descricao: '', ordem: 1, ativo: true },
    { id: 'mot-26', tipoId: 'tipo-7', nome: 'Utilização de horas', descricao: '', ordem: 2, ativo: true },
    { id: 'mot-27', tipoId: 'tipo-7', nome: 'Compensação de saldo', descricao: '', ordem: 3, ativo: true },
    { id: 'mot-28', tipoId: 'tipo-7', nome: 'Ajuste de banco', descricao: '', ordem: 4, ativo: true },
  ],
};

const getParametrosData = (): ParametrosData => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dadosIniciais));
      return dadosIniciais;
    }
    return JSON.parse(stored);
  } catch (error) {
    console.error('Erro ao ler localStorage:', error);
    return dadosIniciais;
  }
};

const saveParametrosData = (data: ParametrosData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao salvar localStorage:', error);
    throw new Error('Não foi possível salvar os dados. Verifique o espaço disponível.');
  }
};

// ============= TIPOS DE OCORRÊNCIA =============

export const getTiposOcorrencia = (apenasAtivos = true): TipoOcorrencia[] => {
  const data = getParametrosData();
  let tipos = data.tipos;
  
  if (apenasAtivos) {
    tipos = tipos.filter(t => t.ativo);
  }
  
  return tipos.sort((a, b) => a.ordem - b.ordem);
};

export const getTipoOcorrenciaById = (id: string): TipoOcorrencia | undefined => {
  const data = getParametrosData();
  return data.tipos.find(t => t.id === id);
};

export const createTipoOcorrencia = (
  dados: Omit<TipoOcorrencia, 'id' | 'ativo'>
): TipoOcorrencia => {
  const data = getParametrosData();
  
  // Verificar duplicata
  const existe = data.tipos.some(t => t.nome.toLowerCase() === dados.nome.toLowerCase() && t.ativo);
  if (existe) {
    throw new Error('Já existe um tipo com este nome');
  }
  
  const novoTipo: TipoOcorrencia = {
    ...dados,
    id: generateId(),
    ativo: true,
  };
  
  data.tipos.push(novoTipo);
  saveParametrosData(data);
  
  return novoTipo;
};

export const updateTipoOcorrencia = (
  id: string,
  dados: Partial<Omit<TipoOcorrencia, 'id'>>
): TipoOcorrencia => {
  const data = getParametrosData();
  const index = data.tipos.findIndex(t => t.id === id);
  
  if (index === -1) {
    throw new Error('Tipo não encontrado');
  }
  
  // Verificar duplicata se o nome mudou
  if (dados.nome) {
    const existe = data.tipos.some(
      t => t.id !== id && t.nome.toLowerCase() === dados.nome!.toLowerCase() && t.ativo
    );
    if (existe) {
      throw new Error('Já existe um tipo com este nome');
    }
  }
  
  data.tipos[index] = { ...data.tipos[index], ...dados };
  saveParametrosData(data);
  
  return data.tipos[index];
};

export const deleteTipoOcorrencia = (id: string): void => {
  const data = getParametrosData();
  const tipo = data.tipos.find(t => t.id === id);
  
  if (!tipo) {
    throw new Error('Tipo não encontrado');
  }
  
  // Soft delete
  tipo.ativo = false;
  
  // Desativar motivos vinculados
  data.motivos.forEach(m => {
    if (m.tipoId === id) {
      m.ativo = false;
    }
  });
  
  saveParametrosData(data);
};

// ============= MOTIVOS DE OCORRÊNCIA =============

export const getMotivosOcorrencia = (
  tipoId?: string,
  apenasAtivos = true
): MotivoOcorrencia[] => {
  const data = getParametrosData();
  let motivos = data.motivos;
  
  if (tipoId) {
    motivos = motivos.filter(m => m.tipoId === tipoId);
  }
  
  if (apenasAtivos) {
    motivos = motivos.filter(m => m.ativo);
  }
  
  return motivos.sort((a, b) => a.ordem - b.ordem);
};

export const getMotivoOcorrenciaById = (id: string): MotivoOcorrencia | undefined => {
  const data = getParametrosData();
  return data.motivos.find(m => m.id === id);
};

export const createMotivoOcorrencia = (
  dados: Omit<MotivoOcorrencia, 'id' | 'ativo'>
): MotivoOcorrencia => {
  const data = getParametrosData();
  
  // Verificar se o tipo existe
  const tipoExiste = data.tipos.some(t => t.id === dados.tipoId && t.ativo);
  if (!tipoExiste) {
    throw new Error('Tipo de ocorrência não encontrado ou inativo');
  }
  
  // Verificar duplicata
  const existe = data.motivos.some(
    m => m.tipoId === dados.tipoId && m.nome.toLowerCase() === dados.nome.toLowerCase() && m.ativo
  );
  if (existe) {
    throw new Error('Já existe um motivo com este nome para este tipo');
  }
  
  const novoMotivo: MotivoOcorrencia = {
    ...dados,
    id: generateId(),
    ativo: true,
  };
  
  data.motivos.push(novoMotivo);
  saveParametrosData(data);
  
  return novoMotivo;
};

export const updateMotivoOcorrencia = (
  id: string,
  dados: Partial<Omit<MotivoOcorrencia, 'id'>>
): MotivoOcorrencia => {
  const data = getParametrosData();
  const index = data.motivos.findIndex(m => m.id === id);
  
  if (index === -1) {
    throw new Error('Motivo não encontrado');
  }
  
  const motivo = data.motivos[index];
  
  // Verificar duplicata se o nome mudou
  if (dados.nome) {
    const existe = data.motivos.some(
      m => m.id !== id && 
           m.tipoId === (dados.tipoId || motivo.tipoId) &&
           m.nome.toLowerCase() === dados.nome!.toLowerCase() && 
           m.ativo
    );
    if (existe) {
      throw new Error('Já existe um motivo com este nome para este tipo');
    }
  }
  
  data.motivos[index] = { ...motivo, ...dados };
  saveParametrosData(data);
  
  return data.motivos[index];
};

export const deleteMotivoOcorrencia = (id: string): void => {
  const data = getParametrosData();
  const motivo = data.motivos.find(m => m.id === id);
  
  if (!motivo) {
    throw new Error('Motivo não encontrado');
  }
  
  // Soft delete
  motivo.ativo = false;
  saveParametrosData(data);
};

// ============= UTILIDADES =============

export const resetarParametros = (): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dadosIniciais));
};

export const exportarParametros = (): string => {
  const data = getParametrosData();
  return JSON.stringify(data, null, 2);
};

export const importarParametros = (jsonString: string): void => {
  try {
    const data = JSON.parse(jsonString) as ParametrosData;
    
    // Validação básica
    if (!data.tipos || !data.motivos || !Array.isArray(data.tipos) || !Array.isArray(data.motivos)) {
      throw new Error('Formato de dados inválido');
    }
    
    saveParametrosData(data);
  } catch (error) {
    throw new Error('Não foi possível importar os dados. Verifique o formato do arquivo.');
  }
};
