export const PLAN_TYPES = {
  TRIAL: "trial",
  PRO_MENSAL: "pro_mensal",
} as const;

export type PlanType = (typeof PLAN_TYPES)[keyof typeof PLAN_TYPES];

export const STRIPE_PRODUCTS = {
  PRO_MENSAL: {
    productId: "prod_Tb8dTUJTXEOca7",
    priceId: "price_1SdwLsBwo5hY8xyD9r6ErPNQ",
  },
} as const;

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface PlanOption {
  name: string;
  description: string;
  displayPrice: string;
  totalValue?: number;
  installments?: string;
  popular?: boolean;
  features: PlanFeature[];
  ctaText: string;
  planType?: "pro_mensal";
  stripeProductId?: string;
}

export const PLAN_FEATURES = {
  TRIAL: [
    { text: "14 dias gratuitos", included: true },
    { text: "Importação limitada de NFes", included: true },
    { text: "Até 1 usuário", included: true },
    { text: "Relatórios básicos", included: true },
    { text: "Importação limitada de OFX", included: true },
    { text: "Classificação automática", included: true },
    { text: "Análise de margens", included: true },
    { text: "Suporte por email", included: false },
  ],
  PRO_MENSAL: [
    { text: "Pagamento recorrente", included: true },
    { text: "Importação ilimitada de NFes", included: true },
    { text: "Importação ilimitada de OFX", included: true },
    { text: "Usuários ilimitados", included: true },
    { text: "Relatórios avançados", included: true },
    { text: "Classificação automática", included: true },
    { text: "Análise de margens", included: true },
    { text: "Suporte prioritário", included: true },
  ],
};

export const PLANS: PlanOption[] = [
  {
    name: "Teste",
    description: "14 dias de teste gratuito",
    displayPrice: "Grátis",
    features: PLAN_FEATURES.TRIAL,
    ctaText: "Iniciar Teste Grátis",
  },
  {
    name: "Pro",
    description: "Pagamento mensal",
    displayPrice: "369,99",
    installments: "18x de R$ 369,99",
    totalValue: 6659.82,
    popular: true,
    planType: "pro_mensal",
    stripeProductId: STRIPE_PRODUCTS.PRO_MENSAL.productId,
    features: PLAN_FEATURES.PRO_MENSAL,
    ctaText: "Assinar Plano",
  },
];

export const URL_PARAMS = {
  SUCCESS: "success",
  CANCELED: "canceled",
} as const;
