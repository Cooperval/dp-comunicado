import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Building, Shield, Palette } from 'lucide-react';
import { useSettingsData } from '@/pages/apps/controle-financeiro/hooks/useSettingsData';
import { ProfileTab } from './tabs/user/ProfileTab';
import { SecurityTab } from './tabs/user/SecurityTab';
import { PreferencesTab } from './tabs/user/PreferencesTab';

export function UserInterface() {
  const { profileData, refetch } = useSettingsData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie suas preferências e dados da conta</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Preferências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab profileData={profileData} onUpdate={refetch} />
        </TabsContent>

        <TabsContent value="company">
          <div className="text-center py-8 text-muted-foreground">
            Configurações da empresa disponíveis em breve
          </div>
        </TabsContent>

        <TabsContent value="security">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="preferences">
          <PreferencesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
