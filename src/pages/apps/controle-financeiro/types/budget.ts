export interface TransactionData {
  id: string;
  amount: number;
  transaction_date: string;
  transaction_type: string;
  description?: string;
  classification?: {
    commitment?: {
      id?: string;
      name: string;
      commitment_group?: {
        id?: string;
        name: string;
        commitment_type?: {
          id?: string;
          name: string;
        };
      };
      commitment_type?: {
        id?: string;
        name: string;
      };
    };
    commitment_group?: {
      id?: string;
      name: string;
      commitment_type?: {
        id?: string;
        name: string;
      };
    };
    commitment_type?: {
      id?: string;
      name: string;
    };
  };
}

export interface MonthlyDREData {
  month: string;
  [key: string]: string | number;
}

export interface DRELine {
  id: string;
  label: string;
  type: "commitment_type" | "commitment_group" | "commitment" | "unclassified";
  level: number;
  values: number[];
  budgetedValues: number[];
  expandable?: boolean;
  expanded?: boolean;
  parentId?: string;
  children?: DRELine[];
  itemId?: string;
}

export interface CommitmentGroupData {
  id: string;
  name: string;
  type: "revenue" | "cost" | "expense";
  values: number[];
  commitments: CommitmentData[];
}

export interface CommitmentData {
  id: string;
  name: string;
  values: number[];
}

export interface DREConfiguration {
  id: string;
  line_type: "revenue" | "cost" | "expense";
  commitment_group_id: string;
  commitment_id: string | null;
}

export interface CommitmentGroup {
  id: string;
  name: string;
  color: string;
  company_id: string;
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
  company_id: string;
}

export interface Configs {
  groups: CommitmentGroup[];
  commitments: Commitment[];
  commitmentTypes: CommitmentType[];
  dreConfigurations: DREConfiguration[];
}

export interface BudgetForecast {
  id: string;
  company_id: string;
  month_year: string;
  budgeted_amount: number;
  commitment_type_id: string | null;
  commitment_group_id: string | null;
  commitment_id: string | null;
  historical_average_12m: number;
  is_locked: boolean;
  locked_at: string | null;
  calculation_date: string;
  created_at: string;
  updated_at: string;
}

export type LineType = "revenue" | "cost" | "expense";
