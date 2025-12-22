import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/pages/apps/controle-financeiro/auth/AuthProvider';
import { toast } from '@/hooks/use-toast';
import { SUPABASE_ERRORS } from '@/pages/apps/controle-financeiro/constants/settingsConstants';

export interface Company {
  id: string;
  name: string;
  segment?: string;
  logo_url?: string;
  group_id: string;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  name: string;
  description?: string;
  city?: string;
  state?: string;
  company_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  subscription_plan: string;
  subscription_status: string;
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  role: string;
  group_id: string;
  company_id: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: string;
  avatar_url?: string;
}

export function useSettingsData() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [profileData, setProfileData] = useState<Profile | null>(null);

  const fetchUsersWithRoles = useCallback(async (userIds: string[]): Promise<Map<string, string>> => {
    if (userIds.length === 0) return new Map();

    // Batch query to resolve N+1 problem
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', userIds);

    const rolesMap = new Map<string, string>(rolesData?.map((r) => [r.user_id, r.role]) || []);
    return rolesMap;
  }, []);

  const fetchData = useCallback(async () => {
    try {
      // Verificar se o usuário está autenticado antes de fazer qualquer operação
      if (!user) {
        setLoading(false);
        return;
      }

      if (profile?.role === 'admin') {
        // Fetch all companies
        const { data: companiesData, error: companiesError } = await supabase
          .from('companies')
          .select('*')
          .order('name');

        if (companiesError) throw companiesError;
        setCompanies((companiesData || []) as Company[]);

        // Fetch all groups
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select('*')
          .order('name');

        if (groupsError) throw groupsError;
        setGroups((groupsData || []) as Group[]);

        // Fetch all branches
        const { data: branchesData, error: branchesError } = await supabase
          .from('branches')
          .select('*')
          .order('name');

        if (branchesError) throw branchesError;
        setBranches((branchesData || []) as Branch[]);

        // Fetch all users
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, group_id, company_id, created_at')
          .order('created_at', { ascending: false });

        if (usersError) throw usersError;

        // Batch fetch roles to resolve N+1
        const userIds = usersData?.map((u) => u.user_id) || [];
        const rolesMap = await fetchUsersWithRoles(userIds);

        // Fetch emails from admin-users edge function com token explícito
        let emailsData: any = null;
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          
          if (!currentSession?.access_token) {
            console.warn('No valid session for admin-users call');
            emailsData = null;
          } else {
            const response = await supabase.functions.invoke('admin-users', {
              headers: {
                Authorization: `Bearer ${currentSession.access_token}`,
              },
              body: { action: 'list' }
            });
            
            if (response.error) {
              console.error('Failed to fetch user emails:', response.error);
              emailsData = null;
            } else {
              emailsData = response.data;
            }
          }
        } catch (error) {
          console.error('Exception when fetching user emails:', error);
          emailsData = null;
        }

        const usersWithRolesAndEmails = usersData?.map((user) => ({
          ...user,
          role: rolesMap.get(user.user_id) || 'operador',
          email: emailsData?.emails?.[user.user_id] || '',
        })) || [];

        setUsers(usersWithRolesAndEmails);
      } else {
        // Regular user: fetch own profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user?.id)
          .single();

        if (profileError && profileError.code !== SUPABASE_ERRORS.PGRST116) {
          throw profileError;
        }

        if (profileData) {
          setProfileData(profileData);
        }
      }
    } catch (error) {
      console.error('Error fetching settings data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [profile?.role, user?.id, fetchUsersWithRoles]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    loading,
    companies,
    groups,
    branches,
    users,
    profileData,
    refetch: fetchData,
  };
}
