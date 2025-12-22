export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type BoardType = 'recurring' | 'non-recurring';
export type TaskStatus = 'not-started' | 'in-progress' | 'completed';

// Definição da tarefa (template reutilizável)
export interface TaskDefinition {
  id: string;
  name: string;
  description?: string;
  durationDays: number;
  dependencies: string[]; // IDs de outras TaskDefinitions
  assignee?: string;
  priority: Priority;
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
}

// Execução de uma tarefa (instância mensal ou contínua)
export interface TaskExecution {
  id: string;
  taskDefinitionId: string;
  boardId: string;
  cycleId?: string; // ID do ciclo mensal (null para não-recorrentes)
  status: TaskStatus;
  progress: number; // 0-100
  startDate: string; // Calculado automaticamente
  endDate: string; // Calculado automaticamente
  actualStartDate?: string;
  actualEndDate?: string;
  notes?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Ciclo mensal
export interface MonthlyCycle {
  id: string;
  boardId: string;
  year: number;
  month: number; // 1-12
  startDate: string; // 1º dia do mês
  endDate: string; // 1º dia do mês seguinte
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
  completedAt?: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  color: string;
}

export interface Board {
  id: string;
  name: string;
  description?: string;
  type: BoardType;
  columns: Column[];
  taskDefinitionIds: string[]; // IDs das definições de tarefas
  currentCycleId?: string;
  createdAt: string;
  updatedAt: string;
}

// Mantém compatibilidade - Task legado para migração
export interface Task {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  progress: number;
  priority: Priority;
  assignee?: string;
  dependencies?: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface FechamentoData {
  boards: Board[];
  tasks: Task[]; // Legado - manter para compatibilidade
  taskDefinitions: TaskDefinition[];
  taskExecutions: TaskExecution[];
  monthlyCycles: MonthlyCycle[];
}

export const DEFAULT_COLUMNS: Column[] = [
  { id: 'not-started', title: 'Não Iniciado', order: 0, color: 'hsl(220 14% 60%)' },
  { id: 'in-progress', title: 'Em Andamento', order: 1, color: 'hsl(200 80% 50%)' },
  { id: 'completed', title: 'Concluído', order: 2, color: 'hsl(142 76% 36%)' },
];

export const PRIORITY_CONFIG = {
  low: { label: 'Baixa', color: 'hsl(142 76% 36%)', icon: '🟢' },
  medium: { label: 'Média', color: 'hsl(45 93% 47%)', icon: '🟡' },
  high: { label: 'Alta', color: 'hsl(24 95% 53%)', icon: '🟠' },
  urgent: { label: 'Urgente', color: 'hsl(0 84% 60%)', icon: '🔴' },
};

export const STATUS_CONFIG = {
  'not-started': { label: 'Não Iniciado', color: 'hsl(220 14% 60%)', icon: '⚪' },
  'in-progress': { label: 'Em Andamento', color: 'hsl(200 80% 50%)', icon: '🔵' },
  'completed': { label: 'Concluído', color: 'hsl(142 76% 36%)', icon: '✅' },
};

export const BOARD_TYPE_CONFIG = {
  'recurring': { label: 'Recorrente Mensal', description: 'Reinicia automaticamente todo mês', icon: '🔄' },
  'non-recurring': { label: 'Não Recorrente', description: 'Projetos contínuos sem reset', icon: '📋' },
};
