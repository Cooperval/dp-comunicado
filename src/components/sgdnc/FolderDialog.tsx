// src/components/sgdnc/FolderDialog.tsx

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
import { Loader2 } from 'lucide-react';
import type { Pasta } from '@/hooks/sgdnc/usePastas';

interface FolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { nome: string; pastaParentId?: string; cor?: string }) => void;
  pastaEditando?: Pasta | null;
  pastas: Pasta[];
}

export function FolderDialog({
  open,
  onOpenChange,
  onSave,
  pastaEditando,
  pastas,
}: FolderDialogProps) {
  const [nome, setNome] = useState('');
  const [pastaParentId, setPastaParentId] = useState<string | null>(null);
  const [cor, setCor] = useState('#3B82F6');
  const [loading, setLoading] = useState(false);

  // Preenche os campos quando pastaEditando muda
  useEffect(() => {
    if (pastaEditando) {
      setNome(pastaEditando.nome || '');
      setPastaParentId(pastaEditando.pasta_parent_id ? String(pastaEditando.pasta_parent_id) : null);
      setCor(pastaEditando.cor || '#3B82F6');
    } else {
      setNome('');
      setPastaParentId(null);
      setCor('#3B82F6');
    }
  }, [pastaEditando]);

  // Reseta ao fechar
  const handleClose = (open: boolean) => {
    if (!open) {
      setNome('');
      setPastaParentId(null);
      setCor('#3B82F6');
    }
    onOpenChange(open);
  };

  const handleSave = () => {
    if (!nome.trim()) return;

    const novaProfundidade = pastaParentId
      ? getProfundidade(pastaParentId, pastas) + 1
      : 1;

    if (novaProfundidade > 4) {
      alert('Não é possível criar pastas além do nível bisneto (máximo 4 níveis).');
      return;
    }

    setLoading(true);
    onSave({
      nome: nome.trim(),
      pastaParentId: pastaParentId || undefined,
      cor,
    });
    setLoading(false);
  };

  const isEdit = !!pastaEditando;


  const buildPastaPath = (pastaId: string, pastas: Pasta[]): string => {
    const path: string[] = [];
    let current = pastas.find(p => String(p.id_pasta) === pastaId);

    while (current) {
      path.unshift(current.nome);
      if (!current.pasta_parent_id) break;
      current = pastas.find(p => p.id_pasta === current!.pasta_parent_id);
    }

    return path.length > 0 ? path.join(' > ') : 'Raiz';
  };


  // Função para calcular a profundidade de uma pasta
  const getProfundidade = (pastaId: string | null, pastas: Pasta[]): number => {
    if (!pastaId) return 1; // Raiz = nível 1

    let profundidade = 1;
    let currentId: string | number | null = pastaId;

    while (currentId) {
      const pasta = pastas.find(p => String(p.id_pasta) === String(currentId));
      if (!pasta) break;
      if (!pasta.pasta_parent_id) break;
      profundidade++;
      currentId = pasta.pasta_parent_id;
    }

    return profundidade;
  };

  // Profundidade da pasta que está sendo editada (ou 1 se for nova)
  const profundidadeAtual = pastaEditando
    ? getProfundidade(String(pastaEditando.id_pasta), pastas)
    : (pastaParentId ? getProfundidade(pastaParentId, pastas) + 1 : 1);



  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Pasta' : 'Nova Pasta'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Altere os dados da pasta selecionada'
              : 'Crie uma nova pasta para organizar seus documentos'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome">Nome da Pasta *</Label>
            <Input
              id="nome"
              placeholder="Ex: Procedimentos ISO"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Pasta Pai */}
          <div className="space-y-2">
            <Label htmlFor="parent">Pasta Pai (opcional)</Label>
            <Select
              value={pastaParentId ?? 'root'}
              onValueChange={(value) => setPastaParentId(value === 'root' ? null : value)}
              disabled={loading}
            >
              <SelectTrigger id="parent">
                <SelectValue placeholder="Selecione uma pasta pai" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Nenhuma (pasta raiz)</SelectItem>
                {pastas
                  .filter((p) => {
                    // Evita auto-referência
                    if (pastaEditando && p.id_pasta === pastaEditando.id_pasta) return false;

                    // Calcula profundidade se essa pasta fosse pai
                    const novaProfundidadeSeFilho = getProfundidade(String(p.id_pasta), pastas) + 1;

                    // Bloqueia se ultrapassar 4 níveis
                    return novaProfundidadeSeFilho <= 4;
                  })
                  .map((pasta) => {
                    const caminho = buildPastaPath(String(pasta.id_pasta), pastas);
                    const profundidade = getProfundidade(String(pasta.id_pasta), pastas);

                    return (
                      <SelectItem
                        key={pasta.id_pasta}
                        value={String(pasta.id_pasta)}
                        // Opcional: desabilita visualmente se estiver no limite
                        className={getProfundidade(String(pasta.id_pasta), pastas) >= 4 ? 'text-muted-foreground' : ''}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{pasta.nome}</span>
                          <span className="text-xs text-muted-foreground">
                            {caminho} (nível {profundidade + 1})
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>

          {/* Cor */}
          <div className="space-y-2">
            <Label htmlFor="cor">Cor da Pasta</Label>
            <div className="flex gap-2">
              <Input
                id="cor"
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                className="w-20 h-10 cursor-pointer"
                disabled={loading}
              />
              <Input
                type="text"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
                placeholder="#3B82F6"
                className="flex-1"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!nome.trim() || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : isEdit ? (
              'Salvar Alterações'
            ) : (
              'Criar Pasta'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
