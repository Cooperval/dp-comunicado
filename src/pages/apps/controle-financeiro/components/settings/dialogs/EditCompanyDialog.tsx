import React, { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SEGMENTS } from '@/pages/apps/controle-financeiro/constants/settingsConstants';
import { Company } from '@/pages/apps/controle-financeiro/hooks/useSettingsData';

interface EditCompanyDialogProps {
  open: boolean;
  company: Company | null;
  onClose: () => void;
  onSave: (id: string, data: { name: string; segment: string }) => void;
}

export function EditCompanyDialog({ open, company, onClose, onSave }: EditCompanyDialogProps) {
  const [form, setForm] = useState({
    name: '',
    segment: '',
  });

  useEffect(() => {
    if (company) {
      setForm({
        name: company.name,
        segment: company.segment || '',
      });
    }
  }, [company]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (company) {
      onSave(company.id, form);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Empresa</DialogTitle>
          <DialogDescription>Atualize as informações da empresa</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit_company_name">Nome da Empresa</Label>
            <Input
              id="edit_company_name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Digite o nome da empresa"
              required
            />
          </div>

          <div>
            <Label htmlFor="edit_segment">Segmento</Label>
            <Select value={form.segment} onValueChange={(value) => setForm({ ...form, segment: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o segmento" />
              </SelectTrigger>
              <SelectContent>
                {SEGMENTS.map((segment) => (
                  <SelectItem key={segment.value} value={segment.value}>
                    {segment.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Salvar Alterações</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
