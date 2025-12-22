import { useLocation } from "react-router-dom";
import { Dashboard } from "@/pages/apps/fechamento/components/dashboard/Dashboard";
import { DashboardStats } from "@/pages/apps/fechamento/components/dashboard/DashboardStats";
import { ValueTypesSettings } from "@/pages/apps/fechamento/components/settings/ValueTypesSettings";
import { KanbanBoard } from "@/pages/apps/fechamento/components/kanban/KanbanBoard";
import { TeamManagement } from "@/pages/apps/fechamento/components/team/TeamManagement";
import { AccessControl } from "@/pages/apps/fechamento/AccessControl";
import { useProjects } from "@/pages/apps/fechamento/hooks/useProjects";
import { useState } from "react";

const Fechamento = () => {
  const location = useLocation();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  
  const {
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
  } = useProjects();

  // Derive active section from URL
  const getActiveSection = () => {
    const path = location.pathname;
    if (path.includes('/projetos')) return 'projects';
    if (path.includes('/equipe')) return 'team';
    if (path.includes('/acesso')) return 'access';
    if (path.includes('/configuracoes')) return 'settings';
    if (path.includes('/dashboard')) return 'dashboard';
    // Default to projects for the base /apps/fechamento route
    return 'projects';
  };

  const activeSection = selectedProjectId ? 'board' : getActiveSection();

  const handleOpenProject = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
  };

  const selectedProject = selectedProjectId 
    ? projects.find(p => p.id === selectedProjectId) 
    : null;
  
  const selectedBoard = selectedProject 
    ? getBoard(selectedProject.boardId)
    : null;

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="flex-1 p-6 gradient-earth">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Dashboard
              </h1>
              <p className="text-muted-foreground">
                Visão geral dos projetos e indicadores
              </p>
            </div>
            <DashboardStats projects={projects} boards={boards} />
          </div>
        );
      
      case 'projects':
        return (
          <Dashboard
            projects={projects}
            boards={boards}
            onCreateProject={createProject}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
            onOpenProject={handleOpenProject}
          />
        );

      case 'board':
        if (selectedProject && selectedBoard) {
          return (
            <KanbanBoard
              board={selectedBoard}
              projectName={selectedProject.name}
              onUpdateBoard={(board) => updateBoard(board.id, board)}
              onBackToProjects={handleBackToProjects}
            />
          );
        }
        return null;

      case 'team':
        return (
          <div className="flex-1 p-6 gradient-earth">
            <TeamManagement
              users={users}
              projects={projects}
              onCreateUser={createUser}
              onUpdateUser={updateUser}
              onDeleteUser={deleteUser}
              onToggleUserStatus={toggleUserStatus}
              onUpdateProjectMembers={updateProjectMembers}
            />
          </div>
        );

      case 'settings':
        return (
          <div className="flex-1 p-6 gradient-earth">
            <ValueTypesSettings />
          </div>
        );

      case 'access':
        return <AccessControl />;

      default:
        return (
          <Dashboard
            projects={projects}
            boards={boards}
            onCreateProject={createProject}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
            onOpenProject={handleOpenProject}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="flex-1 flex flex-col">
        {renderContent()}
      </div>
    </div>
  );
};

export default Fechamento;
