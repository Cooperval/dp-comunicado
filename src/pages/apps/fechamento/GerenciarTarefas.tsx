import { useState, useEffect } from 'react';
import { fechamentoService } from '@/services/fechamentoLocalStorage';
import { TaskDefinition, Board, PRIORITY_CONFIG, BOARD_TYPE_CONFIG } from '@/types/fechamento';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, Edit, Trash2, Clock, Link, RefreshCw, 
  FileText, AlertTriangle, Kanban 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TaskDefinitionModal } from './components/TaskDefinitionModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { detectCircularDependencies } from '@/utils/fechamentoCalculations';

export default function GerenciarTarefas() {
  const [definitions, setDefinitions] = useState<TaskDefinition[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'recurring' | 'non-recurring'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDef, setEditingDef] = useState<TaskDefinition | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [defToDelete, setDefToDelete] = useState<TaskDefinition | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setDefinitions(fechamentoService.getTaskDefinitions());
    setBoards(fechamentoService.getBoards());
  };

  const filteredDefinitions = definitions.filter(def => {
    const matchesSearch = def.name.toLowerCase().includes(search.toLowerCase()) ||
      def.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = filterType === 'all' || 
      (filterType === 'recurring' && def.isRecurring) ||
      (filterType === 'non-recurring' && !def.isRecurring);
    
    return matchesSearch && matchesType;
  });

  const getBoardsUsingDefinition = (defId: string) => {
    return boards.filter(b => b.taskDefinitionIds.includes(defId));
  };

  const getDependencyNames = (def: TaskDefinition) => {
    return def.dependencies.map(depId => {
      const depDef = definitions.find(d => d.id === depId);
      return depDef?.name || 'Desconhecida';
    });
  };

  const handleEdit = (def: TaskDefinition) => {
    setEditingDef(def);
    setModalOpen(true);
  };

  const handleNew = () => {
    setEditingDef(null);
    setModalOpen(true);
  };

  const handleDelete = (def: TaskDefinition) => {
    setDefToDelete(def);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (defToDelete) {
      // Verifica se outras tarefas dependem desta
      const dependents = definitions.filter(d => d.dependencies.includes(defToDelete.id));
      if (dependents.length > 0) {
        toast({
          title: 'Não é possível excluir',
          description: `Esta tarefa é dependência de: ${dependents.map(d => d.name).join(', ')}`,
          variant: 'destructive',
        });
        setDeleteDialogOpen(false);
        return;
      }

      fechamentoService.deleteTaskDefinition(defToDelete.id);
      toast({ title: 'Tarefa excluída' });
      setDeleteDialogOpen(false);
      setDefToDelete(null);
      loadData();
    }
  };

  const handleSave = () => {
    loadData();
    setModalOpen(false);
  };

  // Verifica dependências circulares
  const circularDeps = detectCircularDependencies(definitions);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Tarefas</h1>
          <p className="text-muted-foreground">
            Cadastre e edite definições de tarefas reutilizáveis
          </p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {circularDeps && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Dependência circular detectada!</p>
              <p className="text-sm text-muted-foreground">
                Ciclo: {circularDeps.join(' → ')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="recurring">Recorrentes</SelectItem>
            <SelectItem value="non-recurring">Não Recorrentes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredDefinitions.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">Nenhuma tarefa encontrada</h3>
          <p className="text-muted-foreground mb-6">
            {search ? 'Tente ajustar sua busca' : 'Crie sua primeira definição de tarefa'}
          </p>
          <Button onClick={handleNew}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeira Tarefa
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDefinitions.map((def) => {
            const priorityConfig = PRIORITY_CONFIG[def.priority];
            const usedInBoards = getBoardsUsingDefinition(def.id);
            const dependencies = getDependencyNames(def);

            return (
              <Card key={def.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-lg">{def.name}</h3>
                        <Badge variant="outline" className="gap-1">
                          {def.isRecurring ? (
                            <>
                              <RefreshCw className="h-3 w-3" />
                              Recorrente
                            </>
                          ) : (
                            <>
                              <FileText className="h-3 w-3" />
                              Contínua
                            </>
                          )}
                        </Badge>
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: priorityConfig.color,
                            color: priorityConfig.color,
                          }}
                        >
                          {priorityConfig.icon} {priorityConfig.label}
                        </Badge>
                      </div>

                      {def.description && (
                        <p className="text-sm text-muted-foreground">{def.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {def.durationDays} dia{def.durationDays !== 1 ? 's' : ''}
                        </span>

                        {dependencies.length > 0 && (
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Link className="h-4 w-4" />
                            Depende de: {dependencies.join(', ')}
                          </span>
                        )}
                      </div>

                      {usedInBoards.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">Usado em:</span>
                          {usedInBoards.map(board => (
                            <Badge key={board.id} variant="secondary" className="text-xs">
                              <Kanban className="h-3 w-3 mr-1" />
                              {board.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(def)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(def)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TaskDefinitionModal
        definition={editingDef}
        allDefinitions={definitions}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. A definição "{defToDelete?.name}" será excluída permanentemente, junto com todas as suas execuções.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
