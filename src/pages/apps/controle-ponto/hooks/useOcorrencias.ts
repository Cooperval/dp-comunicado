// hooks/useOcorrencias.ts
import { useState, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";

interface Ocorrencia {
  id: number;
  codigo: string;
  colaborador: string;
  setor: string;
  nome_tipo: string;
  nome_motivo: string;
  data: string;
  horario: string;
  data_fim: string;
  horario_fim: string;
  status: "PE" | "AP" | "RE" | "AN";
  registradoPor: string;
  observacoes?: string;
  respostaOcorrencia?: string;
}

interface Filtros {
  dataInicio: string;
  dataFim: string;
  codigo?: string;
  status?: string;
  tipo?: number;
}

export const useOcorrencias = ({
  token,
  user,
  departamentosPermitidos,
  tipoAcesso,
}: {
  token: string | null;
  user: any;
  departamentosPermitidos: any[];
  tipoAcesso: string;
}) => {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOcorrencia, setSelectedOcorrencia] = useState<Ocorrencia | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

  const fetchOcorrencias = useCallback(
    async ({ dataInicio, dataFim, codigo, status, tipo }: Filtros) => {
      if (!token || !urlApi) return;

      setLoading(true);
      try {
        const payload: any = { data_inicio: dataInicio, data_fim: dataFim };

        const isAdminOuGestor = ["A", "G"].includes(tipoAcesso);

        if (!isAdminOuGestor) {
          const codigosDeptos = departamentosPermitidos
            .map((d) => d.COD_DEPARTAMENTO)
            .filter(Boolean);

          if (codigosDeptos.length === 0) {
            toast({
              title: "Sem permissão",
              description: "Nenhum departamento vinculado.",
              variant: "destructive",
            });
            setOcorrencias([]);
            return;
          }
          payload.departamentos = codigosDeptos;
        }

        if (codigo?.trim()) payload.codigo = Number(codigo.trim());
        if (status && status !== "all") payload.status = status;
        if (tipo) payload.tipo = tipo;

        const response = await fetch(`${urlApi}/controle-de-ponto/lista-ocorrencias`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Nenhuma ocorrência encontrada");

        const data = await response.json();

        const mapped: Ocorrencia[] = data.map((item: any) => {
          // Data início - sempre vem preenchida
          const [day, month, year] = item.DATA_FORMATADA.split("/");

          // Data fim - pode vir null!
          let dataFimFormatada = "";
          let horarioFim = "";

          if (item.DATA_FORMATADA_FIM && item.DATA_FORMATADA_FIM.trim() !== "") {
            const [day_f, month_f, year_f] = item.DATA_FORMATADA_FIM.split("/");
            dataFimFormatada = `${year_f}-${month_f.padStart(2, "0")}-${day_f.padStart(2, "0")}`;
            horarioFim = item.HORARIO_FIM || ""; // HORARIO_FIM pode ser null também
          }
          // Se não tem data_fim, deixamos como string vazia ou "0000-00-00" se preferir

          return {
            id: item.ID_OCORRENCIA,
            codigo: item.COD_FUNCIONARIO,
            colaborador: item.DES_FUNC,
            setor: item.DESC_DEPARTAMENTO || "Sem setor",
            nome_tipo: item.NOME_TIPO,
            nome_motivo: item.NOME_MOTIVO,
            data: `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`,
            horario: item.HORARIO || "",
            data_fim: dataFimFormatada,
            horario_fim: horarioFim,
            status: item.LAST_SITUACAO_CODE,
            registradoPor: item.DES_FUNC_REGISTROU || "Sistema",
            observacoes: item.OBSERVACOES || undefined,
            respostaOcorrencia: item.RESPOSTA_OCORRENCIA || undefined,
          };
        });

        setOcorrencias(mapped);
      } catch (err: any) {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [token, urlApi, departamentosPermitidos, tipoAcesso, toast]
  );

  return {
    ocorrencias,
    loading,
    fetchOcorrencias,
    selectedOcorrencia,
    setSelectedOcorrencia,
    isModalOpen,
    setIsModalOpen,
  };
};