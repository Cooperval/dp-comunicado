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
    name: 'Expansão Sustentável',
    description: 'Projeto de expansão das áreas de cultivo com práticas sustentáveis e tecnologia de precisão',
    projectType: 'obra',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
    deadline: new Date('2025-06-30'),
    members: [
      {
        id: 'user-1',
        name: 'João Silva',
        email: 'joao.silva@sugarflow.com',
        role: 'admin'
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
        id: 'col-4',
        title: 'Pesquisa',
        position: 0,
        boardId: 'board-2',
        cards: [
          {
            id: 'card-5',
            title: 'Estudo de Viabilidade',
            description: 'Análise econômica da expansão',
            value: 2500000,
            valueType: 'currency',
            columnId: 'col-4',
            position: 0,
            createdAt: new Date('2024-02-02'),
            updatedAt: new Date('2024-02-02'),
            priority: 'high',
            startDate: new Date('2024-02-15'),
            endDate: new Date('2024-06-30')
          }
        ]
      },
      {
        id: 'col-5',
        title: 'Desenvolvimento',
        position: 1,
        boardId: 'board-2',
        cards: []
      },
      {
        id: 'col-6',
        title: 'Implementação',
        position: 2,
        boardId: 'board-2',
        cards: []
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