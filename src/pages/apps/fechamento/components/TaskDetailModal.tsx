import { useState, useEffect } from 'react';
import { Task, Priority, PRIORITY_CONFIG } from '@/types/fechamento';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fechamentoService } from '@/services/fechamentoLocalStorage';
import { toast } from '@/hooks/use-toast';
import { Trash2 } from 'lucide-react';

interface TaskDetailModalProps {
  task?: Task | null;
  boardId: string;
  columnId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function TaskDetailModal({
  task,
  boardId,
  columnId,
  open,
  onOpenChange,
  onSave,
}: TaskDetailModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignee, setAssignee] = useState('');

  const isEditing = !!task;

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setProgress(task.progress);
      setStartDate(task.startDate ? task.startDate.split('T')[0] : '');
      setEndDate(task.endDate ? task.endDate.split('T')[0] : '');
      setAssignee(task.assignee || '');
    } else {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setProgress(0);
      setStartDate('');
      setEndDate('');
      setAssignee('');
    }
  }, [task, open]);

  const handleSave = () => {
    if (!title.trim()) {
      toast({ title: 'Título é obrigatório', variant: 'destructive' });
      return;
    }

    if (isEditing && task) {
      fechamentoService.updateTask(task.id, {
        title,
        description: description || undefined,
        priority,
        progress,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        assignee: assignee || undefined,
      });
      toast({ title: 'Tarefa atualizada' });
    } else {
      const tasks = fechamentoService.getTasks(boardId);
      const columnTasks = tasks.filter((t) => t.columnId === columnId);
      
      fechamentoService.createTask({
        boardId,
        columnId,
        title,
        description: description || undefined,
        priority,
        progress,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        assignee: assignee || undefined,
        order: columnTasks.length,
      });
      toast({ title: 'Tarefa criada' });
    }

    onSave();
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (task) {
      fechamentoService.deleteTask(task.id);
      toast({ title: 'Tarefa excluída' });
      onSave();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da tarefa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição detalhada..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.icon} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">Responsável</Label>
              <Input
                id="assignee"
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                placeholder="Nome"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Progresso: {progress}%</Label>
            <Slider
              value={[progress]}
              onValueChange={([v]) => setProgress(v)}
              max={100}
              step={5}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          {isEditing && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
