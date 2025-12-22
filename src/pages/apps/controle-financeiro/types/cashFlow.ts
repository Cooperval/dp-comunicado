/**
 * Cash Flow Types
 * Tipos centralizados para o módulo de fluxo de caixa
 */

export interface CashFlowItem {
  date: string;
  description: string;
  amount: number;
  type: "historical" | "payable" | "receivable";
  status?: string;
  bank_id?: string;
  classification?: {
    group?: string;
    commitment?: string;
    commitmentType?: string;
  };
}

export interface BankInfo {
  id: string;
  bank_name: string;
  account_number: string;
}

export interface DailyCashFlow {
  day: number;
  date: string;
  opening: number;
  historicalIn: number;
  historicalOut: number;
  projectedIn: number;
  projectedOut: number;
  closing: number;
  items: CashFlowItem[];
}

export interface BankCashFlow {
  bank: BankInfo;
  days: DailyCashFlow[];
  totalOpening: number;
  totalHistoricalIn: number;
  totalHistoricalOut: number;
  totalProjectedIn: number;
  totalProjectedOut: number;
  totalClosing: number;
}

export interface MonthlyCashFlow {
  month: string;
  banks: BankCashFlow[];
  totalOpening: number;
  totalHistoricalIn: number;
  totalHistoricalOut: number;
  totalProjectedIn: number;
  totalProjectedOut: number;
  totalClosing: number;
}

export interface FutureEntry {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  entry_type: "payable" | "receivable";
  status: string;
  notes?: string;
  commitment_group_id?: string | null;
  commitment_id?: string | null;
  commitment_type_id?: string | null;
  commitment_groups?: { name: string } | null;
  commitments?: { name: string } | null;
  commitment_types?: { name: string } | null;
}

export interface CommitmentGroup {
  id: string;
  name: string;
  commitment_type_id?: string;
}

export interface Commitment {
  id: string;
  name: string;
  commitment_group_id: string;
  commitment_type_id?: string;
}

export interface CommitmentType {
  id: string;
  name: string;
}

export type CashFlowType = "entry" | "exit" | "receivable" | "payable";

export type DataKeyType = "historicalIn" | "historicalOut" | "projectedIn" | "projectedOut";
