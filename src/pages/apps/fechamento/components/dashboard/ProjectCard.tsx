import { Project, Board, ProjectType } from "@/pages/apps/fechamento/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  ChevronRight, 
  MoreVertical,
  Edit3,
  Trash2,
  ClipboardList,
  Briefcase,
  Building2,
  ClipboardCheck
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectCardProps {
  project: Project;
  board?: Board;
  onOpenProject: (projectId: string) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export const ProjectCard = ({ 
  project,
  board,
  onOpenProject, 
  onEditProject, 
  onDeleteProject 
}: ProjectCardProps) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const getProjectTypeConfig = (type: ProjectType) => {
    const configs = {
      acompanhamento: {
        label: 'Acompanhamento',
        icon: Briefcase,
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
      },
      fechamento: {
        label: 'Fechamento',
        icon: ClipboardCheck,
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      },
      obra: {
        label: 'Acompanhamento de Obra',
        icon: Building2,
        className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
      }
    };
    return configs[type];
  };

  const typeConfig = getProjectTypeConfig(project.projectType);
  const TypeIcon = typeConfig.icon;

  // Calculate task statistics
  const totalTasks = board?.columns.reduce((sum, col) => sum + col.cards.length, 0) || 0;
  const completedTasks = board?.columns
    .filter(col => col.title.toLowerCase().includes('concluído') || col.title.toLowerCase().includes('finalizado'))
    .reduce((sum, col) => sum + col.cards.length, 0) || 0;
  const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div className="kanban-card group p-6 hover:shadow-glow transition-organic cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <Badge className={`mb-3 ${typeConfig.className}`}>
            <TypeIcon className="w-3 h-3 mr-1" />
            {typeConfig.label}
          </Badge>
          <h3 className="text-lg font-semibold text-card-foreground mb-2">
            {project.name}
          </h3>
          <p className="text-muted-foreground line-clamp-2 mb-3">
            {project.description}
          </p>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-organic"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onEditProject(project)}>
              <Edit3 className="w-4 h-4 mr-2" />
              Editar projeto
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDeleteProject(project.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir projeto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 mr-2" />
          Criado em {formatDate(project.createdAt)}
        </div>
        
        {project.deadline && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 mr-2" />
            Término previsto: {formatDate(project.deadline)}
          </div>
        )}
        
        <div className="flex items-center text-sm text-muted-foreground">
          <ClipboardList className="w-4 h-4 mr-2" />
          {totalTasks} {totalTasks === 1 ? 'tarefa criada' : 'tarefas criadas'}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium text-foreground">{completedTasks}/{totalTasks}</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Button
          onClick={() => onOpenProject(project.id)}
          className="gradient-primary hover:shadow-glow transition-organic"
          size="sm"
        >
          Abrir
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};