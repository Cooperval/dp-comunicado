import { useMemo, useState, useRef, useEffect } from 'react';
import { Task, PRIORITY_CONFIG } from '@/types/fechamento';
import { format, differenceInDays, addDays, startOfWeek, eachDayOfInterval, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GanttChartProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

type ViewMode = 'week' | 'month';

interface DependencyConnection {
  fromTaskId: string;
  toTaskId: string;
  fromIndex: number;
  toIndex: number;
}

export function GanttChart({ tasks, onTaskClick }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date('2024-12-01'));
  const tasksContainerRef = useRef<HTMLDivElement>(null);
  const [taskPositions, setTaskPositions] = useState<Map<string, DOMRect>>(new Map());

  const { startDate, endDate, days } = useMemo(() => {
    let start: Date;
    let end: Date;

    if (viewMode === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = addDays(start, 13);
    } else {
      start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    }

    return {
      startDate: start,
      endDate: end,
      days: eachDayOfInterval({ start, end }),
    };
  }, [viewMode, currentDate]);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => task.startDate && task.endDate)
      .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
  }, [tasks]);

  const dependencyConnections = useMemo(() => {
    const connections: DependencyConnection[] = [];
    
    filteredTasks.forEach((task, taskIndex) => {
      if (task.dependencyIds && task.dependencyIds.length > 0) {
        task.dependencyIds.forEach(depId => {
          const depIndex = filteredTasks.findIndex(t => t.id === depId);
          if (depIndex !== -1) {
            connections.push({
              fromTaskId: depId,
              toTaskId: task.id,
              fromIndex: depIndex,
              toIndex: taskIndex,
            });
          }
        });
      }
    });
    
    return connections;
  }, [filteredTasks]);

  const getTaskPosition = (task: Task) => {
    if (!task.startDate || !task.endDate) return null;

    const taskStart = startOfDay(new Date(task.startDate));
    const taskEnd = startOfDay(new Date(task.endDate));
    const rangeStart = startOfDay(startDate);
    const rangeEnd = startOfDay(endDate);

    if (taskEnd < rangeStart || taskStart > rangeEnd) return null;

    const effectiveStart = taskStart < rangeStart ? rangeStart : taskStart;
    const effectiveEnd = taskEnd > rangeEnd ? rangeEnd : taskEnd;

    const totalDays = differenceInDays(rangeEnd, rangeStart) + 1;
    const startOffset = differenceInDays(effectiveStart, rangeStart);
    const duration = differenceInDays(effectiveEnd, effectiveStart) + 1;

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left, width };
  };

  const navigatePrevious = () => {
    if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, -14));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'week') {
      setCurrentDate(addDays(currentDate, 14));
    } else {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Calculate SVG arrow paths for dependencies
  const getArrowPath = (fromIndex: number, toIndex: number, fromTask: Task, toTask: Task) => {
    const fromPos = getTaskPosition(fromTask);
    const toPos = getTaskPosition(toTask);
    
    if (!fromPos || !toPos) return null;

    const rowHeight = 48;
    const taskBarTopOffset = 8;
    const taskBarHeight = 32;
    
    // Calculate positions as percentages of container width
    const fromEndX = fromPos.left + fromPos.width;
    const toStartX = toPos.left;
    
    const fromY = fromIndex * rowHeight + taskBarTopOffset + taskBarHeight / 2;
    const toY = toIndex * rowHeight + taskBarTopOffset + taskBarHeight / 2;

    return { fromEndX, toStartX, fromY, toY };
  };

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

        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Semana
          </Button>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            Mês
          </Button>
        </div>
      </div>

      {/* Timeline header */}
      <div className="flex border-b">
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
                className={`flex-1 text-center text-xs p-1 border-r last:border-r-0 ${
                  isToday ? 'bg-primary/20 font-bold' : isWeekend ? 'bg-muted/30' : ''
                }`}
              >
                <div>{format(day, 'EEE', { locale: ptBR })}</div>
                <div>{format(day, 'dd')}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tasks */}
      <div className="max-h-[500px] overflow-y-auto" ref={tasksContainerRef}>
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma tarefa com datas definidas
          </div>
        ) : (
          <div className="relative">
            {filteredTasks.map((task, taskIndex) => {
              const position = getTaskPosition(task);
              const priorityConfig = PRIORITY_CONFIG[task.priority];
              const isOverdue = task.endDate && new Date(task.endDate) < new Date() && task.progress < 100;
              const hasDependencies = task.dependencyIds && task.dependencyIds.length > 0;

              return (
                <div key={task.id} className="flex border-b last:border-b-0 hover:bg-muted/10 h-12">
                  <div
                    className="w-64 shrink-0 p-2 border-r cursor-pointer truncate flex items-center"
                    onClick={() => onTaskClick(task)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{priorityConfig.icon}</span>
                      <span className={`truncate text-sm ${isOverdue ? 'text-destructive' : ''}`}>
                        {task.title}
                      </span>
                      {hasDependencies && (
                        <span className="text-xs text-muted-foreground" title="Possui dependências">
                          🔗
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 relative">
                    {/* Day columns background */}
                    <div className="absolute inset-0 flex">
                      {days.map((day) => {
                        const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                        return (
                          <div
                            key={day.toISOString()}
                            className={`flex-1 border-r last:border-r-0 ${
                              isToday ? 'bg-primary/10' : isWeekend ? 'bg-muted/20' : ''
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Task bar */}
                    {position && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            data-task-id={task.id}
                            className="absolute top-2 h-8 rounded cursor-pointer transition-transform hover:scale-[1.02] overflow-hidden z-10"
                            style={{
                              left: `${position.left}%`,
                              width: `${position.width}%`,
                              backgroundColor: priorityConfig.color,
                              minWidth: '20px',
                            }}
                            onClick={() => onTaskClick(task)}
                          >
                            {/* Progress indicator */}
                            <div
                              className="absolute inset-y-0 left-0 bg-black/20"
                              style={{ width: `${task.progress}%` }}
                            />
                            <span className="absolute inset-0 flex items-center px-2 text-white text-xs font-medium truncate">
                              {task.title}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            <div className="font-medium">{task.title}</div>
                            <div className="text-xs">
                              {format(new Date(task.startDate!), "dd/MM/yyyy")} - {format(new Date(task.endDate!), "dd/MM/yyyy")}
                            </div>
                            <div className="text-xs">Progresso: {task.progress}%</div>
                            {task.dependencyIds && task.dependencyIds.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                Depende de: {task.dependencyIds.length} tarefa(s)
                              </div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              );
            })}

            {/* SVG overlay for dependency arrows */}
            <svg 
              className="absolute top-0 pointer-events-none z-20"
              style={{ 
                left: '256px',
                width: 'calc(100% - 256px)',
                height: `${filteredTasks.length * 48}px`
              }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
                </marker>
                <marker
                  id="arrowhead-highlight"
                  markerWidth="8"
                  markerHeight="6"
                  refX="7"
                  refY="3"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#3b82f6" />
                </marker>
              </defs>
              
              {dependencyConnections.map((conn, index) => {
                const fromTask = filteredTasks[conn.fromIndex];
                const toTask = filteredTasks[conn.toIndex];
                const arrowData = getArrowPath(conn.fromIndex, conn.toIndex, fromTask, toTask);
                
                if (!arrowData) return null;

                const { fromEndX, toStartX, fromY, toY } = arrowData;
                
                // Calculate actual pixel positions based on percentage
                // We'll use viewBox to handle percentage-based coordinates
                const svgWidth = 1000; // Virtual width for calculations
                
                const startX = (fromEndX / 100) * svgWidth;
                const endX = (toStartX / 100) * svgWidth;
                
                // Determine if we need to curve around (when the target is before the source in time)
                const needsWrapAround = endX < startX + 20;
                
                let pathD: string;
                
                if (needsWrapAround) {
                  // Arrow goes: right from source → down → left → down → right to target
                  const offsetX = 30;
                  const midY = (fromY + toY) / 2;
                  pathD = `
                    M ${startX} ${fromY}
                    L ${startX + offsetX} ${fromY}
                    Q ${startX + offsetX + 10} ${fromY} ${startX + offsetX + 10} ${fromY + 10}
                    L ${startX + offsetX + 10} ${midY - 10}
                    Q ${startX + offsetX + 10} ${midY} ${startX + offsetX} ${midY}
                    L ${endX - offsetX} ${midY}
                    Q ${endX - offsetX - 10} ${midY} ${endX - offsetX - 10} ${midY + 10}
                    L ${endX - offsetX - 10} ${toY - 10}
                    Q ${endX - offsetX - 10} ${toY} ${endX - offsetX} ${toY}
                    L ${endX - 5} ${toY}
                  `;
                } else {
                  // Simple curved path from end of source to start of target
                  const controlPointOffset = Math.min(50, (endX - startX) / 3);
                  pathD = `
                    M ${startX} ${fromY}
                    C ${startX + controlPointOffset} ${fromY}
                      ${endX - controlPointOffset} ${toY}
                      ${endX - 5} ${toY}
                  `;
                }

                return (
                  <path
                    key={`${conn.fromTaskId}-${conn.toTaskId}-${index}`}
                    d={pathD}
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                    markerEnd="url(#arrowhead)"
                    opacity="0.7"
                  />
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Legend */}
      {dependencyConnections.length > 0 && (
        <div className="p-3 border-t bg-muted/20 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="font-medium">Legenda:</span>
          <div className="flex items-center gap-1">
            <svg width="24" height="12">
              <line x1="0" y1="6" x2="20" y2="6" stroke="#6b7280" strokeWidth="2" strokeDasharray="4 2" />
              <polygon points="18,3 24,6 18,9" fill="#6b7280" />
            </svg>
            <span>Dependência</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🔗</span>
            <span>Tarefa com dependências</span>
          </div>
        </div>
      )}
    </div>
  );
}
