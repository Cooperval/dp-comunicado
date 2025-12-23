import { useState } from 'react';
import { Project, Board, Column, Card, User } from '@/types';

// Mock data for demonstration
const initialProjects: Project[] = [
  {
    id: 'project-1',
    name: 'Safra 2024/2025',
    description: 'Planejamento completo da safra 2024/2025 com foco em produtividade e sustentabilidade',
    projectType: 'acompanhamento',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    deadline: new Date('2024-12-31'),
    members: [
      {
        id: 'user-1',
        name: 'João Silva',
        email: 'joao.silva@sugarflow.com',
        role: 'admin'
      },
      {
        id: 'user-2',
        name: 'Maria Santos',
        email: 'maria.santos@sugarflow.com',
        role: 'manager'
      },
      {
        id: 'user-3',
        name: 'Pedro Costa',
        email: 'pedro.costa@sugarflow.com',
        role: 'collaborator'
      }
    ],
    boardId: 'board-1'
  },
  {
    id: 'project-2',
    name: 'Fechamento Dezembro 2024',
    description: 'Fechamento contábil e financeiro do mês de dezembro com todas as conciliações e apurações',
    projectType: 'fechamento',
    closingMonth: 12,
    closingYear: 2024,
    baseStartDate: new Date('2024-12-01'),
    createdAt: new Date('2024-12-01'),
    updatedAt: new Date('2024-12-10'),
    deadline: new Date('2024-12-20'),
    members: [
      {
        id: 'user-1',
        name: 'João Silva',
        email: 'joao.silva@sugarflow.com',
        role: 'admin'
      },
      {
        id: 'user-2',
        name: 'Maria Santos',
        email: 'maria.santos@sugarflow.com',
        role: 'manager'
      },
      {
        id: 'user-3',
        name: 'Pedro Costa',
        email: 'pedro.costa@sugarflow.com',
        role: 'collaborator'
      },
      {
        id: 'user-4',
        name: 'Ana Oliveira',
        email: 'ana.oliveira@sugarflow.com',
        role: 'manager'
      }
    ],
    boardId: 'board-2'
  }
];

const initialBoards: Record<string, Board> = {
  'board-1': {
    id: 'board-1',
    projectId: 'project-1',
    columns: [
      {
        id: 'col-1',
        title: 'Planejamento',
        position: 0,
        boardId: 'board-1',
        backgroundColor: '#fef3c7',
        titleColor: '#92400e',
        cards: [
          {
            id: 'card-1',
            title: 'Análise de Solo',
            description: 'Realizar análise completa da fertilidade e composição do solo',
            value: 15000,
            valueType: 'currency',
            columnId: 'col-1',
            position: 0,
            createdAt: new Date('2024-01-16'),
            updatedAt: new Date('2024-01-16'),
            priority: 'high',
            titleColor: '#dc2626',
            startDate: new Date('2024-03-01'),
            endDate: new Date('2024-03-15')
          },
          {
            id: 'card-2',
            title: 'Preparação de Mudas',
            description: 'Preparar mudas para 500 hectares',
            value: 500,
            valueType: 'hectares',
            columnId: 'col-1',
            position: 1,
            createdAt: new Date('2024-01-17'),
            updatedAt: new Date('2024-01-17'),
            priority: 'medium',
            titleColor: '#059669',
            startDate: new Date('2024-03-10'),
            endDate: new Date('2024-04-30')
          }
        ]
      },
      {
        id: 'col-2',
        title: 'Em Andamento',
        position: 1,
        boardId: 'board-1',
        backgroundColor: '#dbeafe',
        titleColor: '#1d4ed8',
        cards: [
          {
            id: 'card-3',
            title: 'Plantio Mecanizado',
            description: 'Plantio nas áreas do setor Norte',
            value: 1200,
            valueType: 'tons',
            columnId: 'col-2',
            position: 0,
            createdAt: new Date('2024-01-18'),
            updatedAt: new Date('2024-01-18'),
            priority: 'high',
            titleColor: '#3b82f6',
            startDate: new Date('2024-04-01'),
            endDate: new Date('2024-05-15')
          }
        ]
      },
      {
        id: 'col-3',
        title: 'Concluído',
        position: 2,
        boardId: 'board-1',
        backgroundColor: '#dcfce7',
        titleColor: '#166534',
        cards: [
          {
            id: 'card-4',
            title: 'Licenciamento Ambiental',
            description: 'Renovação das licenças ambientais',
            value: 100,
            valueType: 'percentage',
            columnId: 'col-3',
            position: 0,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-20'),
            priority: 'low',
            titleColor: '#15803d',
            startDate: new Date('2024-01-15'),
            endDate: new Date('2024-02-28')
          }
        ]
      }
    ]
  },
  'board-2': {
    id: 'board-2',
    projectId: 'project-2',
    columns: [
      {
        id: 'col-todo',
        title: 'A Fazer',
        position: 0,
        boardId: 'board-2',
        closingColumnType: 'todo',
        isFixed: true,
        backgroundColor: '#fef3c7',
        titleColor: '#92400e',
        cards: [
          {
            id: 'card-todo-1',
            title: 'Conciliação de Contas a Receber',
            description: 'Verificar e conciliar todos os recebimentos do mês com os lançamentos contábeis',
            value: 2500000,
            valueType: 'currency',
            columnId: 'col-todo',
            position: 0,
            createdAt: new Date('2024-12-01'),
            updatedAt: new Date('2024-12-01'),
            priority: 'high',
            titleColor: '#dc2626',
            startDate: new Date('2024-12-12'),
            endDate: new Date('2024-12-15'),
            assigneeId: 'user-2'
          },
          {
            id: 'card-todo-2',
            title: 'Análise de Provisões',
            description: 'Revisar e ajustar provisões para férias, 13º salário e contingências',
            value: 150000,
            valueType: 'currency',
            columnId: 'col-todo',
            position: 1,
            createdAt: new Date('2024-12-01'),
            updatedAt: new Date('2024-12-01'),
            priority: 'medium',
            titleColor: '#f59e0b',
            startDate: new Date('2024-12-13'),
            endDate: new Date('2024-12-15'),
            assigneeId: 'user-3'
          },
          {
            id: 'card-todo-3',
            title: 'Fechamento de Folha de Pagamento',
            description: 'Processar folha de pagamento completa incluindo horas extras e benefícios',
            value: 1800000,
            valueType: 'currency',
            columnId: 'col-todo',
            position: 2,
            createdAt: new Date('2024-12-01'),
            updatedAt: new Date('2024-12-01'),
            priority: 'high',
            titleColor: '#dc2626',
            startDate: new Date('2024-12-14'),
            endDate: new Date('2024-12-18'),
            assigneeId: 'user-1'
          },
          {
            id: 'card-todo-4',
            title: 'Apuração de Impostos Federais',
            description: 'Calcular e apurar PIS, COFINS, IRPJ e CSLL do período',
            value: 320000,
            valueType: 'currency',
            columnId: 'col-todo',
            position: 3,
            createdAt: new Date('2024-12-01'),
            updatedAt: new Date('2024-12-01'),
            priority: 'high',
            titleColor: '#dc2626',
            startDate: new Date('2024-12-15'),
            endDate: new Date('2024-12-18'),
            dependencyIds: ['card-todo-1'],
            assigneeId: 'user-2'
          },
          {
            id: 'card-todo-5',
            title: 'Conciliação de Estoques',
            description: 'Conciliar estoques físicos com registros contábeis - açúcar, etanol e bagaço',
            value: 45000,
            valueType: 'tons',
            columnId: 'col-todo',
            position: 4,
            createdAt: new Date('2024-12-01'),
            updatedAt: new Date('2024-12-01'),
            priority: 'high',
            titleColor: '#dc2626',
            startDate: new Date('2024-12-12'),
            endDate: new Date('2024-12-17'),
            assigneeId: 'user-4'
          },
          {
            id: 'card-todo-6',
            title: 'Análise de Variação de Custos',
            description: 'Analisar variações de custos industriais vs. orçamento planejado',
            value: 8,
            valueType: 'percentage',
            columnId: 'col-todo',
            position: 5,
            createdAt: new Date('2024-12-01'),
            updatedAt: new Date('2024-12-01'),
            priority: 'medium',
            titleColor: '#f59e0b',
            startDate: new Date('2024-12-17'),
            endDate: new Date('2024-12-19'),
            dependencyIds: ['card-todo-5'],
            assigneeId: 'user-3'
          }
        ]
      },
      {
        id: 'col-progress',
        title: 'Em Andamento',
        position: 1,
        boardId: 'board-2',
        closingColumnType: 'in-progress',
        isFixed: true,
        backgroundColor: '#dbeafe',
        titleColor: '#1d4ed8',
        cards: [
          {
            id: 'card-progress-1',
            title: 'Conciliação Bancária',
            description: 'Conciliar extratos de todas as contas bancárias da empresa',
            value: 5200000,
            valueType: 'currency',
            columnId: 'col-progress',
            position: 0,
            createdAt: new Date('2024-12-05'),
            updatedAt: new Date('2024-12-10'),
            priority: 'high',
            titleColor: '#3b82f6',
            startDate: new Date('2024-12-05'),
            endDate: new Date('2024-12-08'),
            assigneeId: 'user-1'
          },
          {
            id: 'card-progress-2',
            title: 'Fechamento de Contas a Pagar',
            description: 'Processar e registrar todos os pagamentos pendentes do mês',
            value: 3100000,
            valueType: 'currency',
            columnId: 'col-progress',
            position: 1,
            createdAt: new Date('2024-12-05'),
            updatedAt: new Date('2024-12-10'),
            priority: 'high',
            titleColor: '#3b82f6',
            startDate: new Date('2024-12-08'),
            endDate: new Date('2024-12-12'),
            dependencyIds: ['card-progress-1'],
            assigneeId: 'user-2'
          },
          {
            id: 'card-progress-3',
            title: 'Apuração de ICMS',
            description: 'Calcular créditos e débitos de ICMS para apuração mensal',
            value: 280000,
            valueType: 'currency',
            columnId: 'col-progress',
            position: 2,
            createdAt: new Date('2024-12-06'),
            updatedAt: new Date('2024-12-10'),
            priority: 'high',
            titleColor: '#3b82f6',
            startDate: new Date('2024-12-06'),
            endDate: new Date('2024-12-09'),
            assigneeId: 'user-3'
          },
          {
            id: 'card-progress-4',
            title: 'Controle de Ativos Fixos',
            description: 'Atualizar registros de depreciação e novos investimentos',
            value: 12000000,
            valueType: 'currency',
            columnId: 'col-progress',
            position: 3,
            createdAt: new Date('2024-12-05'),
            updatedAt: new Date('2024-12-10'),
            priority: 'medium',
            titleColor: '#3b82f6',
            startDate: new Date('2024-12-05'),
            endDate: new Date('2024-12-07'),
            assigneeId: 'user-4'
          },
          {
            id: 'card-progress-5',
            title: 'Análise de Contratos',
            description: 'Revisar contratos vigentes e provisionar valores de fornecedores',
            value: 890000,
            valueType: 'currency',
            columnId: 'col-progress',
            position: 4,
            createdAt: new Date('2024-12-07'),
            updatedAt: new Date('2024-12-10'),
            priority: 'medium',
            titleColor: '#3b82f6',
            startDate: new Date('2024-12-07'),
            endDate: new Date('2024-12-10'),
            assigneeId: 'user-1'
          },
          {
            id: 'card-progress-6',
            title: 'Rateio de Custos Indiretos',
            description: 'Alocar custos indiretos entre centros de custo da produção',
            value: 420000,
            valueType: 'currency',
            columnId: 'col-progress',
            position: 5,
            createdAt: new Date('2024-12-10'),
            updatedAt: new Date('2024-12-10'),
            priority: 'medium',
            titleColor: '#3b82f6',
            startDate: new Date('2024-12-10'),
            endDate: new Date('2024-12-12'),
            dependencyIds: ['card-todo-5'],
            assigneeId: 'user-2'
          },
          {
            id: 'card-progress-7',
            title: 'Validação de Produção Agrícola',
            description: 'Conferir dados de colheita e transporte de cana-de-açúcar',
            value: 1200,
            valueType: 'hectares',
            columnId: 'col-progress',
            position: 6,
            createdAt: new Date('2024-12-08'),
            updatedAt: new Date('2024-12-10'),
            priority: 'high',
            titleColor: '#3b82f6',
            startDate: new Date('2024-12-08'),
            endDate: new Date('2024-12-11'),
            assigneeId: 'user-4'
          }
        ]
      },
      {
        id: 'col-done',
        title: 'Concluída',
        position: 2,
        boardId: 'board-2',
        closingColumnType: 'done',
        isFixed: true,
        backgroundColor: '#dcfce7',
        titleColor: '#166534',
        cards: [
          {
            id: 'card-done-1',
            title: 'Importação de Extratos Bancários',
            description: 'Importar e processar extratos OFX de todas as contas',
            value: 8500000,
            valueType: 'currency',
            columnId: 'col-done',
            position: 0,
            createdAt: new Date('2024-12-01'),
            updatedAt: new Date('2024-12-02'),
            priority: 'high',
            titleColor: '#15803d',
            startDate: new Date('2024-12-01'),
            endDate: new Date('2024-12-02'),
            assigneeId: 'user-1'
          },
          {
            id: 'card-done-2',
            title: 'Lançamentos de NF-e de Entrada',
            description: 'Registrar todas as notas fiscais de entrada do mês',
            value: 2100000,
            valueType: 'currency',
            columnId: 'col-done',
            position: 1,
            createdAt: new Date('2024-12-02'),
            updatedAt: new Date('2024-12-04'),
            priority: 'high',
            titleColor: '#15803d',
            startDate: new Date('2024-12-02'),
            endDate: new Date('2024-12-04'),
            dependencyIds: ['card-done-1'],
            assigneeId: 'user-3'
          },
          {
            id: 'card-done-3',
            title: 'Fechamento de Caixa',
            description: 'Conferir e fechar movimentações de caixa físico',
            value: 45000,
            valueType: 'currency',
            columnId: 'col-done',
            position: 2,
            createdAt: new Date('2024-12-01'),
            updatedAt: new Date('2024-12-02'),
            priority: 'medium',
            titleColor: '#15803d',
            startDate: new Date('2024-12-01'),
            endDate: new Date('2024-12-02'),
            assigneeId: 'user-2'
          },
          {
            id: 'card-done-4',
            title: 'Conferência de Movimentações',
            description: 'Verificar integridade de todas as movimentações financeiras',
            value: 320,
            valueType: 'numeric',
            columnId: 'col-done',
            position: 3,
            createdAt: new Date('2024-12-02'),
            updatedAt: new Date('2024-12-04'),
            priority: 'medium',
            titleColor: '#15803d',
            startDate: new Date('2024-12-02'),
            endDate: new Date('2024-12-04'),
            dependencyIds: ['card-done-3'],
            assigneeId: 'user-4'
          },
          {
            id: 'card-done-5',
            title: 'Backup de Dados Contábeis',
            description: 'Realizar backup completo dos dados do período anterior',
            value: 100,
            valueType: 'percentage',
            columnId: 'col-done',
            position: 4,
            createdAt: new Date('2024-12-02'),
            updatedAt: new Date('2024-12-03'),
            priority: 'low',
            titleColor: '#15803d',
            startDate: new Date('2024-12-02'),
            endDate: new Date('2024-12-03'),
            assigneeId: 'user-1'
          }
        ]
      }
    ]
  }
};

// Mock users data
const initialUsers: User[] = [
  {
    id: 'user-1',
    name: 'João Silva',
    email: 'joao.silva@sugarflow.com',
    role: 'admin',
    active: true
  },
  {
    id: 'user-2',
    name: 'Maria Santos',
    email: 'maria.santos@sugarflow.com',
    role: 'manager',
    active: true
  },
  {
    id: 'user-3',
    name: 'Pedro Costa',
    email: 'pedro.costa@sugarflow.com',
    role: 'collaborator',
    active: true
  },
  {
    id: 'user-4',
    name: 'Ana Oliveira',
    email: 'ana.oliveira@sugarflow.com',
    role: 'manager',
    active: true
  }
];

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [boards, setBoards] = useState<Record<string, Board>>(initialBoards);
  const [users, setUsers] = useState<User[]>(initialUsers);

  const createProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...projectData,
      id: `project-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Colunas diferentes baseado no tipo de projeto
    const columns: Column[] = projectData.projectType === 'fechamento' 
      ? [
          {
            id: `col-${Date.now()}-1`,
            title: 'A Fazer',
            position: 0,
            boardId: newProject.boardId,
            cards: [],
            closingColumnType: 'todo',
            isFixed: true,
            backgroundColor: '#fef3c7',
            titleColor: '#92400e'
          },
          {
            id: `col-${Date.now()}-2`,
            title: 'Em Andamento',
            position: 1,
            boardId: newProject.boardId,
            cards: [],
            closingColumnType: 'in-progress',
            isFixed: true,
            backgroundColor: '#dbeafe',
            titleColor: '#1d4ed8'
          },
          {
            id: `col-${Date.now()}-3`,
            title: 'Concluída',
            position: 2,
            boardId: newProject.boardId,
            cards: [],
            closingColumnType: 'done',
            isFixed: true,
            backgroundColor: '#dcfce7',
            titleColor: '#166534'
          }
        ]
      : [
          {
            id: `col-${Date.now()}-1`,
            title: 'A Fazer',
            position: 0,
            boardId: newProject.boardId,
            cards: []
          },
          {
            id: `col-${Date.now()}-2`,
            title: 'Em Andamento',
            position: 1,
            boardId: newProject.boardId,
            cards: []
          },
          {
            id: `col-${Date.now()}-3`,
            title: 'Concluído',
            position: 2,
            boardId: newProject.boardId,
            cards: []
          }
        ];

    // Create board for the project
    const newBoard: Board = {
      id: newProject.boardId,
      projectId: newProject.id,
      columns
    };

    setProjects(prev => [...prev, newProject]);
    setBoards(prev => ({
      ...prev,
      [newBoard.id]: newBoard
    }));

    return newProject;
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => 
      prev.map(project => 
        project.id === projectId 
          ? { ...project, ...updates, updatedAt: new Date() }
          : project
      )
    );
  };

  const deleteProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setProjects(prev => prev.filter(p => p.id !== projectId));
      setBoards(prev => {
        const { [project.boardId]: deleted, ...rest } = prev;
        return rest;
      });
    }
  };

  const getBoard = (boardId: string): Board | undefined => {
    return boards[boardId];
  };

  const updateBoard = (boardId: string, board: Board) => {
    setBoards(prev => ({
      ...prev,
      [boardId]: board
    }));
  };

  // User management functions
  const createUser = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      active: true,
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, ...updates }
          : user
      )
    );
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
    
    // Remove user from all projects
    setProjects(prev => 
      prev.map(project => ({
        ...project,
        members: project.members.filter(member => member.id !== userId)
      }))
    );
  };

  const toggleUserStatus = (userId: string, active: boolean) => {
    setUsers(prev => 
      prev.map(user => 
        user.id === userId 
          ? { ...user, active }
          : user
      )
    );

    if (!active) {
      // Remove user from all projects when deactivated
      setProjects(prev => 
        prev.map(project => ({
          ...project,
          members: project.members.filter(member => member.id !== userId)
        }))
      );
    }
  };

  const updateProjectMembers = (projectId: string, members: User[]) => {
    setProjects(prev => 
      prev.map(project => 
        project.id === projectId 
          ? { ...project, members, updatedAt: new Date() }
          : project
      )
    );
  };

  return {
    projects,
    createProject,
    updateProject,
    deleteProject,
    getBoard,
    updateBoard,
    boards,
    users,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    updateProjectMembers,
  };
};