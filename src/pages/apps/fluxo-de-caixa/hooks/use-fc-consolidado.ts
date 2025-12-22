// src/hooks/use-fc-consolidado.ts
import { useState, useRef, useCallback } from "react";
import { useAuth } from '@/contexts/AuthContext';

export interface ConsolidadoDia {
  data_iso: string;
  saldoinicial: number;
  contasreceber: number;
  contaspagar: number;
  pendreceber: number;
  pendpagar: number;
  laprevreceber: number;
  laprevpagar: number;
  folha: number;
  orcado: number;
  projecao: number;
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
  codTipoConta?: string;
  codGrupoEmpresa?: number,
  codEmpresa?: number,
  codFilial?: number
};

type ShowFlags = { mov: boolean; pend: boolean; prev: boolean; folha: boolean; orcado: boolean; projecao: boolean };

export function useFluxoCaixaConsolidado() {
  const { token } = useAuth();

  const [data, setData] = useState<ConsolidadoDia[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeReq = useRef(0);

  const fetchData = useCallback(
    async (params: {
      dataInicio?: string;
      dataFim?: string;
      show?: ShowFlags;
      codTipoConta?: string;
      codGrupoEmpresa?: number;
      codEmpresa?: number;
      codFilial?: number;
      visao?: "dia" | "semana" | "mes"; // ← agora inclui semana
    } = {}) => {
      const {
        dataInicio,
        dataFim,
        show,
        codTipoConta,
        codGrupoEmpresa,
        codEmpresa,
        codFilial,
        visao = "dia", // padrão continua sendo dia
      } = params;

      const reqId = ++activeReq.current;

      try {
        setLoading(true);
        setError(null);

        const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
        if (!urlApi) throw new Error("VITE_API_URL não configurada");

        const qs = new URLSearchParams();
        if (dataInicio) qs.append("dataInicio", dataInicio);
        if (dataFim) qs.append("dataFim", dataFim);
        if (show) {
          qs.append("mov", show.mov ? "1" : "0");
          qs.append("pend", show.pend ? "1" : "0");
          qs.append("prev", show.prev ? "1" : "0");
          qs.append("folha", show.folha ? "1" : "0");
          qs.append("orcado", show.orcado ? "1" : "0");
          qs.append("projecao", show.projecao ? "1" : "0");
        }
        if (codTipoConta && codTipoConta !== "all") {
          qs.append("codTipoConta", codTipoConta);
        }
        if (codGrupoEmpresa) qs.append("codGrupoEmpresa", String(codGrupoEmpresa));
        if (codEmpresa) qs.append("codEmpresa", String(codEmpresa));
        if (codFilial) qs.append("codFilial", String(codFilial));

        // === MÁGICA: seleciona a rota correta com base na visão ===
        let endpoint = "";
        if (visao === "mes") {
          endpoint = "/fluxo-caixa/consolidado-mes";
        } else if (visao === "semana") {
          endpoint = "/fluxo-caixa/consolidado-semana";
        } else {
          endpoint = "/fluxo-caixa/consolidado-dia";
        }

        const url = `${urlApi}${endpoint}${qs.toString() ? `?${qs.toString()}` : ""}`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
        }

        const rows = await res.json();

        // Normaliza os dados independentemente da visão (campos podem vir em maiúsculo/minúsculo)
        const normalized: ConsolidadoDia[] = (Array.isArray(rows) ? rows : []).map((r: any) => ({
          data_iso: r.DATA_ISO ?? r.data_iso ?? r.semana_iso ?? r.semana_label?.split(" a ")[0], // fallback para semana
          saldoinicial: Number(r.SALDOINICIAL ?? r.saldoInicial ?? 0),
          contasreceber: Number(r.CONTASRECEBER ?? r.contasReceber ?? 0),
          contaspagar: Number(r.CONTASPAGAR ?? r.contasPagar ?? 0),
          pendreceber: Number(r.PENDRECEBER ?? r.pendReceber ?? 0),
          pendpagar: Number(r.PENDPAGAR ?? r.pendPagar ?? 0),
          laprevreceber: Number(r.LAPREVRECEBER ?? r.laPrevReceber ?? 0),
          laprevpagar: Number(r.LAPREVPAGAR ?? r.laPrevPagar ?? 0),
          folha: Number(r.FOLHAPAGAR ?? r.folhaPagar ?? 0),
          orcado: Number(r.ORCADO ?? r.orcado ?? 0),
          projecao: Number(r.PROJECAOPAGAR ?? r.projecaoPagar ?? 0),
          saldofinal: Number(r.SALDOFINAL ?? r.saldoFinal ?? 0),
          saldoFinalBase: Number(r.SALDOFINALBASE ?? r.saldoFinalBase ?? 0),
          saldoManualDia: Number(r.SALDOMANUALDIA ?? r.saldoManualDia ?? r.saldoManualSemana ?? 0),
          ajusteManualDia: Number(r.AJUSTEMANUALDIA ?? r.ajusteManualDia ?? r.ajusteAberturaSemana ?? 0),
          ajusteAcumuladoAteOntem: Number(r.AJUSTEACUMULADOATEONTEM ?? r.ajusteAcumuladoAteOntem ?? 0),
          isOverrideDia: Number(r.ISOVERRIDEDIA ?? r.isOverrideDia ?? 0),
        }));

        if (reqId === activeReq.current) {
          setData(normalized);
        }
      } catch (e: any) {
        console.error("Erro no useFluxoCaixaConsolidado:", e);
        if (reqId === activeReq.current) {
          setError(e?.message ?? "Erro ao buscar dados");
          setData([]);
        }
      } finally {
        if (reqId === activeReq.current) {
          setLoading(false);
        }
      }
    },
    [token]
  );

  return { data, loading, error, fetchData };
}
