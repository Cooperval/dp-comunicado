import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useHierarchyCRUD } from '@/pages/apps/controle-financeiro/hooks/useHierarchyCRUD';
import { TypesTab } from './tabs/TypesTab';
import { GroupsTab } from './tabs/GroupsTab';
import { CommitmentsTab } from './tabs/CommitmentsTab';

interface HierarchyTabsProps {
  onHierarchyChange?: () => void;
}

export function HierarchyTabs({ onHierarchyChange }: HierarchyTabsProps) {
  const {
    types,
    groups,
    commitments,
    loading,
    createType,
    updateType,
    deleteType,
    createGroup,
    updateGroup,
    deleteGroup,
    createCommitment,
    updateCommitment,
    deleteCommitment
  } = useHierarchyCRUD();

  const handleSuccess = async (callback: () => Promise<boolean>) => {
    const result = await callback();
    if (result && onHierarchyChange) {
      onHierarchyChange();
    }
    return result;
  };

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <Tabs defaultValue="types" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="types">Tipos</TabsTrigger>
        <TabsTrigger value="groups">Grupos</TabsTrigger>
        <TabsTrigger value="commitments">Naturezas</TabsTrigger>
      </TabsList>

      <TabsContent value="types" className="space-y-4">
        <TypesTab
          types={types}
          onCreateType={(data, isUniversal) => handleSuccess(() => createType(data, isUniversal))}
          onUpdateType={(id, data) => handleSuccess(() => updateType(id, data))}
          onDeleteType={(id) => handleSuccess(() => deleteType(id))}
        />
      </TabsContent>

      <TabsContent value="groups" className="space-y-4">
        <GroupsTab
          groups={groups}
          types={types}
          onCreateGroup={(data, isUniversal) => handleSuccess(() => createGroup(data, isUniversal))}
          onUpdateGroup={(id, data) => handleSuccess(() => updateGroup(id, data))}
          onDeleteGroup={(id) => handleSuccess(() => deleteGroup(id))}
        />
      </TabsContent>

      <TabsContent value="commitments" className="space-y-4">
        <CommitmentsTab
          commitments={commitments}
          groups={groups}
          types={types}
          onCreateCommitment={(data, isUniversal) =>
            handleSuccess(() => createCommitment(data, isUniversal))
          }
          onUpdateCommitment={(id, data) => handleSuccess(() => updateCommitment(id, data))}
          onDeleteCommitment={(id) => handleSuccess(() => deleteCommitment(id))}
        />
      </TabsContent>
    </Tabs>
  );
}
