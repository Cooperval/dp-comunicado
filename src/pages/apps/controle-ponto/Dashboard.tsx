import { MetricCard } from "@/pages/apps/controle-ponto/components/MetricCard";
import { useState, useEffect } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Clock,
  X,
  AlertTriangle,
  CheckCircle,
  FileText,
  Calendar,
  List,
  Settings,
  LineChart
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";



interface TotaisOcorrencias {
  total_ocorrencias: number;
  total_aprovadas: number;
  total_pendente: number;
  total_rejeitada: number;
}


export default function Dashboard() {
  const { token } = useAuth();
  const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");
  if (!urlApi) throw new Error("VITE_API_URL não configurada");
  const navigate = useNavigate();



  const [totais, setTotais] = useState<TotaisOcorrencias | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const fetchTotaisOcorrencias = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!token) throw new Error("Token de autenticação não encontrado.");

      const response = await fetch(`${urlApi}/controle-de-ponto/lista-numero-ocorrencias`, {
        method: "GET", // ou GET, conforme seu backend
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // body: JSON.stringify({}) // opcional, se precisar de filtros no futuro
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || errorData.error || `Erro: ${response.status}`);
      }

      const data: TotaisOcorrencias = await response.json();
      setTotais(data);
    } catch (err: any) {
      setError(err.message);
      toast({ title: "Erro ao carregar totais", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTotaisOcorrencias();
  }, [token]);




  const [ocorrenciasRecentes, setOcorrenciasRecentes] = useState<any[]>([]);
  const [pendenciasHoje, setPendenciasHoje] = useState(0);

  const fetchOcorrenciasRecentes = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!token) throw new Error("Token de autenticação não encontrado.");

      const hojeISO = new Date().toISOString().split("T")[0]; // "2025-11-11"

      const payload = {
        data_inicio: "2000-01-01",
        data_fim: hojeISO,
      };


      const response = await fetch(`${urlApi}/controle-de-ponto/lista-ocorrencias`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro: ${response.status}`);
      }

      const data = await response.json();

      // === Mapeia todas as ocorrências ===
      const todasMapped = data.map((item: any) => {
        // === DATA INÍCIO (sempre existe) ===
        const [day, month, year] = item.DATA_FORMATADA.split("/");
        const dataISO = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

        // === DATA FIM (pode ser null ou string vazia) ===
        let dataFimISO = "";
        let horarioFim = "";

        if (item.DATA_FORMATADA_FIM && item.DATA_FORMATADA_FIM.trim() !== "") {
          const [dayF, monthF, yearF] = item.DATA_FORMATADA_FIM.split("/");
          dataFimISO = `${yearF}-${monthF.padStart(2, "0")}-${dayF.padStart(2, "0")}`;
          horarioFim = item.HORARIO_FIM || ""; // pode ser null também
        }
        // Se não tiver data_fim → deixa vazio (você decide depois como exibir)

        return {
          id: item.ID_OCORRENCIA,
          colaborador: item.DES_FUNC || "Não informado",
          codigo: item.COD_FUNCIONARIO?.toString().padStart(6, "0") || "000000",
          tipo: item.NOME_TIPO || "Não definido",
          motivo: item.NOME_MOTIVO || "Sem motivo",

          // Campos novos
          data: dataISO,
          data_fim: dataFimISO,           // "2025-03-15" ou "" se não existir
          horario: item.HORARIO || "--:--",
          horario_fim: horarioFim || "--:--", // ou "" se preferir vazio

          status: item.LAST_SITUACAO_CODE || "PE",
        };
      });

      // === 1. Pendências de HOJE ===
      const pendencias = todasMapped.filter(o => o.status === "PE" && o.data === hojeISO);

      setPendenciasHoje(pendencias.length);

      // === 3. Recentes (5 mais novas) ===
      const recentes = todasMapped
        .sort((a, b) => {
          const dateA = new Date(`${a.data} ${a.horario}`);
          const dateB = new Date(`${b.data} ${b.horario}`);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);

      setOcorrenciasRecentes(recentes);

    } catch (err: any) {
      setError(err.message);
      toast({ title: "Erro ao carregar dados", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchOcorrenciasRecentes();
  }, [token]);



  const isAtrasadaAlerta = (data: string): boolean => {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    ontem.setHours(0, 0, 0, 0);

    const dataOcorrencia = new Date(data);
    dataOcorrencia.setHours(0, 0, 0, 0);

    return dataOcorrencia < ontem;
  };


  const formatarDataLocal = (isoString: string) => {
    const [ano, mes, dia] = isoString.split("-");
    const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
    return data.toLocaleDateString("pt-BR");
  };

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
      </div>


      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total de Ocorrências"
          value={loading ? "..." : totais?.total_ocorrencias?.toString() || "0"}
          icon={FileText}
          trend={{ value: "Atualizado agora", isPositive: true }}
          variant="default"
        />
        <MetricCard
          title="Aprovadas"
          value={loading ? "..." : totais?.total_aprovadas?.toString() || "0"}
          icon={CheckCircle}
          trend={{ value: "Finalizadas", isPositive: true }}
          variant="success"
        />
        <MetricCard
          title="Pendentes"
          value={loading ? "..." : totais?.total_pendente?.toString() || "0"}
          icon={AlertTriangle}
          trend={{ value: "Aguardando aprovação", isPositive: false }}
          variant="warning"
        />
        <MetricCard
          title="Rejeitadas"
          value={loading ? "..." : `${totais?.total_rejeitada || 0}`}
          icon={X}
          trend={{ value: "Não aprovadas", isPositive: false }}
          variant="danger"
        />

      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1: Ocorrências Recentes */}
        <div className="lg:col-span-2">
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Ocorrências Recentes
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/apps/controle-ponto/ocorrencias')}
              >
                Ver Todas
              </Button>
            </div>

            <div className="space-y-4">
              {ocorrenciasRecentes.length > 0 ? (
                ocorrenciasRecentes.map((occurrence) => (
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
                        <StatusBadge
                          variant={
                            occurrence.status === "PE" ? "pending" :
                              occurrence.status === "AP" ? "approved" :

                                occurrence.status === "RE" ? "rejected" : "pending"
                          }
                        >
                          {occurrence.status === "PE" && "Pendente"}
                          {occurrence.status === "AP" && "Aprovada"}

                          {occurrence.status === "RE" && "Rejeitada"}
                        </StatusBadge>

                      </div>
                      <div className="flex flex-col gap-2 text-sm">
                        {/* Linha 1: Tipo + Data Início (direita) */}
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {occurrence.tipo}
                          </span>

                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatarDataLocal(occurrence.data)} • {occurrence.horario || "--:--"}
                          </span>
                        </div>

                        {/* Linha 2: Motivo + Data Fim (direita) */}
                        <div className="flex items-center justify-between">
                          <p className="text-muted-foreground italic">
                            {occurrence.motivo}
                          </p>

                          {/* Só mostra Data Fim se existir */}
                          {occurrence.data_fim ? (
                            <span className="flex items-center gap-1 font-medium text-foreground">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatarDataLocal(occurrence.data_fim)} • {occurrence.horario_fim || "--:--"}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/70">— sem saída</span>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma ocorrência recente.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Coluna 2: Ações Rápidas + Alertas */}
        <div className="space-y-6">
          {/* Ações Rápidas */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Ações Rápidas
            </h3>
            <div className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate('/apps/controle-ponto/nova-ocorrencia')}
              >
                <FileText className="w-4 h-4 mr-2" />
                Registrar Ocorrência
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate('/apps/controle-ponto/ocorrencias')}
              >
                <List className="w-4 h-4 mr-2" />
                Ver Ocorrências
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => navigate('/apps/controle-ponto/configuracoes')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Button>
            </div>
          </Card>

          {/* Alertas de Prazo */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Alertas de Prazo
            </h3>
            <div className="space-y-3">

              {/* Pendências de Hoje */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <Clock className="w-4 h-4 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {pendenciasHoje} pendência{pendenciasHoje !== 1 ? "s" : ""} vence{pendenciasHoje !== 1 ? "m" : ""} hoje
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pendenciasHoje > 0 ? "Requer ação imediata" : "Tudo em dia"}
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