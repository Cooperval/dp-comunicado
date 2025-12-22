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
import { Branch } from '@/pages/apps/controle-financeiro/hooks/useSettingsData';

interface DeleteBranchDialogProps {
  open: boolean;
  branch: Branch | null;
  onClose: () => void;
  onConfirm: () => void;
}

interface BranchData {
  branchesCount: number;
}

export function DeleteBranchDialog({ open, branch, onClose, onConfirm }: DeleteBranchDialogProps) {
  const [loading, setLoading] = useState(true);
  const [branchData, setBranchData] = useState<BranchData | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && branch) {
      fetchBranchData();
      setConfirmText('');
      setError(null);
    }
  }, [open, branch]);

  const fetchBranchData = async () => {
    if (!branch) return;

    setLoading(true);
    setError(null);

    try {
      const { count, error } = await supabase
        .from('branches')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', branch.id);

      if (error) throw error;

      setBranchData({
        branchesCount: count || 0,
      });
    } catch (err: any) {
      console.error('Error fetching branch data:', err);
      setError(err.message || 'Erro ao carregar dados da filial');
    } finally {
      setLoading(false);
    }
  };

  const isConfirmValid = confirmText === branch?.name;
  const hasBranches = branchData && branchData.branchesCount > 0;

  const handleConfirm = () => {
    if (!hasBranches && isConfirmValid) {
      onConfirm();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão de Filial
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
            ) : hasBranches ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Não é possível excluir esta filial.</strong>
                  <br />
                  Existem {branchData.branchesCount} sub-filial(is) associada(s). Remova todas as
                  sub-filiais antes de excluir esta filial.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="text-sm text-foreground">
                  Você está prestes a excluir a filial <strong>"{branch?.name}"</strong>.
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-branch-name">
                    Digite o nome da filial <strong>"{branch?.name}"</strong> para confirmar:
                  </Label>
                  <Input
                    id="confirm-branch-name"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={branch?.name || ''}
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
            disabled={!isConfirmValid || hasBranches || loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              'Excluir Filial'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
