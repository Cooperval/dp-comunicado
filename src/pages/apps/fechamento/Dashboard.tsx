import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fechamentoService } from '@/services/fechamentoLocalStorage';
import { Board, Task, PRIORITY_CONFIG } from '@/types/fechamento';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Kanban, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Plus,
  Users,
  RefreshCw
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const CHART_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
];

interface MemberStats {
  id: string;
  name: string;
  total: number;
  completed: number;
  inProgress: number;
  overdue: number;
}

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

  // Métricas por responsável
  const memberStats = useMemo<MemberStats[]>(() => {
    const statsMap = new Map<string, MemberStats>();
    
    allTasks.forEach(task => {
      const assigneeId = task.assignedTo?.id || (task as any).assigneeId || 'unassigned';
      const assigneeName = task.assignedTo?.name || (task as any).assigneeName || 'Sem responsável';
      
      if (!statsMap.has(assigneeId)) {
        statsMap.set(assigneeId, {
          id: assigneeId,
          name: assigneeName,
          total: 0,
          completed: 0,
          inProgress: 0,
          overdue: 0
        });
      }
      
      const memberStat = statsMap.get(assigneeId)!;
      memberStat.total++;
      
      if (task.progress === 100) {
        memberStat.completed++;
      } else if (task.progress > 0) {
        memberStat.inProgress++;
      }
      
      if (task.endDate && new Date(task.endDate) < new Date() && task.progress < 100) {
        memberStat.overdue++;
      }
    });
    
    return Array.from(statsMap.values()).filter(s => s.total > 0);
  }, [allTasks]);

  // Dados para gráfico de pizza
  const pieChartData = useMemo(() => 
    memberStats.map((member, index) => ({
      name: member.name,
      value: member.total,
      fill: CHART_COLORS[index % CHART_COLORS.length]
    })), [memberStats]);

  // Dados para gráfico de barras
  const barChartData = useMemo(() => 
    memberStats.map(member => ({
      name: member.name.split(' ')[0],
      concluídas: member.completed,
      emAndamento: member.inProgress,
      atrasadas: member.overdue
    })), [memberStats]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do fechamento</p>
        </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                <RefreshCw className="h-4 w-4 mr-2" />
                Resetar Mês
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-destructive" />
                  Confirmar Reset do Mês
                </AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-3">
                    <p>
                      Esta ação irá <strong className="text-foreground">resetar todas as tarefas</strong> de 
                      todos os quadros recorrentes para o status "A Fazer".
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      <li>Progresso será zerado (0%)</li>
                      <li>Datas de início/término reais serão limpas</li>
                      <li>Cronograma será recalculado</li>
                    </ul>
                    <p className="text-destructive font-medium">
                      Esta ação não pode ser desfeita!
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    const result = fechamentoService.resetAllTasks();
                    loadData();
                    toast.success("Mês resetado com sucesso!", {
                      description: `${result.tasksReset} tarefa(s) de ${result.boardsReset} quadro(s) foram reiniciadas.`
                    });
                  }}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sim, Resetar Tudo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={() => navigate('/apps/fechamento/quadros')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Quadro
          </Button>
        </div>
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

      {/* Métricas por Responsável */}
      {allTasks.length > 0 && memberStats.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Métricas por Responsável
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Pizza - Distribuição */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição de Tarefas</CardTitle>
                <CardDescription>Quantidade de tarefas por responsável</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => 
                        `${name.split(' ')[0]} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Gráfico de Barras - Status por Responsável */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status por Responsável</CardTitle>
                <CardDescription>Progresso de tarefas de cada membro</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="concluídas" fill="#10B981" stackId="stack" name="Concluídas" />
                    <Bar dataKey="emAndamento" fill="#3B82F6" stackId="stack" name="Em Andamento" />
                    <Bar dataKey="atrasadas" fill="#EF4444" stackId="stack" name="Atrasadas" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tabela de Performance */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Performance da Equipe</CardTitle>
              <CardDescription>Ranking de conclusão e alertas de atraso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {memberStats
                  .sort((a, b) => {
                    const rateA = a.total > 0 ? a.completed / a.total : 0;
                    const rateB = b.total > 0 ? b.completed / b.total : 0;
                    return rateB - rateA;
                  })
                  .map((member) => {
                    const completionRate = member.total > 0 
                      ? Math.round((member.completed / member.total) * 100) 
                      : 0;
                    
                    return (
                      <div key={member.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium truncate">{member.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {member.completed}/{member.total} ({completionRate}%)
                            </span>
                          </div>
                          <Progress value={completionRate} className="h-2" />
                        </div>
                        {member.overdue > 0 && (
                          <Badge variant="destructive" className="shrink-0">
                            {member.overdue} atrasada{member.overdue > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
