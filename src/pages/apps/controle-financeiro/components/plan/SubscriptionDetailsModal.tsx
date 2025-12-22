import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Settings } from "lucide-react";
import type { SubscriptionDetails } from "@/pages/apps/controle-financeiro/types/subscription";

interface SubscriptionDetailsModalProps {
  open: boolean;
  onClose: () => void;
  onManageSubscription: () => void;
  fetchDetails: () => Promise<SubscriptionDetails | null>;
  portalLoading: boolean;
}

export function SubscriptionDetailsModal({
  open,
  onClose,
  onManageSubscription,
  fetchDetails,
  portalLoading,
}: SubscriptionDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState<SubscriptionDetails | null>(null);

  useEffect(() => {
    if (open) {
      loadDetails();
    }
  }, [open]);

  const loadDetails = async () => {
    setLoading(true);
    const data = await fetchDetails();
    setDetails(data);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Pagamentos</DialogTitle>
          <DialogDescription>Detalhes completos da sua assinatura e histórico de cobranças</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground">Carregando detalhes...</p>
            </div>
          </div>
        ) : details ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground mb-1">Valor</p>
                <p className="text-2xl font-bold">
                  {details.currency} {details.amount.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  por {details.interval === "month" ? "mês" : "ano"}
                </p>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <p className="text-sm text-muted-foreground mb-1">Método de Pagamento</p>
                <p className="text-lg font-semibold">{details.payment_method}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Últimas Cobranças
              </h3>

              {details.invoices && details.invoices.length > 0 ? (
                <div className="space-y-2">
                  {details.invoices.map((invoice, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {new Date(invoice.date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground capitalize">
                          Status: {invoice.status === "paid" ? "Pago" : invoice.status}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {invoice.currency} {invoice.amount.toFixed(2)}
                        </p>
                        {invoice.invoice_pdf && (
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs"
                            onClick={() => window.open(invoice.invoice_pdf, "_blank")}
                          >
                            Ver recibo
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum histórico de pagamento disponível
                </p>
              )}
            </div>

            <div className="pt-4 border-t">
              <Button
                variant="outline"
                onClick={onManageSubscription}
                disabled={portalLoading}
                className="w-full gap-2"
              >
                <Settings className="w-4 h-4" />
                {portalLoading ? "Abrindo..." : "Abrir Portal Completo do Stripe"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Erro ao carregar detalhes</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
