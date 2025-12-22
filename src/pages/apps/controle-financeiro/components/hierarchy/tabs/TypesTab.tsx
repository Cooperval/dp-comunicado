import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Check } from 'lucide-react';
import { useAuth } from '@/pages/apps/controle-financeiro/auth/AuthProvider';
import { CommitmentType } from '@/pages/apps/controle-financeiro/types/hierarchy';
import { SearchablePaginatedList } from '../SearchablePaginatedList';
import { TypeForm } from '../forms/TypeForm';

interface TypesTabProps {
  types: CommitmentType[];
  onCreateType: (data: { name: string; description: string }, isUniversal: boolean) => Promise<boolean>;
  onUpdateType: (id: string, data: { name: string; description: string }) => Promise<boolean>;
  onDeleteType: (id: string) => Promise<boolean>;
}

export function TypesTab({ types, onCreateType, onUpdateType, onDeleteType }: TypesTabProps) {
  const { profile } = useAuth();
  const [editingType, setEditingType] = useState<CommitmentType | null>(null);

  const handleUpdate = async () => {
    if (!editingType) return;
    const success = await onUpdateType(editingType.id, {
      name: editingType.name,
      description: editingType.description
    });
    if (success) {
      setEditingType(null);
    }
  };

  return (
    <div className="space-y-4">
      <TypeForm onSubmit={onCreateType} />

      <SearchablePaginatedList
        items={types}
        searchPlaceholder="Pesquisar tipos..."
        searchFields={['name', 'description']}
        renderItem={(type) => (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            {editingType?.id === type.id ? (
              <div className="flex-1 mr-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-type-name">Nome</Label>
                    <Input
                      id="edit-type-name"
                      value={editingType.name}
                      onChange={(e) =>
                        setEditingType((prev) => (prev ? { ...prev, name: e.target.value } : null))
                      }
                      placeholder="Nome do tipo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-type-description">Descrição</Label>
                    <Input
                      id="edit-type-description"
                      value={editingType.description || ''}
                      onChange={(e) =>
                        setEditingType((prev) =>
                          prev ? { ...prev, description: e.target.value } : null
                        )
                      }
                      placeholder="Descrição"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div>
                  <div className="font-medium">{type.name}</div>
                  <div className="text-sm text-muted-foreground">{type.description}</div>
                </div>
                {type.company_id === null && (
                  <Badge variant="outline" className="text-xs">
                    Universal
                  </Badge>
                )}
              </div>
            )}
            <div className="flex gap-2">
              {editingType?.id === type.id ? (
                <>
                  <Button size="sm" onClick={handleUpdate}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingType(null)}>
                    ×
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingType(type)}
                    disabled={type.company_id === null && profile?.role !== 'admin'}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDeleteType(type.id)}
                    disabled={type.company_id === null && profile?.role !== 'admin'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      />
    </div>
  );
}
