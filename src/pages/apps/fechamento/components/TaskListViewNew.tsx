import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, User, ChevronDown, ChevronRight, 
  AlertTriangle, Lock, Clock, Link2 
} from 'lucide-react';
import { TaskStatus, PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/fechamento';
import { EnrichedExecution } from '../FechamentoBoard';
import { cn } from '@/lib/utils';

interface TaskListViewNewProps {
  enrichedExecutions: EnrichedExecution[];
  onTaskClick: (enriched: EnrichedExecution) => void;
}

type GroupBy = 'status' | 'none';

const STATUS_ORDER: TaskStatus[] = ['not-started', 'in-progress', 'completed'];

export function TaskListViewNew({ enrichedExecutions, onTaskClick }: TaskListViewNewProps) {
  const [groupBy, setGroupBy] = useState<GroupBy>('status');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(STATUS_ORDER)
  );

  // Agrupa por status
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { all: enrichedExecutions };
    }

    const groups: Record<string, EnrichedExecution[]> = {};
    
    STATUS_ORDER.forEach(status => {
      groups[status] = enrichedExecutions.filter(
        e => e.execution.status === status
      );
    });

    return groups;
  }, [enrichedExecutions, groupBy]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const renderTaskRow = (enriched: EnrichedExecution) => {
    const { execution, definition, isBlocked, isOverdue, blockingTasks } = enriched;
    const priorityConfig = PRIORITY_CONFIG[definition.priority];
    const statusConfig = STATUS_CONFIG[execution.status];

    return (
      <TableRow
        key={execution.id}
        className={cn(
          "cursor-pointer hover:bg-muted/50 transition-colors",
          isOverdue && "bg-destructive/5"
        )}
        onClick={() => onTaskClick(enriched)}
      >
        <TableCell>
          <div className="flex items-start gap-2">
            <span className="text-sm mt-0.5">{priorityConfig.icon}</span>
            <div>
              <div className={cn(
                "font-medium",
                isOverdue && "text-destructive"
              )}>
                {definition.name}
              </div>
              {definition.description && (
                <div className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                  {definition.description}
                </div>
              )}
              {isBlocked && execution.status === 'not-started' && (
                <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                  <Lock className="h-3 w-3" />
                  Aguardando: {blockingTasks.slice(0, 2).join(', ')}
                  {blockingTasks.length > 2 && ` +${blockingTasks.length - 2}`}
                </div>
              )}
            </div>
          </div>
        </TableCell>

        <TableCell>
          <Badge
            variant="outline"
            style={{
              borderColor: statusConfig.color,
              backgroundColor: `${statusConfig.color}20`,
            }}
          >
            {statusConfig.icon} {statusConfig.label}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="ml-2 text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Atrasada
            </Badge>
          )}
        </TableCell>

        <TableCell>
          <Badge
            variant="outline"
            style={{
              borderColor: priorityConfig.color,
              color: priorityConfig.color,
            }}
          >
            {priorityConfig.label}
          </Badge>
        </TableCell>

        <TableCell>
          {definition.assignee ? (
            <div className="flex items-center gap-1 text-sm">
              <User className="h-3 w-3 text-muted-foreground" />
              {definition.assignee}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {definition.durationDays} dia(s)
          </div>
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-3 w-3 text-muted-foreground" />
            {format(new Date(execution.startDate), "dd/MM", { locale: ptBR })}
          </div>
        </TableCell>

        <TableCell>
          <div className={cn(
            "flex items-center gap-1 text-sm",
            isOverdue && "text-destructive"
          )}>
            <Calendar className="h-3 w-3" />
            {format(new Date(execution.endDate), "dd/MM", { locale: ptBR })}
          </div>
        </TableCell>

        <TableCell>
          {definition.dependencies.length > 0 ? (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Link2 className="h-3 w-3" />
              {definition.dependencies.length}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-2 min-w-[100px]">
            <Progress value={execution.progress} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground w-8 text-right">
              {execution.progress}%
            </span>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  const renderGroupHeader = (groupId: string, tasks: EnrichedExecution[]) => {
    const statusConfig = STATUS_CONFIG[groupId as TaskStatus];
    const isExpanded = expandedGroups.has(groupId);
    const overdueCount = tasks.filter(t => t.isOverdue).length;

    return (
      <Collapsible
        key={groupId}
        open={isExpanded}
        onOpenChange={() => toggleGroup(groupId)}
      >
        <CollapsibleTrigger asChild>
          <div 
            className="flex items-center gap-3 p-3 bg-muted/30 border-b cursor-pointer hover:bg-muted/50 transition-colors"
            style={{ borderLeftColor: statusConfig.color, borderLeftWidth: '4px' }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-lg">{statusConfig.icon}</span>
            <span className="font-semibold">{statusConfig.label}</span>
            <Badge variant="secondary">{tasks.length}</Badge>
            {overdueCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {overdueCount} atrasada(s)
              </Badge>
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {tasks.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Nenhuma tarefa neste status
            </div>
          ) : (
            <Table>
              <TableBody>
                {tasks.map(renderTaskRow)}
              </TableBody>
            </Table>
          )}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Agrupar por:</span>
          <Button
            variant={groupBy === 'status' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setGroupBy('status')}
          >
            Status
          </Button>
          <Button
            variant={groupBy === 'none' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setGroupBy('none')}
          >
            Sem agrupamento
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {enrichedExecutions.length} tarefa(s)
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        {groupBy === 'status' ? (
          <div>
            {STATUS_ORDER.map(status => 
              renderGroupHeader(status, groupedTasks[status] || [])
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="min-w-[250px]">Tarefa</TableHead>
                <TableHead className="w-[150px]">Status</TableHead>
                <TableHead className="w-[100px]">Prioridade</TableHead>
                <TableHead className="w-[120px]">Responsável</TableHead>
                <TableHead className="w-[80px]">Duração</TableHead>
                <TableHead className="w-[90px]">Início</TableHead>
                <TableHead className="w-[90px]">Fim</TableHead>
                <TableHead className="w-[80px]">Deps</TableHead>
                <TableHead className="w-[120px]">Progresso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrichedExecutions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhuma tarefa encontrada
                  </TableCell>
                </TableRow>
              ) : (
                enrichedExecutions
                  .sort((a, b) => a.execution.order - b.execution.order)
                  .map(renderTaskRow)
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
