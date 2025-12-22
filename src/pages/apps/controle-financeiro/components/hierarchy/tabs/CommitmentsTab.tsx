import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Check } from 'lucide-react';
import { useAuth } from '@/pages/apps/controle-financeiro/auth/AuthProvider';
import { CommitmentType, CommitmentGroup, Commitment } from '@/pages/apps/controle-financeiro/types/hierarchy';
import { SearchablePaginatedList } from '../SearchablePaginatedList';
import { CommitmentForm } from '../forms/CommitmentForm';

interface CommitmentsTabProps {
  commitments: Commitment[];
  groups: CommitmentGroup[];
  types: CommitmentType[];
  onCreateCommitment: (
    data: {
      name: string;
      description: string;
      commitment_group_id: string;
      commitment_type_id: string;
      classification: 'fixo' | 'variavel';
    },
    isUniversal: boolean
  ) => Promise<boolean>;
  onUpdateCommitment: (
    id: string,
    data: {
      name: string;
      description: string;
      commitment_group_id: string;
      commitment_type_id?: string;
      classification: 'fixo' | 'variavel';
    }
  ) => Promise<boolean>;
  onDeleteCommitment: (id: string) => Promise<boolean>;
}

export function CommitmentsTab({
  commitments,
  groups,
  types,
  onCreateCommitment,
  onUpdateCommitment,
  onDeleteCommitment
}: CommitmentsTabProps) {
  const { profile } = useAuth();
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [filteredGroups, setFilteredGroups] = useState<CommitmentGroup[]>([]);

  useEffect(() => {
    if (editingCommitment?.commitment_type_id) {
      const filtered = groups.filter((g) => g.commitment_type_id === editingCommitment.commitment_type_id);
      setFilteredGroups(filtered);
    } else {
      setFilteredGroups(groups);
    }
  }, [editingCommitment?.commitment_type_id, groups]);

  const handleUpdate = async () => {
    if (!editingCommitment) return;
    const success = await onUpdateCommitment(editingCommitment.id, {
      name: editingCommitment.name,
      description: editingCommitment.description,
      commitment_group_id: editingCommitment.commitment_group_id,
      commitment_type_id: editingCommitment.commitment_type_id,
      classification: editingCommitment.classification
    });
    if (success) {
      setEditingCommitment(null);
    }
  };

  return (
    <div className="space-y-4">
      <CommitmentForm types={types} groups={groups} onSubmit={onCreateCommitment} />

      <SearchablePaginatedList
        items={commitments}
        searchPlaceholder="Pesquisar naturezas..."
        searchFields={['name', 'description']}
        renderItem={(commitment) => {
          const group = groups.find((g) => g.id === commitment.commitment_group_id);
          const type = types.find((t) => t.id === commitment.commitment_type_id);

          return (
            <div className="flex items-center justify-between p-3 border rounded-lg">
              {editingCommitment?.id === commitment.id ? (
                <div className="flex-1 mr-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="edit-commitment-type">Tipo</Label>
                      <Select
                        value={editingCommitment.commitment_type_id || 'none'}
                        onValueChange={(value) =>
                          setEditingCommitment((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  commitment_type_id: value === 'none' ? undefined : value,
                                  commitment_group_id:
                                    value === 'none' ? prev.commitment_group_id : ''
                                }
                              : null
                          )
                        }
                      >
                        <SelectTrigger id="edit-commitment-type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {types.map((t) => (
                            <SelectItem key={t.id} value={t.id}>
                              {t.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-commitment-group">Grupo</Label>
                      <Select
                        value={editingCommitment.commitment_group_id}
                        onValueChange={(value) =>
                          setEditingCommitment((prev) =>
                            prev ? { ...prev, commitment_group_id: value } : null
                          )
                        }
                        disabled={!editingCommitment.commitment_type_id}
                      >
                        <SelectTrigger id="edit-commitment-group">
                          <SelectValue
                            placeholder={
                              !editingCommitment.commitment_type_id
                                ? 'Selecione primeiro o tipo'
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
                            filteredGroups.map((g) => (
                              <SelectItem key={g.id} value={g.id}>
                                {g.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="edit-commitment-name">Nome</Label>
                      <Input
                        id="edit-commitment-name"
                        value={editingCommitment.name}
                        onChange={(e) =>
                          setEditingCommitment((prev) =>
                            prev ? { ...prev, name: e.target.value } : null
                          )
                        }
                        placeholder="Nome"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-commitment-description">Descrição</Label>
                      <Input
                        id="edit-commitment-description"
                        value={editingCommitment.description || ''}
                        onChange={(e) =>
                          setEditingCommitment((prev) =>
                            prev ? { ...prev, description: e.target.value } : null
                          )
                        }
                        placeholder="Descrição"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-commitment-classification">
                      Classificação <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={editingCommitment.classification}
                      onValueChange={(value: 'fixo' | 'variavel') =>
                        setEditingCommitment((prev) =>
                          prev ? { ...prev, classification: value } : null
                        )
                      }
                    >
                      <SelectTrigger id="edit-commitment-classification">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixo">Fixo</SelectItem>
                        <SelectItem value="variavel">Variável</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{commitment.name}</span>
                    <Badge
                      variant={commitment.classification === 'fixo' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {commitment.classification === 'fixo' ? 'Fixo' : 'Variável'}
                    </Badge>
                    {commitment.company_id === null && (
                      <Badge variant="outline" className="text-xs">
                        Universal
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {group?.name} {type && `• ${type.name}`}
                  </div>
                  {commitment.description && (
                    <div className="text-xs text-muted-foreground">{commitment.description}</div>
                  )}
                </div>
              )}
              <div className="flex gap-2">
                {editingCommitment?.id === commitment.id ? (
                  <>
                    <Button size="sm" onClick={handleUpdate}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingCommitment(null)}>
                      ×
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingCommitment(commitment)}
                      disabled={commitment.company_id === null && profile?.role !== 'admin'}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDeleteCommitment(commitment.id)}
                      disabled={commitment.company_id === null && profile?.role !== 'admin'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
