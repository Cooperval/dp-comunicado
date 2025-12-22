export const MONTH_NAMES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez"
];

export const VIEW_TYPE_OPTIONS = [
  { value: 'month' as const, label: '📅 Meses', icon: '📅' },
  { value: 'quarter' as const, label: '📊 Trimestre', icon: '📊' },
  { value: 'semester' as const, label: '📈 Semestre', icon: '📈' },
  { value: 'year' as const, label: '🗓️ Ano Total', icon: '🗓️ ' }
];

export type ViewType = 'month' | 'quarter' | 'semester' | 'year';

export const QUARTER_LABELS = ["1º Trimestre", "2º Trimestre", "3º Trimestre", "4º Trimestre"];
export const SEMESTER_LABELS = ["1º Semestre", "2º Semestre"];
export const YEAR_LABEL = ["Ano Total"];

export type ClassificationFilter = 'all' | 'fixo' | 'variavel';

export const CLASSIFICATION_FILTER_OPTIONS = [
  { value: 'all' as const, label: '📊 Todos' },
  { value: 'fixo' as const, label: '🔒 Fixo' },
  { value: 'variavel' as const, label: '📈 Variável' }
];
