import { 
  Board, Column, Task, TaskDefinition, TaskExecution, MonthlyCycle, 
  FechamentoData, DEFAULT_COLUMNS, BoardType, TaskStatus 
} from '@/types/fechamento';
import { 
  generateId, getCycleDates, recalculateSchedule, createExecutionsForCycle,
  shouldCreateNewCycle, getCurrentYearMonth, topologicalSort
} from '@/utils/fechamentoCalculations';

const STORAGE_KEY = 'fechamento-data-v2';

const getInitialData = (): FechamentoData => {
  const now = new Date().toISOString();
  
  // Definições de tarefas padrão
  const def1: TaskDefinition = {
    id: generateId(),
    name: 'Conciliar extratos bancários',
    description: 'Verificar e conciliar todos os extratos bancários do período',
    durationDays: 3,
    dependencies: [],
    priority: 'high',
    isRecurring: true,
    createdAt: now,
    updatedAt: now,
  };
  
  const def2: TaskDefinition = {
    id: generateId(),
    name: 'Revisar lançamentos contábeis',
    description: 'Conferir todos os lançamentos do mês',
    durationDays: 4,
    dependencies: [],
    priority: 'medium',
    isRecurring: true,
    createdAt: now,
    updatedAt: now,
  };
  
  const def3: TaskDefinition = {
    id: generateId(),
    name: 'Apurar impostos',
    description: 'Calcular e apurar todos os impostos do período',
    durationDays: 3,
    dependencies: [def1.id, def2.id],
    priority: 'urgent',
    isRecurring: true,
    createdAt: now,
    updatedAt: now,
  };
  
  const def4: TaskDefinition = {
    id: generateId(),
    name: 'Gerar balancete',
    description: 'Emitir balancete de verificação',
    durationDays: 2,
    dependencies: [def3.id],
    priority: 'high',
    isRecurring: true,
    createdAt: now,
    updatedAt: now,
  };
  
  const def5: TaskDefinition = {
    id: generateId(),
    name: 'Fechar contas de resultado',
    description: 'Encerrar contas de receitas e despesas',
    durationDays: 2,
    dependencies: [def4.id],
    priority: 'high',
    isRecurring: true,
    createdAt: now,
    updatedAt: now,
  };
  
  const taskDefinitions = [def1, def2, def3, def4, def5];
  
  // Board padrão
  const boardId = generateId();
  const { year, month } = getCurrentYearMonth();
  const { startDate, endDate } = getCycleDates(year, month);
  
  const cycleId = generateId();
  const cycle: MonthlyCycle = {
    id: cycleId,
    boardId,
    year,
    month,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: 'active',
    createdAt: now,
  };
  
  const board: Board = {
    id: boardId,
    name: 'Fechamento Mensal',
    description: 'Quadro principal de acompanhamento do fechamento',
    type: 'recurring',
    columns: DEFAULT_COLUMNS,
    taskDefinitionIds: taskDefinitions.map(d => d.id),
    currentCycleId: cycleId,
    createdAt: now,
    updatedAt: now,
  };
  
  // Criar execuções para o ciclo
  const taskExecutions = createExecutionsForCycle(board, cycle, taskDefinitions);
  
  return {
    boards: [board],
    tasks: [], // Legado - vazio
    taskDefinitions,
    taskExecutions,
    monthlyCycles: [cycle],
  };
};

// Migração de dados antigos
const migrateData = (data: any): FechamentoData => {
  // Se já tem a nova estrutura, retorna
  if (data.taskDefinitions && data.taskExecutions && data.monthlyCycles) {
    // Garante que boards têm os novos campos
    data.boards = data.boards.map((b: any) => ({
      ...b,
      type: b.type || 'recurring',
      taskDefinitionIds: b.taskDefinitionIds || [],
      columns: b.columns || DEFAULT_COLUMNS,
    }));
    return data;
  }
  
  // Migra de versão antiga
  const now = new Date().toISOString();
  const { year, month } = getCurrentYearMonth();
  
  const newData: FechamentoData = {
    boards: [],
    tasks: data.tasks || [],
    taskDefinitions: [],
    taskExecutions: [],
    monthlyCycles: [],
  };
  
  // Migra boards
  for (const oldBoard of (data.boards || [])) {
    const boardId = oldBoard.id;
    const { startDate, endDate } = getCycleDates(year, month);
    
    const cycleId = generateId();
    const cycle: MonthlyCycle = {
      id: cycleId,
      boardId,
      year,
      month,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active',
      createdAt: now,
    };
    newData.monthlyCycles.push(cycle);
    
    // Migra tasks antigas para TaskDefinitions e Executions
    const boardTasks = (data.tasks || []).filter((t: any) => t.boardId === boardId);
    const defIds: string[] = [];
    
    for (const task of boardTasks) {
      const defId = generateId();
      const def: TaskDefinition = {
        id: defId,
        name: task.title,
        description: task.description,
        durationDays: task.startDate && task.endDate 
          ? Math.max(1, Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)))
          : 1,
        dependencies: [],
        assignee: task.assignee,
        priority: task.priority || 'medium',
        isRecurring: true,
        createdAt: task.createdAt || now,
        updatedAt: now,
      };
      newData.taskDefinitions.push(def);
      defIds.push(defId);
      
      // Mapeia columnId para status
      let status: TaskStatus = 'not-started';
      if (task.columnId === 'in-progress' || task.columnId === 'review') {
        status = 'in-progress';
      } else if (task.columnId === 'done' || task.columnId === 'completed') {
        status = 'completed';
      }
      
      const exec: TaskExecution = {
        id: generateId(),
        taskDefinitionId: defId,
        boardId,
        cycleId,
        status,
        progress: task.progress || 0,
        startDate: task.startDate || startDate.toISOString(),
        endDate: task.endDate || endDate.toISOString(),
        order: task.order || 0,
        createdAt: task.createdAt || now,
        updatedAt: now,
      };
      newData.taskExecutions.push(exec);
    }
    
    const newBoard: Board = {
      id: boardId,
      name: oldBoard.name,
      description: oldBoard.description,
      type: 'recurring',
      columns: DEFAULT_COLUMNS,
      taskDefinitionIds: defIds,
      currentCycleId: cycleId,
      createdAt: oldBoard.createdAt || now,
      updatedAt: now,
    };
    newData.boards.push(newBoard);
  }
  
  return newData;
};

export const fechamentoService = {
  getData(): FechamentoData {
    try {
      // Tenta carregar versão nova
      let stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return migrateData(JSON.parse(stored));
      }
      
      // Tenta carregar versão antiga
      stored = localStorage.getItem('fechamento-data');
      if (stored) {
        const migrated = migrateData(JSON.parse(stored));
        this.saveData(migrated);
        localStorage.removeItem('fechamento-data');
        return migrated;
      }
    } catch (error) {
      console.error('Erro ao carregar dados do fechamento:', error);
    }
    
    const initialData = getInitialData();
    this.saveData(initialData);
    return initialData;
  },

  saveData(data: FechamentoData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar dados do fechamento:', error);
    }
  },

  // ============ BOARD OPERATIONS ============
  getBoards(): Board[] {
    return this.getData().boards;
  },

  getBoard(id: string): Board | undefined {
    return this.getData().boards.find((b) => b.id === id);
  },

  createBoard(name: string, description: string | undefined, type: BoardType): Board {
    const data = this.getData();
    const now = new Date().toISOString();
    const boardId = generateId();
    
    let currentCycleId: string | undefined;
    
    if (type === 'recurring') {
      const { year, month } = getCurrentYearMonth();
      const { startDate, endDate } = getCycleDates(year, month);
      
      const cycle: MonthlyCycle = {
        id: generateId(),
        boardId,
        year,
        month,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'active',
        createdAt: now,
      };
      data.monthlyCycles.push(cycle);
      currentCycleId = cycle.id;
    }
    
    const newBoard: Board = {
      id: boardId,
      name,
      description,
      type,
      columns: DEFAULT_COLUMNS,
      taskDefinitionIds: [],
      currentCycleId,
      createdAt: now,
      updatedAt: now,
    };
    
    data.boards.push(newBoard);
    this.saveData(data);
    return newBoard;
  },

  updateBoard(id: string, updates: Partial<Pick<Board, 'name' | 'description' | 'columns'>>): Board | undefined {
    const data = this.getData();
    const index = data.boards.findIndex((b) => b.id === id);
    if (index === -1) return undefined;
    
    data.boards[index] = {
      ...data.boards[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData(data);
    return data.boards[index];
  },

  deleteBoard(id: string): boolean {
    const data = this.getData();
    const index = data.boards.findIndex((b) => b.id === id);
    if (index === -1) return false;
    
    data.boards.splice(index, 1);
    data.taskExecutions = data.taskExecutions.filter((e) => e.boardId !== id);
    data.monthlyCycles = data.monthlyCycles.filter((c) => c.boardId !== id);
    this.saveData(data);
    return true;
  },

  // ============ TASK DEFINITION OPERATIONS ============
  getTaskDefinitions(): TaskDefinition[] {
    return this.getData().taskDefinitions;
  },

  getTaskDefinition(id: string): TaskDefinition | undefined {
    return this.getData().taskDefinitions.find((d) => d.id === id);
  },

  createTaskDefinition(def: Omit<TaskDefinition, 'id' | 'createdAt' | 'updatedAt'>): TaskDefinition {
    const data = this.getData();
    const now = new Date().toISOString();
    
    const newDef: TaskDefinition = {
      ...def,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    
    data.taskDefinitions.push(newDef);
    this.saveData(data);
    return newDef;
  },

  updateTaskDefinition(id: string, updates: Partial<Omit<TaskDefinition, 'id' | 'createdAt'>>): TaskDefinition | undefined {
    const data = this.getData();
    const index = data.taskDefinitions.findIndex((d) => d.id === id);
    if (index === -1) return undefined;
    
    data.taskDefinitions[index] = {
      ...data.taskDefinitions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    this.saveData(data);
    return data.taskDefinitions[index];
  },

  deleteTaskDefinition(id: string): boolean {
    const data = this.getData();
    const index = data.taskDefinitions.findIndex((d) => d.id === id);
    if (index === -1) return false;
    
    // Remove das definições
    data.taskDefinitions.splice(index, 1);
    
    // Remove dos boards
    data.boards.forEach(board => {
      board.taskDefinitionIds = board.taskDefinitionIds.filter(defId => defId !== id);
    });
    
    // Remove dependências em outras definições
    data.taskDefinitions.forEach(def => {
      def.dependencies = def.dependencies.filter(depId => depId !== id);
    });
    
    // Remove execuções
    data.taskExecutions = data.taskExecutions.filter(e => e.taskDefinitionId !== id);
    
    this.saveData(data);
    return true;
  },

  // ============ TASK EXECUTION OPERATIONS ============
  getExecutions(boardId: string, cycleId?: string): TaskExecution[] {
    const data = this.getData();
    return data.taskExecutions.filter(e => 
      e.boardId === boardId && 
      (cycleId === undefined || e.cycleId === cycleId)
    );
  },

  getExecution(id: string): TaskExecution | undefined {
    return this.getData().taskExecutions.find((e) => e.id === id);
  },

  createExecution(boardId: string, taskDefId: string, cycleId?: string): TaskExecution {
    const data = this.getData();
    const now = new Date().toISOString();
    const def = data.taskDefinitions.find(d => d.id === taskDefId);
    
    const board = data.boards.find(b => b.id === boardId);
    const cycle = cycleId ? data.monthlyCycles.find(c => c.id === cycleId) : undefined;
    const cycleStart = cycle ? new Date(cycle.startDate) : new Date();
    
    // Calcula datas
    const startDate = cycleStart;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (def?.durationDays || 1) - 1);
    
    const executions = this.getExecutions(boardId, cycleId);
    
    const newExec: TaskExecution = {
      id: generateId(),
      taskDefinitionId: taskDefId,
      boardId,
      cycleId,
      status: 'not-started',
      progress: 0,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      order: executions.length,
      createdAt: now,
      updatedAt: now,
    };
    
    data.taskExecutions.push(newExec);
    this.saveData(data);
    
    // Recalcula schedule
    this.recalculateBoardSchedule(boardId, cycleId);
    
    return newExec;
  },

  updateExecution(id: string, updates: Partial<Omit<TaskExecution, 'id' | 'createdAt'>>): TaskExecution | undefined {
    const data = this.getData();
    const index = data.taskExecutions.findIndex((e) => e.id === id);
    if (index === -1) return undefined;
    
    const execution = data.taskExecutions[index];
    
    // Se o status mudou para completed, registra data real
    if (updates.status === 'completed' && execution.status !== 'completed') {
      updates.actualEndDate = new Date().toISOString();
      updates.progress = 100;
    }
    
    // Se o status mudou para in-progress e não tinha data real de início
    if (updates.status === 'in-progress' && execution.status === 'not-started' && !execution.actualStartDate) {
      updates.actualStartDate = new Date().toISOString();
    }
    
    data.taskExecutions[index] = {
      ...execution,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    this.saveData(data);
    return data.taskExecutions[index];
  },

  deleteExecution(id: string): boolean {
    const data = this.getData();
    const index = data.taskExecutions.findIndex((e) => e.id === id);
    if (index === -1) return false;
    
    data.taskExecutions.splice(index, 1);
    this.saveData(data);
    return true;
  },

  // ============ MONTHLY CYCLE OPERATIONS ============
  getCycles(boardId: string): MonthlyCycle[] {
    return this.getData().monthlyCycles.filter(c => c.boardId === boardId);
  },

  getCurrentCycle(boardId: string): MonthlyCycle | undefined {
    const board = this.getBoard(boardId);
    if (!board?.currentCycleId) return undefined;
    return this.getData().monthlyCycles.find(c => c.id === board.currentCycleId);
  },

  createCycle(boardId: string, year: number, month: number): MonthlyCycle {
    const data = this.getData();
    const now = new Date().toISOString();
    const { startDate, endDate } = getCycleDates(year, month);
    
    const cycle: MonthlyCycle = {
      id: generateId(),
      boardId,
      year,
      month,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      status: 'active',
      createdAt: now,
    };
    
    data.monthlyCycles.push(cycle);
    
    // Atualiza currentCycleId do board
    const boardIndex = data.boards.findIndex(b => b.id === boardId);
    if (boardIndex !== -1) {
      data.boards[boardIndex].currentCycleId = cycle.id;
      data.boards[boardIndex].updatedAt = now;
    }
    
    this.saveData(data);
    return cycle;
  },

  completeCycle(cycleId: string): MonthlyCycle | undefined {
    const data = this.getData();
    const index = data.monthlyCycles.findIndex(c => c.id === cycleId);
    if (index === -1) return undefined;
    
    data.monthlyCycles[index] = {
      ...data.monthlyCycles[index],
      status: 'completed',
      completedAt: new Date().toISOString(),
    };
    
    this.saveData(data);
    return data.monthlyCycles[index];
  },

  // ============ BOARD-TASK ASSOCIATIONS ============
  addTaskToBoard(boardId: string, taskDefinitionId: string): void {
    const data = this.getData();
    const boardIndex = data.boards.findIndex(b => b.id === boardId);
    if (boardIndex === -1) return;
    
    const board = data.boards[boardIndex];
    if (!board.taskDefinitionIds.includes(taskDefinitionId)) {
      board.taskDefinitionIds.push(taskDefinitionId);
      board.updatedAt = new Date().toISOString();
      
      // Cria execução para o ciclo atual
      const currentCycle = this.getCurrentCycle(boardId);
      if (currentCycle) {
        this.createExecution(boardId, taskDefinitionId, currentCycle.id);
      }
      
      this.saveData(data);
    }
  },

  removeTaskFromBoard(boardId: string, taskDefinitionId: string): void {
    const data = this.getData();
    const boardIndex = data.boards.findIndex(b => b.id === boardId);
    if (boardIndex === -1) return;
    
    const board = data.boards[boardIndex];
    board.taskDefinitionIds = board.taskDefinitionIds.filter(id => id !== taskDefinitionId);
    board.updatedAt = new Date().toISOString();
    
    // Remove execuções associadas
    data.taskExecutions = data.taskExecutions.filter(e => 
      !(e.boardId === boardId && e.taskDefinitionId === taskDefinitionId)
    );
    
    this.saveData(data);
  },

  // ============ SCHEDULE CALCULATIONS ============
  recalculateBoardSchedule(boardId: string, cycleId?: string): void {
    const data = this.getData();
    const board = data.boards.find(b => b.id === boardId);
    if (!board) return;
    
    const effectiveCycleId = cycleId || board.currentCycleId;
    const cycle = data.monthlyCycles.find(c => c.id === effectiveCycleId);
    if (!cycle) return;
    
    const executions = data.taskExecutions.filter(e => 
      e.boardId === boardId && e.cycleId === effectiveCycleId
    );
    
    const cycleStartDate = new Date(cycle.startDate);
    const updatedExecutions = recalculateSchedule(data.taskDefinitions, executions, cycleStartDate);
    
    // Atualiza execuções
    for (const updated of updatedExecutions) {
      const index = data.taskExecutions.findIndex(e => e.id === updated.id);
      if (index !== -1) {
        data.taskExecutions[index] = updated;
      }
    }
    
    this.saveData(data);
  },

  // ============ MONTHLY RESET ============
  checkMonthlyReset(): void {
    const data = this.getData();
    const { year, month } = getCurrentYearMonth();
    
    for (const board of data.boards) {
      if (board.type !== 'recurring') continue;
      
      const currentCycle = data.monthlyCycles.find(c => c.id === board.currentCycleId);
      
      if (shouldCreateNewCycle(currentCycle)) {
        // Completa ciclo anterior
        if (currentCycle) {
          this.completeCycle(currentCycle.id);
        }
        
        // Cria novo ciclo
        const newCycle = this.createCycle(board.id, year, month);
        
        // Cria novas execuções
        const executions = createExecutionsForCycle(
          board, 
          newCycle, 
          data.taskDefinitions.filter(d => board.taskDefinitionIds.includes(d.id))
        );
        
        data.taskExecutions.push(...executions);
      }
    }
    
    this.saveData(data);
  },

  // ============ LEGACY SUPPORT ============
  // Mantém compatibilidade com código antigo
  getTasks(boardId: string): Task[] {
    const data = this.getData();
    const board = data.boards.find(b => b.id === boardId);
    if (!board) return [];
    
    const executions = this.getExecutions(boardId, board.currentCycleId);
    
    return executions.map(exec => {
      const def = data.taskDefinitions.find(d => d.id === exec.taskDefinitionId);
      return {
        id: exec.id,
        boardId: exec.boardId,
        columnId: exec.status,
        title: def?.name || 'Sem título',
        description: def?.description,
        startDate: exec.startDate,
        endDate: exec.endDate,
        progress: exec.progress,
        priority: def?.priority || 'medium',
        assignee: def?.assignee,
        dependencies: def?.dependencies,
        order: exec.order,
        createdAt: exec.createdAt,
        updatedAt: exec.updatedAt,
      };
    });
  },

  getTask(id: string): Task | undefined {
    const data = this.getData();
    const exec = data.taskExecutions.find(e => e.id === id);
    if (!exec) return undefined;
    
    const def = data.taskDefinitions.find(d => d.id === exec.taskDefinitionId);
    
    return {
      id: exec.id,
      boardId: exec.boardId,
      columnId: exec.status,
      title: def?.name || 'Sem título',
      description: def?.description,
      startDate: exec.startDate,
      endDate: exec.endDate,
      progress: exec.progress,
      priority: def?.priority || 'medium',
      assignee: def?.assignee,
      dependencies: def?.dependencies,
      order: exec.order,
      createdAt: exec.createdAt,
      updatedAt: exec.updatedAt,
    };
  },

  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const data = this.getData();
    const now = new Date().toISOString();
    
    // Cria TaskDefinition
    const def: TaskDefinition = {
      id: generateId(),
      name: task.title,
      description: task.description,
      durationDays: task.startDate && task.endDate 
        ? Math.max(1, Math.ceil((new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 1,
      dependencies: task.dependencies || [],
      assignee: task.assignee,
      priority: task.priority,
      isRecurring: true,
      createdAt: now,
      updatedAt: now,
    };
    
    data.taskDefinitions.push(def);
    
    // Adiciona ao board
    const board = data.boards.find(b => b.id === task.boardId);
    if (board) {
      board.taskDefinitionIds.push(def.id);
      board.updatedAt = now;
    }
    
    // Cria TaskExecution
    let status: TaskStatus = 'not-started';
    if (task.columnId === 'in-progress') {
      status = 'in-progress';
    } else if (task.columnId === 'done' || task.columnId === 'completed') {
      status = 'completed';
    }
    
    const exec: TaskExecution = {
      id: generateId(),
      taskDefinitionId: def.id,
      boardId: task.boardId,
      cycleId: board?.currentCycleId,
      status,
      progress: task.progress,
      startDate: task.startDate || now,
      endDate: task.endDate || now,
      order: task.order,
      createdAt: now,
      updatedAt: now,
    };
    
    data.taskExecutions.push(exec);
    this.saveData(data);
    
    // Recalcula schedule
    if (board) {
      this.recalculateBoardSchedule(board.id, board.currentCycleId);
    }
    
    return {
      ...task,
      id: exec.id,
      createdAt: now,
      updatedAt: now,
    };
  },

  updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Task | undefined {
    const data = this.getData();
    const exec = data.taskExecutions.find(e => e.id === id);
    if (!exec) return undefined;
    
    const def = data.taskDefinitions.find(d => d.id === exec.taskDefinitionId);
    if (!def) return undefined;
    
    // Atualiza TaskDefinition se necessário
    if (updates.title || updates.description || updates.priority || updates.assignee) {
      const defIndex = data.taskDefinitions.findIndex(d => d.id === exec.taskDefinitionId);
      if (defIndex !== -1) {
        data.taskDefinitions[defIndex] = {
          ...data.taskDefinitions[defIndex],
          name: updates.title ?? data.taskDefinitions[defIndex].name,
          description: updates.description ?? data.taskDefinitions[defIndex].description,
          priority: updates.priority ?? data.taskDefinitions[defIndex].priority,
          assignee: updates.assignee ?? data.taskDefinitions[defIndex].assignee,
          updatedAt: new Date().toISOString(),
        };
      }
    }
    
    // Atualiza TaskExecution
    const execIndex = data.taskExecutions.findIndex(e => e.id === id);
    if (execIndex !== -1) {
      let status: TaskStatus = exec.status;
      if (updates.columnId) {
        if (updates.columnId === 'in-progress') {
          status = 'in-progress';
        } else if (updates.columnId === 'done' || updates.columnId === 'completed') {
          status = 'completed';
        } else if (updates.columnId === 'not-started' || updates.columnId === 'todo') {
          status = 'not-started';
        }
      }
      
      data.taskExecutions[execIndex] = {
        ...exec,
        status,
        progress: updates.progress ?? exec.progress,
        startDate: updates.startDate ?? exec.startDate,
        endDate: updates.endDate ?? exec.endDate,
        updatedAt: new Date().toISOString(),
      };
    }
    
    this.saveData(data);
    
    return this.getTask(id);
  },

  deleteTask(id: string): boolean {
    const data = this.getData();
    const exec = data.taskExecutions.find(e => e.id === id);
    if (!exec) return false;
    
    // Remove execução
    data.taskExecutions = data.taskExecutions.filter(e => e.id !== id);
    
    // Verifica se há outras execuções usando a mesma definição
    const otherExecs = data.taskExecutions.filter(e => e.taskDefinitionId === exec.taskDefinitionId);
    
    // Se não há outras execuções, remove a definição também
    if (otherExecs.length === 0) {
      data.taskDefinitions = data.taskDefinitions.filter(d => d.id !== exec.taskDefinitionId);
      
      // Remove dos boards
      data.boards.forEach(board => {
        board.taskDefinitionIds = board.taskDefinitionIds.filter(defId => defId !== exec.taskDefinitionId);
      });
    }
    
    this.saveData(data);
    return true;
  },

  moveTask(taskId: string, newColumnId: string, newOrder: number): Task | undefined {
    let status: TaskStatus = 'not-started';
    if (newColumnId === 'in-progress') {
      status = 'in-progress';
    } else if (newColumnId === 'done' || newColumnId === 'completed') {
      status = 'completed';
    }
    
    this.updateExecution(taskId, { status, order: newOrder });
    return this.getTask(taskId);
  },

  reorderTasks(boardId: string, columnId: string, taskIds: string[]): void {
    const data = this.getData();
    taskIds.forEach((taskId, index) => {
      const execIndex = data.taskExecutions.findIndex(e => e.id === taskId);
      if (execIndex !== -1) {
        let status: TaskStatus = 'not-started';
        if (columnId === 'in-progress') {
          status = 'in-progress';
        } else if (columnId === 'done' || columnId === 'completed') {
          status = 'completed';
        }
        
        data.taskExecutions[execIndex].status = status;
        data.taskExecutions[execIndex].order = index;
        data.taskExecutions[execIndex].updatedAt = new Date().toISOString();
      }
    });
    this.saveData(data);
  },
};
