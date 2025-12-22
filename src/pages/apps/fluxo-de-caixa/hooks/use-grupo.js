import { useState, useCallback } from "react";
import { useAuth } from '@/contexts/AuthContext';

export function useGrupo() {
  const { token } = useAuth();
  const [grupo, setGrupo] = useState([]);
  const [loadingGrupo, setLoadingGrupo] = useState(false);
  const [errorGrupo, setErrorGrupo] = useState(null);

  const fetchDataGrupo = useCallback(async () => {
    try {
      setLoadingGrupo(true);
      setErrorGrupo(null);

      const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      if (!urlApi) {
        throw new Error("VITE_API_URL não configurada");
      }

      const url = `${urlApi}/fluxo-caixa/grupo-empresa`;
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

      setGrupo(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch error:", err.message); // Log error
      setErrorGrupo(err?.message ?? "Erro desconhecido");
      setGrupo([]);
    } finally {
      setLoadingGrupo(false);
    }
  }, []);

  return { grupo, loadingGrupo, errorGrupo, fetchDataGrupo };
}
