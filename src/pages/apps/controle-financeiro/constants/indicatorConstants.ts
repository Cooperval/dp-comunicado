// Mapeamento de nomes de tipos para categorias
export const TYPE_NAME_MAP: Record<string, string> = {
  'Receitas Operacionais': 'receitasOperacionais',
  'Outras Receitas': 'outrasReceitas',
  'Receitas Financeiras': 'receitasFinanceiras',
  'Custos Operacionais': 'custosOperacionais',
  'Despesas Comerciais': 'despesasComerciais',
  'Despesas Administrativas': 'despesasAdministrativas',
  'Despesas Financeiras': 'despesasFinanceiras',
  'Tributos e Encargos': 'tributosEncargos',
} as const;

// Limites de indicadores para classificação de status
export const INDICATOR_THRESHOLDS = {
  liquidity: {
    excellent: 1.5,
    warning: 1.0,
  },
  margin: {
    excellent: 15,
    warning: 5,
  },
  cost: {
    good: 0.3,
    warning: 0.5,
  },
} as const;

// Labels de status para indicadores
export const INDICATOR_STATUS_LABELS = {
  good: 'Excelente',
  warning: 'Atenção',
  danger: 'Crítico',
  low: 'Baixo',
  moderate: 'Moderado',
  high: 'Alto',
  positive: 'Positivo',
  negative: 'Negativo',
} as const;
