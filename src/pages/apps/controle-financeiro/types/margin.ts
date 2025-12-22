/**
 * Tipos para análise de margem de lucro
 */

// Item de NFe com margem calculada
export interface NFeItem {
  id: string;
  product_code: string;
  product_description: string;
  ncm: string;
  quantity: number;
  cost_price: number;
  sale_price: number;
  total_value: number;
  margin: number;
}

// Dados brutos do banco de dados
export interface NFeItemRaw {
  id: string;
  product_code: string;
  product_description: string;
  ncm: string;
  quantity: number;
  unit_value: number;
  total_value: number;
  nfe_documents: {
    company_id: string;
    cfop: string;
  };
}

// Agrupamento de itens por NCM
export interface NCMGroup {
  items: NFeItemRaw[];
  costItems: NFeItemRaw[];
  saleItems: NFeItemRaw[];
}

// Classificação CFOP
export interface CFOPClassification {
  cfop: string;
  classification: string;
}

// Status de margem
export type MarginStatus = 'excellent' | 'good' | 'poor';
