import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, Clock, User, AlertTriangle, Lock, 
  Link2, ArrowRight, CheckCircle2, PlayCircle, XCircle
} from 'lucide-react';
import { TaskStatus, PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/fechamento';
import { EnrichedExecution } from '../FechamentoBoard';
import { cn } from '@/lib/utils';

interface TaskExecutionModalProps {
  enriched: EnrichedExecution;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (status: TaskStatus) => void;
}

export function TaskExecutionModal({
  enriched,
  isOpen,
  onClose,
  onUpdateStatus,
}: TaskExecutionModalProps) {
  const { execution, definition, isBlocked, isOverdue, blockingTasks } = enriched;
  const priorityConfig = PRIORITY_CONFIG[definition.priority];
  const statusConfig = STATUS_CONFIG[execution.status];

  const canStart = !isBlocked || execution.status !== 'not-started';
  const canComplete = execution.status !== 'not-started';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xl">{priorityConfig.icon}</span>
            <span className={cn(isOverdue && "text-destructive")}>
              {definition.name}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="outline"
              style={{
                borderColor: statusConfig.color,
                backgroundColor: `${statusConfig.color}20`,
              }}
            >
              {statusConfig.icon} {statusConfig.label}
            </Badge>

            <Badge
              variant="outline"
              style={{
                borderColor: priorityConfig.color,
                color: priorityConfig.color,
              }}
            >
              Prioridade: {priorityConfig.label}
            </Badge>

            {isOverdue && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Atrasada
              </Badge>
            )}

            {isBlocked && execution.status === 'not-started' && (
              <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50">
                <Lock className="h-3 w-3 mr-1" />
                Bloqueada
              </Badge>
            )}
          </div>

          {/* Blocked warning */}
          {isBlocked && execution.status === 'not-started' && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-300 text-sm">
                    Esta tarefa está bloqueada
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Aguardando conclusão de:
                  </p>
                  <ul className="list-disc list-inside text-xs text-amber-600 dark:text-amber-400 mt-1">
                    {blockingTasks.map((task, i) => (
                      <li key={i}>{task}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {definition.description && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Descrição</h4>
              <p className="text-sm">{definition.description}</p>
            </div>
          )}

          <Separator />

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Responsável</h4>
                <div className="flex items-center gap-1 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  {definition.assignee || 'Não atribuído'}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Duração</h4>
                <div className="flex items-center gap-1 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {definition.durationDays} dia(s)
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Dependências</h4>
                <div className="flex items-center gap-1 text-sm">
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                  {definition.dependencies.length > 0 
                    ? `${definition.dependencies.length} tarefa(s)`
                    : 'Nenhuma'}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Data Início (Prevista)</h4>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(execution.startDate), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Data Fim (Prevista)</h4>
                <div className={cn(
                  "flex items-center gap-1 text-sm",
                  isOverdue && "text-destructive"
                )}>
                  <Calendar className="h-4 w-4" />
                  {format(new Date(execution.endDate), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>

              {execution.actualStartDate && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Início Real</h4>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(execution.actualStartDate), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </div>
              )}

              {execution.actualEndDate && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Conclusão Real</h4>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(execution.actualEndDate), "dd/MM/yyyy", { locale: ptBR })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Progresso</h4>
            <div className="flex items-center gap-3">
              <Progress value={execution.progress} className="h-2 flex-1" />
              <span className="text-sm font-medium">{execution.progress}%</span>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            {execution.status !== 'not-started' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateStatus('not-started')}
                className="gap-1"
              >
                <XCircle className="h-4 w-4" />
                Voltar para Não Iniciado
              </Button>
            )}

            {execution.status === 'not-started' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onUpdateStatus('in-progress')}
                disabled={!canStart}
                className="gap-1"
              >
                <PlayCircle className="h-4 w-4" />
                Iniciar Tarefa
              </Button>
            )}

            {execution.status === 'in-progress' && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onUpdateStatus('completed')}
                className="gap-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Marcar como Concluída
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
