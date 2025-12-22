import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { useAuth } from '@/pages/apps/controle-financeiro/auth/AuthProvider';
import { CommitmentType, CommitmentGroup } from '@/pages/apps/controle-financeiro/types/hierarchy';

interface CommitmentFormProps {
  types: CommitmentType[];
  groups: CommitmentGroup[];
  onSubmit: (
    data: {
      name: string;
      description: string;
      commitment_group_id: string;
      commitment_type_id: string;
      classification: 'fixo' | 'variavel';
    },
    isUniversal: boolean
  ) => Promise<boolean>;
}

export function CommitmentForm({ types, groups, onSubmit }: CommitmentFormProps) {
  const { profile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    commitment_group_id: '',
    commitment_type_id: '',
    classification: 'variavel' as 'fixo' | 'variavel'
  });
  const [isUniversal, setIsUniversal] = useState(false);
  const [filteredGroups, setFilteredGroups] = useState<CommitmentGroup[]>([]);

  useEffect(() => {
    if (formData.commitment_type_id) {
      const filtered = groups.filter((g) => g.commitment_type_id === formData.commitment_type_id);
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups(groups);
    }
  }, [formData.commitment_type_id, groups]);

  const handleSubmit = async () => {
    const success = await onSubmit(formData, isUniversal);
    if (success) {
      setFormData({
        name: '',
        description: '',
        commitment_group_id: '',
        commitment_type_id: '',
        classification: 'variavel'
      });
      setIsUniversal(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Natureza</CardTitle>
        <CardDescription>Crie uma nova natureza associada a um grupo e tipo</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="commitment-type">
            Tipo de Natureza <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.commitment_type_id}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, commitment_type_id: value, commitment_group_id: '' }))
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
          <Label htmlFor="commitment-group">
            Grupo de Natureza <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.commitment_group_id}
            onValueChange={(value) => setFormData((prev) => ({ ...prev, commitment_group_id: value }))}
            disabled={!formData.commitment_type_id}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  !formData.commitment_type_id
                    ? 'Selecione primeiro o tipo'
                    : filteredGroups.length === 0
                    ? 'Nenhum grupo disponível para este tipo'
                    : 'Selecione o grupo'
                }
              />
            </SelectTrigger>
            <SelectContent>
              {filteredGroups.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  Nenhum grupo disponível para este tipo
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: group.color }}
                      />
                      {group.name}
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="commitment-name">Nome</Label>
          <Input
            id="commitment-name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Aluguel, Vendas"
          />
        </div>
        <div>
          <Label htmlFor="commitment-description">Descrição</Label>
          <Input
            id="commitment-description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Descrição da natureza"
          />
        </div>
        <div>
          <Label htmlFor="commitment-classification">
            Classificação <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.classification}
            onValueChange={(value: 'fixo' | 'variavel') =>
              setFormData((prev) => ({ ...prev, classification: value }))
            }
          >
            <SelectTrigger id="commitment-classification">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixo">Fixo</SelectItem>
              <SelectItem value="variavel">Variável</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="commitment-universal"
            checked={isUniversal}
            onCheckedChange={(checked) => setIsUniversal(checked as boolean)}
            disabled={profile?.role !== 'admin'}
          />
          <Label htmlFor="commitment-universal" className="text-sm font-normal cursor-pointer">
            Universal (visível para todas empresas)
            {profile?.role !== 'admin' && (
              <span className="text-xs text-muted-foreground ml-2">(Apenas admins)</span>
            )}
          </Label>
        </div>
        <Button onClick={handleSubmit} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Criar Natureza
        </Button>
      </CardContent>
    </Card>
  );
}
