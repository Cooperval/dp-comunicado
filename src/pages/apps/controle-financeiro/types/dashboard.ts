export interface IntegratedTransaction {
  id: string;
  company_id: string;
  month_year: string;
  period_key: string;
  aggregation_type: 'month' | 'quarter' | 'semester' | 'year';
  type_name: string;
  group_name: string;
  commitment_name: string;
  total_amount: number;
  transaction_count: number;
  commitment_type_id: string | null;
  commitment_group_id: string | null;
  commitment_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface MonthlyMetrics {
  month: string;
  revenue: number;
  costs: number;
  expenses: number;
  profit: number;
}

export interface YTDMetrics {
  revenue: number;
  costs: number;
  expenses: number;
  profit: number;
  profitMargin: number;
  revenueGrowth: number | null;
  profitGrowth: number | null;
}

export interface AlertConfig {
  type: 'warning' | 'danger' | 'success';
  title: string;
  message: string;
}

// Indicators page types
export interface IndicatorMonthlyMetrics {
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

export type IndicatorStatus = 'good' | 'warning' | 'danger' | 'neutral';

export interface IndicatorStatusConfig {
  status: IndicatorStatus;
  color: string;
  bg: string;
}

export interface YTDIndicators {
  currentRatio: number;
  netMargin: number;
  previousNetMargin: number;
  roi: number;
  costRatio: number;
  revenueGrowth: number;
  profitGrowth: number;
  averageTicket: number;
  ytdData: {
    receitaTotal: number;
    lucroLiquido: number;
    custosTotais: number;
    despesasTotais: number;
    transactionCount: number;
  };
  monthCount: number;
}
