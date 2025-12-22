import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/pages/apps/controle-financeiro/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { getInitials, getRoleLabel, getRoleClassName } from '@/pages/apps/controle-financeiro/utils/formatters';
import { Profile } from '@/pages/apps/controle-financeiro/hooks/useSettingsData';

interface ProfileTabProps {
  profileData: Profile | null;
  onUpdate: () => void;
}

export function ProfileTab({ profileData, onUpdate }: ProfileTabProps) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: profileData?.full_name || '',
    avatar_url: profileData?.avatar_url || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('profiles').update({
        full_name: form.full_name,
        avatar_url: form.avatar_url,
      }).eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Perfil atualizado com sucesso!',
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Atualize seus dados pessoais</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">
                O e-mail não pode ser alterado
              </p>
            </div>

            <div>
              <Label htmlFor="avatar_url">URL do Avatar</Label>
              <Input
                id="avatar_url"
                value={form.avatar_url}
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                placeholder="https://exemplo.com/avatar.jpg"
              />
            </div>

            <Button type="submit" className="w-full">
              Atualizar Perfil
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview do Perfil</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <Avatar className="w-20 h-20">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {form.full_name ? getInitials(form.full_name) : 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="text-center">
            <h3 className="font-semibold">{form.full_name || 'Nome não informado'}</h3>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>

          {profileData?.role && (
            <Badge className={getRoleClassName(profileData.role)}>
              {getRoleLabel(profileData.role)}
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
