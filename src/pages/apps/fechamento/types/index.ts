export type UserRole = 'admin' | 'manager' | 'collaborator';

export type ProjectType = 'acompanhamento' | 'fechamento' | 'obra';

export type ClosingColumnType = 'todo' | 'in-progress' | 'done';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  active?: boolean;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  projectType: ProjectType;
  createdAt: Date;
  updatedAt: Date;
  deadline?: Date;
  members: User[];
  boardId: string;
  // Closing project specific fields
  closingMonth?: number;
  closingYear?: number;
  baseStartDate?: Date;
}

export interface Column {
  id: string;
  title: string;
  position: number;
  boardId: string;
  cards: Card[];
  backgroundColor?: string;
  titleColor?: string;
  closingColumnType?: ClosingColumnType;
  isFixed?: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

export interface Card {
  id: string;
  title: string;
  description?: string;
  value?: number;
  valueType?: 'currency' | 'tons' | 'hectares' | 'percentage';
  columnId: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: User;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  checklist?: ChecklistItem[];
  titleColor?: string;
  attachments?: AttachedFile[];
  startDate?: Date;
  endDate?: Date;
  // Closing task specific fields
  duration?: number;
  dependsOn?: string[];
  actualStartDate?: Date;
  actualEndDate?: Date;
}

export interface ValueTypeConfig {
  id: string;
  name: string;
  abbreviation: string;
  icon: string;
  active: boolean;
}

export interface Board {
  id: string;
  projectId: string;
  columns: Column[];
}

export type DragItem = {
  id: string;
  type: 'card';
  columnId: string;
  index: number;
};