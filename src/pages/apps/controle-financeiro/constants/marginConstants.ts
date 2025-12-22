/**
 * Constantes para análise de margem de lucro
 */

// Limiares de margem para classificação
export const MARGIN_THRESHOLDS = {
  EXCELLENT: 30, // >= 30% é excelente
  GOOD: 15,      // >= 15% é bom
  ICON_THRESHOLD: 20, // >= 20% mostra ícone de crescimento
} as const;

// Razão de custo padrão quando não há classificação CFOP
export const DEFAULT_COST_RATIO = 0.7; // 70% do preço de venda

// Classificações CFOP válidas
export const CFOP_CLASSIFICATIONS = {
  COST: 'custo',
  SALE: 'venda',
} as const;

// Estilos de status de margem
export const MARGIN_STATUS_STYLES = {
  excellent: {
    className: "bg-success text-success-foreground",
    label: "Excelente",
  },
  good: {
    className: "bg-warning text-warning-foreground",
    label: "Bom",
  },
  poor: {
    className: "bg-destructive text-destructive-foreground",
    label: "Baixo",
  },
} as const;
