// src/hooks/use-fc-detalhes.ts
import { useState, useRef, useCallback } from "react";
import { useAuth } from '@/contexts/AuthContext';

export type DetalheItem = {
  COD_AGENCIA: number;
  COD_BANCO: number;
  COD_CONTABANCARIA: number;
  COD_FORNECEDOR?: number | null;
  COD_GRUPOEMPRESA: number;
  COD_OPERACAOBAIXA: number;
  COD_TIPOCONTA: number;
  COD_TIPOMOVIMENTO: number;

  DATAMOVIMENTO: string; // ISO date string

  DESCRICAO: string;
  DESC_BANCO: string;
  DESC_OPERACAOBAIXA: string;
  DESC_TIPOCONTA: string;
  DESC_TIPOMOVIMENTO: string;

  DOCUMENTO?: number | string;
  NUM_LANCAMENTOBANCARIO?: number | string;

  OPERACAO: "C" | "D";

  VALOR: number;
  VALOR_FINAL: number;
};

type FetchParams = {
  date: string; // data_iso no formato que seu backend espera (ex: '2025-12-01')
  type: string; // um dos: contasreceber|contaspagar|pendreceber|pendpagar|laprevreceber|laprevpagar
  codGrupoEmpresa?: number;
  codEmpresa?: number;
  codFilial?: number;
  codTipoConta?: string;

};

export function useFluxoCaixaDetalhes() {
  const { token } = useAuth();
  const [data, setData] = useState<DetalheItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeReq = useRef(0);

  /// dentro do seu hook useFluxoCaixaDetalhes (substitua apenas fetchDetalhes)
  const mapTypeToRoute = (t: string) => {
    // configure aqui o que for necessário para o seu backend
    // route: parte final da URL após /fluxo-caixa/
    // extraQuery: função que recebe (qs: URLSearchParams, params) e adiciona query params específicos
    const map: Record<string, { route: string; extraQuery?: (qs: URLSearchParams, p: FetchParams) => void }> = {
      // Movimentações: quando type é contasreceber ou contaspagar -> /movimentacoes
      contasreceber: {
        route: "movimentacoes",
        extraQuery: (qs, p) => {
          // backend quer dataInicio/dataFim iguais ao dia clicado
          if (p.date) {
            qs.append("dataInicio", p.date);
            qs.append("dataFim", p.date);
          }
          qs.append("tipo", "3");
          qs.append("movType", "receber");
        },
      },
      contaspagar: {
        route: "movimentacoes",
        extraQuery: (qs, p) => {
          if (p.date) {
            qs.append("dataInicio", p.date);
            qs.append("dataFim", p.date);
          }
          qs.append("tipo", "1");
          qs.append("movType", "pagar");
        },
      },

      // Pendências: pendreceber / pendpagar -> /pendencias (exemplo)
      pendreceber: {
        route: "pendencias",
        extraQuery: (qs, p) => {
          if (p.date) {
            qs.append("dataInicio", p.date);
            qs.append("dataFim", p.date);
          }
          qs.append("tipo", "R");
          qs.append("pendType", "receber");
        },
      },
      pendpagar: {
        route: "pendencias",
        extraQuery: (qs, p) => {
          if (p.date) {
            qs.append("dataInicio", p.date);
            qs.append("dataFim", p.date);
          }
          qs.append("tipo", "P");
          qs.append("pendType", "pagar");
        },
      },

      // Lançamentos Futuros: laprevreceber / laprevpagar -> /lancamentos-futuros (exemplo)
      laprevreceber: {
        route: "lancamento",
        extraQuery: (qs, p) => {
          if (p.date) {
            qs.append("dataInicio", p.date);
            qs.append("dataFim", p.date);
          }
          qs.append("tipo", "R");
          qs.append("prevType", "receber");
        },
      },
      laprevpagar: {
        route: "lancamento",
        extraQuery: (qs, p) => {
          if (p.date) {
            qs.append("dataInicio", p.date);
            qs.append("dataFim", p.date);
          }
          qs.append("tipo", "P");
          qs.append("prevType", "pagar");
        },
      },
    };

    return map[t] ?? { route: "detalhes", extraQuery: undefined }; // fallback
  };

  const fetchDetalhes = useCallback(async (params: FetchParams) => {
    const { date, type, codGrupoEmpresa, codEmpresa, codFilial, codTipoConta } = params;
    const reqId = ++activeReq.current;
    try {
      setLoading(true);
      setError(null);

      const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      if (!urlApi) throw new Error("VITE_API_URL não configurada");

      const mapping = mapTypeToRoute(type);
      const qs = new URLSearchParams();

      // Sempre envie os códigos do GEF quando existirem
      if (codGrupoEmpresa) qs.append("codGrupoEmpresa", String(codGrupoEmpresa));
      if (codEmpresa) qs.append("codEmpresa", String(codEmpresa));
      if (codFilial) qs.append("codFilial", String(codFilial));

      if (codTipoConta && codTipoConta !== "all") {
        qs.append("codTipoConta", codTipoConta);
      }
      // Use a função extraQuery da configuração para adicionar parâmetros específicos de cada rota
      if (typeof mapping.extraQuery === "function") {
        mapping.extraQuery(qs, params);
      } else {
        // fallback genérico: envia date como data (se existir)
        if (date) qs.append("date", date);
      }

      const url = `${urlApi}/fluxo-caixa/${mapping.route}` + (qs.toString() ? `?${qs.toString()}` : "");

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();

      const items: DetalheItem[] = Array.isArray(json)
        ? json.map((r: any) => ({
          id: r.ID ?? r.id,
          descricao: r.DESCRICAO ?? r.descricao,
          categoria: r.CATEGORIA ?? r.categoria,
          valor: Number(r.VALOR ?? r.valor ?? 0),
          ...r,
        }))
        : [];

      if (reqId === activeReq.current) setData(items);
      return items;
    } catch (e: any) {
      if (reqId === activeReq.current) {
        setError(e?.message ?? "Erro ao buscar detalhes");
        setData([]);
      }
      return [];
    } finally {
      if (reqId === activeReq.current) setLoading(false);
    }
  }, [token]);

  return { data, loading, error, fetchDetalhes, setData };
}
