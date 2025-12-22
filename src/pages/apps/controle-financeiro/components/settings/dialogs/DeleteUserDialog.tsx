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
import { UserProfile } from '@/pages/apps/controle-financeiro/hooks/useSettingsData';

interface DeleteUserDialogProps {
  open: boolean;
  user: UserProfile | null;
  currentUserId?: string;
  onClose: () => void;
  onConfirm: () => void;
}

interface UserData {
  classificationsCount: number;
}

export function DeleteUserDialog({ open, user, currentUserId, onClose, onConfirm }: DeleteUserDialogProps) {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isSelfDeletion = user?.user_id === currentUserId;

  useEffect(() => {
    if (open && user && !isSelfDeletion) {
      fetchUserData();
      setConfirmText('');
      setError(null);
    } else if (open && isSelfDeletion) {
      setLoading(false);
    }
  }, [open, user, isSelfDeletion]);

  const fetchUserData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { count, error } = await supabase
        .from('transaction_classifications')
        .select('id', { count: 'exact', head: true })
        .eq('classified_by', user.user_id);

      if (error) throw error;

      setUserData({
        classificationsCount: count || 0,
      });
    } catch (err: any) {
      console.error('Error fetching user data:', err);
      setError(err.message || 'Erro ao carregar dados do usuário');
    } finally {
      setLoading(false);
    }
  };

  const isConfirmValid = confirmText === user?.full_name;

  const handleConfirm = () => {
    if (isConfirmValid && !isSelfDeletion) {
      onConfirm();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão de Usuário
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 pt-4">
            {isSelfDeletion ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Você não pode deletar sua própria conta.</strong>
                  <br />
                  Entre em contato com outro administrador para realizar esta ação.
                </AlertDescription>
              </Alert>
            ) : loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="text-sm text-foreground">
                  Você está prestes a excluir o usuário <strong>"{user?.full_name}"</strong>.
                </div>

                {userData && userData.classificationsCount > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Dados associados que serão afetados:</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• {userData.classificationsCount} transação(ões) classificada(s) por este usuário</li>
                      </ul>
                      <p className="mt-2 text-xs text-muted-foreground">
                        As classificações não serão deletadas, mas a referência ao usuário será removida.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="confirm-user-name">
                    Digite o nome do usuário <strong>"{user?.full_name}"</strong> para confirmar:
                  </Label>
                  <Input
                    id="confirm-user-name"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={user?.full_name || ''}
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
            disabled={!isConfirmValid || isSelfDeletion || loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              'Excluir Usuário'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
