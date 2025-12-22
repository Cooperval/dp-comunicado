import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateCompanyDialogProps {
  open: boolean;
  groupId: string | null;
  groupName: string;
  onClose: () => void;
  onSave: (data: { name: string; segment: string; group_id: string }) => void;
}

export function CreateCompanyDialog({ open, groupId, groupName, onClose, onSave }: CreateCompanyDialogProps) {
  const [name, setName] = useState('');
  const [segment, setSegment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupId) {
      onSave({
        name,
        segment,
        group_id: groupId,
      });
      setName('');
      setSegment('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Empresa</DialogTitle>
          <DialogDescription>
            Adicionar uma nova empresa ao grupo "{groupName}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Empresa *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Acme Corp"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="segment">Segmento *</Label>
            <Select value={segment} onValueChange={setSegment} required>
              <SelectTrigger id="segment">
                <SelectValue placeholder="Selecione o segmento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Comércio">Comércio</SelectItem>
                <SelectItem value="Serviços">Serviços</SelectItem>
                <SelectItem value="Indústria">Indústria</SelectItem>
                <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                <SelectItem value="Saúde">Saúde</SelectItem>
                <SelectItem value="Educação">Educação</SelectItem>
                <SelectItem value="Outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Criar Empresa</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
