import { Card, CardContent } from "@/components/ui/card";

export function TrialExpiredBanner() {
  return (
    <Card className="border-destructive bg-destructive/10">
      <CardContent className="pt-6">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-card-foreground">Seu período de teste expirou</p>
          <p className="text-sm text-muted-foreground">
            Assine o plano Pro para continuar utilizando todos os recursos do sistema
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
