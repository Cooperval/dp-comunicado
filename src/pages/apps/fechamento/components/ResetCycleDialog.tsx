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
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface ResetCycleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cycleName: string;
}

export function ResetCycleDialog({
  isOpen,
  onClose,
  onConfirm,
  cycleName,
}: ResetCycleDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Resetar Fechamento
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Você está prestes a resetar o ciclo <strong>{cycleName}</strong>.
            </p>
            <p>Esta ação irá:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Mover todas as tarefas para "Não Iniciado"</li>
              <li>Limpar todas as datas reais de início e conclusão</li>
              <li>Zerar o progresso de todas as tarefas</li>
              <li>Recalcular todas as datas baseado no primeiro dia do mês</li>
            </ul>
            <p className="text-destructive font-medium">
              Esta ação não pode ser desfeita.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Confirmar Reset
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
