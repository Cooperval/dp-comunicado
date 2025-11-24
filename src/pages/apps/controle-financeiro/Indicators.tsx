import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/controle-financeiro/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign, Percent, AlertTriangle } from 'lucide-react';
import { parseISO } from 'date-fns';

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
  custosTotais: number;
  despesasTotais: number;
  lucroLiquido: number;
  margemLiquida: number;
  transactionCount: number;
  averageTicket: number;
}

const Indicators = () => {
  const { user, companyId } = useAuth();
  const [monthlyData, setMonthlyData] = useState<MonthlyMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchTransactionData();
    }
  }, [companyId]);

  // Real-time updates for integrated transactions
  useEffect(() => {
    const channel = supabase
      .channel('indicators-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'integrated_transactions'
        },
        () => {
          console.log('Integrated transactions updated, reloading...');
          fetchTransactionData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dre_line_configurations'
        },
        () => {
          console.log('DRE configurations updated, reloading...');
          fetchTransactionData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  const fetchTransactionData = async () => {
    try {
      if (!companyId) return;

      // Buscar dados agregados de integrated_transactions
      const { data: integratedData, error } = await supabase
        .from('integrated_transactions')
        .select('*')
        .eq('company_id', companyId)
        .order('month_year', { ascending: true });

      if (error) throw error;

      console.log('Integrated transactions loaded:', integratedData?.length || 0);

      // Processar dados integrados
      const monthlyMetrics = processIntegratedDataIntoMonthlyMetrics(integratedData || []);
      setMonthlyData(monthlyMetrics);
      
    } catch (error) {
      console.error('Error fetching integrated transaction data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processIntegratedDataIntoMonthlyMetrics = (integratedData: any[]): MonthlyMetrics[] => {
    const monthlyMap = new Map<string, {
      receitasOperacionais: number;
      outrasReceitas: number;
      receitasFinanceiras: number;
      custosOperacionais: number;
      despesasComerciais: number;
      despesasAdministrativas: number;
      despesasFinanceiras: number;
      tributosEncargos: number;
      transactionCount: number;
    }>();

    integratedData.forEach(item => {
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
          transactionCount: 0
        });
      }

      const monthData = monthlyMap.get(monthKey)!;
      monthData.transactionCount += item.transaction_count;

      // Classificar por tipo
      switch (typeName) {
        case 'Receitas Operacionais':
          monthData.receitasOperacionais += amount;
          break;
        case 'Outras Receitas':
          monthData.outrasReceitas += amount;
          break;
        case 'Receitas Financeiras':
          monthData.receitasFinanceiras += amount;
          break;
        case 'Custos Operacionais':
          monthData.custosOperacionais += amount;
          break;
        case 'Despesas Comerciais':
          monthData.despesasComerciais += amount;
          break;
        case 'Despesas Administrativas':
          monthData.despesasAdministrativas += amount;
          break;
        case 'Despesas Financeiras':
          monthData.despesasFinanceiras += amount;
          break;
        case 'Tributos e Encargos':
          monthData.tributosEncargos += amount;
          break;
        default:
          console.warn(`Tipo não mapeado: ${typeName}`);
      }
    });

    // Converter para array e calcular métricas derivadas
    return Array.from(monthlyMap.entries())
      .map(([month, data]) => {
        // Receita Total
        const receitaTotal = 
          data.receitasOperacionais + 
          data.outrasReceitas + 
          data.receitasFinanceiras;

        // Custos e Despesas Totais
        const custosTotais = data.custosOperacionais;
        const despesasTotais = 
          data.despesasComerciais + 
          data.despesasAdministrativas + 
          data.despesasFinanceiras + 
          data.tributosEncargos;

        // Lucro Líquido
        const lucroLiquido = receitaTotal - custosTotais - despesasTotais;

        // Margem Líquida (%)
        const margemLiquida = receitaTotal > 0 
          ? (lucroLiquido / receitaTotal) * 100 
          : 0;

        // Ticket Médio
        const averageTicket = data.transactionCount > 0 
          ? receitaTotal / data.transactionCount 
          : 0;

        return {
          month,
          ...data,
          receitaTotal,
          custosTotais,
          despesasTotais,
          lucroLiquido,
          margemLiquida,
          averageTicket
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
    const currentRatio = totalOutflow > 0 
      ? latest.receitaTotal / totalOutflow 
      : 0;
    
    // 2. Margem Líquida: (Lucro Líquido / Receita Total) × 100
    const netMargin = latest.margemLiquida;
    const previousNetMargin = previous.margemLiquida;
    
    // 3. ROI: (Lucro Líquido / Custos Totais) × 100
    const roi = latest.custosTotais > 0 
      ? (latest.lucroLiquido / latest.custosTotais) * 100 
      : 0;
    
    // 4. Índice de Custo: (Custos Totais / Receita Total) × 100
    const costRatio = latest.receitaTotal > 0 
      ? (latest.custosTotais / latest.receitaTotal) * 100 
      : 0;
    
    // 5. Crescimento da Receita: ((Receita Atual - Receita Anterior) / Receita Anterior) × 100
    const revenueGrowth = previous.receitaTotal > 0 
      ? ((latest.receitaTotal - previous.receitaTotal) / previous.receitaTotal) * 100 
      : 0;
    
    // 6. Crescimento do Lucro
    const profitGrowth = previous.lucroLiquido > 0 
      ? ((latest.lucroLiquido - previous.lucroLiquido) / previous.lucroLiquido) * 100 
      : 0;

    return {
      currentRatio,
      netMargin,
      previousNetMargin,
      roi,
      costRatio,
      revenueGrowth,
      profitGrowth,
      latest
    };
  };

  const getIndicatorStatus = (value: number, type: string) => {
    switch (type) {
      case 'liquidity':
        if (value >= 1.5) return { status: 'good', color: 'text-success', bg: 'bg-success' };
        if (value >= 1.0) return { status: 'warning', color: 'text-warning', bg: 'bg-warning' };
        return { status: 'danger', color: 'text-destructive', bg: 'bg-destructive' };
      
      case 'margin':
        if (value >= 15) return { status: 'good', color: 'text-success', bg: 'bg-success' };
        if (value >= 5) return { status: 'warning', color: 'text-warning', bg: 'bg-warning' };
        return { status: 'danger', color: 'text-destructive', bg: 'bg-destructive' };
      
      case 'debt':
        if (value <= 0.3) return { status: 'good', color: 'text-success', bg: 'bg-success' };
        if (value <= 0.5) return { status: 'warning', color: 'text-warning', bg: 'bg-warning' };
        return { status: 'danger', color: 'text-destructive', bg: 'bg-destructive' };
      
      default:
        return { status: 'neutral', color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  const formatChartData = () => {
    return monthlyData.map(metric => ({
      month: new Date(metric.month + '-01').toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      receita: metric.receitaTotal,
      lucro: metric.lucroLiquido,
      margem: metric.margemLiquida
    }));
  };

  const indicators = calculateIndicators();

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
                className={getIndicatorStatus(indicators.currentRatio, 'liquidity').bg + ' text-white'}
              >
                {getIndicatorStatus(indicators.currentRatio, 'liquidity').status === 'good' ? 'Excelente' : 
                 getIndicatorStatus(indicators.currentRatio, 'liquidity').status === 'warning' ? 'Atenção' : 'Crítico'}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Receita / (Custos + Despesas)
              </p>
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
                {indicators.netMargin > indicators.previousNetMargin ? 
                  <TrendingUp className="w-4 h-4 text-success" /> : 
                  <TrendingDown className="w-4 h-4 text-destructive" />
                }
              </div>
              <Badge 
                variant="secondary" 
                className={getIndicatorStatus(indicators.netMargin, 'margin').bg + ' text-white'}
              >
                {getIndicatorStatus(indicators.netMargin, 'margin').status === 'good' ? 'Excelente' : 
                 getIndicatorStatus(indicators.netMargin, 'margin').status === 'warning' ? 'Atenção' : 'Crítico'}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Percentual de lucro sobre vendas
              </p>
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
                {indicators.roi > 0 ? 'Positivo' : 'Negativo'}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Retorno sobre custos investidos
              </p>
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
                className={getIndicatorStatus(indicators.costRatio / 100, 'debt').bg + ' text-white'}
              >
                {getIndicatorStatus(indicators.costRatio / 100, 'debt').status === 'good' ? 'Baixo' : 
                 getIndicatorStatus(indicators.costRatio / 100, 'debt').status === 'warning' ? 'Moderado' : 'Alto'}
              </Badge>
              <p className="text-xs text-muted-foreground">
                Custos em relação à receita
              </p>
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
                  formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Margem']}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="margem" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
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
                    `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
                    name === 'receita' ? 'Receita' : 'Lucro'
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
                {indicators.revenueGrowth > 0 ? 
                  <TrendingUp className="w-5 h-5 text-success" /> : 
                  <TrendingDown className="w-5 h-5 text-destructive" />
                }
              </div>
              <p className="text-sm text-muted-foreground">Crescimento da Receita</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                R$ {indicators.latest.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-muted-foreground">Ticket Médio</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                R$ {indicators.latest.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-sm text-muted-foreground">Lucro Líquido Atual</p>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold mb-2">
                {indicators.latest.transactionCount}
              </div>
              <p className="text-sm text-muted-foreground">Transações Classificadas</p>
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
                Todos os indicadores são calculados automaticamente com base nas movimentações bancárias 
                importadas e classificadas na hierarquia de naturezas.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Como Melhorar a Precisão</h4>
              <p className="text-muted-foreground">
                Para análises mais precisas, classifique todas as movimentações bancárias 
                nas categorias apropriadas (Receitas, Despesas, Custos, Investimentos).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Indicators;