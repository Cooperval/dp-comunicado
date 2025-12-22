import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';

export function useMovimentacao() {
  const [movimentacoes2, setMovimentacoes] = useState([]);
  const [loading2, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  // guard contra race conditions ao digitar datas rapidamente
  const activeReq = useRef(0);

  const fetchData = useCallback(async (params = {}) => {
    const { dataInicio, dataFim } = params || {};
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

      const url =
        `${urlApi}/fluxo-caixa/lancamento` +
        (qs.toString() ? "?" + qs.toString() : "");

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Erro HTTP: ${res.status}`);

      const data = await res.json();

      // só aplica se esta ainda for a requisição mais recente
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
