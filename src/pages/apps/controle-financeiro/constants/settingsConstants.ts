export const SEGMENTS = [
  { value: 'retail', label: 'Varejo' },
  { value: 'services', label: 'Serviços' },
  { value: 'technology', label: 'Tecnologia' },
  { value: 'manufacturing', label: 'Indústria' },
  { value: 'healthcare', label: 'Saúde' },
  { value: 'education', label: 'Educação' },
  { value: 'food', label: 'Alimentação' },
  { value: 'other', label: 'Outros' },
] as const;

export const ROLES = [
  { 
    value: 'operador', 
    label: 'Operador', 
    className: 'bg-muted text-muted-foreground' 
  },
  { 
    value: 'gestor', 
    label: 'Gestor', 
    className: 'bg-secondary text-secondary-foreground' 
  },
  { 
    value: 'representante', 
    label: 'Representante', 
    className: 'bg-blue-500 text-white' 
  },
  { 
    value: 'admin', 
    label: 'Administrador', 
    className: 'bg-primary text-primary-foreground' 
  },
] as const;

export const PLANS = [
  { value: 'free', label: 'Free (Gratuito)' },
  { value: 'trial', label: 'Trial (14 dias)' },
  { value: 'pro', label: 'Pro (Pago)' },
] as const;

export const SUPABASE_ERRORS = {
  PGRST116: 'Row not found',
} as const;
