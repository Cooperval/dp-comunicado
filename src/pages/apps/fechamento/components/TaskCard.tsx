import { Task, PRIORITY_CONFIG } from '@/types/fechamento';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, GripVertical } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const isOverdue = task.endDate && new Date(task.endDate) < new Date() && task.progress < 100;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      } ${isOverdue ? 'border-destructive/50' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="outline"
                className="text-xs shrink-0"
                style={{ 
                  borderColor: priorityConfig.color,
                  color: priorityConfig.color 
                }}
              >
                {priorityConfig.icon} {priorityConfig.label}
              </Badge>
            </div>

            <h4 className="font-medium text-sm mb-1 truncate">{task.title}</h4>

            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {task.description}
              </p>
            )}

            {task.progress > 0 && task.progress < 100 && (
              <div className="mb-2">
                <Progress value={task.progress} className="h-1.5" />
                <span className="text-xs text-muted-foreground">{task.progress}%</span>
              </div>
            )}

            {task.endDate && (
              <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                <Calendar className="h-3 w-3" />
                {format(new Date(task.endDate), "dd MMM", { locale: ptBR })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
