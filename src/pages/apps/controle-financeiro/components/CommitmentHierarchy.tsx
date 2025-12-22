import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FolderTree } from 'lucide-react';
import { useHierarchyCRUD } from '@/pages/apps/controle-financeiro/hooks/useHierarchyCRUD';
import { HierarchyTabs } from './hierarchy/HierarchyTabs';

interface CommitmentHierarchyProps {
  selectedGroup?: string;
  selectedCommitment?: string;
  selectedType?: string;
  onSelectionChange: (group: string, commitment: string, type: string) => void;
  showManagement?: boolean;
  showManagementExpanded?: boolean;
  onHierarchyChange?: () => void;
}

export const CommitmentHierarchy: React.FC<CommitmentHierarchyProps> = ({
  selectedGroup,
  selectedCommitment,
  selectedType,
  onSelectionChange,
  showManagement = false,
  showManagementExpanded = false,
  onHierarchyChange
}) => {
  const { types, groups, commitments, loading } = useHierarchyCRUD();
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);

  const filteredCommitments = commitments.filter((c) => c.commitment_group_id === selectedGroup);

  if (loading) {
    return <div className="text-center py-4">Carregando hierarquia...</div>;
  }

  const selectionContent = (
    <div className="space-y-4">
      <div>
        <Select value={selectedType} onValueChange={(value) => onSelectionChange('', '', value)}>
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
        <Select value={selectedGroup} onValueChange={(value) => onSelectionChange(value, '', selectedType || '')}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o grupo" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                  {group.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Select
          value={selectedCommitment}
          onValueChange={(value) => onSelectionChange(selectedGroup || '', value, selectedType || '')}
          disabled={!selectedGroup}
        >
          <SelectTrigger>
            <SelectValue placeholder={!selectedGroup ? 'Selecione primeiro um grupo' : 'Selecione a natureza'} />
          </SelectTrigger>
          <SelectContent>
            {filteredCommitments.map((commitment) => (
              <SelectItem key={commitment.id} value={commitment.id}>
                {commitment.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {selectionContent}

      {showManagement && !showManagementExpanded && (
        <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full">
              <FolderTree className="w-4 h-4 mr-2" />
              Gerenciar Hierarquia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Gerenciar Hierarquia de Naturezas</DialogTitle>
              <DialogDescription>
                Crie e edite tipos, grupos e naturezas da sua empresa
              </DialogDescription>
            </DialogHeader>
            <HierarchyTabs onHierarchyChange={onHierarchyChange} />
          </DialogContent>
        </Dialog>
      )}

      {showManagementExpanded && <HierarchyTabs onHierarchyChange={onHierarchyChange} />}
    </div>
  );
};
