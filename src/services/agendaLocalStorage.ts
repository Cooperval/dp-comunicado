import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, parseISO, isWithinInterval } from 'date-fns';

export interface Compromisso {
  id: string;
  titulo: string;
  descricao?: string;
  data: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFim: string; // HH:mm
  categoria: string;
  cor: string;
  local?: string;
  notificacao?: boolean;
  concluido: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Categoria {
  id: string;
  nome: string;
  cor: string;
  icone?: string;
  ativo: boolean;
}

interface AgendaData {
  compromissos: Compromisso[];
  categorias: Categoria[];
}

const STORAGE_KEY = 'agenda-compromissos';

const categoriasIniciais: Categoria[] = [
  { id: '1', nome: 'Trabalho', cor: '#3b82f6', icone: 'Briefcase', ativo: true },
  { id: '2', nome: 'Pessoal', cor: '#10b981', icone: 'User', ativo: true },
  { id: '3', nome: 'Saúde', cor: '#8b5cf6', icone: 'Heart', ativo: true },
  { id: '4', nome: 'Estudo', cor: '#f59e0b', icone: 'BookOpen', ativo: true },
  { id: '5', nome: 'Outro', cor: '#6b7280', icone: 'MoreHorizontal', ativo: true },
];

const getData = (): AgendaData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initialData: AgendaData = {
      compromissos: [],
      categorias: categoriasIniciais,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
    return initialData;
  }
  return JSON.parse(stored);
};

const saveData = (data: AgendaData): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// CRUD Compromissos
export const getCompromissos = (dataInicio?: Date, dataFim?: Date): Compromisso[] => {
  const data = getData();
  let compromissos = data.compromissos;

  if (dataInicio && dataFim) {
    compromissos = compromissos.filter((c) => {
      const dataComp = parseISO(c.data);
      return isWithinInterval(dataComp, { start: dataInicio, end: dataFim });
    });
  }

  return compromissos.sort((a, b) => {
    const dateCompare = a.data.localeCompare(b.data);
    if (dateCompare !== 0) return dateCompare;
    return a.horaInicio.localeCompare(b.horaInicio);
  });
};

export const getCompromissosPorDia = (data: Date): Compromisso[] => {
  const dataStr = format(data, 'yyyy-MM-dd');
  const allCompromissos = getData().compromissos;
  return allCompromissos
    .filter((c) => c.data === dataStr)
    .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
};

export const getCompromissosPorSemana = (data: Date): Compromisso[] => {
  const inicio = startOfWeek(data, { weekStartsOn: 0 });
  const fim = endOfWeek(data, { weekStartsOn: 0 });
  return getCompromissos(inicio, fim);
};

export const getCompromissosPorMes = (data: Date): Compromisso[] => {
  const inicio = startOfMonth(data);
  const fim = endOfMonth(data);
  return getCompromissos(inicio, fim);
};

export const createCompromisso = (dados: Omit<Compromisso, 'id' | 'criadoEm' | 'atualizadoEm'>): Compromisso => {
  const data = getData();
  const now = new Date().toISOString();
  const novoCompromisso: Compromisso = {
    ...dados,
    id: generateId(),
    criadoEm: now,
    atualizadoEm: now,
  };
  data.compromissos.push(novoCompromisso);
  saveData(data);
  return novoCompromisso;
};

export const updateCompromisso = (id: string, dados: Partial<Compromisso>): Compromisso | null => {
  const data = getData();
  const index = data.compromissos.findIndex((c) => c.id === id);
  if (index === -1) return null;

  data.compromissos[index] = {
    ...data.compromissos[index],
    ...dados,
    atualizadoEm: new Date().toISOString(),
  };
  saveData(data);
  return data.compromissos[index];
};

export const deleteCompromisso = (id: string): void => {
  const data = getData();
  data.compromissos = data.compromissos.filter((c) => c.id !== id);
  saveData(data);
};

export const toggleConcluido = (id: string): Compromisso | null => {
  const data = getData();
  const compromisso = data.compromissos.find((c) => c.id === id);
  if (!compromisso) return null;

  compromisso.concluido = !compromisso.concluido;
  compromisso.atualizadoEm = new Date().toISOString();
  saveData(data);
  return compromisso;
};

// Categorias
export const getCategorias = (): Categoria[] => {
  const data = getData();
  return data.categorias.filter((c) => c.ativo);
};

export const createCategoria = (dados: Omit<Categoria, 'id'>): Categoria => {
  const data = getData();
  const novaCategoria: Categoria = {
    ...dados,
    id: generateId(),
  };
  data.categorias.push(novaCategoria);
  saveData(data);
  return novaCategoria;
};

// Utilidades
export const verificarConflito = (novoCompromisso: Omit<Compromisso, 'id' | 'criadoEm' | 'atualizadoEm'>, idAtual?: string): Compromisso[] => {
  const compromissosDia = getCompromissosPorDia(parseISO(novoCompromisso.data));
  
  return compromissosDia.filter((c) => {
    if (idAtual && c.id === idAtual) return false;
    
    const inicioNovo = novoCompromisso.horaInicio;
    const fimNovo = novoCompromisso.horaFim;
    const inicioExistente = c.horaInicio;
    const fimExistente = c.horaFim;

    return (
      (inicioNovo >= inicioExistente && inicioNovo < fimExistente) ||
      (fimNovo > inicioExistente && fimNovo <= fimExistente) ||
      (inicioNovo <= inicioExistente && fimNovo >= fimExistente)
    );
  });
};

export const getEstatisticasDia = (data: Date): { total: number; horas: number; concluidos: number } => {
  const compromissos = getCompromissosPorDia(data);
  const total = compromissos.length;
  const concluidos = compromissos.filter((c) => c.concluido).length;
  
  const horas = compromissos.reduce((acc, c) => {
    const [hInicio, mInicio] = c.horaInicio.split(':').map(Number);
    const [hFim, mFim] = c.horaFim.split(':').map(Number);
    const minutos = (hFim * 60 + mFim) - (hInicio * 60 + mInicio);
    return acc + minutos / 60;
  }, 0);

  return { total, horas: Math.round(horas * 10) / 10, concluidos };
};

export const buscarCompromissos = (termo: string): Compromisso[] => {
  const data = getData();
  const termoLower = termo.toLowerCase();
  return data.compromissos.filter(
    (c) =>
      c.titulo.toLowerCase().includes(termoLower) ||
      c.descricao?.toLowerCase().includes(termoLower) ||
      c.local?.toLowerCase().includes(termoLower)
  );
};
