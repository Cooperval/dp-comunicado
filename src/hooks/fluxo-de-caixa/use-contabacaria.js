import { useState, useCallback, useRef } from "react";

export function useMovimentacao2() {
  const [movimentacoes3, setMovimentacoes] = useState([]);
  const [loading3, setLoading] = useState(false);
  const [error3, setError] = useState(null);

  const activeReq = useRef(0);

  const fetchData3 = useCallback(async () => {
    const reqId = ++activeReq.current;
    try {



      setLoading(true);
      setError(null);

      const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      if (!urlApi) {
        throw new Error("VITE_API_URL não configurada");
      }

      const res = await fetch(`${urlApi}/fluxo-caixa/contas-bancarias`);
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      const data = await res.json();

      if (reqId === activeReq.current) {
        setMovimentacoes(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (reqId === activeReq.current) {
        setError(err && err.message ? err.message : "Erro desconhecido");
        setMovimentacoes([]);
      }
    } finally {
      if (reqId === activeReq.current) setLoading(false);
    }
  }, []);

  return { movimentacoes3, loading3, error3, fetchData3 };
}


export function useTipoContas() {
  const [tipos, setTipos] = useState([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [errorTipos, setErrorTipos] = useState(null);

  const activeReq = useRef(0);

  const fetchDataTipos = useCallback(async () => {
    const reqId = ++activeReq.current;
    try {



      setLoadingTipos(true);
      setErrorTipos(null);

      const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      if (!urlApi) {
        throw new Error("VITE_API_URL não configurada");
      }

      const res = await fetch(`${urlApi}/fluxo-caixa/tipos-contas`);
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      const data = await res.json();

      if (reqId === activeReq.current) {
        setTipos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (reqId === activeReq.current) {
        setError(err && err.message ? err.message : "Erro desconhecido");
        setTipos([]);
      }
    } finally {
      if (reqId === activeReq.current) setLoadingTipos(false);
    }
  }, []);

  return { tipos, loadingTipos, errorTipos, fetchDataTipos };
}