import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/pages/apps/controle-financeiro/auth/AuthProvider';
import { CommitmentType, CommitmentGroup, Commitment } from '@/pages/apps/controle-financeiro/types/hierarchy';

export function useHierarchyCRUD() {
  const { companyId } = useAuth();
  const [types, setTypes] = useState<CommitmentType[]>([]);
  const [groups, setGroups] = useState<CommitmentGroup[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHierarchy = useCallback(async () => {
    try {
      setLoading(true);

      const [groupsData, commitmentsData, typesData] = await Promise.all([
        supabase.from('commitment_groups').select('*').eq('is_active', true).order('name'),
        supabase.from('commitments').select('*').eq('is_active', true).order('name'),
        supabase.from('commitment_types').select('*').eq('is_active', true).order('name')
      ]);

      if (groupsData.error) throw groupsData.error;
      if (commitmentsData.error) throw commitmentsData.error;
      if (typesData.error) throw typesData.error;

      setGroups(groupsData.data || []);
      setCommitments((commitmentsData.data || []) as Commitment[]);
      setTypes(typesData.data || []);
    } catch (error) {
      console.error('Error fetching hierarchy:', error);
      toast({
        title: 'Erro ao carregar hierarquia',
        description: 'Não foi possível carregar os dados da hierarquia',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  const createType = async (data: { name: string; description: string }, isUniversal: boolean) => {
    if (!data.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite o nome do tipo de natureza',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const { error } = await supabase.from('commitment_types').insert({
        company_id: isUniversal ? null : companyId,
        name: data.name,
        description: data.description
      });

      if (error) throw error;
      await fetchHierarchy();
      
      toast({
        title: 'Tipo criado',
        description: 'Tipo de natureza criado com sucesso'
      });
      return true;
    } catch (error) {
      console.error('Error creating type:', error);
      toast({
        title: 'Erro ao criar tipo',
        description: 'Não foi possível criar o tipo',
        variant: 'destructive'
      });
      return false;
    }
  };

  const updateType = async (id: string, data: { name: string; description: string }) => {
    if (!data.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite o nome do tipo de natureza',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('commitment_types')
        .update({ name: data.name, description: data.description })
        .eq('id', id);

      if (error) throw error;
      await fetchHierarchy();
      
      toast({
        title: 'Tipo atualizado',
        description: 'Tipo de natureza atualizado com sucesso'
      });
      return true;
    } catch (error) {
      console.error('Error updating type:', error);
      toast({
        title: 'Erro ao atualizar tipo',
        description: 'Não foi possível atualizar o tipo',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteType = async (id: string) => {
    try {
      const { data: commitmentsUsingType, error: checkError } = await supabase
        .from('commitments')
        .select('id')
        .eq('commitment_type_id', id)
        .eq('is_active', true);

      if (checkError) throw checkError;

      if (commitmentsUsingType && commitmentsUsingType.length > 0) {
        toast({
          title: 'Não é possível deletar',
          description: 'Este tipo possui naturezas atreladas a ele',
          variant: 'destructive'
        });
        return false;
      }

      const { error } = await supabase
        .from('commitment_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      await fetchHierarchy();
      
      toast({
        title: 'Tipo excluído',
        description: 'Tipo de natureza excluído com sucesso'
      });
      return true;
    } catch (error) {
      console.error('Error deleting type:', error);
      toast({
        title: 'Erro ao excluir tipo',
        description: 'Não foi possível excluir o tipo',
        variant: 'destructive'
      });
      return false;
    }
  };

  const createGroup = async (
    data: { name: string; description: string; color: string; commitment_type_id: string },
    isUniversal: boolean
  ) => {
    if (!data.name.trim() || !data.commitment_type_id) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome e selecione o tipo do grupo',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const { error } = await supabase.from('commitment_groups').insert({
        company_id: isUniversal ? null : companyId,
        name: data.name,
        description: data.description,
        color: data.color,
        commitment_type_id: data.commitment_type_id
      });

      if (error) throw error;
      await fetchHierarchy();
      
      toast({
        title: 'Grupo criado',
        description: 'Grupo de natureza criado com sucesso'
      });
      return true;
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Erro ao criar grupo',
        description: 'Não foi possível criar o grupo',
        variant: 'destructive'
      });
      return false;
    }
  };

  const updateGroup = async (
    id: string,
    data: { name: string; description: string; color: string; commitment_type_id: string }
  ) => {
    if (!data.name.trim() || !data.commitment_type_id) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome e selecione o tipo do grupo',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('commitment_groups')
        .update({
          name: data.name,
          description: data.description,
          color: data.color,
          commitment_type_id: data.commitment_type_id
        })
        .eq('id', id);

      if (error) throw error;
      await fetchHierarchy();
      
      toast({
        title: 'Grupo atualizado',
        description: 'Grupo de natureza atualizado com sucesso'
      });
      return true;
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: 'Erro ao atualizar grupo',
        description: 'Não foi possível atualizar o grupo',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      const { data: commitmentsUsingGroup, error: checkError } = await supabase
        .from('commitments')
        .select('id')
        .eq('commitment_group_id', id)
        .eq('is_active', true);

      if (checkError) throw checkError;

      if (commitmentsUsingGroup && commitmentsUsingGroup.length > 0) {
        toast({
          title: 'Não é possível deletar',
          description: 'Este grupo possui naturezas atreladas a ele',
          variant: 'destructive'
        });
        return false;
      }

      const { error } = await supabase
        .from('commitment_groups')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      await fetchHierarchy();
      
      toast({
        title: 'Grupo excluído',
        description: 'Grupo de natureza excluído com sucesso'
      });
      return true;
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Erro ao excluir grupo',
        description: 'Não foi possível excluir o grupo',
        variant: 'destructive'
      });
      return false;
    }
  };

  const createCommitment = async (
    data: {
      name: string;
      description: string;
      commitment_group_id: string;
      commitment_type_id: string;
      classification: 'fixo' | 'variavel';
    },
    isUniversal: boolean
  ) => {
    if (!data.name.trim() || !data.commitment_type_id || !data.commitment_group_id) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome e selecione o tipo e grupo',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const { error } = await supabase.from('commitments').insert({
        company_id: isUniversal ? null : companyId,
        commitment_group_id: data.commitment_group_id,
        commitment_type_id: data.commitment_type_id || null,
        name: data.name,
        description: data.description,
        classification: data.classification
      });

      if (error) throw error;
      await fetchHierarchy();
      
      toast({
        title: 'Natureza criada',
        description: 'Natureza criada com sucesso'
      });
      return true;
    } catch (error) {
      console.error('Error creating commitment:', error);
      toast({
        title: 'Erro ao criar natureza',
        description: 'Não foi possível criar a natureza',
        variant: 'destructive'
      });
      return false;
    }
  };

  const updateCommitment = async (
    id: string,
    data: {
      name: string;
      description: string;
      commitment_group_id: string;
      commitment_type_id?: string;
      classification: 'fixo' | 'variavel';
    }
  ) => {
    if (!data.name.trim() || !data.commitment_group_id) {
      toast({
        title: 'Dados incompletos',
        description: 'Preencha o nome e selecione um grupo',
        variant: 'destructive'
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('commitments')
        .update({
          commitment_group_id: data.commitment_group_id,
          commitment_type_id: data.commitment_type_id || null,
          name: data.name,
          description: data.description,
          classification: data.classification
        })
        .eq('id', id);

      if (error) throw error;
      await fetchHierarchy();
      
      toast({
        title: 'Natureza atualizada',
        description: 'Natureza atualizada com sucesso'
      });
      return true;
    } catch (error) {
      console.error('Error updating commitment:', error);
      toast({
        title: 'Erro ao atualizar natureza',
        description: 'Não foi possível atualizar a natureza',
        variant: 'destructive'
      });
      return false;
    }
  };

  const deleteCommitment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('commitments')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      await fetchHierarchy();
      
      toast({
        title: 'Natureza excluída',
        description: 'Natureza excluída com sucesso'
      });
      return true;
    } catch (error) {
      console.error('Error deleting commitment:', error);
      toast({
        title: 'Erro ao excluir natureza',
        description: 'Não foi possível excluir a natureza',
        variant: 'destructive'
      });
      return false;
    }
  };

  return {
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
    deleteCommitment,
    refetch: fetchHierarchy
  };
}
