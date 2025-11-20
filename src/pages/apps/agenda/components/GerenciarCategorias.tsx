import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCategorias, createCategoria, updateCategoria, deleteCategoria } from '@/services/agendaLocalStorage';
import { Settings, Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';

export default function GerenciarCategorias() {
  const [open, setOpen] = useState(false);
  const [categorias, setCategorias] = useState(() => getCategorias());
  const [editando, setEditando] = useState<string | null>(null);
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#3b82f6');

  const handleSalvar = () => {
    if (!nome.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    if (editando) {
      updateCategoria(editando, { nome: nome.trim(), cor });
      toast.success('Categoria atualizada');
    } else {
      createCategoria({
        nome: nome.trim(),
        cor,
        ativo: true,
      });
      toast.success('Categoria criada');
    }

    setNome('');
    setCor('#3b82f6');
    setEditando(null);
    setCategorias(getCategorias());
  };

  const handleEditar = (id: string) => {
    const cat = categorias.find((c) => c.id === id);
    if (cat) {
      setNome(cat.nome);
      setCor(cat.cor);
      setEditando(id);
    }
  };

  const handleExcluir = (id: string) => {
    if (confirm('Deseja desativar esta categoria?')) {
      deleteCategoria(id);
      toast.success('Categoria desativada');
      setCategorias(getCategorias());
    }
  };

  const handleCancelar = () => {
    setNome('');
    setCor('#3b82f6');
    setEditando(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Gerenciar Categorias
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Categoria</Label>
                    <Input
                      placeholder="Ex: Trabalho"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cor</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={cor}
                        onChange={(e) => setCor(e.target.value)}
                        className="w-20 h-10"
                      />
                      <Input
                        type="text"
                        value={cor}
                        onChange={(e) => setCor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSalvar} className="flex-1">
                    {editando ? 'Atualizar' : <><Plus className="h-4 w-4 mr-2" /> Adicionar</>}
                  </Button>
                  {editando && (
                    <Button variant="outline" onClick={handleCancelar}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Categorias */}
          <div className="space-y-2">
            <Label>Categorias Existentes</Label>
            <div className="space-y-2 max-h-[300px] overflow-auto">
              {categorias.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded"
                      style={{ backgroundColor: cat.cor }}
                    />
                    <span className="font-medium">{cat.nome}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditar(cat.id)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExcluir(cat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
