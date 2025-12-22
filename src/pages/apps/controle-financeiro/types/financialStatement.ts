export interface IntegratedTransaction {
  id: string;
  company_id: string;
  aggregation_type: 'month' | 'quarter' | 'semester' | 'year';
  period_key: string;
  month_year: string;
  commitment_type_id: string | null;
  commitment_group_id: string | null;
  commitment_id: string | null;
  type_name: string;
  group_name: string;
  commitment_name: string;
  total_amount: number;
  transaction_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface DetailTransaction {
  id: string;
  description: string;
  memo: string | null;
  amount: number;
  transaction_date: string;
  transaction_type: 'credit' | 'debit';
}

export interface ClassificationStats {
  totalCount: number;
  classifiedCount: number;
  unclassifiedCount: number;
}

export type ValueColorClass = 'text-success' | 'text-destructive' | 'text-card-foreground/60';
