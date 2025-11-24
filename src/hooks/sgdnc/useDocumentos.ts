// src/hooks/useDocumentos.ts
import { useState, useCallback, useRef } from "react";
import { useAuth } from '@/contexts/AuthContext';

export interface Documento {
  id_documento: number;
  titulo: string;
  documento: string;
  descricao: string | null;
  pasta_id: number | null;
  tipo: 'procedimento' | 'registro-mapa' | 'exportacao' | 'outro';
  nivel_conformidade: 'critico' | 'alto' | 'medio' | 'baixo';
  data_validade: string | null;
  responsavel_aprovacao: string;
  comentario_submissao: string | null;
  conteudo: {
    paragraphs: Array<{
      id: string;
      type: 'texto' | 'tabela' | 'imagem';
      content: any;
    }>;
  } | null;
  created_at: string;
  versao: number;
  // Futuro: codigo?: string;
}

export function useDocumentos() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const activeReq = useRef(0);

  const fetchDocumentos = useCallback(async () => {
    const reqId = ++activeReq.current;

    try {
      setLoading(true);
      setError(null);

      const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      if (!urlApi) throw new Error("VITE_API_URL não configurada");
      if (!token) throw new Error("Token de autenticação não encontrado");

      const url = `${urlApi}/sgdnc/lista-documentos`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          if (reqId === activeReq.current) {
            setDocumentos([]);
          }
          return;
        }
        throw new Error(data.error || data.details || `Erro HTTP: ${res.status}`);
      }

      if (reqId === activeReq.current) {
        const docs = Array.isArray(data.documentos) ? data.documentos : data;
        setDocumentos(docs);
      }
    } catch (err: any) {
      if (reqId === activeReq.current) {
        setError(err.message || "Erro ao carregar documentos");
        setDocumentos([]);
      }
    } finally {
      if (reqId === activeReq.current) {
        setLoading(false);
      }
    }
  }, [token]);

  return { documentos, loading, error, fetchDocumentos };
}