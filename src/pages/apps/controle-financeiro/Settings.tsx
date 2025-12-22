import React from 'react';
import { useAuth } from '@/pages/apps/controle-financeiro/auth/AuthProvider';
import { AdminInterface } from '@/pages/apps/controle-financeiro/components/settings/AdminInterface';
import { UserInterface } from '@/pages/apps/controle-financeiro/components/settings/UserInterface';
import { useSettingsData } from '@/pages/apps/controle-financeiro/hooks/useSettingsData';

const Settings = () => {
  const { profile } = useAuth();
  const { loading } = useSettingsData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return profile?.role === 'admin' ? <AdminInterface /> : <UserInterface />;
};

export default Settings;
