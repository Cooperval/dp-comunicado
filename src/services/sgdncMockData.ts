// Mock data service for SGDNC (Sistema de Gestão de Documentos e Não Conformidades)
import type { Paragrafo } from '@/types/paragrafo';

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

export interface HistoricoAprovacao {
  id: string;
  usuario: string;
  cargo: string;
  acao: 'submetido' | 'aprovado' | 'rejeitado' | 'revisao-solicitada';
  comentario?: string;
  data: string;
}

export interface Aprovador {
  id: string;
  nome: string;
  cargo: 'analista' | 'quimico' | 'supervisor' | 'gerente';
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
  paragrafos?: Paragrafo[];
  statusAprovacao: 'rascunho' | 'pendente' | 'aprovado' | 'rejeitado';
  aprovadores: Aprovador[];
  responsavelAprovacao?: string;
  historico: HistoricoAprovacao[];
  motivoRejeicao?: string;
  dataSubmissao?: string;
  dataAprovacao?: string;
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

// Mock de aprovadores
export const mockAprovadores: Aprovador[] = [
  { id: 'quimico1', nome: 'Dr. João Silva', cargo: 'quimico' },
  { id: 'quimico2', nome: 'Dra. Ana Paula', cargo: 'quimico' },
  { id: 'supervisor1', nome: 'Maria Santos', cargo: 'supervisor' },
  { id: 'supervisor2', nome: 'Carlos Oliveira', cargo: 'supervisor' },
  { id: 'gerente1', nome: 'Roberto Lima', cargo: 'gerente' },
];

const STORAGE_KEYS = {
  DOCUMENTOS: 'sgdnc_documentos',
  PASTAS: 'sgdnc_pastas',
  NCS: 'sgdnc_ncs',
  TREINAMENTOS: 'sgdnc_treinamentos',
};

// Mock data inicial - Estrutura Hierárquica Completa
const mockPastas: Pasta[] = [
  // ===== Pastas Raiz =====
  { id: '1', nome: 'Procedimentos Operacionais', cor: 'hsl(210 90% 50%)' },
  { id: '2', nome: 'Registros MAPA', cor: 'hsl(142 76% 40%)' },
  { id: '3', nome: 'Exportação China', cor: 'hsl(25 95% 55%)' },
  { id: '4', nome: 'ISO 9001', cor: 'hsl(260 70% 55%)' },
  
  // ===== Subpastas de "Procedimentos Operacionais" =====
  { id: '1-1', nome: 'Higienização', pastaParentId: '1', cor: 'hsl(210 75% 60%)' },
  { id: '1-2', nome: 'Manutenção', pastaParentId: '1', cor: 'hsl(210 75% 65%)' },
  { id: '1-3', nome: 'Segurança', pastaParentId: '1', cor: 'hsl(210 75% 70%)' },
  
  // ===== Sub-subpastas de "Higienização" =====
  { id: '1-1-1', nome: 'Equipamentos', pastaParentId: '1-1', cor: 'hsl(210 60% 70%)' },
  { id: '1-1-2', nome: 'Ambientes', pastaParentId: '1-1', cor: 'hsl(210 60% 75%)' },
  { id: '1-1-3', nome: 'Veículos', pastaParentId: '1-1', cor: 'hsl(210 60% 80%)' },
  
  // ===== Sub-subpastas de "Manutenção" =====
  { id: '1-2-1', nome: 'Preventiva', pastaParentId: '1-2', cor: 'hsl(210 60% 70%)' },
  { id: '1-2-2', nome: 'Corretiva', pastaParentId: '1-2', cor: 'hsl(210 60% 75%)' },
  
  // ===== Subpastas de "Registros MAPA" =====
  { id: '2-1', nome: 'Inspeções', pastaParentId: '2', cor: 'hsl(142 65% 50%)' },
  { id: '2-2', nome: 'Auditorias', pastaParentId: '2', cor: 'hsl(142 65% 55%)' },
  { id: '2-3', nome: 'Certificações', pastaParentId: '2', cor: 'hsl(142 65% 60%)' },
  
  // ===== Sub-subpastas de "Inspeções" =====
  { id: '2-1-1', nome: '2024', pastaParentId: '2-1', cor: 'hsl(142 55% 60%)' },
  { id: '2-1-2', nome: '2023', pastaParentId: '2-1', cor: 'hsl(142 55% 65%)' },
  { id: '2-1-3', nome: 'Arquivo', pastaParentId: '2-1', cor: 'hsl(142 55% 70%)' },
  
  // ===== Sub-subpastas de "Auditorias" =====
  { id: '2-2-1', nome: 'Internas', pastaParentId: '2-2', cor: 'hsl(142 55% 60%)' },
  { id: '2-2-2', nome: 'Externas', pastaParentId: '2-2', cor: 'hsl(142 55% 65%)' },
  
  // ===== Subpastas de "Exportação China" =====
  { id: '3-1', nome: 'Certificados', pastaParentId: '3', cor: 'hsl(25 85% 65%)' },
  { id: '3-2', nome: 'Análises', pastaParentId: '3', cor: 'hsl(25 85% 70%)' },
  { id: '3-3', nome: 'Embarques', pastaParentId: '3', cor: 'hsl(25 85% 75%)' },
  
  // ===== Sub-subpastas de "Certificados" =====
  { id: '3-1-1', nome: 'Sanitários', pastaParentId: '3-1', cor: 'hsl(25 70% 70%)' },
  { id: '3-1-2', nome: 'Qualidade', pastaParentId: '3-1', cor: 'hsl(25 70% 75%)' },
  
  // ===== Sub-subpastas de "Análises" =====
  { id: '3-2-1', nome: 'Microbiológicas', pastaParentId: '3-2', cor: 'hsl(25 70% 70%)' },
  { id: '3-2-2', nome: 'Físico-Químicas', pastaParentId: '3-2', cor: 'hsl(25 70% 75%)' },
  
  // ===== Subpastas de "ISO 9001" =====
  { id: '4-1', nome: 'Processos', pastaParentId: '4', cor: 'hsl(260 60% 65%)' },
  { id: '4-2', nome: 'Indicadores', pastaParentId: '4', cor: 'hsl(260 60% 70%)' },
  { id: '4-3', nome: 'Reuniões', pastaParentId: '4', cor: 'hsl(260 60% 75%)' },
  
  // ===== Sub-subpastas de "Processos" =====
  { id: '4-1-1', nome: 'Produção', pastaParentId: '4-1', cor: 'hsl(260 50% 70%)' },
  { id: '4-1-2', nome: 'Qualidade', pastaParentId: '4-1', cor: 'hsl(260 50% 75%)' },
  { id: '4-1-3', nome: 'Logística', pastaParentId: '4-1', cor: 'hsl(260 50% 80%)' },
];

const mockDocumentos: Documento[] = [
  // ===== Documentos em Pastas Raiz =====
  {
    id: '1',
    titulo: 'Manual Geral de Procedimentos',
    descricao: 'Manual completo de procedimentos operacionais da planta',
    pastaId: '1',
    tags: ['manual', 'procedimento', 'geral'],
    versaoAtual: 5,
    versoes: [
      {
        numero: 5,
        comentario: 'Revisão anual completa',
        arquivo: '/docs/manual-geral-v5.pdf',
        criadoPor: 'João Silva',
        criadoEm: '2024-10-15T14:30:00Z',
      },
    ],
    tipo: 'procedimento',
    nivelConformidade: 'critico',
    dataValidade: '2025-10-15',
    edicaoColaborativa: true,
    permissoes: {
      usuarios: [],
      departamentos: ['Qualidade', 'Produção', 'Manutenção'],
    },
    anexos: [],
    statusAprovacao: 'aprovado',
    aprovadores: mockAprovadores,
    responsavelAprovacao: 'gerente1',
    historico: [
      {
        id: '1-1',
        usuario: 'João Silva',
        cargo: 'analista',
        acao: 'submetido',
        comentario: 'Documento pronto para revisão anual',
        data: '2024-10-10T10:00:00Z',
      },
      {
        id: '1-2',
        usuario: 'Roberto Lima',
        cargo: 'gerente',
        acao: 'aprovado',
        comentario: 'Aprovado conforme revisão',
        data: '2024-10-15T14:30:00Z',
      },
    ],
    dataSubmissao: '2024-10-10T10:00:00Z',
    dataAprovacao: '2024-10-15T14:30:00Z',
    criadoPor: 'João Silva',
    criadoEm: '2024-01-10T10:00:00Z',
    atualizadoEm: '2024-10-15T14:30:00Z',
  },
  
  // ===== Documentos em Subpastas - Higienização =====
  {
    id: '2',
    titulo: 'Procedimento de Higienização Geral',
    descricao: 'Procedimento padrão geral para higienização',
    pastaId: '1-1',
    tags: ['higiene', 'procedimento', 'crítico'],
    versaoAtual: 3,
    versoes: [
      {
        numero: 3,
        comentario: 'Atualização conforme auditoria MAPA',
        arquivo: '/docs/higienizacao-geral-v3.pdf',
        criadoPor: 'Maria Santos',
        criadoEm: '2024-10-15T14:30:00Z',
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
    statusAprovacao: 'pendente',
    aprovadores: mockAprovadores,
    responsavelAprovacao: 'quimico1',
    historico: [
      {
        id: '2-1',
        usuario: 'Maria Santos',
        cargo: 'analista',
        acao: 'submetido',
        comentario: 'Aguardando aprovação do químico responsável',
        data: '2024-10-28T09:00:00Z',
      },
    ],
    dataSubmissao: '2024-10-28T09:00:00Z',
    criadoPor: 'Maria Santos',
    criadoEm: '2024-02-15T10:00:00Z',
    atualizadoEm: '2024-10-15T14:30:00Z',
  },
  
  // ===== Documentos em Sub-subpastas - Equipamentos =====
  {
    id: '3',
    titulo: 'Higienização de Empilhadeiras',
    descricao: 'Procedimento específico para higienização de empilhadeiras',
    pastaId: '1-1-1',
    tags: ['higiene', 'equipamento', 'empilhadeira'],
    versaoAtual: 2,
    versoes: [
      {
        numero: 2,
        comentario: 'Inclusão de novo produto sanitizante',
        arquivo: '/docs/higienizacao-empilhadeira-v2.pdf',
        criadoPor: 'Carlos Oliveira',
        criadoEm: '2024-09-20T10:00:00Z',
      },
    ],
    tipo: 'procedimento',
    nivelConformidade: 'alto',
    dataValidade: '2025-09-20',
    edicaoColaborativa: false,
    permissoes: {
      usuarios: [],
      departamentos: ['Produção', 'Manutenção'],
    },
    anexos: [],
    statusAprovacao: 'pendente',
    aprovadores: mockAprovadores,
    responsavelAprovacao: 'supervisor1',
    historico: [
      {
        id: '3-1',
        usuario: 'Carlos Oliveira',
        cargo: 'analista',
        acao: 'submetido',
        comentario: 'Novo procedimento para aprovação',
        data: '2024-10-27T14:00:00Z',
      },
    ],
    dataSubmissao: '2024-10-27T14:00:00Z',
    criadoPor: 'Carlos Oliveira',
    criadoEm: '2024-03-10T10:00:00Z',
    atualizadoEm: '2024-09-20T10:00:00Z',
  },
  {
    id: '4',
    titulo: 'Limpeza de Máquinas de Corte',
    descricao: 'Protocolo de limpeza para máquinas de corte de carne',
    pastaId: '1-1-1',
    tags: ['higiene', 'equipamento', 'corte', 'crítico'],
    versaoAtual: 4,
    versoes: [
      {
        numero: 4,
        comentario: 'Nova frequência de limpeza',
        arquivo: '/docs/limpeza-corte-v4.pdf',
        criadoPor: 'Ana Paula',
        criadoEm: '2024-10-05T11:00:00Z',
      },
    ],
    tipo: 'procedimento',
    nivelConformidade: 'critico',
    dataValidade: '2025-10-05',
    edicaoColaborativa: true,
    permissoes: {
      usuarios: [],
      departamentos: ['Qualidade', 'Produção'],
    },
    anexos: [],
    statusAprovacao: 'rejeitado',
    aprovadores: mockAprovadores,
    responsavelAprovacao: 'quimico2',
    historico: [
      {
        id: '4-1',
        usuario: 'Ana Paula',
        cargo: 'analista',
        acao: 'submetido',
        data: '2024-10-05T11:00:00Z',
      },
      {
        id: '4-2',
        usuario: 'Dra. Ana Paula',
        cargo: 'quimico',
        acao: 'rejeitado',
        comentario: 'Frequência de limpeza não está de acordo com as normas MAPA. Necessário revisar.',
        data: '2024-10-06T15:30:00Z',
      },
    ],
    motivoRejeicao: 'Frequência de limpeza não está de acordo com as normas MAPA. Necessário revisar.',
    dataSubmissao: '2024-10-05T11:00:00Z',
    criadoPor: 'Ana Paula',
    criadoEm: '2024-01-15T10:00:00Z',
    atualizadoEm: '2024-10-05T11:00:00Z',
  },
  {
    id: '5',
    titulo: 'Sanitização de Esteiras Transportadoras',
    descricao: 'Procedimento de sanitização de esteiras',
    pastaId: '1-1-1',
    tags: ['higiene', 'equipamento', 'esteira'],
    versaoAtual: 3,
    versoes: [
      {
        numero: 3,
        comentario: 'Atualização de produtos químicos',
        arquivo: '/docs/sanitizacao-esteira-v3.pdf',
        criadoPor: 'Roberto Lima',
        criadoEm: '2024-08-12T09:00:00Z',
      },
    ],
    tipo: 'procedimento',
    nivelConformidade: 'alto',
    dataValidade: '2025-08-12',
    edicaoColaborativa: false,
    permissoes: {
      usuarios: [],
      departamentos: ['Produção'],
    },
    anexos: [],
    statusAprovacao: 'pendente',
    aprovadores: mockAprovadores,
    responsavelAprovacao: 'quimico1',
    historico: [
      {
        id: '5-1',
        usuario: 'Roberto Lima',
        cargo: 'analista',
        acao: 'submetido',
        comentario: 'Atualização de produtos químicos aprovados',
        data: '2024-10-26T10:00:00Z',
      },
    ],
    dataSubmissao: '2024-10-26T10:00:00Z',
    criadoPor: 'Roberto Lima',
    criadoEm: '2024-02-20T10:00:00Z',
    atualizadoEm: '2024-08-12T09:00:00Z',
  },
  
  // ===== Documentos em Sub-subpastas - Ambientes =====
  {
    id: '6',
    statusAprovacao: 'aprovado' as const,
    aprovadores: mockAprovadores,
    responsavelAprovacao: 'gerente1',
    historico: [],
    titulo: 'Limpeza de Câmaras Frias',
    descricao: 'Protocolo de limpeza e sanitização de câmaras frias',
    pastaId: '1-1-2',
    tags: ['higiene', 'ambiente', 'câmara-fria', 'crítico'],
    versaoAtual: 5,
    versoes: [
      {
        numero: 5,
        comentario: 'Nova metodologia de sanitização',
        arquivo: '/docs/limpeza-camara-v5.pdf',
        criadoPor: 'Fernando Costa',
        criadoEm: '2024-10-10T14:00:00Z',
      },
    ],
    tipo: 'procedimento',
    nivelConformidade: 'critico',
    dataValidade: '2025-10-10',
    edicaoColaborativa: true,
    permissoes: {
      usuarios: [],
      departamentos: ['Qualidade', 'Produção'],
    },
    anexos: [],
    criadoPor: 'Fernando Costa',
    criadoEm: '2024-01-05T10:00:00Z',
    atualizadoEm: '2024-10-10T14:00:00Z',
  },
  {
    id: '7',
    statusAprovacao: 'aprovado' as const,
    aprovadores: mockAprovadores,
    historico: [],
    titulo: 'Higienização de Pisos e Paredes',
    descricao: 'Procedimento para higienização de superfícies',
    pastaId: '1-1-2',
    tags: ['higiene', 'ambiente', 'pisos'],
    versaoAtual: 2,
    versoes: [
      {
        numero: 2,
        comentario: 'Inclusão de área de expedição',
        arquivo: '/docs/higienizacao-pisos-v2.pdf',
        criadoPor: 'Juliana Souza',
        criadoEm: '2024-09-15T10:00:00Z',
      },
    ],
    tipo: 'procedimento',
    nivelConformidade: 'alto',
    dataValidade: '2025-09-15',
    edicaoColaborativa: false,
    permissoes: {
      usuarios: [],
      departamentos: ['Produção'],
    },
    anexos: [],
    criadoPor: 'Juliana Souza',
    criadoEm: '2024-04-10T10:00:00Z',
    atualizadoEm: '2024-09-15T10:00:00Z',
  },
  
  // ===== Documentos em Manutenção - Preventiva =====
  {
    id: '8',
    statusAprovacao: 'aprovado' as const,
    aprovadores: mockAprovadores,
    historico: [],
    titulo: 'Plano de Manutenção Preventiva Anual',
    descricao: 'Cronograma completo de manutenção preventiva',
    pastaId: '1-2-1',
    tags: ['manutenção', 'preventiva', 'cronograma'],
    versaoAtual: 1,
    versoes: [
      {
        numero: 1,
        comentario: 'Versão inicial 2024',
        arquivo: '/docs/manutencao-preventiva-2024.pdf',
        criadoPor: 'Pedro Mendes',
        criadoEm: '2024-01-05T10:00:00Z',
      },
    ],
    tipo: 'procedimento',
    nivelConformidade: 'alto',
    dataValidade: '2025-01-05',
    edicaoColaborativa: true,
    permissoes: {
      usuarios: [],
      departamentos: ['Manutenção'],
    },
    anexos: [],
    criadoPor: 'Pedro Mendes',
    criadoEm: '2024-01-05T10:00:00Z',
    atualizadoEm: '2024-01-05T10:00:00Z',
  },
  
  // ===== Documentos em Registros MAPA - Inspeções 2024 =====
  {
    id: '9',
    statusAprovacao: 'aprovado' as const,
    aprovadores: mockAprovadores,
    historico: [],
    titulo: 'Inspeção MAPA - Janeiro 2024',
    descricao: 'Relatório de inspeção do MAPA de janeiro',
    pastaId: '2-1-1',
    tags: ['MAPA', 'inspeção', '2024', 'janeiro'],
    versaoAtual: 1,
    versoes: [
      {
        numero: 1,
        comentario: 'Relatório final',
        arquivo: '/docs/inspecao-mapa-jan-2024.pdf',
        criadoPor: 'Inspetor MAPA',
        criadoEm: '2024-01-30T15:00:00Z',
      },
    ],
    tipo: 'registro-mapa',
    nivelConformidade: 'critico',
    edicaoColaborativa: false,
    permissoes: {
      usuarios: [],
      departamentos: ['Qualidade'],
    },
    anexos: [],
    criadoPor: 'João Silva',
    criadoEm: '2024-01-30T15:00:00Z',
    atualizadoEm: '2024-01-30T15:00:00Z',
  },
  {
    id: '10',
    statusAprovacao: 'aprovado' as const,
    aprovadores: mockAprovadores,
    historico: [],
    titulo: 'Inspeção MAPA - Outubro 2024',
    descricao: 'Relatório de inspeção do MAPA de outubro',
    pastaId: '2-1-1',
    tags: ['MAPA', 'inspeção', '2024', 'outubro'],
    versaoAtual: 1,
    versoes: [
      {
        numero: 1,
        comentario: 'Relatório final',
        arquivo: '/docs/inspecao-mapa-out-2024.pdf',
        criadoPor: 'Inspetor MAPA',
        criadoEm: '2024-10-25T15:00:00Z',
      },
    ],
    tipo: 'registro-mapa',
    nivelConformidade: 'critico',
    edicaoColaborativa: false,
    permissoes: {
      usuarios: [],
      departamentos: ['Qualidade'],
    },
    anexos: [],
    criadoPor: 'Maria Santos',
    criadoEm: '2024-10-25T15:00:00Z',
    atualizadoEm: '2024-10-25T15:00:00Z',
  },
  
  // ===== Documentos em Auditorias - Internas =====
  {
    id: '11',
    statusAprovacao: 'aprovado' as const,
    aprovadores: mockAprovadores,
    historico: [],
    titulo: 'Auditoria Interna - 1º Trimestre 2024',
    descricao: 'Relatório de auditoria interna do primeiro trimestre',
    pastaId: '2-2-1',
    tags: ['auditoria', 'interna', '2024', 'trimestre'],
    versaoAtual: 1,
    versoes: [
      {
        numero: 1,
        comentario: 'Relatório consolidado',
        arquivo: '/docs/auditoria-interna-t1-2024.pdf',
        criadoPor: 'Auditor Interno',
        criadoEm: '2024-03-31T17:00:00Z',
      },
    ],
    tipo: 'registro-mapa',
    nivelConformidade: 'alto',
    edicaoColaborativa: false,
    permissoes: {
      usuarios: [],
      departamentos: ['Qualidade', 'Diretoria'],
    },
    anexos: [],
    criadoPor: 'Ana Paula',
    criadoEm: '2024-03-31T17:00:00Z',
    atualizadoEm: '2024-03-31T17:00:00Z',
  },
  
  // ===== Documentos em Exportação - Certificados Sanitários =====
  {
    id: '12',
    statusAprovacao: 'aprovado' as const,
    aprovadores: mockAprovadores,
    historico: [],
    titulo: 'Certificado Sanitário - Lote EXP-2024-045',
    descricao: 'Certificado sanitário para exportação China',
    pastaId: '3-1-1',
    tags: ['exportação', 'certificado', 'sanitário', 'china'],
    versaoAtual: 1,
    versoes: [
      {
        numero: 1,
        comentario: 'Emitido pelo SIF',
        arquivo: '/docs/cert-sanitario-exp-045.pdf',
        criadoPor: 'SIF',
        criadoEm: '2024-10-20T10:00:00Z',
      },
    ],
    tipo: 'exportacao',
    nivelConformidade: 'critico',
    edicaoColaborativa: false,
    permissoes: {
      usuarios: [],
      departamentos: ['Qualidade', 'Exportação'],
    },
    anexos: [],
    criadoPor: 'Carlos Oliveira',
    criadoEm: '2024-10-20T10:00:00Z',
    atualizadoEm: '2024-10-20T10:00:00Z',
  },
  
  // ===== Documentos em Análises - Microbiológicas =====
  {
    id: '13',
    statusAprovacao: 'aprovado' as const,
    aprovadores: mockAprovadores,
    historico: [],
    titulo: 'Análise Microbiológica - Lote 2024-10-A',
    descricao: 'Resultado de análise microbiológica',
    pastaId: '3-2-1',
    tags: ['análise', 'microbiológica', 'lote'],
    versaoAtual: 1,
    versoes: [
      {
        numero: 1,
        comentario: 'Resultado de laboratório',
        arquivo: '/docs/analise-micro-2024-10-a.pdf',
        criadoPor: 'Laboratório',
        criadoEm: '2024-10-18T14:00:00Z',
      },
    ],
    tipo: 'exportacao',
    nivelConformidade: 'critico',
    edicaoColaborativa: false,
    permissoes: {
      usuarios: [],
      departamentos: ['Qualidade'],
    },
    anexos: [],
    criadoPor: 'Maria Santos',
    criadoEm: '2024-10-18T14:00:00Z',
    atualizadoEm: '2024-10-18T14:00:00Z',
  },
  
  // ===== Documentos em ISO 9001 - Processos - Produção =====
  {
    id: '14',
    statusAprovacao: 'aprovado' as const,
    aprovadores: mockAprovadores,
    historico: [],
    titulo: 'Fluxograma de Processo de Desossa',
    descricao: 'Mapeamento completo do processo de desossa',
    pastaId: '4-1-1',
    tags: ['ISO', 'processo', 'produção', 'desossa'],
    versaoAtual: 2,
    versoes: [
      {
        numero: 2,
        comentario: 'Atualização pós-melhoria contínua',
        arquivo: '/docs/fluxograma-desossa-v2.pdf',
        criadoPor: 'Engenharia',
        criadoEm: '2024-09-10T11:00:00Z',
      },
    ],
    tipo: 'outro',
    nivelConformidade: 'alto',
    dataValidade: '2025-09-10',
    edicaoColaborativa: true,
    permissoes: {
      usuarios: [],
      departamentos: ['Qualidade', 'Produção', 'Engenharia'],
    },
    anexos: [],
    criadoPor: 'Roberto Lima',
    criadoEm: '2024-05-15T10:00:00Z',
    atualizadoEm: '2024-09-10T11:00:00Z',
  },
  {
    id: '15',
    statusAprovacao: 'aprovado' as const,
    aprovadores: mockAprovadores,
    historico: [],
    titulo: 'Procedimento de Embalagem Primária',
    descricao: 'Procedimento operacional padrão para embalagem',
    pastaId: '4-1-1',
    tags: ['ISO', 'processo', 'embalagem'],
    versaoAtual: 3,
    versoes: [
      {
        numero: 3,
        comentario: 'Inclusão de novos padrões',
        arquivo: '/docs/embalagem-primaria-v3.pdf',
        criadoPor: 'Juliana Souza',
        criadoEm: '2024-10-01T09:00:00Z',
      },
    ],
    tipo: 'procedimento',
    nivelConformidade: 'alto',
    dataValidade: '2025-10-01',
    edicaoColaborativa: true,
    permissoes: {
      usuarios: [],
      departamentos: ['Produção', 'Qualidade'],
    },
    anexos: [],
    criadoPor: 'Juliana Souza',
    criadoEm: '2024-02-20T10:00:00Z',
    atualizadoEm: '2024-10-01T09:00:00Z',
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

// Funções de aprovação de documentos
export const aprovarDocumento = async (id: string, usuario: string, comentario?: string): Promise<void> => {
  await delay(500);
  const docs = getFromStorage(STORAGE_KEYS.DOCUMENTOS, mockDocumentos);
  const doc = docs.find((d) => d.id === id);
  if (!doc) throw new Error('Documento não encontrado');

  doc.statusAprovacao = 'aprovado';
  doc.dataAprovacao = new Date().toISOString();
  doc.historico.push({
    id: `${Date.now()}`,
    usuario,
    cargo: 'aprovador',
    acao: 'aprovado',
    comentario,
    data: new Date().toISOString(),
  });
  
  saveToStorage(STORAGE_KEYS.DOCUMENTOS, docs);
};

export const rejeitarDocumento = async (id: string, usuario: string, motivo: string): Promise<void> => {
  await delay(500);
  const docs = getFromStorage(STORAGE_KEYS.DOCUMENTOS, mockDocumentos);
  const doc = docs.find((d) => d.id === id);
  if (!doc) throw new Error('Documento não encontrado');

  doc.statusAprovacao = 'rejeitado';
  doc.motivoRejeicao = motivo;
  doc.historico.push({
    id: `${Date.now()}`,
    usuario,
    cargo: 'aprovador',
    acao: 'rejeitado',
    comentario: motivo,
    data: new Date().toISOString(),
  });
  
  saveToStorage(STORAGE_KEYS.DOCUMENTOS, docs);
};

export const solicitarRevisaoDocumento = async (id: string, usuario: string, comentario: string): Promise<void> => {
  await delay(500);
  const docs = getFromStorage(STORAGE_KEYS.DOCUMENTOS, mockDocumentos);
  const doc = docs.find((d) => d.id === id);
  if (!doc) throw new Error('Documento não encontrado');

  doc.historico.push({
    id: `${Date.now()}`,
    usuario,
    cargo: 'aprovador',
    acao: 'revisao-solicitada',
    comentario,
    data: new Date().toISOString(),
  });
  
  saveToStorage(STORAGE_KEYS.DOCUMENTOS, docs);
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
