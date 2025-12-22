import { useState } from "react";
import { Dashboard } from "@/pages/apps/fechamento/components/dashboard/Dashboard";
import { DashboardStats } from "@/pages/apps/fechamento/components/dashboard/DashboardStats";
import { ValueTypesSettings } from "@/pages/apps/fechamento/components/settings/ValueTypesSettings";
import { KanbanBoard } from "@/pages/apps/fechamento/components/kanban/KanbanBoard";
import { TeamManagement } from "@/pages/apps/fechamento/components/team/TeamManagement";
import { useProjects } from "@/pages/apps/fechamento/hooks/useProjects";
import { UserRole } from "@/pages/apps/fechamento/types";

const Fechamento = () => {
  const [activeSection, setActiveSection] = useState('projects');
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

  // Mock current user
  const currentUser = {
    name: 'João Silva',
    role: 'admin' as UserRole
  };

  const handleOpenProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setActiveSection('board');
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
    setActiveSection('projects');
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
      {/* <Sidebar
        currentUser={currentUser}
        activeSection={activeSection}
        onSectionChange={(section) => {
          setActiveSection(section);
          if (section !== 'board') {
            setSelectedProjectId(null);
          }
        }}
      />
       */}
      <div className="flex-1 flex flex-col">
        {renderContent()}
      </div>
    </div>
  );
};

export default Fechamento;