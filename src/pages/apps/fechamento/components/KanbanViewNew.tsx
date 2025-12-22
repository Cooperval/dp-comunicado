import { useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, Lock, Calendar, User, Clock,
  ArrowRight
} from 'lucide-react';
import { TaskStatus, PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/fechamento';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EnrichedExecution } from '../FechamentoBoard';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface KanbanViewNewProps {
  enrichedExecutions: EnrichedExecution[];
  onUpdateStatus: (executionId: string, status: TaskStatus) => void;
  onTaskClick: (enriched: EnrichedExecution) => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'not-started', title: 'Não Iniciado', color: 'hsl(220, 14%, 60%)' },
  { id: 'in-progress', title: 'Em Andamento', color: 'hsl(200, 80%, 50%)' },
  { id: 'completed', title: 'Concluído', color: 'hsl(142, 76%, 36%)' },
];

// Componente da coluna droppable
function KanbanColumn({ 
  column, 
  tasks, 
  onTaskClick 
}: { 
  column: typeof COLUMNS[0]; 
  tasks: EnrichedExecution[]; 
  onTaskClick: (task: EnrichedExecution) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-w-[320px] max-w-[400px] flex flex-col rounded-lg border bg-muted/20 transition-colors",
        isOver && "bg-muted/40 border-primary/50"
      )}
    >
      {/* Column Header */}
      <div 
        className="p-4 border-b"
        style={{ borderLeftColor: column.color, borderLeftWidth: '4px' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">{column.title}</h3>
          <Badge variant="secondary" className="text-xs">
            {tasks.length}
          </Badge>
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-400px)]">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma tarefa
          </div>
        ) : (
          tasks.map((enriched) => (
            <DraggableTaskCard
              key={enriched.execution.id}
              enriched={enriched}
              onClick={() => onTaskClick(enriched)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Componente do card draggable
function DraggableTaskCard({ 
  enriched, 
  onClick,
  isDragging = false,
}: { 
  enriched: EnrichedExecution; 
  onClick: () => void;
  isDragging?: boolean;
}) {
  const { execution, definition, isBlocked, isOverdue, blockingTasks } = enriched;
  const priorityConfig = PRIORITY_CONFIG[definition.priority];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
  } = useDraggable({
    id: execution.id,
    data: { enriched },
    disabled: isBlocked && execution.status === 'not-started',
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-all hover:shadow-md",
        isDragging && "opacity-50 shadow-lg rotate-2",
        isOverdue && "border-destructive",
        isBlocked && execution.status === 'not-started' && "opacity-60 cursor-not-allowed"
      )}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <CardContent className="p-3 space-y-2">
        {/* Header with priority and status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm">{priorityConfig.icon}</span>
            <h4 className={cn(
              "font-medium text-sm line-clamp-2",
              isOverdue && "text-destructive"
            )}>
              {definition.name}
            </h4>
          </div>
          
          {isOverdue && (
            <Badge variant="destructive" className="text-xs shrink-0">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Atrasada
            </Badge>
          )}
        </div>

        {/* Blocked indicator */}
        {isBlocked && execution.status === 'not-started' && (
          <div className="flex items-start gap-2 p-2 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <Lock className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-700 dark:text-amber-300">
              <span className="font-medium">Bloqueada</span>
              <p className="text-amber-600 dark:text-amber-400">
                Aguardando: {blockingTasks.slice(0, 2).join(', ')}
                {blockingTasks.length > 2 && ` +${blockingTasks.length - 2}`}
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        {definition.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {definition.description}
          </p>
        )}

        {/* Footer with dates and assignee */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {format(new Date(execution.startDate), "dd/MM", { locale: ptBR })} 
                <ArrowRight className="h-3 w-3 inline mx-0.5" />
                {format(new Date(execution.endDate), "dd/MM", { locale: ptBR })}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{definition.durationDays}d</span>
            </div>
          </div>

          {definition.assignee && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[80px]">{definition.assignee}</span>
            </div>
          )}
        </div>

        {/* Progress */}
        {execution.status !== 'not-started' && (
          <div className="flex items-center gap-2">
            <Progress value={execution.progress} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">{execution.progress}%</span>
          </div>
        )}

        {/* Dependencies indicator */}
        {definition.dependencies.length > 0 && !isBlocked && (
          <div className="text-xs text-muted-foreground">
            {definition.dependencies.length} dependência(s)
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function KanbanViewNew({ 
  enrichedExecutions, 
  onUpdateStatus,
  onTaskClick 
}: KanbanViewNewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Agrupa execuções por status
  const tasksByColumn = useMemo(() => {
    const grouped: Record<TaskStatus, EnrichedExecution[]> = {
      'not-started': [],
      'in-progress': [],
      'completed': [],
    };

    enrichedExecutions.forEach(enriched => {
      grouped[enriched.execution.status].push(enriched);
    });

    // Ordena por ordem
    Object.keys(grouped).forEach(key => {
      grouped[key as TaskStatus].sort((a, b) => a.execution.order - b.execution.order);
    });

    return grouped;
  }, [enrichedExecutions]);

  const activeTask = useMemo(() => {
    if (!activeId) return null;
    return enrichedExecutions.find(e => e.execution.id === activeId);
  }, [activeId, enrichedExecutions]);

  // Valida se pode mover para a coluna
  const canMoveToColumn = (enriched: EnrichedExecution, targetStatus: TaskStatus): boolean => {
    // Sempre pode voltar para não iniciado
    if (targetStatus === 'not-started') return true;

    // Para mover para em andamento ou concluído, verificar dependências
    if (targetStatus === 'in-progress' || targetStatus === 'completed') {
      return !enriched.isBlocked;
    }

    return true;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const enriched = active.data.current?.enriched as EnrichedExecution;
    const targetStatus = over.id as TaskStatus;

    if (!enriched || enriched.execution.status === targetStatus) return;

    // Validar movimento
    if (!canMoveToColumn(enriched, targetStatus)) {
      toast.error('Não é possível mover esta tarefa', {
        description: 'As dependências ainda não foram concluídas.',
      });
      return;
    }

    onUpdateStatus(enriched.execution.id, targetStatus);
    toast.success('Tarefa atualizada', {
      description: `Movida para "${COLUMNS.find(c => c.id === targetStatus)?.title}"`,
    });
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 h-full overflow-x-auto pb-4">
        {COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={tasksByColumn[column.id]}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-3 shadow-2xl">
            <DraggableTaskCard
              enriched={activeTask}
              onClick={() => {}}
              isDragging
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
