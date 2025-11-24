// src/hooks/use-fc-consolidado.ts
import { useState, useRef, useCallback } from "react";

export interface ConsolidadoDia {
  data_iso: string;
  saldoinicial: number;
  contasreceber: number;
  contaspagar: number;
  pendreceber: number;
  pendpagar: number;
  laprevreceber: number;
  laprevpagar: number;
  saldofinal: number;

  // novos (opcionais)
  saldoFinalBase?: number;
  saldoManualDia?: number;
  ajusteManualDia?: number;
  ajusteAcumuladoAteOntem?: number;
  isOverrideDia?: number; // 1|0
}

type FetchParams = {
  dataInicio?: string;
  dataFim?: string;
  show?: ShowFlags;
  codTipoConta?: string; // <-- NOVO
};

type ShowFlags = { mov: boolean; pend: boolean; prev: boolean };

export function useFluxoCaixaConsolidado() {
  const [data, setData] = useState<ConsolidadoDia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeReq = useRef(0);

  const fetchData = useCallback(
    async (params: { dataInicio?: string; dataFim?: string; show?: ShowFlags } = {}) => {
      const { dataInicio, dataFim, show, codTipoConta } = params;
      const reqId = ++activeReq.current;

      try {
        setLoading(true);
        setError(null);

        const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
        if (!urlApi) {
          throw new Error("VITE_API_URL não configurada");
        }


        const qs = new URLSearchParams();
        if (dataInicio) qs.append("dataInicio", dataInicio);
        if (dataFim) qs.append("dataFim", dataFim);
        if (show) {
          qs.append("mov", show.mov ? "1" : "0");
          qs.append("pend", show.pend ? "1" : "0");
          qs.append("prev", show.prev ? "1" : "0");
        }

        // NOVO: só envia se for diferente de "all"
        if (codTipoConta && codTipoConta !== "all") {
          qs.append("codTipoConta", codTipoConta);
        }
        
        const url =
          `${urlApi}/fluxo-caixa/consolidado` +
          (qs.toString() ? `?${qs.toString()}` : "");
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const rows = await res.json();
        const normalized: ConsolidadoDia[] = (Array.isArray(rows) ? rows : []).map((r: any) => ({
          data_iso: r.DATA_ISO ?? r.data_iso,
          saldoinicial: Number(r.SALDOINICIAL ?? r.saldoInicial ?? 0),
          contasreceber: Number(r.CONTASRECEBER ?? r.contasReceber ?? 0),
          contaspagar: Number(r.CONTASPAGAR ?? r.contasPagar ?? 0),
          pendreceber: Number(r.PENDRECEBER ?? r.pendReceber ?? 0),
          pendpagar: Number(r.PENDPAGAR ?? r.pendPagar ?? 0),
          laprevreceber: Number(r.LAPREVRECEBER ?? r.laPrevReceber ?? 0),
          laprevpagar: Number(r.LAPREVPAGAR ?? r.laPrevPagar ?? 0),
          saldofinal: Number(r.SALDOFINAL ?? r.saldoFinal ?? 0),
          saldoFinalBase: Number(r.SALDOFINALBASE ?? r.saldoFinalBase ?? 0),
          saldoManualDia: Number(r.SALDOMANUALDIA ?? r.saldoManualDia ?? 0),
          ajusteManualDia: Number(r.AJUSTEMANUALDIA ?? r.ajusteManualDia ?? 0),
          ajusteAcumuladoAteOntem: Number(r.AJUSTEACUMULADOATEONTEM ?? r.ajusteAcumuladoAteOntem ?? 0),
          isOverrideDia: Number(r.ISOVERRIDEDIA ?? r.isOverrideDia ?? 0),
        }));

        if (reqId === activeReq.current) setData(normalized);
      } catch (e: any) {
        if (reqId === activeReq.current) {
          setError(e?.message ?? "Erro ao buscar dados");
          setData([]);
        }
      } finally {
        if (reqId === activeReq.current) setLoading(false);
      }
    },
    []
  );

  return { data, loading, error, fetchData };
}
