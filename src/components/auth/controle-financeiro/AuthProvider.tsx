// src/components/auth/controle-financeiro/AuthProvider.tsx
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
  subscription_plan: 'free' | 'trial' | 'pro';
  subscription_status: 'active' | 'inactive';
  trial_ends_at: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  company: Company | null;
  loading: boolean;
  companyId: string | null;
  subscribed: boolean;
  subscriptionEnd: string | null;
  checkSubscription: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mantive o hook useAuth por compatibilidade caso outro código importe deste arquivo
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ---------- Provider e hook específicos para "Meu Controle" ----------
export const AuthProviderMeuControle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const validateAndUpdateTrialStatus = async (company: Company): Promise<Company> => {
    if (!company.trial_ends_at) return company;
    const trialEndDate = new Date(company.trial_ends_at);
    const now = new Date();
    if (trialEndDate < now && company.subscription_status === 'active' && company.subscription_plan === 'trial') {
      console.log('Trial expired, updating status to inactive');
      const { error } = await supabase
        .from('companies')
        .update({ subscription_status: 'inactive' })
        .eq('id', company.id);
      if (error) {
        console.error('Error updating trial status:', error);
        return company;
      }
      return {
        ...company,
        subscription_status: 'inactive' as const
      };
    }
    return company;
  };

  const checkSubscription = async (retryCount = 0) => {
    try {
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

      if (data.subscribed && !data.subscription_end && retryCount < 2) {
        console.log(`Subscription active but no end date, retrying in 3s (attempt ${retryCount + 1}/2)...`);
        setTimeout(() => checkSubscription(retryCount + 1), 3000);
      }
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

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error fetching user role:', roleError);
      }

      const composedProfile = {
        ...profileData,
        role: roleData?.role || profileData?.role || 'operador'
      };

      setProfile(composedProfile);
      setCompanyId(profileData?.company_id || null);

      if (profileData?.company_id) {
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id, name, subscription_plan, subscription_status, trial_ends_at')
          .eq('id', profileData.company_id)
          .single();

        if (companyError) {
          console.error('Error fetching company:', companyError);
          setCompany(null);
        } else {
          const validatedCompany = await validateAndUpdateTrialStatus(companyData as Company);
          setCompany(validatedCompany);
        }
      } else {
        setCompany(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
      setCompanyId(null);
      setCompany(null);
    }
  };

  useEffect(() => {
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
          setCompany(null);
          setSubscribed(false);
          setSubscriptionEnd(null);
        }

        setLoading(false);
      }
    );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!session?.user) return;
    const interval = setInterval(() => {
      checkSubscription();
    }, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const { data: currentSession } = await supabase.auth.getSession();

      if (currentSession?.session) {
        const { error } = await supabase.auth.signOut();
        if (error && error.message !== 'Auth session missing!' && !error.message.includes('session id') && !error.message.includes("doesn't exist")) {
          throw error;
        }
      }

      setSession(null);
      setUser(null);
      setProfile(null);
      setCompanyId(null);
      setCompany(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setSession(null);
      setUser(null);
      setProfile(null);
      setCompanyId(null);
      setCompany(null);
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

  const value = {
    user,
    session,
    profile,
    company,
    loading,
    companyId,
    subscribed,
    subscriptionEnd,
    checkSubscription,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// hook específico esperado pelo ProtectedRouteMeuControle
export const useAuthMeuControle = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthMeuControle must be used within an AuthProviderMeuControle');
  }
  return context;
};
