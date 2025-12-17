export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  progress: number; // 0-100
  priority: Priority;
  assignee?: string;
  dependencies?: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
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
  columns: Column[];
  createdAt: string;
  updatedAt: string;
}

export interface FechamentoData {
  boards: Board[];
  tasks: Task[];
}

export const DEFAULT_COLUMNS: Column[] = [
  { id: 'todo', title: 'A Fazer', order: 0, color: 'hsl(220 14% 60%)' },
  { id: 'in-progress', title: 'Em Andamento', order: 1, color: 'hsl(200 80% 50%)' },
  { id: 'review', title: 'Revisão', order: 2, color: 'hsl(45 93% 47%)' },
  { id: 'done', title: 'Concluído', order: 3, color: 'hsl(142 76% 36%)' },
];

export const PRIORITY_CONFIG = {
  low: { label: 'Baixa', color: 'hsl(142 76% 36%)', icon: '🟢' },
  medium: { label: 'Média', color: 'hsl(45 93% 47%)', icon: '🟡' },
  high: { label: 'Alta', color: 'hsl(24 95% 53%)', icon: '🟠' },
  urgent: { label: 'Urgente', color: 'hsl(0 84% 60%)', icon: '🔴' },
};
