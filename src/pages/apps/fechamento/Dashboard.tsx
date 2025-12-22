import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fechamentoService } from '@/services/fechamentoLocalStorage';
import { Board, Task, PRIORITY_CONFIG } from '@/types/fechamento';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  LayoutDashboard, 
  Kanban, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Plus 
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = fechamentoService.getData();
    setBoards(data.boards);
    setAllTasks(data.tasks);
  };

  const stats = {
    totalBoards: boards.length,
    totalTasks: allTasks.length,
    completedTasks: allTasks.filter((t) => t.progress === 100).length,
    inProgressTasks: allTasks.filter((t) => t.progress > 0 && t.progress < 100).length,
    overdueTasks: allTasks.filter(
      (t) => t.endDate && new Date(t.endDate) < new Date() && t.progress < 100
    ).length,
    urgentTasks: allTasks.filter((t) => t.priority === 'urgent' && t.progress < 100).length,
  };

  const completionRate = stats.totalTasks > 0 
    ? Math.round((stats.completedTasks / stats.totalTasks) * 100) 
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do fechamento</p>
        </div>
        <Button onClick={() => navigate('/apps/fechamento/quadros')}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Quadro
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Tarefas</CardTitle>
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              em {stats.totalBoards} quadro(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedTasks}</div>
            <Progress value={completionRate} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">{completionRate}% concluído</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgressTasks}</div>
            <p className="text-xs text-muted-foreground">
              tarefas em progresso
            </p>
          </CardContent>
        </Card>

        <Card className={stats.overdueTasks > 0 ? 'border-destructive/50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.overdueTasks > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.overdueTasks > 0 ? 'text-destructive' : ''}`}>
              {stats.overdueTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.urgentTasks > 0 && `${stats.urgentTasks} urgente(s)`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Boards list */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quadros</h2>
        {boards.length === 0 ? (
          <Card className="p-8 text-center">
            <Kanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhum quadro criado</h3>
            <p className="text-muted-foreground mb-4">
              Crie seu primeiro quadro para começar a gerenciar tarefas
            </p>
            <Button onClick={() => navigate('/apps/fechamento/quadros')}>
              Criar Quadro
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => {
              const boardTasks = allTasks.filter((t) => t.boardId === board.id);
              const completed = boardTasks.filter((t) => t.progress === 100).length;
              const progress = boardTasks.length > 0 
                ? Math.round((completed / boardTasks.length) * 100) 
                : 0;

              return (
                <Card 
                  key={board.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/apps/fechamento/quadro/${board.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{board.name}</CardTitle>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    {board.description && (
                      <CardDescription>{board.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>{boardTasks.length} tarefa(s)</span>
                      <span>{completed} concluída(s)</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {progress}%
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent urgent tasks */}
      {stats.urgentTasks > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Tarefas Urgentes
          </h2>
          <div className="space-y-2">
            {allTasks
              .filter((t) => t.priority === 'urgent' && t.progress < 100)
              .slice(0, 5)
              .map((task) => {
                const board = boards.find((b) => b.id === task.boardId);
                return (
                  <Card 
                    key={task.id} 
                    className="cursor-pointer hover:shadow-sm transition-shadow border-l-4"
                    style={{ borderLeftColor: PRIORITY_CONFIG.urgent.color }}
                    onClick={() => navigate(`/apps/fechamento/quadro/${task.boardId}`)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{task.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {board?.name}
                        </div>
                      </div>
                      <div className="text-right">
                        <Progress value={task.progress} className="h-2 w-20" />
                        <span className="text-xs text-muted-foreground">{task.progress}%</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
