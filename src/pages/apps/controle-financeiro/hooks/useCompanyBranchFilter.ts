import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/pages/apps/controle-financeiro/auth/AuthProvider';
import { Branch, Company } from './useOrganizationData';

export function useCompanyBranchFilter() {
  const { user, group } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !group) {
      setLoading(false);
      return;
    }

    fetchCompanies();
  }, [user?.id, group?.id]);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchBranches(selectedCompanyId);
    } else {
      setBranches([]);
      setSelectedBranchId('');
    }
  }, [selectedCompanyId]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);

      // Buscar profile do usuário para pegar group_id
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('group_id')
        .eq('user_id', user!.id)
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

      setCompanies(companiesData || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      setBranches([]);
    }
  };

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setSelectedBranchId(''); // Reset branch when company changes
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
  };

  return {
    companies,
    branches,
    selectedCompanyId,
    selectedBranchId,
    loading,
    handleCompanyChange,
    handleBranchChange,
  };
}
