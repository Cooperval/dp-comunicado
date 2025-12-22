export interface Transaction {
  id: string;
  transaction_date: string;
  amount: number;
  description: string;
  transaction_type: 'debit' | 'credit';
  memo?: string;
  fitid?: string;
  banks: BankInfo;
}

export interface BankInfo {
  bank_name: string;
  account_number: string;
  bank_code: string;
}

export interface Bank {
  id: string;
  bank_name: string;
  account_number: string;
  bank_code: string;
}

export interface TransactionSummary {
  totalCredit: number;
  totalDebit: number;
  totalCount: number;
}

export interface TransactionFilters {
  searchTerm: string;
  selectedBank: string;
  selectedType: string;
  selectedYear: number;
  selectedMonths: number[];
}
