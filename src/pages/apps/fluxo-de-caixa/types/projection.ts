export interface ProjectionItem {
  id: string;
  category: string;
  value: number;
  premise: string;
}

export interface Projection {
  id: string;
  date: string;
  type: number;
  items: ProjectionItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectionLog {
  id: string;
  projectionId: string;
  action: 'create' | 'update' | 'delete';
  field?: string;
  oldValue?: string | number;
  newValue?: string | number;
  timestamp: string;
  description: string;
}

export const CATEGORIES = [
  { id: 'urbana', name: 'URBANA' },
  { id: 'rural', name: 'RURAL' },
  { id: 'mercadao', name: 'MERCADÃO' },
  { id: 'agroenergia', name: 'AGROENERGIA' },
  { id: 'prolabore', name: 'PRÓ-LABORE' },
  { id: 'total', name: 'Total' },
] as const;
