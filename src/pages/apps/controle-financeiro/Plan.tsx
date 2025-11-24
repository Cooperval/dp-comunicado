import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Sparkles, Settings, FileText, CreditCard, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/controle-financeiro/AuthProvider";
import { RepresentativeRoute } from "@/components/auth/controle-financeiro/RepresentativeRoute";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PlanOption {
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  popular?: boolean;
  features: PlanFeature[];
  ctaText: string;
}

const Plan = () => {
  const { company, subscribed, subscriptionEnd, checkSubscription, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);

  const currentPlan = subscribed ? "pro" : (company?.subscription_plan || "trial");
  const isTrialActive = currentPlan === "trial" && company?.subscription_status === "active";
  const isTrialExpired = currentPlan === "trial" && company?.subscription_status !== "active";

  // Check for success/canceled params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast({
        title: "Assinatura confirmada!",
        description: "Bem-vindo ao Plano Pro. Verificando seu status...",
      });
      // Refresh subscription status
      setTimeout(() => {
        checkSubscription();
      }, 2000);
    } else if (params.get('canceled') === 'true') {
      toast({
        title: "Pagamento cancelado",
        description: "Você pode tentar novamente quando quiser.",
        variant: "destructive",
      });
    }
  }, []);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Erro ao processar",
        description: "Não foi possível criar a sessão de pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir o portal de gerenciamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleViewDetails = async () => {
    try {
      setDetailsLoading(true);
      setDetailsModalOpen(true);
      
      const { data, error } = await supabase.functions.invoke('get-subscription-details', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      setSubscriptionDetails(data);
    } catch (error: any) {
      console.error('Error fetching subscription details:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao buscar detalhes da assinatura",
        variant: "destructive",
      });
      setDetailsModalOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handlePlanAction = (planName: string) => {
    if (planName === "Teste") {
      if (isTrialActive) {
        toast({
          title: "Trial já ativo",
          description: "Você já está utilizando o período de teste.",
        });
      } else {
        toast({
          title: "Trial expirado",
          description: "Seu período de teste já foi utilizado. Assine o plano Pro para continuar.",
          variant: "destructive",
        });
      }
    } else if (planName === "Pro") {
      handleCheckout();
    }
  };

  const plans: PlanOption[] = [
    {
      name: "Teste",
      description: "14 dias de teste gratuito",
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        { text: "14 dias gratuitos", included: true },
        { text: "Importação limitada de NFes", included: true },
        { text: "Até 1 usuários", included: true },
        { text: "Relatórios básicos", included: true },
        { text: "Importação limitada de OFX", included: true },
        { text: "Classificação automática", included: true },
        { text: "Análise de margens", included: true },
        { text: "Suporte por email", included: false },
      ],
      ctaText: "Iniciar Teste Grátis",
    },
    {
      name: "Pro",
      description: "Para empresas que querem crescer",
      monthlyPrice: 369.99,
      annualPrice: 369.99,
      popular: true,
      features: [
        { text: "Importação ilimitada de NFes", included: true },
        { text: "Importação ilimitada de OFX", included: true },
        { text: "Usuários ilimitados", included: true },
        { text: "Relatórios avançados", included: true },
        { text: "Classificação automática", included: true },
        { text: "Análise de margens", included: true },
        { text: "Suporte prioritário", included: true },
      ],
      ctaText: "Assinar Plano Pro",
    },
  ];

  const getPrice = (plan: PlanOption) => {
    if (plan.annualPrice === 0) return "Grátis";
    return plan.annualPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Trial Expired Banner */}
      {isTrialExpired && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-card-foreground">
                Seu período de teste expirou
              </p>
              <p className="text-sm text-muted-foreground">
                Assine o plano Pro para continuar utilizando todos os recursos do sistema
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-card-foreground">Planos Mensais</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Comece com 14 dias gratuitos ou assine o plano Pro mensal
        </p>
      </div>

      {/* Current Subscription Card */}
      {subscribed && (
        <Card className="max-w-3xl mx-auto border-success/50 bg-success/5">
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
                  <p className="text-lg font-semibold">Plano Pro</p>
                  <p className="text-sm text-muted-foreground">R$ 369,99/mês</p>
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
                      new Date(subscriptionEnd).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })
                    ) : (
                      <span className="text-muted-foreground">Calculando...</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                {portalLoading ? "Abrindo..." : "Gerenciar Assinatura"}
              </Button>
              <Button
                variant="secondary"
                onClick={handleViewDetails}
                className="gap-2"
              >
                <FileText className="w-4 h-4" />
                Ver Histórico de Pagamentos
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Gerencie seu método de pagamento, veja o histórico completo ou cancele sua assinatura
            </p>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "relative transition-all hover:shadow-elevated",
              plan.popular && "border-primary shadow-financial",
            )}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground shadow-md">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Mais Popular
                </Badge>
              </div>
            )}

            {currentPlan === "trial" && plan.name === "Teste" && !subscribed && (
              <Badge className="absolute top-4 right-4 bg-success">Plano Atual</Badge>
            )}
            {(currentPlan === "pro" || subscribed) && plan.name === "Pro" && (
              <Badge className="absolute top-4 right-4 bg-success">Plano Atual</Badge>
            )}

            <CardHeader className="text-center pb-8 pt-6">
              <CardTitle className="text-2xl text-card-foreground">{plan.name}</CardTitle>
              <CardDescription className="text-sm pt-2">{plan.description}</CardDescription>

              <div className="pt-6">
                <div className="flex items-baseline justify-center gap-1">
                  {plan.annualPrice === 0 ? (
                    <span className="text-4xl font-bold text-card-foreground">Grátis</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-card-foreground">R$ {getPrice(plan)}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </>
                  )}
                </div>
                {plan.annualPrice === 0 && <p className="text-xs text-muted-foreground mt-2">Por 14 dias</p>}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <Button
                className="w-full"
                variant={plan.popular ? "default" : "outline"}
                size="lg"
                onClick={() => handlePlanAction(plan.name)}
                disabled={(plan.name === "Teste" && isTrialActive) || (plan.name === "Pro" && (subscribed || loading))}
              >
                {plan.name === "Teste" && isTrialActive 
                  ? "Plano Atual" 
                  : plan.name === "Pro" && subscribed 
                  ? "Plano Atual" 
                  : plan.name === "Pro" && loading
                  ? "Processando..."
                  : plan.ctaText}
              </Button>

              <div className="space-y-3 pt-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check
                      className={cn(
                        "w-5 h-5 flex-shrink-0 mt-0.5",
                        feature.included ? "text-success" : "text-muted-foreground/30",
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm",
                        feature.included ? "text-card-foreground" : "text-muted-foreground line-through",
                      )}
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ or Additional Info */}
      <Card className="max-w-3xl mx-auto bg-muted/30">
        <CardContent className="pt-6">
          <p className="text-center text-sm text-muted-foreground">
            Experimente gratuitamente por 14 dias. Sem cartão de crédito. Cancele a qualquer momento.
            <br />
            Dúvidas? Entre em contato com nossa equipe de vendas.
          </p>
        </CardContent>
      </Card>

      {/* Subscription Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Histórico de Pagamentos</DialogTitle>
            <DialogDescription>
              Detalhes completos da sua assinatura e histórico de cobranças
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-muted-foreground">Carregando detalhes...</p>
              </div>
            </div>
          ) : subscriptionDetails ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground mb-1">Valor</p>
                  <p className="text-2xl font-bold">
                    {subscriptionDetails.currency} {subscriptionDetails.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">por {subscriptionDetails.interval === 'month' ? 'mês' : 'ano'}</p>
                </div>
                <div className="p-4 rounded-lg border bg-card">
                  <p className="text-sm text-muted-foreground mb-1">Método de Pagamento</p>
                  <p className="text-lg font-semibold">{subscriptionDetails.payment_method}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Últimas Cobranças
                </h3>
                
                {subscriptionDetails.invoices && subscriptionDetails.invoices.length > 0 ? (
                  <div className="space-y-2">
                    {subscriptionDetails.invoices.map((invoice: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {new Date(invoice.date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-muted-foreground capitalize">
                            Status: {invoice.status === 'paid' ? 'Pago' : invoice.status}
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
                              onClick={() => window.open(invoice.invoice_pdf, '_blank')}
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
                  onClick={handleManageSubscription}
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
