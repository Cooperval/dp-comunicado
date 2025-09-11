import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Calendar
} from "lucide-react";

const recentOccurrences = [
  {
    id: "1",
    colaborador: "Maria Silva",
    codigo: "001234",
    tipo: "Entrada/Saída",
    data: "2024-01-15",
    horario: "14:30",
    status: "pending" as const,
    motivo: "Consulta médica"
  },
  {
    id: "2", 
    colaborador: "João Santos",
    codigo: "001235",
    tipo: "Falta Justificada",
    data: "2024-01-15",
    horario: "08:00",
    status: "approved" as const,
    motivo: "Atestado médico"
  },
  {
    id: "3",
    colaborador: "Ana Costa",
    codigo: "001236", 
    tipo: "Banco de Horas",
    data: "2024-01-14",
    horario: "18:00",
    status: "urgent" as const,
    motivo: "Compensação pendente há 48h"
  }
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Visão geral das ocorrências do ponto eletrônico
          </p>
        </div>
        <Button className="bg-gradient-primary hover:bg-primary-hover">
          <FileText className="w-4 h-4 mr-2" />
          Nova Ocorrência
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Ocorrências Hoje"
          value="12"
          icon={Clock}
          trend={{ value: "+20% vs ontem", isPositive: true }}
          variant="default"
        />
        <MetricCard
          title="Pendentes Aprovação"
          value="8"
          icon={AlertTriangle}
          trend={{ value: "3 urgentes", isPositive: false }}
          variant="warning"
        />
        <MetricCard
          title="Aprovadas Hoje"
          value="5"
          icon={CheckCircle}
          trend={{ value: "+15%", isPositive: true }}
          variant="success"
        />
        <MetricCard
          title="Colaboradores Ativos"
          value="247"
          icon={Users}
          variant="default"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Ocorrências Recentes
              </h2>
              <Button variant="outline" size="sm">
                Ver Todas
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentOccurrences.map((occurrence) => (
                <div
                  key={occurrence.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-foreground">
                        {occurrence.colaborador}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({occurrence.codigo})
                      </span>
                      <StatusBadge variant={occurrence.status}>
                        {occurrence.status === "pending" && "Pendente"}
                        {occurrence.status === "approved" && "Aprovada"}
                        {occurrence.status === "urgent" && "Urgente"}
                      </StatusBadge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {occurrence.tipo}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {occurrence.data} às {occurrence.horario}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {occurrence.motivo}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Ações Rápidas
            </h3>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Registrar Ocorrência
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="w-4 h-4 mr-2" />
                Gerenciar Colaboradores
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Pendências Urgentes
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Alertas de Prazo
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    3 atestados vencidos
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Prazo de 48h ultrapassado
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/5 border border-warning/20">
                <Clock className="w-4 h-4 text-warning" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    5 pendências vencem hoje
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Requer ação imediata
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}