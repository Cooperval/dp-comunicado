import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/pages/apps/controle-financeiro/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TrendingUp, TrendingDown, Activity, DollarSign, Percent, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/pages/apps/controle-financeiro/utils/formatters";
import { CURRENT_YEAR } from "@/pages/apps/controle-financeiro/constants/dashboardConstants";
import { TYPE_NAME_MAP, INDICATOR_THRESHOLDS, INDICATOR_STATUS_LABELS } from "@/pages/apps/controle-financeiro/constants/indicatorConstants";
import type {
  IntegratedTransaction,
  IndicatorMonthlyMetrics,
  IndicatorStatusConfig,
  YTDIndicators,
} from "@/pages/apps/controle-financeiro/types/dashboard";
import { CompanyBranchFilter } from "@/pages/apps/controle-financeiro/components/filters/CompanyBranchFilter";
import { useCompanyBranchFilter } from "@/pages/apps/controle-financeiro/hooks/useCompanyBranchFilter";

const Indicators = () => {
  const { companyId } = useAuth();
  const [monthlyData, setMonthlyData] = useState<IndicatorMonthlyMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  // Company and Branch filter
  const companyBranchFilter = useCompanyBranchFilter();

  const fetchTransactionData = useCallback(async () => {
    try {
      if (!companyId) return;

      let query = supabase
        .from("integrated_transactions")
        .select("*")
        .eq("company_id", companyBranchFilter.selectedCompanyId || companyId);

      if (companyBranchFilter.selectedBranchId) {
        query = query.eq("branch_id", companyBranchFilter.selectedBranchId);
      }

      const { data: integratedData, error } = await query.order("month_year", { ascending: true });

      if (error) throw error;

      const monthlyMetrics = processIntegratedDataIntoMonthlyMetrics(integratedData || []);
      setMonthlyData(monthlyMetrics);
    } catch (error) {
      console.error("Error fetching integrated transaction data:", error);
    } finally {
      setLoading(false);
    }
  }, [companyId, companyBranchFilter.selectedCompanyId, companyBranchFilter.selectedBranchId]);

  useEffect(() => {
    if (companyId) {
      fetchTransactionData();
    }
  }, [companyId, fetchTransactionData]);

  // Real-time updates for integrated transactions
  useEffect(() => {
    const channel = supabase
      .channel("indicators-realtime")
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

  const processIntegratedDataIntoMonthlyMetrics = (
    integratedData: IntegratedTransaction[],
  ): IndicatorMonthlyMetrics[] => {
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
      const amount = Math.abs(item.total_amount);
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

      // Classificar por tipo usando mapeamento
      const mappedKey = TYPE_NAME_MAP[typeName];
      if (mappedKey && mappedKey in monthData) {
        (monthData as any)[mappedKey] += amount;
      }
    });

    // Converter para array e calcular métricas derivadas
    return Array.from(monthlyMap.entries())
      .map(([month, data]) => {
        // Receita Total
        const receitaTotal = data.receitasOperacionais + data.outrasReceitas + data.receitasFinanceiras;

        // Custos e Despesas Totais
        const custosTotais = data.custosOperacionais;
        const despesasTotais =
          data.despesasComerciais + data.despesasAdministrativas + data.despesasFinanceiras + data.tributosEncargos;

        // Lucro Líquido
        const lucroLiquido = receitaTotal - custosTotais - despesasTotais;

        // Margem Líquida (%)
        const margemLiquida = receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0;

        // Ticket Médio
        const averageTicket = data.transactionCount > 0 ? receitaTotal / data.transactionCount : 0;

        return {
          month,
          ...data,
          receitaTotal,
          custosTotais,
          despesasTotais,
          lucroLiquido,
          margemLiquida,
          averageTicket,
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Últimos 12 meses
  };

  const calculateIndicators = () => {
    if (monthlyData.length === 0) return null;

    const latest = monthlyData[monthlyData.length - 1];
    const previous = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : latest;

    // 1. Liquidez Corrente: Receita / (Custos + Despesas)
    const totalOutflow = latest.custosTotais + latest.despesasTotais;
    const currentRatio = totalOutflow > 0 ? latest.receitaTotal / totalOutflow : 0;

    // 2. Margem Líquida: (Lucro Líquido / Receita Total) × 100
    const netMargin = latest.margemLiquida;
    const previousNetMargin = previous.margemLiquida;

    // 3. ROI: (Lucro Líquido / Custos Totais) × 100
    const roi = latest.custosTotais > 0 ? (latest.lucroLiquido / latest.custosTotais) * 100 : 0;

    // 4. Índice de Custo: (Custos Totais / Receita Total) × 100
    const costRatio = latest.receitaTotal > 0 ? (latest.custosTotais / latest.receitaTotal) * 100 : 0;

    // 5. Crescimento da Receita: ((Receita Atual - Receita Anterior) / Receita Anterior) × 100
    const revenueGrowth =
      previous.receitaTotal > 0 ? ((latest.receitaTotal - previous.receitaTotal) / previous.receitaTotal) * 100 : 0;

    // 6. Crescimento do Lucro - Tratamento para lucros negativos
    let profitGrowth = 0;
    if (previous.lucroLiquido !== 0) {
      if (previous.lucroLiquido > 0) {
        profitGrowth = ((latest.lucroLiquido - previous.lucroLiquido) / previous.lucroLiquido) * 100;
      } else {
        // Quando lucro anterior é negativo, inverter a lógica
        profitGrowth = ((latest.lucroLiquido - previous.lucroLiquido) / Math.abs(previous.lucroLiquido)) * 100;
      }
    }

    return {
      currentRatio,
      netMargin,
      previousNetMargin,
      roi,
      costRatio,
      revenueGrowth,
      profitGrowth,
      latest,
    };
  };

  const getIndicatorStatus = (value: number, type: string): IndicatorStatusConfig => {
    switch (type) {
      case "liquidity":
        if (value >= INDICATOR_THRESHOLDS.liquidity.excellent)
          return { status: "good", color: "text-success", bg: "bg-success" };
        if (value >= INDICATOR_THRESHOLDS.liquidity.warning)
          return { status: "warning", color: "text-warning", bg: "bg-warning" };
        return { status: "danger", color: "text-destructive", bg: "bg-destructive" };

      case "margin":
        if (value >= INDICATOR_THRESHOLDS.margin.excellent)
          return { status: "good", color: "text-success", bg: "bg-success" };
        if (value >= INDICATOR_THRESHOLDS.margin.warning)
          return { status: "warning", color: "text-warning", bg: "bg-warning" };
        return { status: "danger", color: "text-destructive", bg: "bg-destructive" };

      case "debt":
        if (value <= INDICATOR_THRESHOLDS.cost.good) return { status: "good", color: "text-success", bg: "bg-success" };
        if (value <= INDICATOR_THRESHOLDS.cost.warning)
          return { status: "warning", color: "text-warning", bg: "bg-warning" };
        return { status: "danger", color: "text-destructive", bg: "bg-destructive" };

      default:
        return { status: "neutral", color: "text-muted-foreground", bg: "bg-muted" };
    }
  };

  const calculateYTDIndicators = (): YTDIndicators | null => {
    if (monthlyData.length === 0) return null;

    const currentMonth = new Date().getMonth() + 1;
    const currentYearData = monthlyData.filter((m) => m.month.startsWith(CURRENT_YEAR.toString()));
    const previousYearData = monthlyData.filter((m) => {
      const [year, month] = m.month.split("-");
      return parseInt(year) === CURRENT_YEAR - 1 && parseInt(month) <= currentMonth;
    });

    if (currentYearData.length === 0) return null;

    const ytdCurrent = currentYearData.reduce(
      (acc, month) => ({
        receitaTotal: acc.receitaTotal + month.receitaTotal,
        lucroLiquido: acc.lucroLiquido + month.lucroLiquido,
        custosTotais: acc.custosTotais + month.custosTotais,
        despesasTotais: acc.despesasTotais + month.despesasTotais,
        transactionCount: acc.transactionCount + month.transactionCount,
      }),
      { receitaTotal: 0, lucroLiquido: 0, custosTotais: 0, despesasTotais: 0, transactionCount: 0 },
    );

    const ytdPrevious = previousYearData.reduce(
      (acc, month) => ({
        receitaTotal: acc.receitaTotal + month.receitaTotal,
        lucroLiquido: acc.lucroLiquido + month.lucroLiquido,
      }),
      { receitaTotal: 0, lucroLiquido: 0 },
    );

    const totalOutflow = ytdCurrent.custosTotais + ytdCurrent.despesasTotais;
    const currentRatio = totalOutflow > 0 ? ytdCurrent.receitaTotal / totalOutflow : 0;
    const netMargin = ytdCurrent.receitaTotal > 0 ? (ytdCurrent.lucroLiquido / ytdCurrent.receitaTotal) * 100 : 0;
    const previousNetMargin =
      ytdPrevious.receitaTotal > 0 ? (ytdPrevious.lucroLiquido / ytdPrevious.receitaTotal) * 100 : 0;
    const roi = ytdCurrent.custosTotais > 0 ? (ytdCurrent.lucroLiquido / ytdCurrent.custosTotais) * 100 : 0;
    const costRatio = ytdCurrent.receitaTotal > 0 ? (ytdCurrent.custosTotais / ytdCurrent.receitaTotal) * 100 : 0;
    const revenueGrowth =
      ytdPrevious.receitaTotal > 0
        ? ((ytdCurrent.receitaTotal - ytdPrevious.receitaTotal) / ytdPrevious.receitaTotal) * 100
        : 0;

    // Crescimento do Lucro - Tratamento para lucros negativos
    let profitGrowth = 0;
    if (ytdPrevious.lucroLiquido !== 0) {
      if (ytdPrevious.lucroLiquido > 0) {
        profitGrowth = ((ytdCurrent.lucroLiquido - ytdPrevious.lucroLiquido) / ytdPrevious.lucroLiquido) * 100;
      } else {
        profitGrowth =
          ((ytdCurrent.lucroLiquido - ytdPrevious.lucroLiquido) / Math.abs(ytdPrevious.lucroLiquido)) * 100;
      }
    }

    const averageTicket = ytdCurrent.transactionCount > 0 ? ytdCurrent.receitaTotal / ytdCurrent.transactionCount : 0;

    return {
      currentRatio,
      netMargin,
      previousNetMargin,
      roi,
      costRatio,
      revenueGrowth,
      profitGrowth,
      averageTicket,
      ytdData: ytdCurrent,
      monthCount: currentYearData.length,
    };
  };

  const formatChartData = () => {
    return monthlyData
      .filter((m) => m.month.startsWith(CURRENT_YEAR.toString()))
      .map((metric) => ({
        month: new Date(metric.month + "-01").toLocaleDateString("pt-BR", { month: "short" }),
        receita: metric.receitaTotal,
        lucro: metric.lucroLiquido,
        margem: metric.margemLiquida,
      }));
  };

  const indicators = calculateYTDIndicators();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!indicators) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum dado disponível</h3>
            <p className="text-muted-foreground text-center">
              Importe movimentações bancárias e classifique-as para visualizar os indicadores
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const chartData = formatChartData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <CompanyBranchFilter
          companies={companyBranchFilter.companies}
          branches={companyBranchFilter.branches}
          selectedCompanyId={companyBranchFilter.selectedCompanyId}
          selectedBranchId={companyBranchFilter.selectedBranchId}
          onCompanyChange={companyBranchFilter.handleCompanyChange}
          onBranchChange={companyBranchFilter.handleBranchChange}
          loading={companyBranchFilter.loading}
        />
      </div>

      {/* Key Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Liquidez Corrente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{indicators.currentRatio.toFixed(2)}</div>
              <Badge
                variant="secondary"
                className={getIndicatorStatus(indicators.currentRatio, "liquidity").bg + " text-white"}
              >
                {getIndicatorStatus(indicators.currentRatio, "liquidity").status === "good"
                  ? INDICATOR_STATUS_LABELS.good
                  : getIndicatorStatus(indicators.currentRatio, "liquidity").status === "warning"
                    ? INDICATOR_STATUS_LABELS.warning
                    : INDICATOR_STATUS_LABELS.danger}
              </Badge>
              <p className="text-xs text-muted-foreground">Receita / (Custos + Despesas)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Percent className="w-4 h-4" />
              Margem Líquida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{indicators.netMargin.toFixed(1)}%</span>
                {indicators.netMargin > indicators.previousNetMargin ? (
                  <TrendingUp className="w-4 h-4 text-success" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-destructive" />
                )}
              </div>
              <Badge
                variant="secondary"
                className={getIndicatorStatus(indicators.netMargin, "margin").bg + " text-white"}
              >
                {getIndicatorStatus(indicators.netMargin, "margin").status === "good"
                  ? INDICATOR_STATUS_LABELS.good
                  : getIndicatorStatus(indicators.netMargin, "margin").status === "warning"
                    ? INDICATOR_STATUS_LABELS.warning
                    : INDICATOR_STATUS_LABELS.danger}
              </Badge>
              <p className="text-xs text-muted-foreground">Percentual de lucro sobre vendas</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              ROI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{indicators.roi.toFixed(1)}%</div>
              <Badge
                variant="secondary"
                className={indicators.roi > 0 ? "bg-success text-white" : "bg-warning text-white"}
              >
                {indicators.roi > 0 ? INDICATOR_STATUS_LABELS.positive : INDICATOR_STATUS_LABELS.negative}
              </Badge>
              <p className="text-xs text-muted-foreground">Retorno sobre custos investidos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Índice de Custos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold">{indicators.costRatio.toFixed(1)}%</div>
              <Badge
                variant="secondary"
                className={getIndicatorStatus(indicators.costRatio / 100, "debt").bg + " text-white"}
              >
                {getIndicatorStatus(indicators.costRatio / 100, "debt").status === "good"
                  ? INDICATOR_STATUS_LABELS.low
                  : getIndicatorStatus(indicators.costRatio / 100, "debt").status === "warning"
                    ? INDICATOR_STATUS_LABELS.moderate
                    : INDICATOR_STATUS_LABELS.high}
              </Badge>
              <p className="text-xs text-muted-foreground">Custos em relação à receita</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Evolução da Margem Líquida</CardTitle>
            <CardDescription>Percentual de lucro sobre receita ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${Number(value).toFixed(1)}%`, "Margem"]}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="margem"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receita vs Lucro</CardTitle>
            <CardDescription>Comparação mensal entre receita e lucro líquido</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                    name === "receita" ? "Receita" : "Lucro",
                  ]}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Bar dataKey="receita" fill="hsl(var(--primary))" />
                <Bar dataKey="lucro" fill="hsl(var(--success))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Growth Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Crescimento e Eficiência</CardTitle>
          <CardDescription>Indicadores de evolução e eficiência operacional do negócio</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl font-bold">{indicators.revenueGrowth.toFixed(1)}%</span>
                {indicators.revenueGrowth > 0 ? (
                  <TrendingUp className="w-5 h-5 text-success" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-destructive" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">Crescimento da Receita (YTD)</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold mb-2">{formatCurrency(indicators.averageTicket)}</div>
              <p className="text-sm text-muted-foreground">Ticket Médio (YTD)</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold mb-2">{formatCurrency(indicators.ytdData.lucroLiquido)}</div>
              <p className="text-sm text-muted-foreground">Lucro Líquido (YTD)</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold mb-2">{indicators.ytdData.transactionCount}</div>
              <p className="text-sm text-muted-foreground">Transações (YTD)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Source Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Sobre os Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Fonte dos Indicadores</h4>
              <p className="text-muted-foreground">
                Todos os indicadores são calculados automaticamente com base nas movimentações bancárias importadas e
                classificadas na hierarquia de naturezas.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Como Melhorar a Precisão</h4>
              <p className="text-muted-foreground">
                Para análises mais precisas, classifique todas as movimentações bancárias nas categorias apropriadas
                (Receitas, Despesas, Custos, Investimentos).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Indicators;
