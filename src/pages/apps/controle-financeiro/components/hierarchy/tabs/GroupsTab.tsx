import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Check } from 'lucide-react';
import { useAuth } from '@/pages/apps/controle-financeiro/auth/AuthProvider';
import { CommitmentType, CommitmentGroup } from '@/pages/apps/controle-financeiro/types/hierarchy';
import { SearchablePaginatedList } from '../SearchablePaginatedList';
import { GroupForm } from '../forms/GroupForm';

interface GroupsTabProps {
  groups: CommitmentGroup[];
  types: CommitmentType[];
  onCreateGroup: (
    data: { name: string; description: string; color: string; commitment_type_id: string },
    isUniversal: boolean
  ) => Promise<boolean>;
  onUpdateGroup: (
    id: string,
    data: { name: string; description: string; color: string; commitment_type_id: string }
  ) => Promise<boolean>;
  onDeleteGroup: (id: string) => Promise<boolean>;
}

export function GroupsTab({ groups, types, onCreateGroup, onUpdateGroup, onDeleteGroup }: GroupsTabProps) {
  const { profile } = useAuth();
  const [editingGroup, setEditingGroup] = useState<CommitmentGroup | null>(null);

  const handleUpdate = async () => {
    if (!editingGroup || !editingGroup.commitment_type_id) return;
    const success = await onUpdateGroup(editingGroup.id, {
      name: editingGroup.name,
      description: editingGroup.description,
      color: editingGroup.color,
      commitment_type_id: editingGroup.commitment_type_id
    });
    if (success) {
      setEditingGroup(null);
    }
  };

  return (
    <div className="space-y-4">
      <GroupForm types={types} onSubmit={onCreateGroup} />

      <SearchablePaginatedList
        items={groups}
        searchPlaceholder="Pesquisar grupos..."
        searchFields={['name', 'description']}
        renderItem={(group) => (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            {editingGroup?.id === group.id ? (
              <div className="flex-1 mr-2 space-y-2">
                <div>
                  <Label htmlFor="edit-group-type">Tipo</Label>
                  <Select
                    value={editingGroup.commitment_type_id || ''}
                    onValueChange={(value) =>
                      setEditingGroup((prev) =>
                        prev ? { ...prev, commitment_type_id: value } : null
                      )
                    }
                  >
                    <SelectTrigger id="edit-group-type">
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-group-name">Nome</Label>
                    <Input
                      id="edit-group-name"
                      value={editingGroup.name}
                      onChange={(e) =>
                        setEditingGroup((prev) => (prev ? { ...prev, name: e.target.value } : null))
                      }
                      placeholder="Nome do grupo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-group-description">Descrição</Label>
                    <Input
                      id="edit-group-description"
                      value={editingGroup.description || ''}
                      onChange={(e) =>
                        setEditingGroup((prev) =>
                          prev ? { ...prev, description: e.target.value } : null
                        )
                      }
                      placeholder="Descrição"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{group.name}</span>
                    {group.company_id === null && (
                      <Badge variant="outline" className="text-xs">
                        Universal
                      </Badge>
                    )}
                    {!group.commitment_type_id && (
                      <Badge variant="destructive" className="text-xs">
                        ⚠️ Tipo não definido
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {group.description}
                    {group.commitment_type_id && (
                      <span className="ml-2 text-xs">
                        • Tipo: {types.find((t) => t.id === group.commitment_type_id)?.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              {editingGroup?.id === group.id ? (
                <>
                  <Button size="sm" onClick={handleUpdate}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingGroup(null)}>
                    ×
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingGroup(group)}
                    disabled={group.company_id === null && profile?.role !== 'admin'}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDeleteGroup(group.id)}
                    disabled={group.company_id === null && profile?.role !== 'admin'}
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
