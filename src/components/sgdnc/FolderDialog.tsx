import { useState } from 'react';
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
import type { Pasta } from '@/services/sgdncMockData';

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { nome: string; pastaParentId?: string; cor?: string }) => void;
  pastas: Pasta[];
}

export function FolderDialog({ open, onOpenChange, onSave, pastas }: FolderDialogProps) {
  const [nome, setNome] = useState('');
  const [pastaParentId, setPastaParentId] = useState('');
  const [cor, setCor] = useState('#3B82F6');

  const handleSave = () => {
    if (!nome.trim()) return;
    
    onSave({
      nome: nome.trim(),
      pastaParentId: pastaParentId || undefined,
      cor,
    });

    setNome('');
    setPastaParentId('');
    setCor('#3B82F6');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Pasta</DialogTitle>
          <DialogDescription>
            Crie uma nova pasta para organizar seus documentos
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
                <SelectItem value="">Nenhuma (pasta raiz)</SelectItem>
                {pastas.map((pasta) => (
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!nome.trim()}>
            Criar Pasta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
