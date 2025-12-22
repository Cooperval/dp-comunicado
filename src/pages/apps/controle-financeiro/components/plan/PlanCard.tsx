import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanOption } from "@/pages/apps/controle-financeiro/constants/planConstants";

interface PlanCardProps {
  plan: PlanOption;
  isCurrentPlan: boolean;
  isTrialActive: boolean;
  onSelect: () => void;
  disabled: boolean;
}

export function PlanCard({ plan, isCurrentPlan, isTrialActive, onSelect, disabled }: PlanCardProps) {
  const getButtonText = () => {
    if (plan.name === "Teste" && isTrialActive) return "Plano Atual";
    if (isCurrentPlan) return "Plano Atual";
    if (disabled) return "Processando...";
    return plan.ctaText;
  };

  const isButtonDisabled = () => {
    if (plan.name === "Teste" && isTrialActive) return true;
    if (plan.planType && isCurrentPlan) return true;
    return disabled;
  };

  return (
    <Card
      className={cn(
        "relative transition-all hover:shadow-elevated",
        plan.popular && "border-primary shadow-financial"
      )}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground shadow-md">
            <Sparkles className="w-3 h-3 mr-1" />
            Mais Popular
          </Badge>
        </div>
      )}

      {isCurrentPlan && (
        <Badge className="absolute top-4 right-4 bg-success">Plano Atual</Badge>
      )}

      <CardHeader className="text-center pb-8 pt-6">
        <CardTitle className="text-2xl text-card-foreground">{plan.name}</CardTitle>
        <CardDescription className="text-base pt-4 min-h-[60px]">{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <Button
          className="w-full"
          variant={plan.popular ? "default" : "outline"}
          size="lg"
          onClick={onSelect}
          disabled={isButtonDisabled()}
        >
          {getButtonText()}
        </Button>

        <div className="space-y-3 pt-2">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <Check
                className={cn(
                  "w-5 h-5 flex-shrink-0 mt-0.5",
                  feature.included ? "text-success" : "text-muted-foreground/30"
                )}
              />
              <span
                className={cn(
                  "text-sm",
                  feature.included ? "text-card-foreground" : "text-muted-foreground line-through"
                )}
              >
                {feature.text}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
