import { useMemo, useState } from 'react';
import { Task, PRIORITY_CONFIG } from '@/types/fechamento';
import { format, differenceInDays, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GanttChartProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

type ViewMode = 'week' | 'month';

export function GanttChart({ tasks, onTaskClick }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const { startDate, endDate, days } = useMemo(() => {
    let start: Date;
    let end: Date;

    if (viewMode === 'week') {
      start = startOfWeek(currentDate, { weekStartsOn: 1 });
      end = addDays(start, 13); // 2 weeks
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

  const getTaskPosition = (task: Task) => {
    if (!task.startDate || !task.endDate) return null;

    const taskStart = startOfDay(new Date(task.startDate));
    const taskEnd = startOfDay(new Date(task.endDate));
    const rangeStart = startOfDay(startDate);
    const rangeEnd = startOfDay(endDate);

    // Check if task is within the visible range
    if (taskEnd < rangeStart || taskStart > rangeEnd) return null;

    const effectiveStart = taskStart < rangeStart ? rangeStart : taskStart;
    const effectiveEnd = taskEnd > rangeEnd ? rangeEnd : taskEnd;

    const totalDays = differenceInDays(rangeEnd, rangeStart) + 1;
    const startOffset = differenceInDays(effectiveStart, rangeStart);
    const duration = differenceInDays(effectiveEnd, effectiveStart) + 1;

    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return { left: `${left}%`, width: `${width}%` };
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
      <div className="max-h-[400px] overflow-y-auto">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhuma tarefa com datas definidas
          </div>
        ) : (
          filteredTasks.map((task) => {
            const position = getTaskPosition(task);
            const priorityConfig = PRIORITY_CONFIG[task.priority];
            const isOverdue = task.endDate && new Date(task.endDate) < new Date() && task.progress < 100;

            return (
              <div key={task.id} className="flex border-b last:border-b-0 hover:bg-muted/10">
                <div
                  className="w-64 shrink-0 p-2 border-r cursor-pointer truncate"
                  onClick={() => onTaskClick(task)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{priorityConfig.icon}</span>
                    <span className={`truncate text-sm ${isOverdue ? 'text-destructive' : ''}`}>
                      {task.title}
                    </span>
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
                          className="absolute top-2 h-8 rounded cursor-pointer transition-transform hover:scale-[1.02] overflow-hidden"
                          style={{
                            left: position.left,
                            width: position.width,
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
