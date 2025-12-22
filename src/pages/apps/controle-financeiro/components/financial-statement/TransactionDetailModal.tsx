import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { DetailTransaction } from "@/pages/apps/controle-financeiro/types/financialStatement";

interface TransactionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  transactions: DetailTransaction[];
  loading: boolean;
}

export function TransactionDetailModal({
  open,
  onOpenChange,
  title,
  transactions,
  loading,
}: TransactionDetailModalProps) {
  const totalValue = transactions.reduce(
    (sum, t) => sum + (t.transaction_type === "credit" ? t.amount : -t.amount),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Movimentações Detalhadas</DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma movimentação encontrada para este período.
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 rounded-md font-semibold text-sm">
                <div className="col-span-2">Data</div>
                <div className="col-span-5">Descrição</div>
                <div className="col-span-2 text-center">Tipo</div>
                <div className="col-span-3 text-right">Valor</div>
              </div>

              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="grid grid-cols-12 gap-2 px-4 py-3 border rounded-md hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-2 text-sm">
                    {format(parseISO(transaction.transaction_date), "dd/MM/yyyy")}
                  </div>
                  <div className="col-span-5">
                    <div className="text-sm font-medium">{transaction.description}</div>
                    {transaction.memo && (
                      <div className="text-xs text-muted-foreground mt-1">{transaction.memo}</div>
                    )}
                  </div>
                  <div className="col-span-2 text-center">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        transaction.transaction_type === "credit"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {transaction.transaction_type === "credit" ? "Crédito" : "Débito"}
                    </span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span
                      className={`font-semibold ${
                        transaction.transaction_type === "credit"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      R${" "}
                      {Math.abs(transaction.amount).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              ))}

              <div className="mt-4 p-4 bg-primary/10 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total de movimentações:</span>
                  <span className="font-bold text-lg">
                    {transactions.length} {transactions.length === 1 ? "transação" : "transações"}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-semibold">Valor total:</span>
                  <span className="font-bold text-lg">
                    R${" "}
                    {Math.abs(totalValue).toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
