import { Card, Column } from "@/pages/apps/fechamento/types";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Link2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getBlockingDependencies, getTaskStatus, getDependencies } from "@/pages/apps/fechamento/lib/dependencyUtils";
import { cn } from "@/lib/utils";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ClosingCardProps {
  card: Card;
  columns: Column[];
  doneColumnId: string;
  onClick: () => void;
}

export const ClosingCard = ({ card, columns, doneColumnId, onClick }: ClosingCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const status = getTaskStatus(card);
  const blockingDeps = getBlockingDependencies(columns, card, doneColumnId);
  const dependencies = getDependencies(columns, card);
  const isBlocked = blockingDeps.length > 0;

  const statusColors = {
    'on-time': 'bg-green-500/10 border-green-500/30',
    'warning': 'bg-yellow-500/10 border-yellow-500/30',
    'overdue': 'bg-red-500/10 border-red-500/30',
    'completed': 'bg-emerald-500/10 border-emerald-500/30',
    'not-started': 'bg-muted border-border'
  };

  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="bg-muted/50 border-2 border-dashed border-primary/30 rounded-lg h-32"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "bg-card border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md",
        statusColors[status],
        isBlocked && "opacity-70"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {card.assignedTo && (
            <Avatar className="w-6 h-6 flex-shrink-0">
              <AvatarFallback className="text-xs bg-primary/20">
                {card.assignedTo.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="text-sm font-medium truncate">{card.title}</span>
        </div>
        {card.priority && (
          <div className={cn("w-2 h-2 rounded-full flex-shrink-0", priorityColors[card.priority])} />
        )}
      </div>

      {/* Duration */}
      {card.duration && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
          <Clock className="w-3 h-3" />
          <span>{card.duration} {card.duration === 1 ? 'dia' : 'dias'}</span>
        </div>
      )}

      {/* Dates */}
      {card.startDate && card.endDate && (
        <div className="text-xs text-muted-foreground mb-2">
          📅 {format(card.startDate, "dd/MM", { locale: ptBR })} - {format(card.endDate, "dd/MM", { locale: ptBR })}
        </div>
      )}

      {/* Dependencies */}
      {dependencies.length > 0 && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
          <Link2 className="w-3 h-3" />
          <span className="truncate">
            Depende de: {dependencies.map(d => d.title).join(', ')}
          </span>
        </div>
      )}

      {/* Status indicators */}
      <div className="flex items-center gap-2 flex-wrap">
        {isBlocked && (
          <Badge variant="outline" className="text-xs bg-orange-500/10 border-orange-500/30 text-orange-600">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Bloqueada
          </Badge>
        )}
        {status === 'completed' && (
          <Badge variant="outline" className="text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-600">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Concluída
          </Badge>
        )}
        {status === 'overdue' && !isBlocked && (
          <Badge variant="outline" className="text-xs bg-red-500/10 border-red-500/30 text-red-600">
            Atrasada
          </Badge>
        )}
      </div>
    </div>
  );
};