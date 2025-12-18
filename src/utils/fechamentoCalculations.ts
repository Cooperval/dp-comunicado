import { addDays, startOfMonth, addMonths, differenceInDays, isAfter, isBefore, parseISO, format } from 'date-fns';
import { TaskDefinition, TaskExecution, MonthlyCycle, Board } from '@/types/fechamento';

// Gera ID único
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Obtém datas do ciclo mensal
export function getCycleDates(year: number, month: number): { startDate: Date; endDate: Date } {
  const startDate = new Date(year, month - 1, 1);
  const endDate = addMonths(startDate, 1);
  return { startDate, endDate };
}

// Ordenação topológica para resolver dependências
export function topologicalSort(definitions: TaskDefinition[]): TaskDefinition[] {
  const sorted: TaskDefinition[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const defMap = new Map(definitions.map(d => [d.id, d]));

  function visit(def: TaskDefinition): boolean {
    if (visited.has(def.id)) return true;
    if (visiting.has(def.id)) return false; // Ciclo detectado

    visiting.add(def.id);

    for (const depId of def.dependencies) {
      const depDef = defMap.get(depId);
      if (depDef && !visit(depDef)) {
        return false;
      }
    }

    visiting.delete(def.id);
    visited.add(def.id);
    sorted.push(def);
    return true;
  }

  for (const def of definitions) {
    if (!visited.has(def.id)) {
      visit(def);
    }
  }

  return sorted;
}

// Detecta dependências circulares
export function detectCircularDependencies(definitions: TaskDefinition[]): string[] | null {
  const defMap = new Map(definitions.map(d => [d.id, d]));
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycle: string[] = [];

  function dfs(id: string, path: string[]): boolean {
    if (recursionStack.has(id)) {
      const cycleStart = path.indexOf(id);
      cycle.push(...path.slice(cycleStart), id);
      return true;
    }
    if (visited.has(id)) return false;

    visited.add(id);
    recursionStack.add(id);

    const def = defMap.get(id);
    if (def) {
      for (const depId of def.dependencies) {
        if (dfs(depId, [...path, id])) return true;
      }
    }

    recursionStack.delete(id);
    return false;
  }

  for (const def of definitions) {
    if (!visited.has(def.id)) {
      if (dfs(def.id, [])) {
        return cycle;
      }
    }
  }

  return null;
}

// Calcula data de início baseado nas dependências
export function calculateStartDate(
  definition: TaskDefinition,
  allDefinitions: TaskDefinition[],
  executionMap: Map<string, TaskExecution>,
  cycleStartDate: Date
): Date {
  if (definition.dependencies.length === 0) {
    return cycleStartDate;
  }

  let latestEndDate = cycleStartDate;

  for (const depId of definition.dependencies) {
    const depExecution = executionMap.get(depId);
    if (depExecution) {
      const depEndDate = parseISO(depExecution.endDate);
      if (isAfter(depEndDate, latestEndDate)) {
        latestEndDate = depEndDate;
      }
    }
  }

  // Início é o dia após a conclusão da última predecessora
  return addDays(latestEndDate, 1);
}

// Calcula data de fim baseado na duração
export function calculateEndDate(startDate: Date, durationDays: number): Date {
  return addDays(startDate, Math.max(0, durationDays - 1));
}

// Recalcula todas as datas das execuções de um board
export function recalculateSchedule(
  definitions: TaskDefinition[],
  executions: TaskExecution[],
  cycleStartDate: Date
): TaskExecution[] {
  // Filtra apenas as definições que têm execuções
  const relevantDefIds = new Set(executions.map(e => e.taskDefinitionId));
  const relevantDefs = definitions.filter(d => relevantDefIds.has(d.id));
  
  // Ordena topologicamente
  const sortedDefs = topologicalSort(relevantDefs);
  
  // Mapa de execuções por taskDefinitionId
  const executionMap = new Map<string, TaskExecution>();
  executions.forEach(e => executionMap.set(e.taskDefinitionId, e));
  
  const updatedExecutions: TaskExecution[] = [];
  
  for (const def of sortedDefs) {
    const execution = executionMap.get(def.id);
    if (!execution) continue;
    
    const startDate = calculateStartDate(def, sortedDefs, executionMap, cycleStartDate);
    const endDate = calculateEndDate(startDate, def.durationDays);
    
    const updatedExecution: TaskExecution = {
      ...execution,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    updatedExecutions.push(updatedExecution);
    executionMap.set(def.id, updatedExecution);
  }
  
  return updatedExecutions;
}

// Cria execuções para um novo ciclo
export function createExecutionsForCycle(
  board: Board,
  cycle: MonthlyCycle,
  definitions: TaskDefinition[]
): TaskExecution[] {
  const now = new Date().toISOString();
  const cycleStartDate = parseISO(cycle.startDate);
  
  // Filtra definições relevantes para o board
  const boardDefs = definitions.filter(d => board.taskDefinitionIds.includes(d.id));
  
  // Ordena topologicamente
  const sortedDefs = topologicalSort(boardDefs);
  
  // Cria execuções
  const executions: TaskExecution[] = [];
  const executionMap = new Map<string, TaskExecution>();
  
  sortedDefs.forEach((def, index) => {
    const startDate = calculateStartDate(def, sortedDefs, executionMap, cycleStartDate);
    const endDate = calculateEndDate(startDate, def.durationDays);
    
    const execution: TaskExecution = {
      id: generateId(),
      taskDefinitionId: def.id,
      boardId: board.id,
      cycleId: cycle.id,
      status: 'not-started',
      progress: 0,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      order: index,
      createdAt: now,
      updatedAt: now,
    };
    
    executions.push(execution);
    executionMap.set(def.id, execution);
  });
  
  return executions;
}

// Verifica se precisa criar um novo ciclo
export function shouldCreateNewCycle(cycle: MonthlyCycle | undefined): boolean {
  if (!cycle) return true;
  
  const today = new Date();
  const cycleEndDate = parseISO(cycle.endDate);
  
  return !isBefore(today, cycleEndDate);
}

// Obtém ano e mês atual
export function getCurrentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

// Formata nome do ciclo
export function formatCycleName(cycle: MonthlyCycle): string {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return `${monthNames[cycle.month - 1]} ${cycle.year}`;
}

// Calcula estatísticas de um ciclo
export function calculateCycleStats(executions: TaskExecution[]) {
  const total = executions.length;
  const completed = executions.filter(e => e.status === 'completed').length;
  const inProgress = executions.filter(e => e.status === 'in-progress').length;
  const notStarted = executions.filter(e => e.status === 'not-started').length;
  const overdue = executions.filter(e => {
    const endDate = parseISO(e.endDate);
    return e.status !== 'completed' && isBefore(endDate, new Date());
  }).length;
  
  const totalProgress = executions.reduce((sum, e) => sum + e.progress, 0);
  const averageProgress = total > 0 ? Math.round(totalProgress / total) : 0;
  
  return {
    total,
    completed,
    inProgress,
    notStarted,
    overdue,
    averageProgress,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

// Converte TaskExecution para formato de Task legado (para compatibilidade com componentes existentes)
export function executionToLegacyTask(
  execution: TaskExecution,
  definition: TaskDefinition
): {
  id: string;
  boardId: string;
  columnId: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  progress: number;
  priority: string;
  assignee?: string;
  dependencies?: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
  // Campos extras
  taskDefinitionId: string;
  status: string;
  durationDays: number;
} {
  return {
    id: execution.id,
    boardId: execution.boardId,
    columnId: execution.status,
    title: definition.name,
    description: definition.description,
    startDate: execution.startDate,
    endDate: execution.endDate,
    progress: execution.progress,
    priority: definition.priority,
    assignee: definition.assignee,
    dependencies: definition.dependencies,
    order: execution.order,
    createdAt: execution.createdAt,
    updatedAt: execution.updatedAt,
    taskDefinitionId: definition.id,
    status: execution.status,
    durationDays: definition.durationDays,
  };
}
