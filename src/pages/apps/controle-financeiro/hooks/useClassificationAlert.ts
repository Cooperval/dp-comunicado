import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { financialStatementService } from "@/pages/apps/controle-financeiro/services/financialStatementService";

export function useClassificationAlert(
  companyId: string | undefined,
  hasLoadedData: boolean
) {
  const [unclassifiedCount, setUnclassifiedCount] = useState<number>(0);
  const [showAlert, setShowAlert] = useState(false);

  const fetchClassificationStats = async () => {
    if (!companyId) return;

    try {
      const stats = await financialStatementService.fetchClassificationStats(companyId);
      setUnclassifiedCount(stats.unclassifiedCount);
      setShowAlert(stats.unclassifiedCount > 0);
    } catch (error) {
      console.error("Erro ao buscar estatísticas de classificação:", error);
    }
  };

  useEffect(() => {
    if (!companyId || !hasLoadedData) return;

    fetchClassificationStats();

    const channel = supabase
      .channel("classification-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transaction_classifications",
        },
        () => {
          fetchClassificationStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, hasLoadedData]);

  return {
    unclassifiedCount,
    showAlert,
    refresh: fetchClassificationStats,
  };
}
