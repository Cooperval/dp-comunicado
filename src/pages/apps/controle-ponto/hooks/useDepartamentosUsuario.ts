import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

type Departamento = {
  COD_DEPARTAMENTO: number;
  DESC_DEPARTAMENTO?: string;
};

type Props = {
  user: { id?: string } | null;
  token: string | null;
};

export const useDepartamentosUsuario = ({ user, token }: Props) => {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

  useEffect(() => {
    if (!user?.id || !token || !urlApi) {
      setDepartamentos([]);
      setIsLoading(false);
      return;
    }

    const codFuncionario = Number(user.id);

    const carregar = async () => {
      setIsLoading(true);
      try {
        // 1º tenta via grupos
        const resGrupos = await fetch(`${urlApi}/controle-de-ponto/lista-departamentos/${codFuncionario}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (resGrupos.ok) {
          const data = await resGrupos.json();
          if (Array.isArray(data) && data.length > 0) {
            setDepartamentos(data);
            setIsLoading(false);
            return;
          }
        }

        // 2º fallback: departamento funcional direto do RH
        const resFallback = await fetch(`${urlApi}/controle-de-ponto/consulta-dados-usuario-dpto`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cracha: codFuncionario.toString() }),
        });

        if (!resFallback.ok) throw new Error("Erro ao buscar departamento funcional");

        const dados = await resFallback.json();
        const usuario = Array.isArray(dados) ? dados[0] : dados;

        if (!usuario?.cod_departamento) throw new Error("Sem departamento no RH");

        const deptoFallback: Departamento = {
          COD_DEPARTAMENTO: usuario.cod_departamento,
          DESC_DEPARTAMENTO: usuario.desc_departamento || "Departamento sem descrição",
        };

        setDepartamentos([deptoFallback]);
        
      } catch (err: any) {
        console.error(err);
        setDepartamentos([]);
        toast({
          title: "Acesso restrito",
          description: err.message || "Não foi possível carregar seus departamentos.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    carregar();
  }, [user?.id, token, toast, urlApi]);

  return { departamentos, isLoading };
};