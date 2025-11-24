import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export type MotivoOcorrencia = {
  id: number;
  tipoId: number;
  nome: string;
  ativo: boolean;
};

export const useMotivoOcorrencias = ({ token }: { token: string | null }) => {
  const [motivos, setMotivos] = useState<MotivoOcorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

  useEffect(() => {
    if (!token || !urlApi) {
      setLoading(false);
      return;
    }

    const carregar = async () => {
      try {
        const res = await fetch(`${urlApi}/controle-de-ponto/lista-motivo-ocorrencias`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Erro ao carregar motivos");

        const data = await res.json();
        const mapped = data.map((m: any) => ({
          id: m.ID_MOTIVO,
          tipoId: Number(m.ID_TIPO),
          nome: m.NOME_MOTIVO_OCORRENCIA,
          ativo: m.SITUACAO === "A",
        }));

        setMotivos(mapped);
      } catch (err: any) {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [token, toast, urlApi]);

  return { motivos, loading };
};