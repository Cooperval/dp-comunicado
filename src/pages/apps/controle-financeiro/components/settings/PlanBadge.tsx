import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function getPlanBadge(plan: string, status: string, trialEndsAt?: string | null) {
  if (plan === 'free') {
    return (
      <Badge variant="secondary" className="bg-gray-500">
        Free
      </Badge>
    );
  }

  if (plan === 'trial') {
    if (status === 'active' && trialEndsAt) {
      const daysRemaining = Math.ceil(
        (new Date(trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return (
        <Badge variant="default" className="bg-blue-500">
          Trial ({daysRemaining} dias)
        </Badge>
      );
    } else {
      return <Badge variant="destructive">Trial Expirado</Badge>;
    }
  }

  if (plan === 'pro') {
    return (
      <Badge variant="default" className="bg-green-500">
        {status === 'active' ? 'Pro' : 'Pro (Inativo)'}
      </Badge>
    );
  }

  return null;
}

export interface StripeStatus {
  group_id: string;
  has_stripe_customer: boolean;
  has_active_subscription: boolean;
  subscription_status?: string;
  product_id?: string;
  subscription_end?: string;
  last_payment_date?: string;
}

export function getStripeBadge(status: StripeStatus | undefined) {
  if (!status) {
    return null;
  }

  if (status.has_active_subscription) {
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-700">
        ✓ Pagamento Ativo
      </Badge>
    );
  }

  if (status.subscription_status === 'past_due') {
    return (
      <Badge className="bg-yellow-500 hover:bg-yellow-600">
        ⚠ Pagamento Pendente
      </Badge>
    );
  }

  if (status.subscription_status === 'canceled') {
    return <Badge variant="destructive">Cancelado</Badge>;
  }

  if (status.has_stripe_customer) {
    return (
      <Badge variant="secondary" className="bg-gray-400">
        Sem Assinatura
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-muted-foreground">
      Sem Stripe
    </Badge>
  );
}

export function getStripeDetails(status: StripeStatus | undefined) {
  if (!status || !status.has_stripe_customer) {
    return null;
  }

  const details: string[] = [];

  if (status.subscription_end) {
    const endDate = format(new Date(status.subscription_end), "dd/MM/yyyy", { locale: ptBR });
    details.push(`Renova: ${endDate}`);
  }

  if (status.last_payment_date) {
    const paymentDate = format(new Date(status.last_payment_date), "dd/MM/yyyy", { locale: ptBR });
    details.push(`Último pagamento: ${paymentDate}`);
  }

  return details.length > 0 ? details.join(' | ') : null;
}
