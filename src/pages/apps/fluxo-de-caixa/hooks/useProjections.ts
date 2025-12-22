import { useState, useCallback } from 'react';
import { Projection, ProjectionLog, ProjectionItem, CATEGORIES } from '@/pages/apps/fluxo-de-caixa/types/projection';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const generateId = () => Math.random().toString(36).substring(2, 11);

const createInitialProjections = (): Projection[] => {
  return [
    {
      id: generateId(),
      date: '2024-11-17',
      type: 'previsao',
      items: [
        { id: generateId(), category: 'URBANA', value: 62910, premise: 'Horas trabalhadas' },
        { id: generateId(), category: 'RURAL', value: 99137, premise: 'Produção rural, chuvas' },
        { id: generateId(), category: 'MERCADÃO', value: 3276, premise: 'Reembolso assistência e quitação de horas' },
        { id: generateId(), category: 'AGROENERGIA', value: 17298, premise: 'Base no sistema' },
        { id: generateId(), category: 'PRÓ-LABORE', value: 7819, premise: 'Base no sistema' },
      ],
      total: 190441,
      createdAt: '2024-11-17T10:00:00Z',
      updatedAt: '2024-11-17T10:00:00Z',
    },
    {
      id: generateId(),
      date: '2024-11-28',
      type: 'previsao',
      items: [
        { id: generateId(), category: 'URBANA', value: 86561, premise: 'Horas trabalhadas' },
        { id: generateId(), category: 'RURAL', value: 96971, premise: 'Produção rural, chuvas' },
        { id: generateId(), category: 'MERCADÃO', value: 2668, premise: 'Reembolso assistência e quitação de horas' },
        { id: generateId(), category: 'AGROENERGIA', value: 17006, premise: 'Base no sistema' },
        { id: generateId(), category: 'PRÓ-LABORE', value: 7819, premise: 'Base no sistema' },
      ],
      total: 211026,
      createdAt: '2024-11-28T14:30:00Z',
      updatedAt: '2024-11-28T14:30:00Z',
    },
    {
      id: generateId(),
      date: '2024-12-05',
      type: 'realizado',
      items: [
        { id: generateId(), category: 'URBANA', value: 16840.20, premise: 'Horas trabalhadas' },
        { id: generateId(), category: 'RURAL', value: 11712.14, premise: 'Produção rural, chuvas' },
        { id: generateId(), category: 'MERCADÃO', value: 3098.52, premise: 'Reembolso assistência e quitação de horas' },
        { id: generateId(), category: 'AGROENERGIA', value: 17006.08, premise: 'Base no sistema' },
        { id: generateId(), category: 'PRÓ-LABORE', value: 17816.17, premise: 'Base no sistema' },
      ],
      total: 66473.11,
      createdAt: '2024-12-05T09:00:00Z',
      updatedAt: '2024-12-05T09:00:00Z',
    },
  ];
};

export function useProjections() {
  const [projections, setProjections] = useState<Projection[]>(createInitialProjections);
  const [logs, setLogs] = useState<ProjectionLog[]>([]);

  const addLog = useCallback((
    projectionId: string,
    action: ProjectionLog['action'],
    description: string,
    field?: string,
    oldValue?: string | number,
    newValue?: string | number
  ) => {
    const newLog: ProjectionLog = {
      id: generateId(),
      projectionId,
      action,
      field,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
      description,
    };
    setLogs(prev => [newLog, ...prev]);
  }, []);

  const addProjection = useCallback((data: {
    date: string;
    type: 'previsao' | 'realizado';
    items: Omit<ProjectionItem, 'id'>[];
  }) => {
    const newProjection: Projection = {
      id: generateId(),
      date: data.date,
      type: data.type,
      items: data.items.map(item => ({ ...item, id: generateId() })),
      total: data.items.reduce((sum, item) => sum + item.value, 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProjections(prev => [...prev, newProjection]);
    
    const formattedDate = format(new Date(data.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    addLog(
      newProjection.id,
      'create',
      `Nova projeção criada para ${formattedDate} (${data.type === 'previsao' ? 'Previsão' : 'Realizado'})`
    );

    return newProjection;
  }, [addLog]);

  const updateProjection = useCallback((
    projectionId: string,
    updates: Partial<Omit<Projection, 'id' | 'createdAt'>>
  ) => {
    setProjections(prev => prev.map(projection => {
      if (projection.id !== projectionId) return projection;

      const updatedProjection = {
        ...projection,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      if (updates.items) {
        updatedProjection.total = updates.items.reduce((sum, item) => sum + item.value, 0);
        
        // Log individual item changes
        updates.items.forEach(newItem => {
          const oldItem = projection.items.find(i => i.category === newItem.category);
          if (oldItem && oldItem.value !== newItem.value) {
            addLog(
              projectionId,
              'update',
              `Valor de ${newItem.category} alterado`,
              newItem.category,
              oldItem.value,
              newItem.value
            );
          }
        });
      }

      return updatedProjection;
    }));
  }, [addLog]);

  const deleteProjection = useCallback((projectionId: string) => {
    const projection = projections.find(p => p.id === projectionId);
    if (projection) {
      const formattedDate = format(new Date(projection.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
      addLog(
        projectionId,
        'delete',
        `Projeção de ${formattedDate} removida`
      );
    }
    setProjections(prev => prev.filter(p => p.id !== projectionId));
  }, [projections, addLog]);

  return {
    projections,
    logs,
    addProjection,
    updateProjection,
    deleteProjection,
  };
}
