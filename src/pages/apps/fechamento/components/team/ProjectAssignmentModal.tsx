import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Project } from '@/pages/apps/fechamento/types';
import { useToast } from '@/hooks/use-toast';

interface ProjectAssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  projects: Project[];
  onUpdateProjectMembers: (projectId: string, members: User[]) => void;
}

export const ProjectAssignmentModal = ({
  open,
  onOpenChange,
  user,
  projects,
  onUpdateProjectMembers,
}: ProjectAssignmentModalProps) => {
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Inicializar com os projetos onde o usuário já está
    const userProjects = projects
      .filter(project => project.members.some(member => member.id === user.id))
      .map(project => project.id);
    setSelectedProjects(userProjects);
  }, [user, projects]);

  const handleProjectToggle = (projectId: string, checked: boolean) => {
    setSelectedProjects(prev => 
      checked 
        ? [...prev, projectId]
        : prev.filter(id => id !== projectId)
    );
  };

  const handleSave = () => {
    // Para cada projeto, atualize os membros
    projects.forEach(project => {
      const shouldHaveUser = selectedProjects.includes(project.id);
      const currentlyHasUser = project.members.some(member => member.id === user.id);
      
      if (shouldHaveUser && !currentlyHasUser) {
        // Adicionar usuário ao projeto
        const updatedMembers = [...project.members, user];
        onUpdateProjectMembers(project.id, updatedMembers);
      } else if (!shouldHaveUser && currentlyHasUser) {
        // Remover usuário do projeto
        const updatedMembers = project.members.filter(member => member.id !== user.id);
        onUpdateProjectMembers(project.id, updatedMembers);
      }
    });

    toast({
      title: "Projetos atualizados",
      description: "As atribuições de projetos foram atualizadas com sucesso.",
    });
    
    onOpenChange(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'manager':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'collaborator':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'manager':
        return 'Gestor';
      case 'collaborator':
        return 'Colaborador';
      default:
        return role;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Atribuir Projetos</DialogTitle>
          <DialogDescription>
            Gerencie os projetos aos quais {user.name} tem acesso.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.name}</span>
            <Badge className={getRoleColor(user.role)}>
              {getRoleLabel(user.role)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {projects.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum projeto encontrado
            </div>
          ) : (
            projects.map(project => {
              const isSelected = selectedProjects.includes(project.id);
              const memberCount = project.members.length;
              
              return (
                <Card key={project.id} className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={`project-${project.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleProjectToggle(project.id, !!checked)}
                      />
                      <div className="flex-1 min-w-0">
                        <label 
                          htmlFor={`project-${project.id}`} 
                          className="font-medium cursor-pointer block"
                        >
                          {project.name}
                        </label>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {project.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>{memberCount} membro(s)</span>
                          <span>Criado em {project.createdAt.toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};