import { useState, useCallback, useRef, useEffect } from "react";
import { useAuth } from '@/contexts/AuthContext';

export function useMovimentacao() {
  const [saldos, setSaldos] = useState([]);
  const [loading2, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const activeReq = useRef(0);

  const fetchData = useCallback(async (params = {}) => {
    const {
      dataFim,
      codTipo,
      codGrupoEmpresa,
      codEmpresa,
      codFilial
    } = params;

    const reqId = ++activeReq.current;



    try {
      setLoading(true);
      setError(null);

      const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      if (!urlApi) throw new Error("VITE_API_URL não configurada");

      const qs = new URLSearchParams();

      // Parâmetros obrigatórios/opcionais
      if (dataFim) qs.append("dataFim", dataFim);

      if (codTipo && codTipo !== "all") {
        qs.append("codTipo", String(codTipo));
      }

      // ADICIONEI AQUI: envia os 3 códigos do GEF
      if (codGrupoEmpresa) qs.append("codGrupoEmpresa", String(codGrupoEmpresa));
      if (codEmpresa) qs.append("codEmpresa", String(codEmpresa));
      if (codFilial) qs.append("codFilial", String(codFilial));

      const url = `${urlApi}/fluxo-caixa/saldos${qs.toString() ? "?" + qs.toString() : ""}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const texto = await res.text();
        throw new Error(`Erro ${res.status}: ${texto || "Falha na requisição"}`);
      }

      const data = await res.json();


      if (reqId === activeReq.current) {
        setSaldos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      if (reqId === activeReq.current) {
        setError(err.message || "Erro desconhecido");
        setSaldos([]);
      }
    } finally {
      if (reqId === activeReq.current) {
        setLoading(false);
      }
    }
  }, []);

  return { saldos, loading2, error, fetchData };
}
