import { useState, useCallback } from "react";
import { useAuth } from '@/contexts/AuthContext';

export function useProjecao() {
  const { token } = useAuth();

  const [projecao, setProjecao] = useState([]);
  const [loadingProjecao, setLoadingProjecao] = useState(false);
  const [errorProjecao, setErrorProjecao] = useState(null);

  const fetchDataprojecao = useCallback(async () => {
    try {
      setLoadingProjecao(true);
      setErrorProjecao(null);

      const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      if (!urlApi) {
        throw new Error("VITE_API_URL não configurada");
      }

      const url = `${urlApi}/fluxo-caixa/projecao`;

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

      setProjecao(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err.message); // Log error
      setErrorProjecao(err?.message ?? "Erro desconhecido");
      setProjecao([]);
    } finally {
      setLoadingProjecao(false);
    }
  }, []);

  return { projecao, loadingProjecao, errorProjecao, fetchDataprojecao };
}
