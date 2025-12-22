/**
 * Cash Flow Constants
 * Constantes compartilhadas para o módulo de fluxo de caixa
 */

export const MONTH_BUTTONS = [
  { num: 1, label: "Jan" },
  { num: 2, label: "Fev" },
  { num: 3, label: "Mar" },
  { num: 4, label: "Abr" },
  { num: 5, label: "Mai" },
  { num: 6, label: "Jun" },
  { num: 7, label: "Jul" },
  { num: 8, label: "Ago" },
  { num: 9, label: "Set" },
  { num: 10, label: "Out" },
  { num: 11, label: "Nov" },
  { num: 12, label: "Dez" },
] as const;

export const ALL_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export const ENTRY_TYPE_CONFIG = {
  historical: { label: "Realizado", icon: "ArrowUpDown" },
  receivable: { label: "Receber", icon: "Receipt", color: "text-green-600" },
  payable: { label: "Pagar", icon: "CreditCard", color: "text-red-600" },
} as const;

export const FILTER_STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendente" },
  { value: "paid", label: "Pago" },
  { value: "received", label: "Recebido" },
  { value: "cancelled", label: "Cancelado" },
] as const;

export const FILTER_TYPE_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "receivable", label: "Receber" },
  { value: "payable", label: "Pagar" },
] as const;

export const DETAIL_MODAL_TYPE_CONFIG = {
  entry: { label: "Entradas", colorClass: "text-green-600" },
  exit: { label: "Saídas", colorClass: "text-red-600" },
  receivable: { label: "A Receber", colorClass: "text-green-500" },
  payable: { label: "A Pagar", colorClass: "text-red-500" },
} as const;
