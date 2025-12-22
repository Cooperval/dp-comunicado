import { useState, useCallback } from "react";
import { useAuth } from '@/contexts/AuthContext';

export function useGef() {
  const { token } = useAuth();

  const [gef, setGef] = useState([]);
  const [loadingGef, setLoadingGef] = useState(false);
  const [errorGef, setErrorGef] = useState(null);

  const fetchDataGef = useCallback(async () => {
    try {
      setLoadingGef(true);
      setErrorGef(null);

      const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      if (!urlApi) {
        throw new Error("VITE_API_URL não configurada");
      }

      const url = `${urlApi}/fluxo-caixa/gef`;

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

      setGef(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err.message); // Log error
      setErrorGef(err?.message ?? "Erro desconhecido");
      setGef([]);
    } finally {
      setLoadingGef(false);
    }
  }, []);

  return { gef, loadingGef, errorGef, fetchDataGef };
}
