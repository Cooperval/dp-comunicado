import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar, Settings, Loader2 } from "lucide-react";
import { PLANS } from "@/pages/apps/controle-financeiro/constants/planConstants";

interface CurrentSubscriptionCardProps {
  productId: string | null;
  subscriptionEnd: string | null;
  onManageSubscription: () => void;
  portalLoading: boolean;
}

export function CurrentSubscriptionCard({
  productId,
  subscriptionEnd,
  onManageSubscription,
  portalLoading,
}: CurrentSubscriptionCardProps) {
  const getCurrentPlan = () => {
    return PLANS.find((p) => p.stripeProductId === productId);
  };

  const getCurrentPlanPriceDisplay = () => {
    const currentPlan = getCurrentPlan();
    if (!currentPlan) return " ";

    if (currentPlan.planType === "pro_mensal") {
      return `R$ ${currentPlan.displayPrice}/mês`;
    }
    return `R$ ${currentPlan.displayPrice}`;
  };

  return (
    <Card className="max-w-2xl mx-auto border-success/50 bg-success/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">Minha Assinatura</CardTitle>
            <CardDescription>Detalhes do seu plano ativo</CardDescription>
          </div>
          <Badge className="bg-success text-success-foreground">Ativa</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Plano Atual</p>
              <p className="text-lg font-semibold">{getCurrentPlan()?.name || "Plano Pro"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Próxima Cobrança</p>
              <p className="text-lg font-semibold">
                {subscriptionEnd ? (
                  new Date(subscriptionEnd).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })
                ) : (
                  <span className="text-muted-foreground">Calculando...</span>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t">
          <Button onClick={onManageSubscription} variant="outline" className="w-full" disabled={portalLoading}>
            {portalLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Abrindo portal...
              </>
            ) : (
              <>
                <Settings className="mr-2 h-4 w-4" />
                Gerenciar Assinatura
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
