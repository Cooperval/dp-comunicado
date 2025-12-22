import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

// Mapeamento de tipos de commitment para classificação
export const COMMITMENT_TYPE_MAP: Record<string, 'revenue' | 'cost' | 'expense'> = {
  'Receitas': 'revenue',
  'Receita Bruta': 'revenue',
  'Receita Operacional': 'revenue',
  'Receita Líquida': 'revenue',
  'Outras Receitas': 'revenue',
  'Custos': 'cost',
  'Custo de Produto': 'cost',
  'Custo de Serviço': 'cost',
  'Custo Operacional': 'cost',
  'Despesas': 'expense',
  'Despesa Administrativa': 'expense',
  'Despesa Comercial': 'expense',
  'Despesa Operacional': 'expense',
  'Despesa Financeira': 'expense',
  'Outras Despesas': 'expense',
};

// Estilos e ícones para alertas
export const ALERT_STYLES = {
  warning: {
    icon: AlertCircle,
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
  danger: {
    icon: TrendingDown,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
  },
  success: {
    icon: TrendingUp,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
  },
};

// Limites de margem para alertas
export const MARGIN_THRESHOLDS = {
  HEALTHY: 0.20,  // 20%
  WARNING: 0.10,  // 10%
} as const;

// Ano atual (calculado uma vez)
export const CURRENT_YEAR = new Date().getFullYear();
