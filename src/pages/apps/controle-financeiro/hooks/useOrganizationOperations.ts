import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateBranchDTO {
  name: string;
  description?: string;
  city?: string;
  state?: string;
  company_id: string;
}

interface UpdateBranchDTO {
  name: string;
  description?: string;
  city?: string;
  state?: string;
}

interface CreateCompanyDTO {
  name: string;
  segment: string;
  group_id: string;
}

interface UpdateCompanyDTO {
  name: string;
  segment: string;
}

export function useOrganizationOperations(onSuccess: () => void) {
  const [processing, setProcessing] = useState(false);

  const createBranch = async (data: CreateBranchDTO) => {
    setProcessing(true);
    try {
      const { error } = await supabase.from('branches').insert(data);
      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Filial criada com sucesso!',
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating branch:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a filial.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const updateBranch = async (id: string, data: UpdateBranchDTO) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('branches')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Filial atualizada com sucesso!',
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating branch:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a filial.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const deleteBranch = async (id: string, name: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('branches')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Filial "${name}" deletada com sucesso!`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar a filial.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const createCompany = async (data: CreateCompanyDTO) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('companies')
        .insert({
          name: data.name,
          segment: data.segment,
          group_id: data.group_id,
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Empresa cadastrada com sucesso!',
      });

      onSuccess();
    } catch (error) {
      console.error('Error creating company:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível cadastrar a empresa.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const updateCompany = async (id: string, data: UpdateCompanyDTO) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Empresa atualizada com sucesso!',
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating company:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a empresa.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const deleteCompany = async (id: string, name: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Empresa "${name}" deletada com sucesso!`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar a empresa.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  return {
    createBranch,
    updateBranch,
    deleteBranch,
    createCompany,
    updateCompany,
    deleteCompany,
    processing,
  };
}
