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

  // Avaliações
  getAvaliacoesStats: async (userId: string | undefined, isRH: boolean) => {
    await delay(300);
    if (isRH) {
      return { total: 15, pendentes: 8, concluidas: 5, atrasadas: 2 };
    }
    return { total: 3, pendentes: 2, concluidas: 1, atrasadas: 0 };
  },

  getAvaliacoes: async (userId: string | undefined, isRH: boolean) => {
    await delay(400);
    const avaliacoes = [
      {
        id: '1',
        aprendiz: 'João Oliveira',
        gestor: 'Carlos Silva',
        prazo: '15/02/2025',
        status: 'pendente' as const,
        dataCriacao: '01/02/2025',
      },
      {
        id: '2',
        aprendiz: 'Maria Souza',
        gestor: 'Carlos Silva',
        prazo: '10/02/2025',
        status: 'concluida' as const,
        dataCriacao: '25/01/2025',
        dataConclusao: '08/02/2025',
      },
      {
        id: '3',
        aprendiz: 'Lucas Ferreira',
        gestor: 'Ana Costa',
        prazo: '20/02/2025',
        status: 'pendente' as const,
        dataCriacao: '05/02/2025',
      },
    ];
    return isRH ? avaliacoes : avaliacoes.filter(a => a.gestor === 'Carlos Silva');
  },

  createAvaliacao: async (data: any) => {
    await delay(600);
    return { success: true, id: Date.now().toString() };
  },

  getAvaliacaoById: async (id: string) => {
    await delay(300);
    return {
      id,
      aprendiz: 'João Oliveira',
      gestor: 'Carlos Silva',
      prazo: '15/02/2025',
      dataCriacao: '01/02/2025',
      observacoes: 'Primeira avaliação do aprendiz',
    };
  },

  submitAvaliacao: async (id: string, data: any) => {
    await delay(600);
    return { success: true };
  },

  getAvaliacaoDetalhes: async (id: string) => {
    await delay(300);
    return {
      id,
      aprendiz: 'João Oliveira',
      gestor: 'Carlos Silva',
      dataConclusao: '08/02/2025',
      notas: {
        'Pontualidade': 5,
        'Assiduidade': 5,
        'Proatividade': 4,
        'Trabalho em Equipe': 5,
        'Aprendizado': 4,
      },
      observacoes: 'Excelente desempenho. Demonstra muita dedicação e vontade de aprender.',
    };
  },
};
