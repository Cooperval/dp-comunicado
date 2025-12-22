import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { useAuth } from '@/pages/apps/controle-financeiro/auth/AuthProvider';
import { CommitmentType } from '@/pages/apps/controle-financeiro/types/hierarchy';

interface GroupFormProps {
  types: CommitmentType[];
  onSubmit: (
    data: { name: string; description: string; color: string; commitment_type_id: string },
    isUniversal: boolean
  ) => Promise<boolean>;
}

export function GroupForm({ types, onSubmit }: GroupFormProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#6B7280',
    commitment_type_id: ''
  });
  const [isUniversal, setIsUniversal] = useState(false);

  const handleSubmit = async () => {
    const success = await onSubmit(formData, isUniversal);
    if (success) {
      setFormData({ name: '', description: '', color: '#6B7280', commitment_type_id: '' });
      setIsUniversal(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Grupo de Natureza</CardTitle>
        <CardDescription>Crie um novo grupo de natureza (ex: Receitas, Despesas)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="group-type">
            Tipo de Natureza <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.commitment_type_id}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, commitment_type_id: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="group-name">Nome</Label>
          <Input
            id="group-name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Receitas"
          />
        </div>
        <div>
          <Label htmlFor="group-description">Descrição</Label>
          <Input
            id="group-description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Descrição do grupo"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="group-universal"
            checked={isUniversal}
            onCheckedChange={(checked) => setIsUniversal(checked as boolean)}
            disabled={profile?.role !== 'admin'}
          />
          <Label htmlFor="group-universal" className="text-sm font-normal cursor-pointer">
            Universal (visível para todas empresas)
            {profile?.role !== 'admin' && (
              <span className="text-xs text-muted-foreground ml-2">(Apenas admins)</span>
            )}
          </Label>
        </div>
        <Button onClick={handleSubmit} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Criar Grupo
        </Button>
      </CardContent>
    </Card>
  );
}
