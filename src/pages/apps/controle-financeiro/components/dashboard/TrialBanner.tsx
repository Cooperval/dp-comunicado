import { AlertCircle, Crown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TrialBannerProps {
  trialEndsAt: string;
  onUpgradeClick: () => void;
}

export const TrialBanner = ({ trialEndsAt, onUpgradeClick }: TrialBannerProps) => {
  const daysRemaining = Math.ceil(
    (new Date(trialEndsAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysRemaining < 0) return null;

  const isUrgent = daysRemaining <= 3;

  return (
    <Alert 
      className={`mb-6 ${isUrgent ? 'border-destructive bg-destructive/10' : 'border-primary bg-primary/10'}`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className={`h-5 w-5 ${isUrgent ? 'text-destructive' : 'text-primary'}`} />
          <div>
            <AlertDescription className="font-medium">
              Período de teste: {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
            </AlertDescription>
            <p className="text-sm text-muted-foreground mt-1">
              Aproveite todos os recursos até {new Date(trialEndsAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>
        <Button 
          onClick={onUpgradeClick}
          size="sm"
          className="gap-2"
        >
          <Crown className="h-4 w-4" />
          Fazer Upgrade
        </Button>
      </div>
    </Alert>
  );
};
