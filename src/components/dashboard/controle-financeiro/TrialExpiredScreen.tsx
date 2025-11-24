import { AlertTriangle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface TrialExpiredScreenProps {
  onContactClick: () => void;
  userRole?: 'operador' | 'gestor' | 'representante' | 'admin' | 'owner' | 'manager' | 'accountant';
}

export const TrialExpiredScreen = ({ onContactClick, userRole }: TrialExpiredScreenProps) => {
  const canUpgrade = userRole === 'representante' || userRole === 'admin';
  
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-8">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Período de teste expirado</CardTitle>
          <CardDescription className="text-base mt-2">
            {canUpgrade 
              ? "Seu período de teste chegou ao fim. Para continuar utilizando o sistema, faça upgrade para um plano pago."
              : "Seu período de teste chegou ao fim. Entre em contato com o representante ou administrador da empresa para renovar o acesso."
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Benefícios do Plano Pro
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>✓ Acesso ilimitado a todos os recursos</li>
              <li>✓ Suporte prioritário</li>
              <li>✓ Relatórios avançados</li>
              <li>✓ Análises em tempo real</li>
            </ul>
          </div>
          
          {canUpgrade && (
            <Button 
              onClick={onContactClick}
              className="w-full gap-2"
              size="lg"
            >
              <Crown className="h-5 w-5" />
              Fazer Upgrade Agora
            </Button>
          )}
          
          <p className="text-xs text-center text-muted-foreground">
            {canUpgrade 
              ? "Você pode gerenciar os planos e assinaturas da sua empresa"
              : "Solicite ao representante ou administrador da empresa a renovação da assinatura"
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
