import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fechamentoService } from '@/services/fechamentoLocalStorage';
import { Board, BoardType, BOARD_TYPE_CONFIG } from '@/types/fechamento';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { toast } from '@/hooks/use-toast';
import { Plus, Kanban, Trash2, Edit, ArrowRight, RefreshCw, FileText } from 'lucide-react';

export default function Quadros() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<Board[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBoard, setEditingBoard] = useState<Board | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [boardType, setBoardType] = useState<BoardType>('recurring');

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = () => {
    setBoards(fechamentoService.getBoards());
  };

  const openNewDialog = () => {
    setEditingBoard(null);
    setName('');
    setDescription('');
    setBoardType('recurring');
    setDialogOpen(true);
  };

  const openEditDialog = (board: Board, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBoard(board);
    setName(board.name);
    setDescription(board.description || '');
    setBoardType(board.type);
    setDialogOpen(true);
  };

  const openDeleteDialog = (board: Board, e: React.MouseEvent) => {
    e.stopPropagation();
    setBoardToDelete(board);
    setDeleteDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }

    if (editingBoard) {
      fechamentoService.updateBoard(editingBoard.id, { name, description: description || undefined });
      toast({ title: 'Quadro atualizado' });
    } else {
      const newBoard = fechamentoService.createBoard(name, description || undefined, boardType);
      toast({ title: 'Quadro criado' });
      navigate(`/apps/fechamento/quadro/${newBoard.id}`);
    }

    setDialogOpen(false);
    loadBoards();
  };

  const handleDelete = () => {
    if (boardToDelete) {
      fechamentoService.deleteBoard(boardToDelete.id);
      toast({ title: 'Quadro excluído' });
      setDeleteDialogOpen(false);
      setBoardToDelete(null);
      loadBoards();
    }
  };

  const getTaskCount = (boardId: string) => {
    return fechamentoService.getTasks(boardId).length;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quadros</h1>
          <p className="text-muted-foreground">Gerencie seus quadros de fechamento</p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Quadro
        </Button>
      </div>

      {boards.length === 0 ? (
        <Card className="p-12 text-center">
          <Kanban className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-medium mb-2">Nenhum quadro criado</h3>
          <p className="text-muted-foreground mb-6">
            Crie seu primeiro quadro para começar a organizar suas tarefas de fechamento
          </p>
          <Button onClick={openNewDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Quadro
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <Card
              key={board.id}
              className="cursor-pointer hover:shadow-md transition-shadow group"
              onClick={() => navigate(`/apps/fechamento/quadro/${board.id}`)}
            >
              <CardHeader>
                  <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Kanban className="h-5 w-5 text-primary" />
                        {board.name}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {board.type === 'recurring' ? (
                          <><RefreshCw className="h-3 w-3 mr-1" />Mensal</>
                        ) : (
                          <><FileText className="h-3 w-3 mr-1" />Contínuo</>
                        )}
                      </Badge>
                    </div>
                    {board.description && (
                      <CardDescription className="mt-1">{board.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => openEditDialog(board, e)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={(e) => openDeleteDialog(board, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{getTaskCount(board.id)} tarefa(s)</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBoard ? 'Editar Quadro' : 'Novo Quadro'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome do quadro"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>
            {!editingBoard && (
              <div className="space-y-3">
                <Label>Tipo do Quadro</Label>
                <RadioGroup value={boardType} onValueChange={(v) => setBoardType(v as BoardType)}>
                  {Object.entries(BOARD_TYPE_CONFIG).map(([key, config]) => (
                    <div key={key} className="flex items-start space-x-3">
                      <RadioGroupItem value={key} id={key} className="mt-1" />
                      <div className="grid gap-0.5">
                        <Label htmlFor={key} className="flex items-center gap-2 cursor-pointer">
                          {config.icon} {config.label}
                        </Label>
                        <p className="text-xs text-muted-foreground">{config.description}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir quadro?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Todas as tarefas do quadro "{boardToDelete?.name}" serão excluídas permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
