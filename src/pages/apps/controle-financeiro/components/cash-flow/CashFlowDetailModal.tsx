import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DETAIL_MODAL_TYPE_CONFIG } from "@/pages/apps/controle-financeiro/constants/cashFlowConstants";
import type { CashFlowItem, CashFlowType } from "@/pages/apps/controle-financeiro/types/cashFlow";

interface CashFlowDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  date: string;
  items: CashFlowItem[];
  type: CashFlowType;
}

export function CashFlowDetailModal({
  open,
  onOpenChange,
  title,
  date,
  items,
  type,
}: CashFlowDetailModalProps) {
  const totalValue = items.reduce((sum, item) => sum + Math.abs(item.amount), 0);
  const config = DETAIL_MODAL_TYPE_CONFIG[type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className={config.colorClass}>
            {config.label} - {format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </DialogTitle>
          <DialogDescription>{title}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma movimentação encontrada.
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header da lista */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-muted/50 rounded-md font-semibold text-sm">
                <div className="col-span-6">Descrição</div>
                <div className="col-span-3">Classificação</div>
                <div className="col-span-3 text-right">Valor</div>
              </div>

              {/* Lista de movimentações */}
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 px-4 py-3 border rounded-md hover:bg-muted/30 transition-colors"
                >
                  <div className="col-span-6">
                    <div className="text-sm font-medium">{item.description}</div>
                  </div>
                  <div className="col-span-3">
                    {item.classification?.group && (
                      <div className="text-xs text-muted-foreground">
                        <div>{item.classification.group}</div>
                        {item.classification.commitment && (
                          <div className="mt-1">{item.classification.commitment}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="col-span-3 text-right">
                    <span className={`font-semibold ${config.colorClass}`}>
                      R$ {Math.abs(item.amount).toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Footer com totais */}
              <div className="mt-4 p-4 bg-muted/50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total de movimentações:</span>
                  <span className="font-bold text-lg">
                    {items.length} {items.length === 1 ? "movimentação" : "movimentações"}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-semibold">Valor total:</span>
                  <span className={`font-bold text-lg ${config.colorClass}`}>
                    R$ {totalValue.toLocaleString("pt-BR", {
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
