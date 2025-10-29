import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface Pasta {
  id: string;
  nome: string;
  pasta_parent_id?: string | null;
  pastaParentId?: string;
  cor?: string;
}

export interface CreatePastaInput {
  nome: string;
  pasta_parent_id?: string;
  cor?: string;
}

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: CreatePastaInput) => Promise<void>;
  pastas: Pasta[];
  pastaEditando?: Pasta | null;
}

export function FolderDialog({ open, onOpenChange, onSave, pastas, pastaEditando }: FolderDialogProps) {
  const [nome, setNome] = useState('');
  const [pastaParentId, setPastaParentId] = useState('');
  const [cor, setCor] = useState('#3B82F6');
  const [loading, setLoading] = useState(false);

  // Sincronizar estado com pasta editando
  useEffect(() => {
    if (pastaEditando) {
      setNome(pastaEditando.nome);
      setPastaParentId(pastaEditando.pasta_parent_id || pastaEditando.pastaParentId || '');
      setCor(pastaEditando.cor || '#3B82F6');
    } else {
      setNome('');
      setPastaParentId('');
      setCor('#3B82F6');
    }
  }, [pastaEditando]);

  const handleSave = async () => {
    if (!nome.trim()) return;
    
    setLoading(true);
    try {
      await onSave({
        nome: nome.trim(),
        pasta_parent_id: pastaParentId || undefined,
        cor,
      });

      setNome('');
      setPastaParentId('');
      setCor('#3B82F6');
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar pasta:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para verificar se uma pasta é descendente de outra
  const isDescendente = (pastaId: string, ancestralId: string): boolean => {
    const pasta = pastas.find(p => p.id === pastaId);
    if (!pasta) return false;
    const parentId = pasta.pasta_parent_id || pasta.pastaParentId;
    if (!parentId) return false;
    if (parentId === ancestralId) return true;
    return isDescendente(parentId, ancestralId);
  };

  // Filtrar pastas para não permitir selecionar a própria pasta ou suas filhas como pai
  const pastasDisponiveis = pastaEditando
    ? pastas.filter(p => p.id !== pastaEditando.id && !isDescendente(p.id, pastaEditando.id))
    : pastas;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{pastaEditando ? 'Editar Pasta' : 'Nova Pasta'}</DialogTitle>
          <DialogDescription>
            {pastaEditando
              ? 'Edite as informações da pasta'
              : 'Crie uma nova pasta para organizar seus documentos'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Pasta *</Label>
            <Input
              id="nome"
              placeholder="Ex: Procedimentos ISO"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent">Pasta Pai (opcional)</Label>
            <Select value={pastaParentId} onValueChange={setPastaParentId}>
              <SelectTrigger id="parent">
                <SelectValue placeholder="Nenhuma (pasta raiz)" />
              </SelectTrigger>
              <SelectContent>
                {pastasDisponiveis.map((pasta) => (
                  <SelectItem key={pasta.id} value={pasta.id}>
                    {pasta.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cor">Cor da Pasta</Label>
            <div className="flex gap-2">
              <Input
                id="cor"
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                placeholder="#3B82F6"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!nome.trim() || loading}>
            {loading ? 'Salvando...' : pastaEditando ? 'Salvar' : 'Criar Pasta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
