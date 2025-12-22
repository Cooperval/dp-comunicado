import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/pages/apps/controle-financeiro/auth/AuthProvider";
import { toast } from "@/hooks/use-toast";
import type { SubscriptionDetails } from "@/pages/apps/controle-financeiro/types/subscription";

export function usePlanActions() {
  const { checkSubscription, group } = useAuth();
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleCheckout = async (planType: "pro_mensal" | "pro_completo") => {
    setLoading(true);
    try {
      // Obter sessão fresca para garantir token válido
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.access_token) {
        throw new Error("Sessão não encontrada. Faça login novamente.");
      }

      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        body: { plan_type: planType },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
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
      // Obter sessão fresca para garantir token válido
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.access_token) {
        throw new Error("Sessão não encontrada. Faça login novamente.");
      }

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast({
        title: "Erro",
        description: "Não foi possível abrir o portal de gerenciamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const fetchSubscriptionDetails = async (): Promise<SubscriptionDetails | null> => {
    try {
      // Obter sessão fresca para garantir token válido
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.access_token) {
        throw new Error("Sessão não encontrada. Faça login novamente.");
      }

      const { data, error } = await supabase.functions.invoke("get-subscription-details", {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
        body: { group_id: group?.id },
      });

      if (error) throw error;
      return data as SubscriptionDetails;
    } catch (error: any) {
      console.error("Error fetching subscription details:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao buscar detalhes da assinatura",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    loading,
    portalLoading,
    handleCheckout,
    handleManageSubscription,
    fetchSubscriptionDetails,
    refreshSubscription: checkSubscription,
  };
}
