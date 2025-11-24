import { useState, useCallback, useRef, useEffect } from "react";

export function useMovimentacao() {
  const [movimentacoes2, setMovimentacoes] = useState([]);
  const [loading2, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeReq = useRef(0);

  const fetchData = useCallback(async (params = {}) => {
    const { dataFim, codTipo } = params || {};   // 👈 já está desestruturado
    const reqId = ++activeReq.current;

    try {


      setLoading(true);
      setError(null);

      const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      if (!urlApi) {
        throw new Error("VITE_API_URL não configurada");
      }

      const qs = new URLSearchParams();
      if (dataFim) qs.append("dataFim", dataFim);

      // 👇 acrescenta codTipo se vier definido e não for “all”
      if (codTipo !== undefined && codTipo !== null && codTipo !== "" && codTipo !== "all") {
        qs.append("codTipo", String(codTipo)); // use String(...) ou Number(...) conforme sua API
      }

      const url =
        `${urlApi}/fluxo-caixa/saldos` +
        (qs.toString() ? "?" + qs.toString() : "");

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      const data = await res.json();

      if (reqId === activeReq.current) {
        setMovimentacoes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (reqId === activeReq.current) {
        setError(err?.message ?? "Erro desconhecido");
        setMovimentacoes([]);
      }
    } finally {
      if (reqId === activeReq.current) {
        setLoading(false);
      }
    }
  }, []);

  return { movimentacoes2, loading2, error, fetchData };
}
