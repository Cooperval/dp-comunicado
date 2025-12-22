// src/hooks/usePastas.ts
import { useState, useCallback, useRef } from "react";
import { useAuth } from '@/contexts/AuthContext';

export interface Pasta {
  id_pasta: number;
  nome: string;
  pasta_parent_id: number | null;
  cor: string;
  created_at: string;
  updated_at: string;
}

export function usePastas() {
  const [pastas, setPastas] = useState<Pasta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth(); // ← Pega o token do contexto

  const activeReq = useRef(0);

  const fetchPastas = useCallback(async () => {
    const reqId = ++activeReq.current;

    try {
      setLoading(true);
      setError(null);

      const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      if (!urlApi) throw new Error("VITE_API_URL não configurada");
      if (!token) throw new Error("Token de autenticação não encontrado");

      const url = `${urlApi}/sgdnc/lista-pasta`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // ← Token aqui
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          if (reqId === activeReq.current) {
            setPastas([]);
          }
          return;
        }
        throw new Error(data.error || data.details || `Erro HTTP: ${res.status}`);
      }

      if (reqId === activeReq.current) {
        setPastas(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      if (reqId === activeReq.current) {
        setError(err.message || "Erro ao carregar pastas");
        setPastas([]);
      }
    } finally {
      if (reqId === activeReq.current) {
        setLoading(false);
      }
    }
  }, [token]); // ← Dependência: refetch se token mudar

  return { pastas, loading, error, fetchPastas };
}