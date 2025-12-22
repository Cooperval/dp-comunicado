import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/pages/apps/controle-financeiro/auth/AuthProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, CheckCircle2, TrendingUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ClassificationStatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Stats {
  totalTransactions: number;
  classifiedTransactions: number;
  unclassifiedTransactions: number;
  percentageClassified: number;
}

export function ClassificationStatsModal({ open, onOpenChange }: ClassificationStatsModalProps) {
  const { company } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    totalTransactions: 0,
    classifiedTransactions: 0,
    unclassifiedTransactions: 0,
    percentageClassified: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && company?.id) {
      fetchStats();
    }
  }, [open, company?.id]);

  const fetchStats = async () => {
    if (!company?.id) return;

    setLoading(true);
    try {
      // Buscar total de transações
      const { count: totalCount, error: totalError } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id);

      if (totalError) throw totalError;

      // Buscar transações classificadas (com join)
      const { data: classifiedData, error: classifiedError } = await supabase
        .from("transaction_classifications")
        .select("transaction_id, transactions!inner(company_id)")
        .eq("transactions.company_id", company.id);

      if (classifiedError) throw classifiedError;

      const totalTransactions = totalCount || 0;
      const classifiedTransactions = classifiedData?.length || 0;
      const unclassifiedTransactions = totalTransactions - classifiedTransactions;
      const percentageClassified = totalTransactions > 0 
        ? Math.round((classifiedTransactions / totalTransactions) * 100) 
        : 0;

      setStats({
        totalTransactions,
        classifiedTransactions,
        unclassifiedTransactions,
        percentageClassified,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToClassification = () => {
    onOpenChange(false);
    navigate("/transaction-classification");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Estatísticas de Classificação
          </DialogTitle>
          <DialogDescription>
            Acompanhe o progresso da classificação das suas transações OFX
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total de Transações */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de Transações</p>
                    <p className="text-3xl font-bold">{stats.totalTransactions}</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transações Classificadas */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Classificadas</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.classifiedTransactions}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transações Sem Classificação */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Sem Classificação</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {stats.unclassifiedTransactions}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Percentual */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Progresso de Classificação</p>
                    <p className="text-lg font-bold">{stats.percentageClassified}%</p>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2.5">
                    <div
                      className="bg-primary h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${stats.percentageClassified}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botão de Ação */}
            {stats.unclassifiedTransactions > 0 && (
              <Button 
                onClick={handleGoToClassification} 
                className="w-full"
                size="lg"
              >
                Ir para Classificação
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
