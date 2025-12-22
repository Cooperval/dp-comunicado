import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fechamentoService } from '@/services/fechamentoLocalStorage';
import { Board, Task } from '@/types/fechamento';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from './components/KanbanBoard';
import { GanttChart } from './components/GanttChart';
import { TaskListView } from './components/TaskListView';
import { TaskDetailModal } from './components/TaskDetailModal';
import { ArrowLeft, Kanban, GanttChartSquare, List, Plus } from 'lucide-react';

export default function BoardView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState('kanban');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('todo');

  useEffect(() => {
    if (id) {
      loadBoard();
    }
  }, [id]);

  const loadBoard = () => {
    if (!id) return;
    const boardData = fechamentoService.getBoard(id);
    if (boardData) {
      setBoard(boardData);
      setTasks(fechamentoService.getTasks(id));
    } else {
      navigate('/apps/fechamento/quadros');
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setSelectedColumnId(task.columnId);
    setModalOpen(true);
  };

  const handleAddTask = (columnId: string) => {
    setSelectedTask(null);
    setSelectedColumnId(columnId);
    setModalOpen(true);
  };

  const handleTaskSave = () => {
    loadBoard();
  };

  if (!board) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/apps/fechamento/quadros')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{board.name}</h1>
            {board.description && (
              <p className="text-muted-foreground">{board.description}</p>
            )}
          </div>
        </div>
        <Button onClick={() => handleAddTask('todo')}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <Kanban className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="gantt" className="flex items-center gap-2">
            <GanttChartSquare className="h-4 w-4" />
            Gantt
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          <KanbanBoard
            board={board}
            tasks={tasks}
            onTasksChange={loadBoard}
            onTaskClick={handleTaskClick}
            onAddTask={handleAddTask}
          />
        </TabsContent>

        <TabsContent value="gantt" className="mt-4">
          <GanttChart tasks={tasks} onTaskClick={handleTaskClick} />
        </TabsContent>

        <TabsContent value="list" className="mt-4">
          <TaskListView
            tasks={tasks}
            columns={board.columns}
            onTaskClick={handleTaskClick}
          />
        </TabsContent>
      </Tabs>

      <TaskDetailModal
        task={selectedTask}
        boardId={board.id}
        columnId={selectedColumnId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleTaskSave}
      />
    </div>
  );
}
