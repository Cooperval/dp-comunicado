import { useState, useEffect } from 'react';
import { TaskDefinition, Priority, PRIORITY_CONFIG } from '@/types/fechamento';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { fechamentoService } from '@/services/fechamentoLocalStorage';
import { toast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { detectCircularDependencies } from '@/utils/fechamentoCalculations';

interface TaskDefinitionModalProps {
  definition?: TaskDefinition | null;
  allDefinitions: TaskDefinition[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function TaskDefinitionModal({
  definition,
  allDefinitions,
  open,
  onOpenChange,
  onSave,
}: TaskDefinitionModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState(1);
  const [priority, setPriority] = useState<Priority>('medium');
  const [assignee, setAssignee] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);
  const [dependencies, setDependencies] = useState<string[]>([]);
  const [selectedDep, setSelectedDep] = useState('');

  const isEditing = !!definition;

  useEffect(() => {
    if (definition) {
      setName(definition.name);
      setDescription(definition.description || '');
      setDurationDays(definition.durationDays);
      setPriority(definition.priority);
      setAssignee(definition.assignee || '');
      setIsRecurring(definition.isRecurring);
      setDependencies(definition.dependencies);
    } else {
      setName('');
      setDescription('');
      setDurationDays(1);
      setPriority('medium');
      setAssignee('');
      setIsRecurring(true);
      setDependencies([]);
    }
    setSelectedDep('');
  }, [definition, open]);

  // Filtra definições disponíveis para dependência (exclui a própria tarefa e suas dependências)
  const availableForDependency = allDefinitions.filter(d => {
    if (definition && d.id === definition.id) return false;
    if (dependencies.includes(d.id)) return false;
    return true;
  });

  const addDependency = () => {
    if (!selectedDep) return;
    
    // Verifica se criaria dependência circular
    const testDefs = allDefinitions.map(d => 
      d.id === definition?.id 
        ? { ...d, dependencies: [...dependencies, selectedDep] }
        : d
    );
    
    if (definition) {
      const circular = detectCircularDependencies(testDefs);
      if (circular) {
        toast({
          title: 'Dependência circular',
          description: 'Adicionar essa dependência criaria um ciclo',
          variant: 'destructive',
        });
        return;
      }
    }
    
    setDependencies([...dependencies, selectedDep]);
    setSelectedDep('');
  };

  const removeDependency = (depId: string) => {
    setDependencies(dependencies.filter(d => d !== depId));
  };

  const getDefName = (id: string) => {
    return allDefinitions.find(d => d.id === id)?.name || 'Desconhecida';
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    if (durationDays < 1) {
      toast({ title: 'Duração deve ser pelo menos 1 dia', variant: 'destructive' });
      return;
    }

    if (isEditing && definition) {
      fechamentoService.updateTaskDefinition(definition.id, {
        name,
        description: description || undefined,
        durationDays,
        priority,
        assignee: assignee || undefined,
        isRecurring,
        dependencies,
      });
      toast({ title: 'Tarefa atualizada' });
    } else {
      fechamentoService.createTaskDefinition({
        name,
        description: description || undefined,
        durationDays,
        priority,
        assignee: assignee || undefined,
        isRecurring,
        dependencies,
      });
      toast({ title: 'Tarefa criada' });
    }

    onSave();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da tarefa"
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
              <Label htmlFor="duration">Duração (dias)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
              />
            </div>

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
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Responsável</Label>
            <Input
              id="assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Nome do responsável"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Tarefa Recorrente</Label>
              <p className="text-xs text-muted-foreground">
                Tarefas recorrentes reiniciam todo mês
              </p>
            </div>
            <Switch
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          <div className="space-y-2">
            <Label>Dependências (predecessoras)</Label>
            <div className="flex gap-2">
              <Select value={selectedDep} onValueChange={setSelectedDep}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecione uma tarefa..." />
                </SelectTrigger>
                <SelectContent>
                  {availableForDependency.length === 0 ? (
                    <SelectItem value="none" disabled>
                      Nenhuma tarefa disponível
                    </SelectItem>
                  ) : (
                    availableForDependency.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button 
                type="button" 
                variant="outline" 
                onClick={addDependency}
                disabled={!selectedDep}
              >
                Adicionar
              </Button>
            </div>

            {dependencies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {dependencies.map((depId) => (
                  <Badge key={depId} variant="secondary" className="gap-1">
                    {getDefName(depId)}
                    <button
                      type="button"
                      onClick={() => removeDependency(depId)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Esta tarefa só pode iniciar após a conclusão das predecessoras
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
