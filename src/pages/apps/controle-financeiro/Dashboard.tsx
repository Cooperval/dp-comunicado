import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/pages/apps/controle-financeiro/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MetricCard from "@/pages/apps/controle-financeiro/components/dashboard/MetricCard";
import FinancialChart from "@/pages/apps/controle-financeiro/components/dashboard/FinancialChart";
import { TrendingUp, TrendingDown, DollarSign, Users, Target, AlertCircle } from "lucide-react";
import { formatCurrency, formatPercentage } from "@/pages/apps/controle-financeiro/utils/formatters";
import { COMMITMENT_TYPE_MAP, MARGIN_THRESHOLDS, CURRENT_YEAR, ALERT_STYLES } from "@/pages/apps/controle-financeiro/constants/dashboardConstants";
import { financialStatementService } from "@/pages/apps/controle-financeiro/services/financialStatementService";
import type { IntegratedTransaction, AlertConfig } from "@/pages/apps/controle-financeiro/types/dashboard";
import { CompanyBranchFilter } from "@/pages/apps/controle-financeiro/components/filters/CompanyBranchFilter";
import { useCompanyBranchFilter } from "@/pages/apps/controle-financeiro/hooks/useCompanyBranchFilter";

interface MonthlyMetrics {
  month: string;
  receitasOperacionais: number;
  outrasReceitas: number;
  receitasFinanceiras: number;
  receitaTotal: number;
  custosOperacionais: number;
  despesasComerciais: number;
  despesasAdministrativas: number;
  despesasFinanceiras: number;
  tributosEncargos: number;
  lucroLiquido: number;
  transactionCount: number;
}

const Dashboard = () => {
  const { user, companyId } = useAuth();
  const [monthlyData, setMonthlyData] = useState<MonthlyMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Company and Branch filter
  const companyBranchFilter = useCompanyBranchFilter();

  const fetchTransactionData = useCallback(async () => {
    try {
      if (!companyId) return;

      // Buscar dados agregados da tabela integrated_transactions
      let query = supabase
        .from("integrated_transactions")
        .select("*")
        .eq("company_id", companyBranchFilter.selectedCompanyId || companyId);

      // Filtrar por filial se selecionada
      if (companyBranchFilter.selectedBranchId) {
        query = query.eq("branch_id", companyBranchFilter.selectedBranchId);
      }

      const { data: integratedData, error } = await query.order("month_year", { ascending: true });

      if (error) throw error;

      // Filtrar por ano selecionado antes de processar
      const filteredData = integratedData?.filter((item) => item.month_year.startsWith(selectedYear.toString())) || [];

      // Processar dados integrados em métricas mensais
      const monthlyMetrics = processIntegratedDataIntoMonthlyMetrics(filteredData);
      setMonthlyData(monthlyMetrics);
    } catch (error) {
      console.error("Error fetching integrated transaction data:", error);
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedYear, companyBranchFilter.selectedCompanyId, companyBranchFilter.selectedBranchId]);

  // Buscar anos disponíveis
  useEffect(() => {
    const fetchYears = async () => {
      if (!companyId) return;
      const years = await financialStatementService.fetchAvailableYears(companyId);
      setAvailableYears(years);
      if (years.length > 0) {
        setSelectedYear(years[0]); // Seleciona o ano mais recente
      }
    };
    fetchYears();
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      fetchTransactionData();
    }
  }, [companyId, fetchTransactionData]);

  // Real-time updates for integrated transactions
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "integrated_transactions",
        },
        () => {
          fetchTransactionData();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dre_line_configurations",
        },
        () => {
          fetchTransactionData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactionData]);

  const processIntegratedDataIntoMonthlyMetrics = (integratedData: IntegratedTransaction[]): MonthlyMetrics[] => {
    const monthlyMap = new Map<
      string,
      {
        receitasOperacionais: number;
        outrasReceitas: number;
        receitasFinanceiras: number;
        custosOperacionais: number;
        despesasComerciais: number;
        despesasAdministrativas: number;
        despesasFinanceiras: number;
        tributosEncargos: number;
        transactionCount: number;
      }
    >();

    integratedData.forEach((item) => {
      const monthKey = item.month_year.substring(0, 7); // YYYY-MM
      const amount = Math.abs(item.total_amount); // Usar valor absoluto
      const typeName = item.type_name;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          receitasOperacionais: 0,
          outrasReceitas: 0,
          receitasFinanceiras: 0,
          custosOperacionais: 0,
          despesasComerciais: 0,
          despesasAdministrativas: 0,
          despesasFinanceiras: 0,
          tributosEncargos: 0,
          transactionCount: 0,
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.transactionCount += item.transaction_count;

      // Classificar por tipo de commitment
      switch (typeName) {
        case "Receitas Operacionais":
          monthData.receitasOperacionais += amount;
          break;
        case "Outras Receitas":
          monthData.outrasReceitas += amount;
          break;
        case "Receitas Financeiras":
          monthData.receitasFinanceiras += amount;
          break;
        case "Custos Operacionais":
          monthData.custosOperacionais += amount;
          break;
        case "Despesas Comerciais":
          monthData.despesasComerciais += amount;
          break;
        case "Despesas Administrativas":
          monthData.despesasAdministrativas += amount;
          break;
        case "Despesas Financeiras":
          monthData.despesasFinanceiras += amount;
          break;
        case "Tributos e Encargos":
          monthData.tributosEncargos += amount;
          break;
        default:
          console.warn(`Tipo não mapeado: ${typeName}`);
      }
    });

    // Converter para array e calcular totais e lucro líquido
    return Array.from(monthlyMap.entries())
      .map(([month, data]) => {
        const receitaTotal = data.receitasOperacionais + data.outrasReceitas + data.receitasFinanceiras;

        const lucroLiquido =
          receitaTotal -
          data.custosOperacionais -
          data.despesasComerciais -
          data.despesasAdministrativas -
          data.despesasFinanceiras -
          data.tributosEncargos;

        return {
          month,
          ...data,
          receitaTotal,
          lucroLiquido,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const getYTDData = () => {
    if (monthlyData.length === 0) return null;

    const currentMonth = new Date().getMonth() + 1;

    // Filtrar apenas dados do ano selecionado
    const currentYearData = monthlyData.filter((m) => m.month.startsWith(selectedYear.toString()));

    // Filtrar dados do ano anterior (mesmo período)
    const previousYearData = monthlyData.filter((m) => {
      const [year, month] = m.month.split("-");
      return parseInt(year) === selectedYear - 1 && parseInt(month) <= currentMonth;
    });

    if (currentYearData.length === 0) return null;

    // Acumular valores do ano atual (YTD)
    const ytdCurrent = currentYearData.reduce(
      (acc, month) => ({
        receitaTotal: acc.receitaTotal + month.receitaTotal,
        lucroLiquido: acc.lucroLiquido + month.lucroLiquido,
        custosOperacionais: acc.custosOperacionais + month.custosOperacionais,
        despesasTotal:
          acc.despesasTotal +
          (month.despesasComerciais +
            month.despesasAdministrativas +
            month.despesasFinanceiras +
            month.tributosEncargos),
        transactionCount: acc.transactionCount + month.transactionCount,
      }),
      {
        receitaTotal: 0,
        lucroLiquido: 0,
        custosOperacionais: 0,
        despesasTotal: 0,
        transactionCount: 0,
      },
    );

    // Acumular valores do ano anterior (YTD para comparação)
    const ytdPrevious = previousYearData.reduce(
      (acc, month) => ({
        receitaTotal: acc.receitaTotal + month.receitaTotal,
        lucroLiquido: acc.lucroLiquido + month.lucroLiquido,
      }),
      {
        receitaTotal: 0,
        lucroLiquido: 0,
      },
    );

    // Cálculos
    const netMargin = ytdCurrent.receitaTotal > 0 ? (ytdCurrent.lucroLiquido / ytdCurrent.receitaTotal) * 100 : 0;

    const revenueGrowth =
      ytdPrevious.receitaTotal > 0
        ? ((ytdCurrent.receitaTotal - ytdPrevious.receitaTotal) / ytdPrevious.receitaTotal) * 100
        : 0;

    // Tratamento especial para lucros negativos
    let profitGrowth = 0;
    if (ytdPrevious.lucroLiquido !== 0) {
      if (ytdPrevious.lucroLiquido < 0 && ytdCurrent.lucroLiquido > 0) {
        // Se lucro anterior era negativo e atual é positivo, é crescimento
        profitGrowth =
          Math.abs((ytdCurrent.lucroLiquido - ytdPrevious.lucroLiquido) / Math.abs(ytdPrevious.lucroLiquido)) * 100;
      } else {
        profitGrowth =
          ((ytdCurrent.lucroLiquido - ytdPrevious.lucroLiquido) / Math.abs(ytdPrevious.lucroLiquido)) * 100;
      }
    }

    const averageTicket = ytdCurrent.transactionCount > 0 ? ytdCurrent.receitaTotal / ytdCurrent.transactionCount : 0;

    return {
      revenue: ytdCurrent.receitaTotal,
      netProfit: ytdCurrent.lucroLiquido,
      costs: ytdCurrent.custosOperacionais,
      expenses: ytdCurrent.despesasTotal,
      netMargin,
      averageTicket,
      revenueGrowth,
      profitGrowth,
      transactionCount: ytdCurrent.transactionCount,
      monthCount: currentYearData.length,
    };
  };

  const currentData = getYTDData();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentData) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado disponível</h3>
            <p className="text-muted-foreground text-center">
              Importe movimentações bancárias e classifique-as para visualizar o dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData = monthlyData.map((metric) => ({
    month: new Date(metric.month + "-01").toLocaleDateString("pt-BR", { month: "short" }),
    revenue: metric.receitaTotal,
    profit: metric.lucroLiquido,
  }));

  const alerts: AlertConfig[] = [
    {
      type: "success",
      title: "Dados em tempo real",
      message: `Baseado em ${currentData.transactionCount} transações classificadas`,
    },
    {
      type: currentData.profitGrowth > 0 ? "success" : "warning",
      title: "Performance do lucro",
      message: `Lucro ${currentData.profitGrowth > 0 ? "cresceu" : "reduziu"} ${Math.abs(currentData.profitGrowth).toFixed(1)}% vs mesmo período ano anterior`,
    },
    {
      type:
        currentData.netMargin > MARGIN_THRESHOLDS.HEALTHY * 100
          ? "success"
          : currentData.netMargin > MARGIN_THRESHOLDS.WARNING * 100
            ? "warning"
            : "danger",
      title: "Margem líquida",
      message: `Margem atual de ${currentData.netMargin.toFixed(1)}%`,
    },
  ];

  const getAlertStyle = (type: AlertConfig["type"]) => {
    return ALERT_STYLES[type] || ALERT_STYLES.warning;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <CompanyBranchFilter
            companies={companyBranchFilter.companies}
            branches={companyBranchFilter.branches}
            selectedCompanyId={companyBranchFilter.selectedCompanyId}
            selectedBranchId={companyBranchFilter.selectedBranchId}
            onCompanyChange={companyBranchFilter.handleCompanyChange}
            onBranchChange={companyBranchFilter.handleBranchChange}
            loading={companyBranchFilter.loading}
          />

          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Ano:</label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-28">
                <SelectValue placeholder="Selecionar ano" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Receita (YTD)"
          value={formatCurrency(currentData.revenue)}
          change={`${currentData.revenueGrowth > 0 ? "+" : ""}${currentData.revenueGrowth.toFixed(1)}% vs ano anterior`}
          changeType={currentData.revenueGrowth >= 0 ? "positive" : "negative"}
          icon={DollarSign}
          description={`${currentData.monthCount} meses acumulados`}
        />
        <MetricCard
          title="Lucro Líquido (YTD)"
          value={formatCurrency(currentData.netProfit)}
          change={`${currentData.profitGrowth > 0 ? "+" : ""}${currentData.profitGrowth.toFixed(1)}% vs ano anterior`}
          changeType={currentData.profitGrowth >= 0 ? "positive" : "negative"}
          icon={TrendingUp}
          description={`Acumulado ${selectedYear}`}
        />
        <MetricCard
          title="Margem Líquida (YTD)"
          value={`${currentData.netMargin.toFixed(1)}%`}
          icon={Target}
          description={`Sobre ${currentData.transactionCount} transações`}
        />
        <MetricCard
          title="Ticket Médio (YTD)"
          value={formatCurrency(currentData.averageTicket)}
          icon={Users}
          description={`${currentData.transactionCount} transações no ano`}
        />
      </div>

      {/* Chart and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FinancialChart data={chartData} title={`Evolução Financeira (${selectedYear})`} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alertas e Notificações</CardTitle>
            <CardDescription>Principais insights dos dados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {alerts.map((alert, index) => {
              const style = getAlertStyle(alert.type);
              const Icon = style.icon;
              return (
                <div key={index} className={`p-4 rounded-lg border ${style.bgColor} ${style.borderColor}`}>
                  <div className="flex items-start gap-3">
                    <Icon className={`w-5 h-5 ${style.color}`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Additional info about data source */}
            <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <h4 className="font-medium text-sm">Fonte dos Dados</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Dados calculados em tempo real das movimentações bancárias classificadas
                  </p>
                  <p className="text-xs text-primary mt-2">
                    Classifique mais movimentações para análises mais precisas
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
