// hooks/useRespostasOcorrencia.ts
import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface RespostaOcorrencia {
    id: number;
    desc_resposta_ocorrencia: string;
    situacao: "PE" | "AP" | "RE" | "AN";
}

export const useRespostasOcorrencia = ({ token }: { token: string | null }) => {
    const [respostas, setRespostas] = useState<RespostaOcorrencia[]>([]);
    const [loading, setLoading] = useState(false);
    const [respostaSelecionada, setRespostaSelecionada] = useState<number | undefined>();
    const { toast } = useToast();
    const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

    const fetchRespostas = async () => {
        if (!token || !urlApi) return;
        setLoading(true);
        try {
            const res = await fetch(`${urlApi}/controle-de-ponto/lista-resposta-ocorrencias`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Erro ao carregar respostas");
            const data = await res.json();
            const array = Array.isArray(data) ? data : data.data || [];
            setRespostas(
                array.map((r: any) => ({
                    id: r.ID_RESPOSTA,
                    desc_resposta_ocorrencia: r.DESC_RESPOSTA_OCORRENCIA,
                    situacao: r.SITUACAO,
                }))
            );
        } catch (err: any) {
            toast({ title: "Erro", description: err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRespostas();
    }, [token]);

    return { respostas, loading, respostaSelecionada, setRespostaSelecionada };
};