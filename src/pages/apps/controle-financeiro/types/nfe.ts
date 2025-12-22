/**
 * Tipos para Notas Fiscais Eletrônicas (NFe)
 */

export interface NFeTax {
  id: string;
  tax_type: string;
  base_calculation: number;
  tax_rate: number;
  tax_value: number;
}

export interface NFeItem {
  id: string;
  product_code: string;
  product_description: string;
  ncm: string;
  quantity: number;
  unit_value: number;
  total_value: number;
  nfe_taxes: NFeTax[];
}

export interface NFeDuplicata {
  id: string;
  numero_parcela: string;
  data_vencimento: string;
  valor_parcela: number;
}

export interface NFeEmitter {
  cnpj: string;
  razao_social: string;
  municipio: string;
  uf: string;
}

export interface NFeRecipient {
  cnpj: string;
  razao_social: string;
  municipio: string;
  uf: string;
}

export interface NFeDocument {
  id: string;
  nfe_number: string;
  serie: string;
  emission_date: string;
  operation_nature: string;
  cfop: string | null;
  total_products_value: number;
  total_icms_value: number;
  total_pis_value: number;
  total_cofins_value: number;
  total_ipi_value: number;
  total_iss_value: number;
  total_nfe_value: number;
  fatura_numero: string | null;
  fatura_valor_original: number | null;
  fatura_valor_desconto: number | null;
  fatura_valor_liquido: number | null;
  created_at: string;
  nfe_emitters: NFeEmitter[];
  nfe_recipients: NFeRecipient[];
  nfe_items: NFeItem[];
  nfe_duplicatas: NFeDuplicata[];
}

export interface NFeUploadListItem {
  id: string;
  nfe_number: string;
  serie: string;
  emission_date: string;
  total_nfe_value: number;
  created_at: string;
  nfe_emitters: Array<{ razao_social: string }>;
}

export interface CFOPData {
  cfop: string;
  count: number;
  classification?: string;
}
