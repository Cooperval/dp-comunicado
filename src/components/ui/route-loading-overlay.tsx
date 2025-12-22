import { TrendingUp } from "lucide-react";
import { useRouteLoading } from "@/hooks/useRouteLoading";

export function RouteLoadingOverlay() {
  const { loading, progress } = useRouteLoading();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col items-center gap-6 relative">
        {/* Gradiente circular animado */}
        {/* <div className="absolute inset-0 -m-12">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-primary/20 via-success/20 to-primary/20 animate-spin" 
               style={{ animationDuration: '2s' }} />
        </div> */}

        {/* Logo com pulso */}
        <div className="relative z-10 flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20">
          <TrendingUp className="h-10 w-10 text-primary animate-pulse" />
        </div>

        {/* Texto Meu Gestor */}
        <div className="flex flex-col items-center gap-3 animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <h2 className="text-2xl font-bold text-blue-500">Meu Gestor</h2>

          {/* Barra de progresso sem gradient */}
          <div className="w-64 h-1.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              {/* Remover shimmer também, se quiser */}
              {/* <div className="absolute inset-0 bg-blue-400/40 animate-shimmer" /> */}
            </div>
          </div>

          <p className="text-sm text-muted-foreground animate-pulse">Carregando dados financeiros...</p>
        </div>
      </div>
    </div>
  );
}
