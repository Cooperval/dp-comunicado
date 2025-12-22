// Mock data service - simulates API calls with delays
// When integrating with real backend, replace these functions with actual API calls

const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAPI = {
  // Simulate network delay
  delay,

  // Dashboard metrics
  getDashboardMetrics: async () => {
    await delay(300);
    return {
      today: 12,
      pending: 5,
      approved: 8,
      activeCollaborators: 143,
    };
  },

  // Get all occurrences
  getOcorrencias: async () => {
    await delay(400);
    return [
      {
        id: '1',
        colaborador: 'João Silva',
        matricula: '001234',
        tipo: 'Atraso',
        data: '2024-01-15',
        hora: '08:45',
        status: 'pendente',
        motivo: 'Trânsito intenso',
        prazo: '2024-01-20',
      },
      {
        id: '2',
        colaborador: 'Maria Santos',
        matricula: '001235',
        tipo: 'Falta Justificada',
        data: '2024-01-14',
        hora: '-',
        status: 'aprovada',
        motivo: 'Atestado médico',
        prazo: '2024-01-19',
      },
    ];
  },

  // Create new occurrence
  createOcorrencia: async (data: any) => {
    await delay(600);
    return {
      success: true,
      id: Date.now().toString(),
      message: 'Ocorrência registrada com sucesso',
    };
  },

  // Get collaborators
  getColaboradores: async () => {
    await delay(400);
    return [
      {
        id: '1',
        nome: 'João Silva',
        matricula: '001234',
        setor: 'Vendas',
        cargo: 'Vendedor',
        status: 'ativo',
      },
      {
        id: '2',
        nome: 'Maria Santos',
        matricula: '001235',
        setor: 'Administrativo',
        cargo: 'Assistente',
        status: 'ativo',
      },
    ];
  },

  // ===== User Management =====
  getUsuarios: async () => {
    await delay(400);
    return [
      { id: '1', matricula: '001', name: 'Admin', email: 'admin@example.com', role: 'admin' as const, department: 'TI', allowedApps: ['*'], active: true, createdAt: '2024-01-01' },
      { id: '2', matricula: '002', name: 'User', email: 'user@example.com', role: 'gestor' as const, department: 'RH', allowedApps: ['avaliacao'], active: true, createdAt: '2024-01-01' },
    ];
  },

  createUsuario: async (data: any) => {
    await delay(600);
    return { success: true, id: Date.now().toString() };
  },

  updateUsuario: async (id: string, data: any) => {
    await delay(600);
    return { success: true };
  },

  deleteUsuario: async (id: string) => {
    await delay(600);
    return { success: true };
  },

  // ===== Avaliação =====
  getAvaliacoesStats: async () => {
    await delay(300);
    return { total: 10, pendentes: 3, concluidas: 7 };
  },

  getAvaliacoes: async () => {
    await delay(400);
    return [];
  },

  getModelosAvaliacao: async () => {
    await delay(400);
    return [];
  },

  getModeloAvaliacaoById: async (id: string) => {
    await delay(400);
    return null;
  },

  createModeloAvaliacao: async (data: any) => {
    await delay(600);
    return { success: true, id: Date.now().toString() };
  },

  updateModeloAvaliacao: async (id: string, data: any) => {
    await delay(600);
    return { success: true };
  },

  deleteModeloAvaliacao: async (id: string) => {
    await delay(600);
    return { success: true };
  },

  duplicateModeloAvaliacao: async (id: string) => {
    await delay(600);
    return { success: true, id: Date.now().toString() };
  },

  atribuirAvaliacao: async (data: any) => {
    await delay(600);
    return { success: true };
  },

  getAvaliacaoParaResponder: async (id: string) => {
    await delay(400);
    return null;
  },

  getAvaliacaoDetalhes: async (id: string) => {
    await delay(400);
    return null;
  },

  submitAvaliacaoResposta: async (id: string, data: any) => {
    await delay(600);
    return { success: true };
  },
};