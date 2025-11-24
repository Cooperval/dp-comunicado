import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export type TipoOcorrencia = {
  id: number;
  nome: string;
  descricao: string | null;
  cor: string;
  ativo: boolean;
};

export const useTipoOcorrencias = ({ token }: { token: string | null }) => {
  const [tipos, setTipos] = useState<TipoOcorrencia[]>([]);
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
        const res = await fetch(`${urlApi}/controle-de-ponto/lista-tipo-ocorrencias`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Erro ao carregar tipos");

        const data = await res.json();
        const mapped = data.map((t: any) => ({
          id: t.ID_TIPO,
          nome: t.NOME_OCORRENCIA,
          descricao: t.DESC_OCORRENCIA || null,
          cor: t.COR || "#3b82f6",
          ativo: t.SITUACAO === "A",
        }));

        setTipos(mapped);
      } catch (err: any) {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [token, toast, urlApi]);

  return { tipos, loading };
};