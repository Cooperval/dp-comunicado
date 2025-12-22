import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Copy, Lock } from 'lucide-react';
import { ROLES } from '@/pages/apps/controle-financeiro/constants/settingsConstants';
import { UserProfile, Group } from '@/pages/apps/controle-financeiro/hooks/useSettingsData';
import { toast } from '@/hooks/use-toast';

interface EditUserDialogProps {
  open: boolean;
  user: UserProfile | null;
  groups: Group[];
  onClose: () => void;
  onSave: (userId: string, profileId: string, data: {
    full_name: string;
    role: 'operador' | 'gestor' | 'representante' | 'admin';
    group_id: string;
    company_id: string | null;
  }, newPassword?: string) => void;
}

export function EditUserDialog({ open, user, groups, onClose, onSave }: EditUserDialogProps) {
  const [form, setForm] = useState({
    full_name: '',
    role: 'operador' as 'operador' | 'gestor' | 'representante' | 'admin',
    group_id: '',
  });
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name,
        role: user.role as 'operador' | 'gestor' | 'representante' | 'admin',
        group_id: user.group_id,
      });
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);
    }
  }, [user]);

  const passwordsMatch = newPassword === confirmPassword;
  const passwordValid = newPassword.length >= 6 || newPassword === '';
  const canSubmit = passwordValid && (newPassword === '' || passwordsMatch);

  const handleCopyEmail = () => {
    if (user?.email) {
      navigator.clipboard.writeText(user.email);
      toast({
        title: 'Email copiado',
        description: 'O email foi copiado para a área de transferência.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    
    if (user) {
      // Validar se o company_id do usuário pertence ao grupo selecionado
      // Se não pertencer, devemos limpar o company_id antes de salvar
      let validatedCompanyId = user.company_id;
      
      if (user.company_id && form.group_id !== user.group_id) {
        // Se o grupo mudou, precisamos verificar se a empresa atual pertence ao novo grupo
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: company } = await supabase
          .from('companies')
          .select('group_id')
          .eq('id', user.company_id)
          .single();

        if (company) {
          // Se a empresa não pertence ao novo grupo, limpar company_id
          if (company.group_id !== form.group_id) {
            validatedCompanyId = null;
            toast({
              title: 'Atenção',
              description: 'A empresa do usuário foi removida pois não pertence ao novo grupo.',
            });
          }
        }
      }

      onSave(user.user_id, user.id, {
        ...form,
        company_id: validatedCompanyId
      }, newPassword || undefined);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
          <DialogDescription>Atualize as informações do usuário</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (Read-only) */}
          <div>
            <Label htmlFor="edit_user_email">Email</Label>
            <div className="flex gap-2">
              <Input
                id="edit_user_email"
                value={user?.email || ''}
                readOnly
                className="bg-muted"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyEmail}
                title="Copiar email"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Nome Completo */}
          <div>
            <Label htmlFor="edit_user_name">Nome Completo</Label>
            <Input
              id="edit_user_name"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Digite o nome completo"
              required
            />
          </div>

          {/* Função */}
          <div>
            <Label htmlFor="edit_user_role">Função</Label>
            <Select value={form.role} onValueChange={(value: any) => setForm({ ...form, role: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grupo */}
          <div>
            <Label htmlFor="edit_user_group">Grupo</Label>
            <Select
              value={form.group_id}
              onValueChange={(value) => setForm({ ...form, group_id: value })}
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

          {/* Security Section */}
          <Collapsible open={showPasswordSection} onOpenChange={setShowPasswordSection}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
              >
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>Alterar Senha</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${showPasswordSection ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div>
                <Label htmlFor="new_password">Nova Senha</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
                {newPassword && !passwordValid && (
                  <p className="text-sm text-destructive mt-1">
                    A senha deve ter no mínimo 6 caracteres
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite a senha novamente"
                />
                {confirmPassword && !passwordsMatch && (
                  <p className="text-sm text-destructive mt-1">
                    As senhas não coincidem
                  </p>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Deixe em branco para manter a senha atual
              </p>
            </CollapsibleContent>
          </Collapsible>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
