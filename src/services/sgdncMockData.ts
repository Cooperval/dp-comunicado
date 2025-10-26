// Mock data service for SGDNC (Sistema de Gestão de Documentos e Não Conformidades)

export interface Anexo {
  id: string;
  nome: string;
  tipo: string;
  tamanho: number;
  url: string;
  uploadPor: string;
  uploadEm: string;
}

export interface Versao {
  numero: number;
  comentario: string;
  arquivo: string;
  criadoPor: string;
  criadoEm: string;
}

export interface Documento {
  id: string;
  titulo: string;
  descricao: string;
  pastaId: string;
  tags: string[];
  versaoAtual: number;
  versoes: Versao[];
  tipo: 'procedimento' | 'registro-mapa' | 'exportacao' | 'outro';
  nivelConformidade: 'critico' | 'alto' | 'medio' | 'baixo';
  dataValidade?: string;
  edicaoColaborativa: boolean;
  permissoes: {
    usuarios: string[];
    departamentos: string[];
  };
  anexos: Anexo[];
  criadoPor: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Pasta {
  id: string;
  nome: string;
  pastaParentId?: string;
  cor?: string;
  icone?: string;
}

export interface LogAlteracao {
  id: string;
  tipo: 'criacao' | 'edicao' | 'status' | 'comentario' | 'evidencia';
  descricao: string;
  usuario: string;
  data: string;
}

export interface AcaoCorretiva {
  id: string;
  descricao: string;
  responsavel: string;
  status: 'planejada' | 'em-andamento' | 'concluida';
  dataPrevista: string;
  dataRealizada?: string;
}

export interface NaoConformidade {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  tipo: 'produto' | 'processo' | 'documental' | 'hse';
  dataOcorrencia: string;
  local: string;
  severidade: 'critica' | 'alta' | 'media' | 'baixa';
  impactos: ('qualidade' | 'producao' | 'seguranca' | 'regulatorio')[];
  causaRaiz?: string;
  produtoLote?: string;
  responsavel: string;
  departamento: string;
  prazo: string;
  status: 'aberta' | 'em-analise' | 'resolvida' | 'fechada';
  evidencias: Anexo[];
  acoesCorretivas: AcaoCorretiva[];
  historico: LogAlteracao[];
  notificar: string[];
  criadoPor: string;
  criadoEm: string;
  resolvidoEm?: string;
}

export interface Confirmacao {
  usuarioId: string;
  data: string;
  assinatura?: string;
  tempoLeitura?: number;
}

export interface Treinamento {
  id: string;
  titulo: string;
  tipo: 'leitura-documento' | 'pratico' | 'video' | 'presencial';
  documentoId?: string;
  conteudo?: string;
  data: string;
  tempoMinimo?: number;
  participantes: string[];
  confirmacoes: Confirmacao[];
  status: 'agendado' | 'em-andamento' | 'concluido';
  criadoPor: string;
  criadoEm: string;
}

const STORAGE_KEYS = {
  DOCUMENTOS: 'sgdnc_documentos',
  PASTAS: 'sgdnc_pastas',
  NCS: 'sgdnc_ncs',
  TREINAMENTOS: 'sgdnc_treinamentos',
};

// Mock data inicial
const mockPastas: Pasta[] = [
  { id: '1', nome: 'Procedimentos Operacionais', cor: 'hsl(210 90% 45%)' },
  { id: '2', nome: 'Registros MAPA', cor: 'hsl(142 76% 36%)' },
  { id: '3', nome: 'Exportação China', cor: 'hsl(25 95% 53%)' },
  { id: '4', nome: 'ISO 9001', cor: 'hsl(260 70% 50%)' },
];

const mockDocumentos: Documento[] = [
  {
    id: '1',
    titulo: 'Procedimento de Higienização',
    descricao: 'Procedimento padrão para higienização de equipamentos',
    pastaId: '1',
    tags: ['higiene', 'procedimento', 'crítico'],
    versaoAtual: 3,
    versoes: [
      {
        numero: 3,
        comentario: 'Atualização conforme auditoria MAPA',
        arquivo: '/docs/higienizacao-v3.pdf',
        criadoPor: 'João Silva',
        criadoEm: '2024-10-15T14:30:00Z',
      },
      {
        numero: 2,
        comentario: 'Correção de erro de digitação',
        arquivo: '/docs/higienizacao-v2.pdf',
        criadoPor: 'Maria Santos',
        criadoEm: '2024-10-10T09:15:00Z',
      },
    ],
    tipo: 'procedimento',
    nivelConformidade: 'critico',
    dataValidade: '2025-10-15',
    edicaoColaborativa: true,
    permissoes: {
      usuarios: [],
      departamentos: ['Qualidade', 'Produção'],
    },
    anexos: [],
    criadoPor: 'João Silva',
    criadoEm: '2024-01-10T10:00:00Z',
    atualizadoEm: '2024-10-15T14:30:00Z',
  },
];

const mockNCs: NaoConformidade[] = [
  {
    id: '1',
    codigo: 'NC-2024-001',
    titulo: 'Desvio de temperatura em câmara fria',
    descricao: 'Temperatura da câmara fria excedeu limite de 4°C por 2 horas',
    tipo: 'processo',
    dataOcorrencia: '2024-10-20T08:00:00Z',
    local: 'Câmara Fria 01',
    severidade: 'critica',
    impactos: ['qualidade', 'regulatorio'],
    causaRaiz: 'Falha no sensor de temperatura',
    produtoLote: 'Lote 2024-10-A',
    responsavel: 'Carlos Oliveira',
    departamento: 'Manutenção',
    prazo: '2024-10-25T17:00:00Z',
    status: 'aberta',
    evidencias: [],
    acoesCorretivas: [
      {
        id: '1',
        descricao: 'Substituir sensor de temperatura',
        responsavel: 'Carlos Oliveira',
        status: 'em-andamento',
        dataPrevista: '2024-10-22T17:00:00Z',
      },
    ],
    historico: [
      {
        id: '1',
        tipo: 'criacao',
        descricao: 'NC registrada',
        usuario: 'Maria Santos',
        data: '2024-10-20T09:00:00Z',
      },
    ],
    notificar: ['qualidade@empresa.com'],
    criadoPor: 'Maria Santos',
    criadoEm: '2024-10-20T09:00:00Z',
  },
];

const mockTreinamentos: Treinamento[] = [
  {
    id: '1',
    titulo: 'Leitura de Procedimento de Higienização',
    tipo: 'leitura-documento',
    documentoId: '1',
    data: '2024-10-25T09:00:00Z',
    tempoMinimo: 10,
    participantes: ['user1', 'user2', 'user3'],
    confirmacoes: [],
    status: 'agendado',
    criadoPor: 'João Silva',
    criadoEm: '2024-10-18T10:00:00Z',
  },
];

// Helper functions
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getFromStorage = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const saveToStorage = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Documentos
export const getDocumentos = async (filtros?: {
  busca?: string;
  pastaId?: string;
  tags?: string[];
}): Promise<Documento[]> => {
  await delay(300);
  let documentos = getFromStorage(STORAGE_KEYS.DOCUMENTOS, mockDocumentos);

  if (filtros?.busca) {
    const busca = filtros.busca.toLowerCase();
    documentos = documentos.filter(
      (doc) =>
        doc.titulo.toLowerCase().includes(busca) ||
        doc.descricao.toLowerCase().includes(busca) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(busca))
    );
  }

  if (filtros?.pastaId) {
    documentos = documentos.filter((doc) => doc.pastaId === filtros.pastaId);
  }

  if (filtros?.tags && filtros.tags.length > 0) {
    documentos = documentos.filter((doc) =>
      filtros.tags!.some((tag) => doc.tags.includes(tag))
    );
  }

  return documentos;
};

export const getDocumentoById = async (id: string): Promise<Documento | null> => {
  await delay(200);
  const documentos = getFromStorage(STORAGE_KEYS.DOCUMENTOS, mockDocumentos);
  return documentos.find((doc) => doc.id === id) || null;
};

export const createDocumento = async (data: Omit<Documento, 'id' | 'criadoEm' | 'atualizadoEm'>): Promise<Documento> => {
  await delay(500);
  const documentos = getFromStorage(STORAGE_KEYS.DOCUMENTOS, mockDocumentos);
  const novoDocumento: Documento = {
    ...data,
    id: Date.now().toString(),
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  };
  documentos.push(novoDocumento);
  saveToStorage(STORAGE_KEYS.DOCUMENTOS, documentos);
  return novoDocumento;
};

export const updateDocumento = async (id: string, data: Partial<Documento>): Promise<Documento> => {
  await delay(500);
  const documentos = getFromStorage(STORAGE_KEYS.DOCUMENTOS, mockDocumentos);
  const index = documentos.findIndex((doc) => doc.id === id);
  if (index === -1) throw new Error('Documento não encontrado');

  documentos[index] = {
    ...documentos[index],
    ...data,
    atualizadoEm: new Date().toISOString(),
  };
  saveToStorage(STORAGE_KEYS.DOCUMENTOS, documentos);
  return documentos[index];
};

export const deleteDocumento = async (id: string): Promise<void> => {
  await delay(300);
  const documentos = getFromStorage(STORAGE_KEYS.DOCUMENTOS, mockDocumentos);
  const filtered = documentos.filter((doc) => doc.id !== id);
  saveToStorage(STORAGE_KEYS.DOCUMENTOS, filtered);
};

// Pastas
export const getPastas = async (): Promise<Pasta[]> => {
  await delay(200);
  return getFromStorage(STORAGE_KEYS.PASTAS, mockPastas);
};

export const createPasta = async (data: Omit<Pasta, 'id'>): Promise<Pasta> => {
  await delay(300);
  const pastas = getFromStorage(STORAGE_KEYS.PASTAS, mockPastas);
  const novaPasta: Pasta = {
    ...data,
    id: Date.now().toString(),
  };
  pastas.push(novaPasta);
  saveToStorage(STORAGE_KEYS.PASTAS, pastas);
  return novaPasta;
};

// Não Conformidades
export const getNaoConformidades = async (filtros?: {
  status?: string;
  severidade?: string;
  departamento?: string;
}): Promise<NaoConformidade[]> => {
  await delay(300);
  let ncs = getFromStorage(STORAGE_KEYS.NCS, mockNCs);

  if (filtros?.status) {
    ncs = ncs.filter((nc) => nc.status === filtros.status);
  }

  if (filtros?.severidade) {
    ncs = ncs.filter((nc) => nc.severidade === filtros.severidade);
  }

  if (filtros?.departamento) {
    ncs = ncs.filter((nc) => nc.departamento === filtros.departamento);
  }

  return ncs;
};

export const getNaoConformidadeById = async (id: string): Promise<NaoConformidade | null> => {
  await delay(200);
  const ncs = getFromStorage(STORAGE_KEYS.NCS, mockNCs);
  return ncs.find((nc) => nc.id === id) || null;
};

export const createNaoConformidade = async (
  data: Omit<NaoConformidade, 'id' | 'codigo' | 'criadoEm'>
): Promise<NaoConformidade> => {
  await delay(500);
  const ncs = getFromStorage(STORAGE_KEYS.NCS, mockNCs);
  const ano = new Date().getFullYear();
  const numero = String(ncs.length + 1).padStart(3, '0');
  const novaNC: NaoConformidade = {
    ...data,
    id: Date.now().toString(),
    codigo: `NC-${ano}-${numero}`,
    criadoEm: new Date().toISOString(),
  };
  ncs.push(novaNC);
  saveToStorage(STORAGE_KEYS.NCS, ncs);
  return novaNC;
};

export const updateNaoConformidade = async (id: string, data: Partial<NaoConformidade>): Promise<NaoConformidade> => {
  await delay(500);
  const ncs = getFromStorage(STORAGE_KEYS.NCS, mockNCs);
  const index = ncs.findIndex((nc) => nc.id === id);
  if (index === -1) throw new Error('NC não encontrada');

  ncs[index] = { ...ncs[index], ...data };
  saveToStorage(STORAGE_KEYS.NCS, ncs);
  return ncs[index];
};

export const addAcaoCorretiva = async (ncId: string, acao: Omit<AcaoCorretiva, 'id'>): Promise<NaoConformidade> => {
  await delay(300);
  const ncs = getFromStorage(STORAGE_KEYS.NCS, mockNCs);
  const nc = ncs.find((n) => n.id === ncId);
  if (!nc) throw new Error('NC não encontrada');

  const novaAcao: AcaoCorretiva = {
    ...acao,
    id: Date.now().toString(),
  };

  nc.acoesCorretivas.push(novaAcao);
  nc.historico.push({
    id: Date.now().toString(),
    tipo: 'edicao',
    descricao: 'Ação corretiva adicionada',
    usuario: 'Usuário Atual',
    data: new Date().toISOString(),
  });

  saveToStorage(STORAGE_KEYS.NCS, ncs);
  return nc;
};

// Treinamentos
export const getTreinamentos = async (filtros?: { status?: string }): Promise<Treinamento[]> => {
  await delay(300);
  let treinamentos = getFromStorage(STORAGE_KEYS.TREINAMENTOS, mockTreinamentos);

  if (filtros?.status) {
    treinamentos = treinamentos.filter((t) => t.status === filtros.status);
  }

  return treinamentos;
};

export const getTreinamentoById = async (id: string): Promise<Treinamento | null> => {
  await delay(200);
  const treinamentos = getFromStorage(STORAGE_KEYS.TREINAMENTOS, mockTreinamentos);
  return treinamentos.find((t) => t.id === id) || null;
};

export const createTreinamento = async (data: Omit<Treinamento, 'id' | 'criadoEm'>): Promise<Treinamento> => {
  await delay(500);
  const treinamentos = getFromStorage(STORAGE_KEYS.TREINAMENTOS, mockTreinamentos);
  const novoTreinamento: Treinamento = {
    ...data,
    id: Date.now().toString(),
    criadoEm: new Date().toISOString(),
  };
  treinamentos.push(novoTreinamento);
  saveToStorage(STORAGE_KEYS.TREINAMENTOS, treinamentos);
  return novoTreinamento;
};

export const confirmarLeitura = async (
  treinamentoId: string,
  confirmacao: Confirmacao
): Promise<Treinamento> => {
  await delay(300);
  const treinamentos = getFromStorage(STORAGE_KEYS.TREINAMENTOS, mockTreinamentos);
  const treinamento = treinamentos.find((t) => t.id === treinamentoId);
  if (!treinamento) throw new Error('Treinamento não encontrado');

  treinamento.confirmacoes.push(confirmacao);
  
  // Atualizar status se todos confirmaram
  if (treinamento.confirmacoes.length === treinamento.participantes.length) {
    treinamento.status = 'concluido';
  }

  saveToStorage(STORAGE_KEYS.TREINAMENTOS, treinamentos);
  return treinamento;
};

// KPIs e Relatórios
export const getKPIs = async () => {
  await delay(300);
  const documentos = getFromStorage(STORAGE_KEYS.DOCUMENTOS, mockDocumentos);
  const ncs = getFromStorage(STORAGE_KEYS.NCS, mockNCs);
  const treinamentos = getFromStorage(STORAGE_KEYS.TREINAMENTOS, mockTreinamentos);

  const ncsAbertas = ncs.filter((nc) => nc.status === 'aberta' || nc.status === 'em-analise');
  const treinamentosPendentes = treinamentos.filter((t) => t.status !== 'concluido');

  return {
    totalDocumentos: documentos.length,
    ncsAbertas: ncsAbertas.length,
    treinamentosPendentes: treinamentosPendentes.length,
    taxaRetrabalho: 12.5, // Mock
  };
};

export const getDadosGrafico = async (tipo: string) => {
  await delay(300);
  
  if (tipo === 'ncs-mes') {
    return [
      { mes: 'Mai', abertas: 5, resolvidas: 3 },
      { mes: 'Jun', abertas: 8, resolvidas: 6 },
      { mes: 'Jul', abertas: 6, resolvidas: 7 },
      { mes: 'Ago', abertas: 10, resolvidas: 8 },
      { mes: 'Set', abertas: 7, resolvidas: 9 },
      { mes: 'Out', abertas: 4, resolvidas: 5 },
    ];
  }

  if (tipo === 'documentos-categoria') {
    return [
      { categoria: 'Procedimentos', total: 45 },
      { categoria: 'MAPA', total: 32 },
      { categoria: 'Exportação', total: 28 },
      { categoria: 'ISO', total: 15 },
    ];
  }

  return [];
};
