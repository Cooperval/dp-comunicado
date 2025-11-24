import { useState, useCallback } from "react";

export function useMovimentacaoLogs(baseUrl = "http://localhost:8850") {
  const [movimentacoesLogs, setMovimentacoesLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [errorLogs, setErrorLogs] = useState(null);

  const fetchDataLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      setErrorLogs(null);

      const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      if (!urlApi) {
        throw new Error("VITE_API_URL não configurada");
      }

      const url = `${urlApi}/fluxo-caixa/logs-saldo`;
      const res = await fetch(url);

      const text = await res.text();

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${text}`);
      }

      const data = JSON.parse(text); // Parse JSON manually to debug

      setMovimentacoesLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err.message); // Log error
      setErrorLogs(err?.message ?? "Erro desconhecido");
      setMovimentacoesLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, [baseUrl]);

  return { movimentacoesLogs, loadingLogs, errorLogs, fetchDataLogs };
}
