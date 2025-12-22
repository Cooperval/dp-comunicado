import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/pages/apps/controle-financeiro/auth/AuthProvider';

export interface Branch {
  id: string;
  name: string;
  description: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  segment: string | null;
  group_id: string;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
  subscription_plan: string;
  subscription_status: string;
}

export interface OrganizationData {
  groupId: string;
  groupName: string;
  groupDescription: string | null;
  branches: Branch[];
  companies: Company[];
}

export function useOrganizationData() {
  const { user, group } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OrganizationData | null>(null);

  const fetchData = async () => {
    if (!user || !group) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Buscar profile do usuário para pegar group_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('group_id')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      if (!profileData?.group_id) {
        setLoading(false);
        return;
      }

      // Buscar companies do grupo
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .eq('group_id', profileData.group_id)
        .order('name');

      if (companiesError) throw companiesError;

      // Buscar branches das empresas
      const companyIds = companiesData?.map(c => c.id) || [];
      
      let branchesData: Branch[] = [];
      if (companyIds.length > 0) {
        const { data: fetchedBranches, error: branchesError } = await supabase
          .from('branches')
          .select('*')
          .in('company_id', companyIds)
          .order('name');

        if (branchesError) throw branchesError;
        branchesData = fetchedBranches || [];
      }

      // Buscar descrição do grupo
      const { data: groupDetails } = await supabase
        .from('groups')
        .select('description')
        .eq('id', profileData.group_id)
        .single();

      setData({
        groupId: profileData.group_id,
        groupName: group.name,
        groupDescription: groupDetails?.description || null,
        branches: branchesData || [],
        companies: companiesData,
      });
    } catch (error) {
      console.error('Error fetching organization data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id, group?.id]);

  return { data, loading, refetch: fetchData };
}
