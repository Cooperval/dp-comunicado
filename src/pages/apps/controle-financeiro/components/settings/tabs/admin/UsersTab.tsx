import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2 } from 'lucide-react';
import { UserProfile, Group } from '@/pages/apps/controle-financeiro/hooks/useSettingsData';
import { getRoleLabel, getRoleClassName } from '@/pages/apps/controle-financeiro/utils/formatters';

interface UsersTabProps {
  users: UserProfile[];
  groups: Group[];
  onEdit: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
}

export function UsersTab({ users, groups, onEdit, onDelete }: UsersTabProps) {
  const getGroupName = (groupId: string) => {
    return groups.find((g) => g.id === groupId)?.name || 'Grupo não encontrado';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuários Cadastrados</CardTitle>
        <CardDescription>Lista de todos os usuários da plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex justify-between items-center p-3 border rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{user.full_name || 'Nome não informado'}</p>
                <p className="text-sm text-muted-foreground">
                  {getRoleLabel(user.role)} - {getGroupName(user.group_id)} - Cadastrado em{' '}
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getRoleClassName(user.role)}>{getRoleLabel(user.role)}</Badge>
                <Button variant="outline" size="sm" onClick={() => onEdit(user)} className="h-8 w-8 p-0">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(user)}
                  className="h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-muted-foreground text-center py-4">Nenhum usuário cadastrado</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
