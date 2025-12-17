import { useState, useEffect } from 'react';
import { fechamentoService } from '@/services/fechamentoLocalStorage';
import { Column, DEFAULT_COLUMNS } from '@/types/fechamento';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Settings, RotateCcw, GripVertical, Trash2, Plus } from 'lucide-react';

export default function Configuracoes() {
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [newColumnColor, setNewColumnColor] = useState('#6b7280');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const boards = fechamentoService.getBoards();
    if (boards.length > 0) {
      setColumns(boards[0].columns);
    }
  };

  const handleResetToDefaults = () => {
    setColumns(DEFAULT_COLUMNS);
    const boards = fechamentoService.getBoards();
    boards.forEach((board) => {
      fechamentoService.updateBoard(board.id, { columns: DEFAULT_COLUMNS });
    });
    toast({ title: 'Configurações restauradas para o padrão' });
  };

  const handleAddColumn = () => {
    if (!newColumnTitle.trim()) {
      toast({ title: 'Título é obrigatório', variant: 'destructive' });
      return;
    }

    const newColumn: Column = {
      id: `col-${Date.now()}`,
      title: newColumnTitle,
      order: columns.length,
      color: newColumnColor,
    };

    const updatedColumns = [...columns, newColumn];
    setColumns(updatedColumns);
    
    const boards = fechamentoService.getBoards();
    boards.forEach((board) => {
      fechamentoService.updateBoard(board.id, { columns: updatedColumns });
    });

    setNewColumnTitle('');
    setNewColumnColor('#6b7280');
    toast({ title: 'Coluna adicionada' });
  };

  const handleRemoveColumn = (columnId: string) => {
    if (columns.length <= 2) {
      toast({ title: 'Mínimo de 2 colunas obrigatório', variant: 'destructive' });
      return;
    }

    const updatedColumns = columns
      .filter((c) => c.id !== columnId)
      .map((c, idx) => ({ ...c, order: idx }));
    
    setColumns(updatedColumns);
    
    const boards = fechamentoService.getBoards();
    boards.forEach((board) => {
      fechamentoService.updateBoard(board.id, { columns: updatedColumns });
    });

    toast({ title: 'Coluna removida' });
  };

  const handleUpdateColumn = (columnId: string, field: 'title' | 'color', value: string) => {
    const updatedColumns = columns.map((c) =>
      c.id === columnId ? { ...c, [field]: value } : c
    );
    setColumns(updatedColumns);
    
    const boards = fechamentoService.getBoards();
    boards.forEach((board) => {
      fechamentoService.updateBoard(board.id, { columns: updatedColumns });
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configurações
          </h1>
          <p className="text-muted-foreground">Configure as opções do módulo de fechamento</p>
        </div>
        <Button variant="outline" onClick={handleResetToDefaults}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Restaurar Padrão
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Colunas do Kanban</CardTitle>
          <CardDescription>
            Configure as colunas padrão que serão usadas nos quadros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing columns */}
          <div className="space-y-3">
            {columns.map((column) => (
              <div
                key={column.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                
                <div
                  className="w-6 h-6 rounded-full shrink-0"
                  style={{ backgroundColor: column.color }}
                />

                <Input
                  value={column.title}
                  onChange={(e) => handleUpdateColumn(column.id, 'title', e.target.value)}
                  className="flex-1"
                />

                <Input
                  type="color"
                  value={column.color}
                  onChange={(e) => handleUpdateColumn(column.id, 'color', e.target.value)}
                  className="w-16 h-9 p-1 cursor-pointer"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleRemoveColumn(column.id)}
                  disabled={columns.length <= 2}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Add new column */}
          <div className="flex items-center gap-3 p-3 border rounded-lg border-dashed">
            <Plus className="h-4 w-4 text-muted-foreground" />

            <Input
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="Nome da nova coluna"
              className="flex-1"
            />

            <Input
              type="color"
              value={newColumnColor}
              onChange={(e) => setNewColumnColor(e.target.value)}
              className="w-16 h-9 p-1 cursor-pointer"
            />

            <Button onClick={handleAddColumn}>Adicionar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• As alterações nas colunas serão aplicadas a todos os quadros existentes.</p>
            <p>• Tarefas em colunas removidas serão movidas para a primeira coluna disponível.</p>
            <p>• É necessário ter no mínimo 2 colunas em cada quadro.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
