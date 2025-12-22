export interface Invoice {
  date: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed";
  invoice_pdf?: string;
}

export interface SubscriptionDetails {
  subscription_id: string;
  amount: number;
  currency: string;
  interval: "month" | "year";
  current_period_start: string;
  current_period_end: string;
  payment_method: string;
  invoices: Invoice[];
}

export type SubscriptionStatus = "active" | "inactive" | "payment_failed" | "trial";
