import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { useAuth } from '@/pages/apps/controle-financeiro/auth/AuthProvider';

interface TypeFormProps {
  onSubmit: (data: { name: string; description: string }, isUniversal: boolean) => Promise<boolean>;
}

export function TypeForm({ onSubmit }: TypeFormProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isUniversal, setIsUniversal] = useState(false);

  const handleSubmit = async () => {
    const success = await onSubmit(formData, isUniversal);
    if (success) {
      setFormData({ name: '', description: '' });
      setIsUniversal(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Novo Tipo de Natureza</CardTitle>
        <CardDescription>Crie um novo tipo de natureza independente</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="type-name">Nome</Label>
          <Input
            id="type-name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Peças, Serviços"
          />
        </div>
        <div>
          <Label htmlFor="type-description">Descrição</Label>
          <Input
            id="type-description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Descrição do tipo"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="type-universal"
            checked={isUniversal}
            onCheckedChange={(checked) => setIsUniversal(checked as boolean)}
            disabled={profile?.role !== 'admin'}
          />
          <Label htmlFor="type-universal" className="text-sm font-normal cursor-pointer">
            Universal (visível para todas empresas)
            {profile?.role !== 'admin' && (
              <span className="text-xs text-muted-foreground ml-2">(Apenas admins)</span>
            )}
          </Label>
        </div>
        <Button onClick={handleSubmit} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Criar Tipo
        </Button>
      </CardContent>
    </Card>
  );
}
