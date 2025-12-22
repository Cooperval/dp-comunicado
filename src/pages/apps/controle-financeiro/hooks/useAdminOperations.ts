import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateCompanyDTO {
  name: string;
  segment: string;
  group_id: string;
}

interface UpdateCompanyDTO {
  name: string;
  segment: string;
}

interface CreateGroupDTO {
  name: string;
  description?: string;
  plan: 'free' | 'trial' | 'pro';
}

interface CreateBranchDTO {
  name: string;
  description?: string;
  city?: string;
  state?: string;
  company_id: string;
}

interface UpdateGroupDTO {
  name: string;
  description?: string;
}

interface UpdateBranchDTO {
  name: string;
  description?: string;
  city?: string;
  state?: string;
}

interface CreateUserDTO {
  email: string;
  fullName: string;
  password: string;
  role: 'operador' | 'gestor' | 'representante';
  groupId: string;  // Grupo selecionado diretamente
}

interface UpdateUserDTO {
  full_name: string;
  role: 'operador' | 'gestor' | 'representante' | 'admin';
  group_id: string;
  company_id: string | null;
}

export function useAdminOperations(onSuccess: () => void) {
  const [processing, setProcessing] = useState(false);

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

  const createGroup = async (data: CreateGroupDTO) => {
    setProcessing(true);
    try {
      const insertData: any = {
        name: data.name,
        description: data.description || null,
        subscription_plan: data.plan,
        subscription_status: 'active',
      };

      if (data.plan === 'trial') {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        insertData.trial_ends_at = trialEnd.toISOString();
      }

      const { error } = await supabase.from('groups').insert(insertData);
      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Grupo criado com sucesso!',
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar o grupo.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const updateGroup = async (id: string, data: UpdateGroupDTO) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Grupo atualizado com sucesso!',
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating group:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o grupo.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const deleteGroup = async (id: string, name: string) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Grupo "${name}" deletado com sucesso!`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error deleting group:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível deletar o grupo.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

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

  const createUser = async (data: CreateUserDTO, groupName: string) => {
    setProcessing(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('send-user-invitation', {
        body: {
          email: data.email,
          fullName: data.fullName,
          password: data.password,
          groupId: data.groupId,
          groupName,
          role: data.role,
        },
      });

      if (error) throw new Error(error.message);
      if (!result.success) throw new Error(result.error);

      toast({
        title: 'Sucesso',
        description: result.message || 'Usuário criado com sucesso!',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar o usuário.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const updateUser = async (userId: string, profileId: string, data: UpdateUserDTO) => {
    setProcessing(true);
    try {
      // Update profile with group_id and company_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          group_id: data.group_id,
          company_id: data.company_id,
        })
        .eq('id', profileId);

      if (profileError) throw profileError;

      // Replace roles
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: data.role });

      if (insertError) throw insertError;

      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado com sucesso!',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar o usuário.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const deleteUser = async (userId: string, profileId: string, name: string, currentUserId?: string) => {
    setProcessing(true);
    try {
      // 1. First, delete from auth.users via Edge Function
      // This will cascade delete to profiles table due to FK constraint
      console.log('[deleteUser] Deleting user from auth.users via Edge Function:', userId);
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { 
          action: 'delete',
          userId
        }
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'Failed to delete user from auth');

      // 2. Explicitly delete roles (may already be deleted by CASCADE, but ensure cleanup)
      console.log('[deleteUser] Cleaning up user_roles:', userId);
      await supabase.from('user_roles').delete().eq('user_id', userId);

      // 3. Explicitly delete profile (may already be deleted by CASCADE, but ensure cleanup)
      console.log('[deleteUser] Cleaning up profile:', profileId);
      await supabase.from('profiles').delete().eq('id', profileId);

      toast({
        title: 'Sucesso',
        description: `Usuário "${name}" deletado completamente do sistema!`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível deletar o usuário.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const changePlan = async (groupId: string, newPlan: string) => {
    setProcessing(true);
    try {
      const updateData: any = {
        subscription_plan: newPlan,
        subscription_status: 'active',
      };

      if (newPlan === 'trial') {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        updateData.trial_ends_at = trialEnd.toISOString();
      } else {
        updateData.trial_ends_at = null;
      }

      const { error } = await supabase
        .from('groups')
        .update(updateData)
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: `Plano alterado para ${newPlan.toUpperCase()} com sucesso!`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error changing plan:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar o plano.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const updateUserPassword = async (userId: string, newPassword: string) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-users', {
        body: { 
          action: 'update-password',
          userId,
          newPassword 
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to update password');

      toast({
        title: 'Sucesso',
        description: 'Senha atualizada com sucesso!',
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível atualizar a senha.',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setProcessing(false);
    }
  };

  return {
    processing,
    createCompany,
    updateCompany,
    deleteCompany,
    createGroup,
    updateGroup,
    deleteGroup,
    createBranch,
    updateBranch,
    deleteBranch,
    createUser,
    updateUser,
    deleteUser,
    changePlan,
    updateUserPassword,
  };
}
