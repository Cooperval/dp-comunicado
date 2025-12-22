import { useMemo, useState } from 'react';
import { format, differenceInDays, addDays, eachDayOfInterval, parseISO, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, AlertTriangle, Lock } from 'lucide-react';
import { MonthlyCycle, PRIORITY_CONFIG, STATUS_CONFIG } from '@/types/fechamento';
import { EnrichedExecution } from '../FechamentoBoard';
import { cn } from '@/lib/utils';

interface GanttChartNewProps {
  enrichedExecutions: EnrichedExecution[];
  cycle: MonthlyCycle;
  onTaskClick: (enriched: EnrichedExecution) => void;
}

export function GanttChartNew({ enrichedExecutions, cycle, onTaskClick }: GanttChartNewProps) {
  const [offset, setOffset] = useState(0);

  // Calcula o range de dias visíveis
  const { days, startDate, endDate } = useMemo(() => {
    const cycleStart = parseISO(cycle.startDate);
    const cycleEnd = parseISO(cycle.endDate);
    
    // Mostra 30 dias a partir do início do ciclo
    const visibleStart = addDays(cycleStart, offset);
    const visibleEnd = addDays(visibleStart, 30);
    
    return {
      startDate: visibleStart,
      endDate: visibleEnd,
      days: eachDayOfInterval({ start: visibleStart, end: visibleEnd }),
    };
  }, [cycle, offset]);

  // Ordena tarefas por data de início
  const sortedTasks = useMemo(() => {
    return [...enrichedExecutions].sort((a, b) => {
      const dateA = new Date(a.execution.startDate).getTime();
      const dateB = new Date(b.execution.startDate).getTime();
      return dateA - dateB;
    });
  }, [enrichedExecutions]);

  // Calcula posição e largura da barra
  const getTaskBar = (enriched: EnrichedExecution) => {
    const taskStart = startOfDay(parseISO(enriched.execution.startDate));
    const taskEnd = startOfDay(parseISO(enriched.execution.endDate));
    const rangeStart = startOfDay(startDate);
    const rangeEnd = startOfDay(endDate);

    // Verifica se está no range visível
    if (taskEnd < rangeStart || taskStart > rangeEnd) return null;

    const effectiveStart = taskStart < rangeStart ? rangeStart : taskStart;
    const effectiveEnd = taskEnd > rangeEnd ? rangeEnd : taskEnd;

    const totalDays = differenceInDays(rangeEnd, rangeStart) + 1;
    const startOffset = differenceInDays(effectiveStart, rangeStart);
    const duration = differenceInDays(effectiveEnd, effectiveStart) + 1;

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 2)}%` };
  };

  // Cor da barra baseada no status e atraso
  const getBarColor = (enriched: EnrichedExecution) => {
    const { execution, isOverdue } = enriched;

    // Atraso sempre sobrepõe
    if (isOverdue) return 'bg-red-500';

    switch (execution.status) {
      case 'completed':
        return 'bg-green-500';
      case 'in-progress':
        return 'bg-blue-500';
      default:
        return 'bg-slate-300 dark:bg-slate-600';
    }
  };

  // Linha de hoje
  const todayPosition = useMemo(() => {
    const today = startOfDay(new Date());
    const rangeStart = startOfDay(startDate);
    const rangeEnd = startOfDay(endDate);

    if (today < rangeStart || today > rangeEnd) return null;

    const totalDays = differenceInDays(rangeEnd, rangeStart) + 1;
    const offset = differenceInDays(today, rangeStart);

    return `${(offset / totalDays) * 100}%`;
  }, [startDate, endDate]);

  // Linhas de dependência
  const dependencyLines = useMemo(() => {
    const lines: { from: EnrichedExecution; to: EnrichedExecution }[] = [];

    sortedTasks.forEach(enriched => {
      enriched.definition.dependencies.forEach(depId => {
        const depTask = sortedTasks.find(t => t.definition.id === depId);
        if (depTask) {
          lines.push({ from: depTask, to: enriched });
        }
      });
    });

    return lines;
  }, [sortedTasks]);

  const navigatePrevious = () => setOffset(prev => Math.max(prev - 7, -30));
  const navigateNext = () => setOffset(prev => prev + 7);
  const navigateToday = () => setOffset(0);

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Header controls */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={navigateToday}>
            Hoje
          </Button>
          <Button variant="outline" size="sm" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <span className="font-medium">
          {format(startDate, "dd MMM", { locale: ptBR })} - {format(endDate, "dd MMM yyyy", { locale: ptBR })}
        </span>

        {/* Legenda */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-300 dark:bg-slate-600" />
            <span>Não Iniciada</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>Em Andamento</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span>Concluída</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span>Atrasada</span>
          </div>
        </div>
      </div>

      {/* Timeline header */}
      <div className="flex border-b sticky top-0 bg-card z-10">
        <div className="w-64 shrink-0 p-2 font-medium border-r bg-muted/20">
          Tarefa
        </div>
        <div className="flex-1 flex">
          {days.map((day) => {
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex-1 text-center text-xs p-1 border-r last:border-r-0",
                  isToday && "bg-primary/20 font-bold",
                  isWeekend && !isToday && "bg-muted/30"
                )}
              >
                <div>{format(day, 'EEE', { locale: ptBR })}</div>
                <div>{format(day, 'dd')}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tasks */}
      <div className="max-h-[500px] overflow-y-auto relative">
        {sortedTasks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma tarefa encontrada
          </div>
        ) : (
          sortedTasks.map((enriched, index) => {
            const bar = getTaskBar(enriched);
            const { execution, definition, isOverdue, isBlocked } = enriched;
            const priorityConfig = PRIORITY_CONFIG[definition.priority];

            return (
              <div key={execution.id} className="flex border-b last:border-b-0 hover:bg-muted/10">
                <div
                  className="w-64 shrink-0 p-2 border-r cursor-pointer"
                  onClick={() => onTaskClick(enriched)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{priorityConfig.icon}</span>
                    <span className={cn(
                      "truncate text-sm",
                      isOverdue && "text-destructive"
                    )}>
                      {definition.name}
                    </span>
                    {isBlocked && execution.status === 'not-started' && (
                      <Lock className="h-3 w-3 text-amber-500 shrink-0" />
                    )}
                    {isOverdue && (
                      <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                    )}
                  </div>
                </div>

                <div className="flex-1 relative h-12">
                  {/* Day columns background */}
                  <div className="absolute inset-0 flex">
                    {days.map((day) => {
                      const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      return (
                        <div
                          key={day.toISOString()}
                          className={cn(
                            "flex-1 border-r last:border-r-0",
                            isToday && "bg-primary/10",
                            isWeekend && !isToday && "bg-muted/20"
                          )}
                        />
                      );
                    })}
                  </div>

                  {/* Today line */}
                  {todayPosition && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary z-20"
                      style={{ left: todayPosition }}
                    />
                  )}

                  {/* Task bar */}
                  {bar && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "absolute top-2 h-8 rounded cursor-pointer transition-transform hover:scale-[1.02] overflow-hidden z-10",
                            getBarColor(enriched)
                          )}
                          style={{
                            left: bar.left,
                            width: bar.width,
                            minWidth: '20px',
                          }}
                          onClick={() => onTaskClick(enriched)}
                        >
                          {/* Progress indicator */}
                          <div
                            className="absolute inset-y-0 left-0 bg-black/20"
                            style={{ width: `${execution.progress}%` }}
                          />
                          <span className="absolute inset-0 flex items-center px-2 text-white text-xs font-medium truncate">
                            {definition.name}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="space-y-1">
                          <div className="font-medium">{definition.name}</div>
                          <div className="text-xs">
                            {format(parseISO(execution.startDate), "dd/MM/yyyy")} - {format(parseISO(execution.endDate), "dd/MM/yyyy")}
                          </div>
                          <div className="text-xs">Duração: {definition.durationDays} dia(s)</div>
                          <div className="text-xs">Progresso: {execution.progress}%</div>
                          {isOverdue && (
                            <div className="text-xs text-red-400 font-medium">⚠️ Atrasada</div>
                          )}
                          {isBlocked && execution.status === 'not-started' && (
                            <div className="text-xs text-amber-400 font-medium">🔒 Bloqueada</div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
