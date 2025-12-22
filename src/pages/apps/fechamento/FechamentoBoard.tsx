import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, Calendar, LayoutGrid, List, BarChart3, 
  AlertCircle, CheckCircle2, Clock, AlertTriangle 
} from 'lucide-react';
import { fechamentoService } from '@/services/fechamentoLocalStorage';
import { 
  Board, TaskDefinition, TaskExecution, MonthlyCycle, 
  TaskStatus, PRIORITY_CONFIG, STATUS_CONFIG 
} from '@/types/fechamento';
import { formatCycleName, calculateCycleStats } from '@/utils/fechamentoCalculations';
import { KanbanViewNew } from './components/KanbanViewNew';
import { TaskListViewNew } from './components/TaskListViewNew';
import { GanttChartNew } from './components/GanttChartNew';
import { ResetCycleDialog } from './components/ResetCycleDialog';
import { TaskExecutionModal } from './components/TaskExecutionModal';

type ViewMode = 'kanban' | 'list' | 'gantt';

export interface EnrichedExecution {
  execution: TaskExecution;
  definition: TaskDefinition;
  isBlocked: boolean;
  isOverdue: boolean;
  blockingTasks: string[];
}

export function FechamentoBoard() {
  const [board, setBoard] = useState<Board | null>(null);
  const [definitions, setDefinitions] = useState<TaskDefinition[]>([]);
  const [executions, setExecutions] = useState<TaskExecution[]>([]);
  const [cycle, setCycle] = useState<MonthlyCycle | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [selectedExecution, setSelectedExecution] = useState<EnrichedExecution | null>(null);

  // Carrega dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = fechamentoService.getData();
    
    // Pega o primeiro board recorrente
    const recurringBoard = data.boards.find(b => b.type === 'recurring');
    if (!recurringBoard) return;

    setBoard(recurringBoard);
    setDefinitions(data.taskDefinitions.filter(d => 
      recurringBoard.taskDefinitionIds.includes(d.id)
    ));

    const currentCycle = data.monthlyCycles.find(c => c.id === recurringBoard.currentCycleId);
    setCycle(currentCycle || null);

    if (currentCycle) {
      setExecutions(data.taskExecutions.filter(e => 
        e.boardId === recurringBoard.id && e.cycleId === currentCycle.id
      ));
    }
  };

  // Enriquece execuções com informações de dependência e atraso
  const enrichedExecutions = useMemo((): EnrichedExecution[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return executions.map(execution => {
      const definition = definitions.find(d => d.id === execution.taskDefinitionId);
      if (!definition) return null;

      // Verifica se está bloqueada (dependências não concluídas)
      const blockingTasks: string[] = [];
      let isBlocked = false;

      for (const depId of definition.dependencies) {
        const depExec = executions.find(e => 
          e.taskDefinitionId === depId
        );
        if (depExec && depExec.status !== 'completed') {
          isBlocked = true;
          const depDef = definitions.find(d => d.id === depId);
          if (depDef) blockingTasks.push(depDef.name);
        }
      }

      // Verifica se está atrasada
      const endDate = new Date(execution.endDate);
      endDate.setHours(0, 0, 0, 0);
      const isOverdue = execution.status !== 'completed' && endDate < today;

      return {
        execution,
        definition,
        isBlocked,
        isOverdue,
        blockingTasks,
      };
    }).filter(Boolean) as EnrichedExecution[];
  }, [executions, definitions]);

  // Estatísticas do ciclo
  const stats = useMemo(() => {
    return calculateCycleStats(executions);
  }, [executions]);

  // Handler para atualizar status de uma execução
  const handleUpdateExecution = (executionId: string, status: TaskStatus) => {
    fechamentoService.updateExecution(executionId, { status });
    loadData();
  };

  // Handler para resetar ciclo
  const handleResetCycle = () => {
    if (!board) return;
    fechamentoService.resetCurrentCycle(board.id);
    loadData();
    setIsResetDialogOpen(false);
  };

  // Handler para clicar em uma tarefa
  const handleTaskClick = (enriched: EnrichedExecution) => {
    setSelectedExecution(enriched);
  };

  if (!board || !cycle) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Fechamento Mensal
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Ciclo: {formatCycleName(cycle)}
                </span>
                <Badge variant={cycle.status === 'active' ? 'default' : 'secondary'}>
                  {cycle.status === 'active' ? 'Ativo' : 'Concluído'}
                </Badge>
              </div>
            </div>

            <Button 
              variant="destructive" 
              onClick={() => setIsResetDialogOpen(true)}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Resetar Fechamento
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-muted">
                    <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <Clock className="h-4 w-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.notStarted}</p>
                    <p className="text-xs text-muted-foreground">Não Iniciadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                    <p className="text-xs text-muted-foreground">Em Andamento</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.completed}</p>
                    <p className="text-xs text-muted-foreground">Concluídas</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.overdue}</p>
                    <p className="text-xs text-muted-foreground">Atrasadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content with Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="h-full flex flex-col">
          <div className="px-6 pt-4 border-b bg-background">
            <TabsList>
              <TabsTrigger value="kanban" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Kanban
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="gantt" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Gantt
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto">
            <TabsContent value="kanban" className="h-full m-0 p-6">
              <KanbanViewNew
                enrichedExecutions={enrichedExecutions}
                onUpdateStatus={handleUpdateExecution}
                onTaskClick={handleTaskClick}
              />
            </TabsContent>

            <TabsContent value="list" className="h-full m-0 p-6">
              <TaskListViewNew
                enrichedExecutions={enrichedExecutions}
                onTaskClick={handleTaskClick}
              />
            </TabsContent>

            <TabsContent value="gantt" className="h-full m-0 p-6">
              <GanttChartNew
                enrichedExecutions={enrichedExecutions}
                cycle={cycle}
                onTaskClick={handleTaskClick}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Reset Dialog */}
      <ResetCycleDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetCycle}
        cycleName={formatCycleName(cycle)}
      />

      {/* Task Detail Modal */}
      {selectedExecution && (
        <TaskExecutionModal
          enriched={selectedExecution}
          isOpen={!!selectedExecution}
          onClose={() => setSelectedExecution(null)}
          onUpdateStatus={(status) => {
            handleUpdateExecution(selectedExecution.execution.id, status);
            setSelectedExecution(null);
          }}
        />
      )}
    </div>
  );
}

export default FechamentoBoard;
