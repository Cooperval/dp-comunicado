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
import { Company } from '@/pages/apps/controle-financeiro/hooks/useSettingsData';

interface DeleteCompanyDialogProps {
  open: boolean;
  company: Company | null;
  onClose: () => void;
  onConfirm: () => void;
}

interface CompanyData {
  usersCount: number;
  transactionsCount: number;
  banksCount: number;
  nfesCount: number;
  classificationsCount: number;
}

export function DeleteCompanyDialog({ open, company, onClose, onConfirm }: DeleteCompanyDialogProps) {
  const [loading, setLoading] = useState(true);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && company) {
      fetchCompanyData();
      setConfirmText('');
      setError(null);
    }
  }, [open, company]);

  const fetchCompanyData = async () => {
    if (!company) return;

    setLoading(true);
    setError(null);

    try {
      const [usersRes, transactionsRes, banksRes, nfesRes, classificationsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
        supabase.from('transactions').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
        supabase.from('banks').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
        supabase.from('nfe_documents').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
        supabase
          .from('integrated_transactions')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', company.id),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (transactionsRes.error) throw transactionsRes.error;
      if (banksRes.error) throw banksRes.error;
      if (nfesRes.error) throw nfesRes.error;
      if (classificationsRes.error) throw classificationsRes.error;

      setCompanyData({
        usersCount: usersRes.count || 0,
        transactionsCount: transactionsRes.count || 0,
        banksCount: banksRes.count || 0,
        nfesCount: nfesRes.count || 0,
        classificationsCount: classificationsRes.count || 0,
      });
    } catch (err: any) {
      console.error('Error fetching company data:', err);
      setError(err.message || 'Erro ao carregar dados da empresa');
    } finally {
      setLoading(false);
    }
  };

  const isConfirmValid = confirmText === company?.name;
  const hasUsers = companyData && companyData.usersCount > 0;
  const hasData = companyData && (
    companyData.transactionsCount > 0 ||
    companyData.banksCount > 0 ||
    companyData.nfesCount > 0 ||
    companyData.classificationsCount > 0
  );

  const handleConfirm = () => {
    if (!hasUsers && isConfirmValid) {
      onConfirm();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Exclusão de Empresa
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
            ) : hasUsers ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Não é possível excluir esta empresa.</strong>
                  <br />
                  Existem {companyData.usersCount} usuário(s) associado(s) a esta empresa. Remova todos os
                  usuários antes de excluir a empresa.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="text-sm text-foreground">
                  Você está prestes a excluir a empresa <strong>"{company?.name}"</strong>.
                </div>

                {hasData && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Os seguintes dados serão permanentemente deletados:</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        {companyData.transactionsCount > 0 && (
                          <li>• {companyData.transactionsCount} transação(ões)</li>
                        )}
                        {companyData.banksCount > 0 && <li>• {companyData.banksCount} banco(s)</li>}
                        {companyData.nfesCount > 0 && <li>• {companyData.nfesCount} nota(s) fiscal(is)</li>}
                        {companyData.classificationsCount > 0 && (
                          <li>• {companyData.classificationsCount} classificação(ões)</li>
                        )}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="confirm-company-name">
                    Digite o nome da empresa <strong>"{company?.name}"</strong> para confirmar:
                  </Label>
                  <Input
                    id="confirm-company-name"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={company?.name || ''}
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
            disabled={!isConfirmValid || hasUsers || loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              'Excluir Empresa'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
