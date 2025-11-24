import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, DollarSign } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="text-center space-y-8 max-w-2xl mx-auto px-4">
        <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-6">
          <DollarSign className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Fluxo de Caixa
        </h1>
        <p className="text-xl text-muted-foreground">
          Sua solução completa para gestão financeira. Controle saldos bancários, 
          movimentações e tenha insights detalhados sobre suas finanças.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/dashboard">
            <Button size="lg" className="gap-2">
              Começar Agora
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
