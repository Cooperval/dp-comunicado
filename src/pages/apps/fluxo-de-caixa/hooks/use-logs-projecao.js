import { useState, useCallback } from "react";
import { useAuth } from '@/contexts/AuthContext';

export function useLogsProjecao() {
  const [logsProjecao, setLogsProjecao] = useState([]);
  const [loadingLogsProjecao, setLoadingLogsProjecao] = useState(false);
  const [errorLogsProjecao, setErrorLogsProjecao] = useState(null);
  const { token } = useAuth();

  const fetchDataLogsProjecao = useCallback(async () => {
    try {
      setLoadingLogsProjecao(true);
      setErrorLogsProjecao(null);

      const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      if (!urlApi) {
        throw new Error("VITE_API_URL não configurada");
      }

      const url = `${urlApi}/fluxo-caixa/logs-projecao`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${text}`);
      }

      const data = JSON.parse(text); // Parse JSON manually to debug

      setLogsProjecao(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err.message); // Log error
      setErrorLogsProjecao(err?.message ?? "Erro desconhecido");
      setLogsProjecao([]);
    } finally {
      setLoadingLogsProjecao(false);
    }
  }, []);

  return { logsProjecao, loadingLogsProjecao, errorLogsProjecao, fetchDataLogsProjecao };
}
