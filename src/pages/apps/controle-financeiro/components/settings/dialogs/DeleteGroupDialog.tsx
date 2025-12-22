import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Group } from '@/pages/apps/controle-financeiro/hooks/useSettingsData';

interface DeleteGroupDialogProps {
  open: boolean;
  group: Group | null;
  onClose: () => void;
  onConfirm: () => void;
}

interface GroupData {
  companiesCount: number;
  usersCount: number;
  branchesCount: number;
}

export function DeleteGroupDialog({ open, group, onClose, onConfirm }: DeleteGroupDialogProps) {
  const [loading, setLoading] = useState(true);
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && group) {
      fetchGroupData();
      setConfirmText('');
      setError(null);
    }
  }, [open, group]);

  const fetchGroupData = async () => {
    if (!group) return;

    setLoading(true);
    setError(null);

    try {
      const [branchesRes, usersRes, companiesRes] = await Promise.all([
        supabase.from('companies').select('id', { count: 'exact', head: true }).eq('group_id', group.id),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('group_id', group.id),
        supabase.from('branches').select('id', { count: 'exact', head: true }).eq('company_id', group.id),
      ]);

      if (branchesRes.error) throw branchesRes.error;
      if (usersRes.error) throw usersRes.error;
      if (companiesRes.error) throw companiesRes.error;

      setGroupData({
        companiesCount: branchesRes.count || 0,
        usersCount: usersRes.count || 0,
        branchesCount: companiesRes.count || 0,
      });
    } catch (err: any) {
      console.error('Error fetching group data:', err);
      setError(err.message || 'Erro ao carregar dados do grupo');
    } finally {
      setLoading(false);
    }
  };

  const isConfirmValid = confirmText === group?.name;
  const hasDependencies = groupData && (groupData.companiesCount > 0 || groupData.usersCount > 0 || groupData.branchesCount > 0);

  const handleConfirm = () => {
    if (!hasDependencies && isConfirmValid) {
      onConfirm();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão de Grupo
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : hasDependencies ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Não é possível excluir este grupo.</strong>
                  <br />
                  {groupData.companiesCount > 0 && (
                    <>Existem {groupData.companiesCount} empresa(s) associada(s). </>
                  )}
                  {groupData.branchesCount > 0 && (
                    <>Existem {groupData.branchesCount} filial(is) associada(s). </>
                  )}
                  {groupData.usersCount > 0 && (
                    <>Existem {groupData.usersCount} usuário(s) associado(s). </>
                  )}
                  Remova todas as dependências antes de excluir o grupo.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="text-sm text-foreground">
                  Você está prestes a excluir o grupo <strong>"{group?.name}"</strong>.
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-group-name">
                    Digite o nome do grupo <strong>"{group?.name}"</strong> para confirmar:
                  </Label>
                  <Input
                    id="confirm-group-name"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={group?.name || ''}
                    className="font-mono"
                  />
                </div>

                <div className="text-sm text-destructive font-medium">
                  Esta ação não pode ser desfeita!
                </div>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmValid || hasDependencies || loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              'Excluir Grupo'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
