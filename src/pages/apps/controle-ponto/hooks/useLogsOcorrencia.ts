// hooks/useLogsOcorrencia.ts
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface LogOcorrencia {
  ID_SITUACAO: number;
  SITUACAO: string;
  DESC_SITUACAO: string;
  DATA_FORMATADA: string;
  DES_FUNC_ALTEROU: string;
  DESC_DEPARTAMENTO_ALTEROU?: string;
}

export const useLogsOcorrencia = ({
  token,
  selectedOcorrencia,
}: {
  token: string | null;
  selectedOcorrencia: any;
}) => {
  const [logs, setLogs] = useState<LogOcorrencia[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

  useEffect(() => {
    if (!selectedOcorrencia?.id || !token) return;

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${urlApi}/controle-de-ponto/lista-logs-ocorrencia`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id_ocorrencia: selectedOcorrencia.id }),
        });
        if (!res.ok) throw new Error("Erro ao carregar logs");
        setLogs(await res.json());
      } catch (err: any) {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [selectedOcorrencia?.id, token, toast, urlApi]);

  return { logs, loading };
};