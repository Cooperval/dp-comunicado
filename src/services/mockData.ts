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
};
