import { useState } from "react";
import { Project, Board } from "@/pages/apps/fechamento/types";
import { ProjectCard } from "./ProjectCard";
import { CreateProjectModal } from "./CreateProjectModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter } from "lucide-react";

interface DashboardProps {
  projects: Project[];
  boards: Record<string, Board>;
  onCreateProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenProject: (projectId: string) => void;
}

export const Dashboard = ({ 
  projects,
  boards,
  onCreateProject, 
  onUpdateProject, 
  onDeleteProject, 
  onOpenProject 
}: DashboardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setIsCreateModalOpen(true);
  };

  const handleSaveProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingProject) {
      onUpdateProject(editingProject.id, {
        ...projectData,
        updatedAt: new Date()
      });
    } else {
      onCreateProject(projectData);
    }
    setIsCreateModalOpen(false);
    setEditingProject(null);
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingProject(null);
  };

  return (
    <div className="flex-1 gradient-earth p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Projetos
            </h1>
            <p className="text-muted-foreground">
              Gerencie seus projetos de cana-de-açúcar, produção e sustentabilidade
            </p>
          </div>
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="gradient-primary hover:shadow-glow transition-organic"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Projeto
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projetos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 transition-organic focus:shadow-soft"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              board={boards[project.boardId]}
              onOpenProject={onOpenProject}
              onEditProject={handleEditProject}
              onDeleteProject={onDeleteProject}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 gradient-primary rounded-full flex items-center justify-center shadow-glow">
            <Plus className="w-12 h-12 text-primary-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {searchQuery ? 'Nenhum projeto encontrado' : 'Nenhum projeto criado'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery 
              ? 'Tente ajustar sua busca ou criar um novo projeto'
              : 'Comece criando seu primeiro projeto sucroenergético'
            }
          </p>
          {!searchQuery && (
            <Button 
              onClick={() => setIsCreateModalOpen(true)}
              className="gradient-primary hover:shadow-glow transition-organic"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Projeto
            </Button>
          )}
        </div>
      )}

      {/* Create/Edit Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveProject}
        initialData={editingProject}
      />
    </div>
  );
};