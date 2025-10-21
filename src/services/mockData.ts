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

  // Modelos de Avaliação
  getModelosAvaliacao: async () => {
    await delay(400);
    return [
      {
        id: '1',
        titulo: 'Avaliação de Desempenho Trimestral',
        descricao: 'Modelo padrão para avaliação trimestral de aprendizes',
        ativo: true,
        perguntas: [
          {
            id: 'p1',
            tipo: 'multipla_escolha',
            titulo: 'Pontualidade',
            descricao: 'Como você avalia a pontualidade do aprendiz?',
            obrigatoria: true,
            opcoes: [
              { texto: 'Insatisfatório', valor: 1 },
              { texto: 'Regular', valor: 2 },
              { texto: 'Bom', valor: 3 },
              { texto: 'Muito Bom', valor: 4 },
              { texto: 'Excelente', valor: 5 },
            ],
          },
          {
            id: 'p2',
            tipo: 'multipla_escolha',
            titulo: 'Proatividade',
            descricao: 'Avalie o nível de iniciativa e busca por soluções',
            obrigatoria: true,
            opcoes: [
              { texto: 'Insatisfatório', valor: 1 },
              { texto: 'Regular', valor: 2 },
              { texto: 'Bom', valor: 3 },
              { texto: 'Muito Bom', valor: 4 },
              { texto: 'Excelente', valor: 5 },
            ],
          },
          {
            id: 'p3',
            tipo: 'descritiva',
            titulo: 'Pontos Fortes',
            descricao: 'Descreva os principais pontos fortes observados',
            obrigatoria: true,
          },
          {
            id: 'p4',
            tipo: 'descritiva',
            titulo: 'Áreas de Melhoria',
            descricao: 'Identifique áreas onde o aprendiz pode melhorar',
            obrigatoria: false,
          },
        ],
      },
      {
        id: '2',
        titulo: 'Avaliação de Integração (30 dias)',
        descricao: 'Modelo para avaliar primeiros 30 dias do aprendiz',
        ativo: true,
        perguntas: [
          {
            id: 'p1',
            tipo: 'multipla_escolha',
            titulo: 'Adaptação à Equipe',
            descricao: 'Como foi a integração com a equipe?',
            obrigatoria: true,
            opcoes: [
              { texto: 'Insatisfatório', valor: 1 },
              { texto: 'Regular', valor: 2 },
              { texto: 'Bom', valor: 3 },
              { texto: 'Muito Bom', valor: 4 },
              { texto: 'Excelente', valor: 5 },
            ],
          },
          {
            id: 'p2',
            tipo: 'descritiva',
            titulo: 'Observações Gerais',
            descricao: 'Comentários sobre o período de integração',
            obrigatoria: true,
          },
        ],
      },
    ];
  },

  getModeloAvaliacaoById: async (id: string) => {
    await delay(300);
    const modelos = await mockAPI.getModelosAvaliacao();
    return modelos.find((m) => m.id === id);
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
    await delay(500);
    return { success: true };
  },

  duplicateModeloAvaliacao: async (id: string) => {
    await delay(500);
    return { success: true, id: Date.now().toString() };
  },

  atribuirAvaliacao: async (data: any) => {
    await delay(600);
    return { success: true, id: Date.now().toString() };
  },

  getAvaliacaoParaResponder: async (id: string) => {
    await delay(300);
    const modelos = await mockAPI.getModelosAvaliacao();
    return {
      id,
      aprendiz: 'João Oliveira',
      gestor: 'Carlos Silva',
      prazo: '15/02/2025',
      observacoes: 'Primeira avaliação do aprendiz',
      modelo: modelos[0],
    };
  },

  submitAvaliacaoResposta: async (id: string, data: any) => {
    await delay(600);
    return { success: true };
  },

  // User Management
  getUsuarios: async () => {
    await delay(400);
    const storedUsers = localStorage.getItem('mock_users');
    if (storedUsers) {
      return JSON.parse(storedUsers);
    }
    
    const defaultUsers = [
      {
        id: '0',
        matricula: '0001',
        name: 'Admin Sistema',
        email: 'admin@empresa.com',
        role: 'admin',
        department: 'Tecnologia da Informação',
        allowedApps: ['controle-ponto', 'avaliacao', 'admin'],
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '1',
        matricula: '1001',
        name: 'João Silva',
        email: 'gestor@empresa.com',
        role: 'gestor',
        department: 'Vendas',
        allowedApps: ['controle-ponto', 'avaliacao'],
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        matricula: '2001',
        name: 'Maria Santos',
        email: 'rh@empresa.com',
        role: 'rh',
        department: 'Recursos Humanos',
        allowedApps: ['controle-ponto', 'avaliacao'],
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        matricula: '3001',
        name: 'Carlos Oliveira',
        email: 'dp@empresa.com',
        role: 'dp',
        department: 'Departamento Pessoal',
        allowedApps: ['controle-ponto'],
        active: true,
        createdAt: new Date().toISOString(),
      },
    ];
    
    localStorage.setItem('mock_users', JSON.stringify(defaultUsers));
    return defaultUsers;
  },

  getUsuarioById: async (id: string) => {
    await delay(300);
    const users = await mockAPI.getUsuarios();
    return users.find((u: any) => u.id === id);
  },

  createUsuario: async (data: any) => {
    await delay(600);
    const users = await mockAPI.getUsuarios();
    const newUser = {
      ...data,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      active: true,
    };
    users.push(newUser);
    localStorage.setItem('mock_users', JSON.stringify(users));
    return { success: true, user: newUser };
  },

  updateUsuario: async (id: string, data: any) => {
    await delay(600);
    const users = await mockAPI.getUsuarios();
    const index = users.findIndex((u: any) => u.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...data };
      localStorage.setItem('mock_users', JSON.stringify(users));
      return { success: true, user: users[index] };
    }
    return { success: false, error: 'Usuário não encontrado' };
  },

  deleteUsuario: async (id: string) => {
    await delay(500);
    const users = await mockAPI.getUsuarios();
    const filtered = users.filter((u: any) => u.id !== id);
    localStorage.setItem('mock_users', JSON.stringify(filtered));
    return { success: true };
  },
};
