import { Card, Column } from '@/pages/apps/fechamento/types';
import { addDays, isAfter, isBefore, startOfDay } from 'date-fns';

/**
 * Get all cards from all columns
 */
export const getAllCards = (columns: Column[]): Card[] => {
  return columns.flatMap(col => col.cards);
};

/**
 * Find a card by its ID across all columns
 */
export const findCardById = (columns: Column[], cardId: string): Card | undefined => {
  return getAllCards(columns).find(card => card.id === cardId);
};

/**
 * Get cards that a specific card depends on
 */
export const getDependencies = (columns: Column[], card: Card): Card[] => {
  if (!card.dependsOn || card.dependsOn.length === 0) return [];
  return card.dependsOn
    .map(id => findCardById(columns, id))
    .filter((c): c is Card => c !== undefined);
};

/**
 * Get cards that depend on a specific card
 */
export const getDependents = (columns: Column[], cardId: string): Card[] => {
  return getAllCards(columns).filter(card => 
    card.dependsOn?.includes(cardId)
  );
};

/**
 * Check if a card's dependencies are all completed
 */
export const areDependenciesCompleted = (
  columns: Column[], 
  card: Card, 
  doneColumnId: string
): boolean => {
  const dependencies = getDependencies(columns, card);
  if (dependencies.length === 0) return true;
  
  return dependencies.every(dep => dep.columnId === doneColumnId);
};

/**
 * Get blocking dependencies (dependencies not yet completed)
 */
export const getBlockingDependencies = (
  columns: Column[], 
  card: Card, 
  doneColumnId: string
): Card[] => {
  const dependencies = getDependencies(columns, card);
  return dependencies.filter(dep => dep.columnId !== doneColumnId);
};

/**
 * Calculate start date based on dependencies
 */
export const calculateStartDate = (
  columns: Column[],
  card: Card,
  baseStartDate: Date
): Date => {
  if (!card.dependsOn || card.dependsOn.length === 0) {
    return startOfDay(baseStartDate);
  }

  const dependencies = getDependencies(columns, card);
  if (dependencies.length === 0) {
    return startOfDay(baseStartDate);
  }

  // Find the latest end date among dependencies
  const latestEndDate = dependencies.reduce((latest, dep) => {
    const depEndDate = dep.endDate || dep.startDate;
    if (!depEndDate) return latest;
    if (!latest) return depEndDate;
    return isAfter(depEndDate, latest) ? depEndDate : latest;
  }, null as Date | null);

  if (!latestEndDate) {
    return startOfDay(baseStartDate);
  }

  // Start the day after the latest dependency ends
  return addDays(startOfDay(latestEndDate), 1);
};

/**
 * Calculate end date based on start date and duration
 */
export const calculateEndDate = (startDate: Date, duration: number): Date => {
  return addDays(startOfDay(startDate), duration - 1);
};

/**
 * Recalculate dates for a card and its dependents
 */
export const recalculateDates = (
  columns: Column[],
  cardId: string,
  baseStartDate: Date
): Column[] => {
  const updatedColumns = [...columns];
  
  const updateCardDates = (id: string, visited: Set<string> = new Set()): void => {
    if (visited.has(id)) return; // Prevent circular dependencies
    visited.add(id);
    
    for (const col of updatedColumns) {
      const cardIndex = col.cards.findIndex(c => c.id === id);
      if (cardIndex !== -1) {
        const card = col.cards[cardIndex];
        const newStartDate = calculateStartDate(updatedColumns, card, baseStartDate);
        const newEndDate = card.duration 
          ? calculateEndDate(newStartDate, card.duration)
          : newStartDate;
        
        col.cards[cardIndex] = {
          ...card,
          startDate: newStartDate,
          endDate: newEndDate
        };
        
        // Update dependents
        const dependents = getDependents(updatedColumns, id);
        dependents.forEach(dep => updateCardDates(dep.id, visited));
        break;
      }
    }
  };
  
  // First update the specified card, then its dependents
  const dependents = getDependents(columns, cardId);
  dependents.forEach(dep => updateCardDates(dep.id));
  
  return updatedColumns;
};

/**
 * Check for circular dependencies
 */
export const hasCircularDependency = (
  columns: Column[],
  cardId: string,
  potentialDependencyId: string
): boolean => {
  if (cardId === potentialDependencyId) return true;
  
  const visited = new Set<string>();
  const stack: string[] = [potentialDependencyId];
  
  while (stack.length > 0) {
    const currentId = stack.pop()!;
    if (currentId === cardId) return true;
    if (visited.has(currentId)) continue;
    
    visited.add(currentId);
    
    const dependents = getDependents(columns, currentId);
    dependents.forEach(dep => stack.push(dep.id));
  }
  
  return false;
};

/**
 * Validate if a card can be moved to a target column
 */
export const canMoveToColumn = (
  columns: Column[],
  card: Card,
  targetColumnId: string,
  doneColumnId: string,
  inProgressColumnId: string
): { canMove: boolean; reason?: string } => {
  // Moving to "In Progress" requires all dependencies to be completed
  if (targetColumnId === inProgressColumnId) {
    const blockingDeps = getBlockingDependencies(columns, card, doneColumnId);
    if (blockingDeps.length > 0) {
      const names = blockingDeps.map(d => d.title).join(', ');
      return {
        canMove: false,
        reason: `Aguardando conclusão de: ${names}`
      };
    }
  }
  
  return { canMove: true };
};

/**
 * Get task status based on dates
 */
export const getTaskStatus = (card: Card): 'on-time' | 'warning' | 'overdue' | 'completed' | 'not-started' => {
  if (card.actualEndDate) return 'completed';
  if (!card.startDate || !card.endDate) return 'not-started';
  
  const today = startOfDay(new Date());
  const endDate = startOfDay(card.endDate);
  const warningDate = addDays(endDate, -1);
  
  if (isAfter(today, endDate)) return 'overdue';
  if (isAfter(today, warningDate) || today.getTime() === warningDate.getTime()) return 'warning';
  return 'on-time';
};

/**
 * Sort cards by their dependencies (topological sort)
 */
export const sortCardsByDependencies = (cards: Card[]): Card[] => {
  const sorted: Card[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();
  
  const visit = (card: Card): void => {
    if (temp.has(card.id)) return; // Circular dependency, skip
    if (visited.has(card.id)) return;
    
    temp.add(card.id);
    
    if (card.dependsOn) {
      card.dependsOn.forEach(depId => {
        const depCard = cards.find(c => c.id === depId);
        if (depCard) visit(depCard);
      });
    }
    
    temp.delete(card.id);
    visited.add(card.id);
    sorted.push(card);
  };
  
  cards.forEach(card => visit(card));
  
  return sorted;
};

/**
 * Get closing columns configuration
 */
export const getClosingColumns = (boardId: string): { id: string; title: string; closingColumnType: 'todo' | 'in-progress' | 'done'; backgroundColor: string; titleColor: string }[] => {
  const timestamp = Date.now();
  return [
    {
      id: `col-closing-todo-${timestamp}`,
      title: 'A Fazer',
      closingColumnType: 'todo' as const,
      backgroundColor: '#fef3c7',
      titleColor: '#92400e'
    },
    {
      id: `col-closing-inprogress-${timestamp}`,
      title: 'Em Andamento',
      closingColumnType: 'in-progress' as const,
      backgroundColor: '#dbeafe',
      titleColor: '#1d4ed8'
    },
    {
      id: `col-closing-done-${timestamp}`,
      title: 'Concluída',
      closingColumnType: 'done' as const,
      backgroundColor: '#dcfce7',
      titleColor: '#166534'
    }
  ];
};