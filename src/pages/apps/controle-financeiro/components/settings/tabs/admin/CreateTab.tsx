import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PLANS, ROLES } from '@/pages/apps/controle-financeiro/constants/settingsConstants';
import { Group } from '@/pages/apps/controle-financeiro/hooks/useSettingsData';

interface CreateTabProps {
  groups: Group[];
  onCreateGroup: (data: { name: string; description?: string; plan: 'free' | 'trial' | 'pro' }) => void;
  onCreateUser: (data: {
    email: string;
    fullName: string;
    password: string;
    role: 'operador' | 'gestor' | 'representante';
    groupId: string;
  }, groupName: string) => void;
}

export function CreateTab({ groups, onCreateGroup, onCreateUser }: CreateTabProps) {
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    plan: 'free' as 'free' | 'trial' | 'pro',
  });

  const [userForm, setUserForm] = useState({
    email: '',
    fullName: '',
    password: '',
    role: 'operador' as 'operador' | 'gestor' | 'representante',
    groupId: '',
  });

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateGroup({
      name: groupForm.name,
      description: groupForm.description || undefined,
      plan: groupForm.plan,
    });
    setGroupForm({ name: '', description: '', plan: 'free' });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const group = groups.find((g) => g.id === userForm.groupId);
    if (group) {
      onCreateUser(userForm, group.name);
      setUserForm({ email: '', fullName: '', password: '', role: 'operador', groupId: '' });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Criar Grupo</CardTitle>
          <CardDescription>Adicione um novo grupo organizacional</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateGroup} className="space-y-4">
            <div>
              <Label htmlFor="group_name">Nome do Grupo</Label>
              <Input
                id="group_name"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                placeholder="Digite o nome do grupo"
                required
              />
            </div>

            <div>
              <Label htmlFor="group_description">Descrição (opcional)</Label>
              <Input
                id="group_description"
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                placeholder="Breve descrição do grupo"
              />
            </div>

            <div>
              <Label htmlFor="plan">Plano Inicial</Label>
              <Select
                value={groupForm.plan}
                onValueChange={(value: 'free' | 'trial' | 'pro') =>
                  setGroupForm({ ...groupForm, plan: value })
                }
              >
                <SelectTrigger id="plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((plan) => (
                    <SelectItem key={plan.value} value={plan.value}>
                      {plan.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full">
              Criar Grupo
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Novo Usuário</CardTitle>
          <CardDescription>Adicione um usuário a um grupo existente</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <Label htmlFor="user_email">E-mail</Label>
              <Input
                id="user_email"
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                placeholder="email@exemplo.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="user_name">Nome Completo</Label>
              <Input
                id="user_name"
                value={userForm.fullName}
                onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                placeholder="Digite o nome completo"
                required
              />
            </div>

            <div>
              <Label htmlFor="user_password">Senha</Label>
              <Input
                id="user_password"
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="Digite a senha"
                required
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="user_role">Função</Label>
              <Select
                value={userForm.role}
                onValueChange={(value: 'operador' | 'gestor' | 'representante') =>
                  setUserForm({ ...userForm, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.filter((r) => r.value !== 'admin').map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="user_group">Grupo</Label>
              <Select
                value={userForm.groupId}
                onValueChange={(value) => setUserForm({ ...userForm, groupId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grupo" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={!userForm.groupId}>
              Cadastrar Usuário
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
