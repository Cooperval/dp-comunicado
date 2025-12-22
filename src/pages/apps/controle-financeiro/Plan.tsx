import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/pages/apps/controle-financeiro/auth/AuthProvider";
import { RepresentativeRoute } from "@/pages/apps/controle-financeiro/auth/RepresentativeRoute";
import { toast } from "@/hooks/use-toast";
import { usePlanActions } from "@/pages/apps/controle-financeiro/hooks/usePlanActions";
import { PLANS, URL_PARAMS } from "@/pages/apps/controle-financeiro/constants/planConstants";
import { TrialExpiredBanner } from "@/pages/apps/controle-financeiro/components/plan/TrialExpiredBanner";
import { PlanCard } from "@/pages/apps/controle-financeiro/components/plan/PlanCard";
import { CurrentSubscriptionCard } from "@/pages/apps/controle-financeiro/components/plan/CurrentSubscriptionCard";
import { SubscriptionDetailsModal } from "@/pages/apps/controle-financeiro/components/plan/SubscriptionDetailsModal";

const Plan = () => {
  const { group, subscribed, subscriptionEnd, productId } = useAuth();
  const {
    loading,
    portalLoading,
    handleCheckout,
    handleManageSubscription,
    fetchSubscriptionDetails,
    refreshSubscription,
  } = usePlanActions();
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const currentPlan = subscribed ? "pro" : group?.subscription_plan || "trial";
  const isTrialActive = currentPlan === "trial" && group?.subscription_status === "active";
  const isTrialExpired = currentPlan === "trial" && group?.subscription_status !== "active";

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isSuccess = params.get(URL_PARAMS.SUCCESS) === "true";
    const isCanceled = params.get(URL_PARAMS.CANCELED) === "true";

    if (isSuccess) {
      toast({
        title: "Assinatura confirmada!",
        description: "Bem-vindo ao Plano Pro. Verificando seu status...",
      });
      const timer = setTimeout(() => {
        refreshSubscription();
      }, 2000);

      window.history.replaceState({}, "", window.location.pathname);

      return () => clearTimeout(timer);
    } else if (isCanceled) {
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [refreshSubscription]);

  const handlePlanAction = useCallback(
    (plan: (typeof PLANS)[number]) => {
      if (plan.name === "Teste") {
        if (isTrialActive) {
          toast({
            title: "Trial já ativo",
            description: "Você já está utilizando o período de teste.",
          });
        } else {
          toast({
            title: "Trial expirado",
            description: "Seu período de teste já foi utilizado. Assine um plano Pro para continuar.",
            variant: "destructive",
          });
        }
      } else if (plan.planType) {
        handleCheckout(plan.planType);
      }
    },
    [isTrialActive, handleCheckout],
  );

  const isCurrentPlan = useCallback(
    (plan: (typeof PLANS)[number]) => {
      if (plan.name === "Teste" && isTrialActive && !subscribed) return true;
      if (subscribed && plan.stripeProductId === productId) return true;
      return false;
    },
    [isTrialActive, subscribed, productId],
  );

  return (
    <div className="space-y-8 pb-12">
      {isTrialExpired && <TrialExpiredBanner />}

      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-card-foreground">Escolha Seu Plano</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Comece com 14 dias gratuitos ou escolha entre pagamento mensal ou único
        </p>
      </div>

      {subscribed && (
        <CurrentSubscriptionCard
          productId={productId}
          subscriptionEnd={subscriptionEnd}
          onManageSubscription={handleManageSubscription}
          portalLoading={portalLoading}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.name}
            plan={plan}
            isCurrentPlan={isCurrentPlan(plan)}
            isTrialActive={isTrialActive}
            onSelect={() => handlePlanAction(plan)}
            disabled={loading}
          />
        ))}
      </div>

      <Card className="max-w-3xl mx-auto bg-muted/30">
        <CardContent className="pt-6">
          <p className="text-center text-sm text-muted-foreground">
            Experimente gratuitamente por 14 dias. Sem cartão de crédito.
            <br />
            Dúvidas? Entre em contato com nossa equipe de vendas.
          </p>
        </CardContent>
      </Card>

      <SubscriptionDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onManageSubscription={handleManageSubscription}
        fetchDetails={fetchSubscriptionDetails}
        portalLoading={portalLoading}
      />
    </div>
  );
};

const PlanPage = () => {
  return (
    <RepresentativeRoute>
      <Plan />
    </RepresentativeRoute>
  );
};

export default PlanPage;
