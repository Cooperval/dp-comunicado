import { Task, Column, PRIORITY_CONFIG } from '@/types/fechamento';
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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, User } from 'lucide-react';

interface TaskListViewProps {
  tasks: Task[];
  columns: Column[];
  onTaskClick: (task: Task) => void;
}

export function TaskListView({ tasks, columns, onTaskClick }: TaskListViewProps) {
  const sortedTasks = [...tasks].sort((a, b) => {
    // Sort by column order first, then by task order
    const colA = columns.find((c) => c.id === a.columnId);
    const colB = columns.find((c) => c.id === b.columnId);
    if (colA && colB && colA.order !== colB.order) {
      return colA.order - colB.order;
    }
    return a.order - b.order;
  });

  const getColumnInfo = (columnId: string) => {
    return columns.find((c) => c.id === columnId);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-[300px]">Tarefa</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[100px]">Prioridade</TableHead>
            <TableHead className="w-[120px]">Responsável</TableHead>
            <TableHead className="w-[100px]">Início</TableHead>
            <TableHead className="w-[100px]">Fim</TableHead>
            <TableHead className="w-[120px]">Progresso</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Nenhuma tarefa encontrada
              </TableCell>
            </TableRow>
          ) : (
            sortedTasks.map((task) => {
              const column = getColumnInfo(task.columnId);
              const priorityConfig = PRIORITY_CONFIG[task.priority];
              const isOverdue = task.endDate && new Date(task.endDate) < new Date() && task.progress < 100;

              return (
                <TableRow
                  key={task.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onTaskClick(task)}
                >
                  <TableCell>
                    <div>
                      <div className={`font-medium ${isOverdue ? 'text-destructive' : ''}`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1">
                          {task.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {column && (
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: column.color,
                          backgroundColor: `${column.color}20`,
                        }}
                      >
                        {column.title}
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
                      {priorityConfig.icon} {priorityConfig.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <div className="flex items-center gap-1 text-sm">
                        <User className="h-3 w-3" />
                        {task.assignee}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.startDate ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(task.startDate), "dd/MM", { locale: ptBR })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.endDate ? (
                      <div className={`flex items-center gap-1 text-sm ${isOverdue ? 'text-destructive' : ''}`}>
                        <Calendar className="h-3 w-3" />
                        {format(new Date(task.endDate), "dd/MM", { locale: ptBR })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={task.progress} className="h-2 w-16" />
                      <span className="text-xs text-muted-foreground">{task.progress}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
