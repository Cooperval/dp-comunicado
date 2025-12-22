import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  full_name: string;
  role: 'operador' | 'gestor' | 'representante' | 'admin' | 'owner' | 'manager' | 'accountant';
  avatar_url?: string;
}

interface Company {
  id: string;
  name: string;
}

interface Group {
  id: string;
  name: string;
  subscription_plan: 'free' | 'trial' | 'pro';
  subscription_status: 'active' | 'inactive';
  trial_ends_at: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  company: Company | null;
  group: Group | null;
  loading: boolean;
  companyId: string | null;
  groupId: string | null;
  subscribed: boolean;
  subscriptionEnd: string | null;
  productId: string | null;
  checkSubscription: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);

  const validateAndUpdateTrialStatus = async (group: Group): Promise<Group> => {
    // Se não tem data de trial, retornar sem mudanças
    if (!group.trial_ends_at) return group;
    
    const trialEndDate = new Date(group.trial_ends_at);
    const now = new Date();
    
    // Se o trial expirou E o status ainda está ativo, atualizar para inativo
    if (trialEndDate < now && group.subscription_status === 'active' && group.subscription_plan === 'trial') {
      console.log('Trial expired, updating status to inactive');
      
      const { error } = await supabase
        .from('groups')
        .update({ subscription_status: 'inactive' })
        .eq('id', group.id);
      
      if (error) {
        console.error('Error updating trial status:', error);
        return group;
      }
      
      // Retornar group com status atualizado
      return {
        ...group,
        subscription_status: 'inactive' as const
      };
    }
    
    return group;
  };

  const checkSubscription = async (retryCount = 0) => {
    try {
      // Get fresh session to ensure we have a valid token
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.access_token) {
        console.log('No valid session, skipping subscription check');
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }

      console.log('Subscription status:', data);
      setSubscribed(data.subscribed || false);
      setSubscriptionEnd(data.subscription_end || null);
      setProductId(data.product_id || null);

      // Retry logic: if subscribed but no subscription_end, retry after 3 seconds
      if (data.subscribed && !data.subscription_end && retryCount < 2) {
        console.log(`Subscription active but no end date, retrying in 3s (attempt ${retryCount + 1}/2)...`);
        setTimeout(() => checkSubscription(retryCount + 1), 3000);
      }

      // Company subscription is now updated via Stripe webhook
      // No need to update here anymore
    } catch (error) {
      console.error('Error in checkSubscription:', error);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Fetch user role from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error fetching user role:', roleError);
      }

      // Auto-sincronizar role se não existir em user_roles mas existir em profiles
      if (!roleData && profileData?.role) {
        console.log('Auto-syncing role from profiles to user_roles');
        const { error: syncError } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: userId, 
            role: profileData.role 
          });
        
        if (syncError) {
          console.error('Error auto-syncing role:', syncError);
        }
      }

      const profile = {
        ...profileData,
        role: roleData?.role || profileData?.role || 'operador'
      };
      
      setProfile(profile);
      setCompanyId(profileData?.company_id || null);
      setGroupId(profileData?.group_id || null);

      // Fetch company data if user has a company
      if (profileData?.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id, name, group_id')
          .eq('id', profileData.company_id)
          .single();

        if (companyError) {
          console.error('Error fetching company:', companyError);
          setCompany(null);
        } else {
          // Validar se a empresa pertence ao grupo do usuário
          if (profileData?.group_id) {
            // Verificar se a empresa pertence ao grupo do usuário
            if (companyData.group_id !== profileData.group_id) {
              console.log('Company does not belong to user group, finding valid company...');
              
              const { data: validCompany } = await supabase
                .from('companies')
                .select('id, name')
                .eq('group_id', profileData.group_id)
                .limit(1)
                .maybeSingle();

              if (validCompany) {
                console.log('Found valid company, updating profile...');
                setCompanyId(validCompany.id);
                setCompany({ id: validCompany.id, name: validCompany.name });
                
                // Atualizar o profile com a empresa correta
                await supabase
                  .from('profiles')
                  .update({ company_id: validCompany.id })
                  .eq('user_id', userId);
              } else {
                console.log('No valid company found for this group');
                setCompany(null);
                setCompanyId(null);
              }
            } else {
              setCompany(companyData as Company);
            }
          } else {
            setCompany(companyData as Company);
          }
        }
      } else {
        setCompany(null);
      }

      // Fetch group data - subscription is now at group level
      if (profileData?.group_id) {
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select('id, name, subscription_plan, subscription_status, trial_ends_at')
          .eq('id', profileData.group_id)
          .single();

        if (groupError) {
          console.error('Error fetching group:', groupError);
          setGroup(null);
        } else {
          // Validar e atualizar status do trial se necessário
          const validatedGroup = await validateAndUpdateTrialStatus(groupData as Group);
          setGroup(validatedGroup);
        }
      } else {
        setGroup(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
      setCompanyId(null);
      setGroupId(null);
      setCompany(null);
      setGroup(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
            checkSubscription();
          }, 0);
        } else {
          setProfile(null);
          setCompanyId(null);
          setGroupId(null);
          setCompany(null);
          setGroup(null);
          setSubscribed(false);
          setSubscriptionEnd(null);
          setProductId(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
        checkSubscription();
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Auto-refresh subscription status every minute
  useEffect(() => {
    if (!session?.user) return;

    const interval = setInterval(() => {
      checkSubscription();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [session]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Check if there's an active session before attempting logout
      const { data: currentSession } = await supabase.auth.getSession();
      
      if (currentSession?.session) {
        const { error } = await supabase.auth.signOut();
        if (error && error.message !== 'Auth session missing!' && !error.message.includes('session id') && !error.message.includes("doesn't exist")) {
          throw error;
        }
      }
      
      // Always clear local state regardless of logout result
      setSession(null);
      setUser(null);
      setProfile(null);
      setCompanyId(null);
      setGroupId(null);
      setCompany(null);
      setGroup(null);
      setSubscribed(false);
      setSubscriptionEnd(null);
      setProductId(null);
    } catch (error) {
      console.error('Error signing out:', error);
      // Still clear local state even if logout failed
      setSession(null);
      setUser(null);
      setProfile(null);
      setCompanyId(null);
      setGroupId(null);
      setCompany(null);
      setGroup(null);
      setSubscribed(false);
      setSubscriptionEnd(null);
      setProductId(null);
      // Re-throw only if it's not a session-related error
      if (error instanceof Error && 
          !error.message.includes('Auth session missing') && 
          !error.message.includes('session id') &&
          !error.message.includes("doesn't exist")) {
        throw error;
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/set-password`;
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error };
  };

  const value = {
    user,
    session,
    profile,
    company,
    group,
    loading,
    companyId,
    groupId,
    subscribed,
    subscriptionEnd,
    productId,
    checkSubscription,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};