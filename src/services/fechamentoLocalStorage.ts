import { Board, Column, Task, FechamentoData, DEFAULT_COLUMNS } from '@/types/fechamento';

const STORAGE_KEY = 'fechamento-data';

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const getInitialData = (): FechamentoData => {
  const now = new Date().toISOString();
  const boardId = generateId();
  
  return {
    boards: [
      {
        id: boardId,
        name: 'Fechamento Mensal',
        description: 'Quadro principal de acompanhamento do fechamento',
        columns: DEFAULT_COLUMNS,
        createdAt: now,
        updatedAt: now,
      },
    ],
    tasks: [
      {
        id: generateId(),
        boardId,
        columnId: 'todo',
        title: 'Conciliar extratos bancários',
        description: 'Verificar e conciliar todos os extratos bancários do período',
        startDate: new Date(Date.now() + 86400000).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        progress: 0,
        priority: 'high',
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        boardId,
        columnId: 'todo',
        title: 'Revisar lançamentos contábeis',
        description: 'Conferir todos os lançamentos do mês',
        startDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        progress: 0,
        priority: 'medium',
        order: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        boardId,
        columnId: 'in-progress',
        title: 'Apurar impostos',
        description: 'Calcular e apurar todos os impostos do período',
        startDate: new Date(Date.now() - 86400000).toISOString(),
        endDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        progress: 40,
        priority: 'urgent',
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        boardId,
        columnId: 'review',
        title: 'Gerar balancete',
        description: 'Emitir balancete de verificação',
        startDate: new Date(Date.now() - 86400000 * 3).toISOString(),
        endDate: new Date(Date.now()).toISOString(),
        progress: 80,
        priority: 'medium',
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: generateId(),
        boardId,
        columnId: 'done',
        title: 'Fechar contas de resultado',
        description: 'Encerrar contas de receitas e despesas',
        startDate: new Date(Date.now() - 86400000 * 5).toISOString(),
        endDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        progress: 100,
        priority: 'high',
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
};

export const fechamentoService = {
  getData(): FechamentoData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
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

  // Board operations
  getBoards(): Board[] {
    return this.getData().boards;
  },

  getBoard(id: string): Board | undefined {
    return this.getData().boards.find((b) => b.id === id);
  },

  createBoard(name: string, description?: string): Board {
    const data = this.getData();
    const now = new Date().toISOString();
    const newBoard: Board = {
      id: generateId(),
      name,
      description,
      columns: DEFAULT_COLUMNS,
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
    data.tasks = data.tasks.filter((t) => t.boardId !== id);
    this.saveData(data);
    return true;
  },

  // Task operations
  getTasks(boardId: string): Task[] {
    return this.getData().tasks.filter((t) => t.boardId === boardId);
  },

  getTask(id: string): Task | undefined {
    return this.getData().tasks.find((t) => t.id === id);
  },

  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task {
    const data = this.getData();
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    data.tasks.push(newTask);
    this.saveData(data);
    return newTask;
  },

  updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Task | undefined {
    const data = this.getData();
    const index = data.tasks.findIndex((t) => t.id === id);
    if (index === -1) return undefined;
    
    data.tasks[index] = {
      ...data.tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData(data);
    return data.tasks[index];
  },

  deleteTask(id: string): boolean {
    const data = this.getData();
    const index = data.tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;
    
    data.tasks.splice(index, 1);
    this.saveData(data);
    return true;
  },

  moveTask(taskId: string, newColumnId: string, newOrder: number): Task | undefined {
    const data = this.getData();
    const taskIndex = data.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return undefined;

    const task = data.tasks[taskIndex];
    const oldColumnId = task.columnId;

    // Update orders of tasks in old column
    if (oldColumnId !== newColumnId) {
      data.tasks
        .filter((t) => t.boardId === task.boardId && t.columnId === oldColumnId && t.order > task.order)
        .forEach((t) => t.order--);
    }

    // Update orders of tasks in new column
    data.tasks
      .filter((t) => t.boardId === task.boardId && t.columnId === newColumnId && t.order >= newOrder)
      .forEach((t) => t.order++);

    // Update the task
    data.tasks[taskIndex] = {
      ...task,
      columnId: newColumnId,
      order: newOrder,
      updatedAt: new Date().toISOString(),
    };

    this.saveData(data);
    return data.tasks[taskIndex];
  },

  reorderTasks(boardId: string, columnId: string, taskIds: string[]): void {
    const data = this.getData();
    taskIds.forEach((taskId, index) => {
      const taskIndex = data.tasks.findIndex((t) => t.id === taskId);
      if (taskIndex !== -1) {
        data.tasks[taskIndex].order = index;
        data.tasks[taskIndex].columnId = columnId;
        data.tasks[taskIndex].updatedAt = new Date().toISOString();
      }
    });
    this.saveData(data);
  },
};
