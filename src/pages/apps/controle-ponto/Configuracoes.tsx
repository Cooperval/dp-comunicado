import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  CheckCircle,
  XCircle,
  RefreshCw,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Configuracoes() {
  const { toast } = useToast();
  const { token } = useAuth();

  const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
  const [activeTab, setActiveTab] = useState('tipos');

  // Estados para Tipos
  const [tipos, setTipos] = useState<Array<{
    id: number;
    nome: string;
    descricao: string | null;
    cor: string;
    ativo: boolean;
    situacao: string;
  }>>([]);


  const [dialogTipo, setDialogTipo] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data?: TipoOcorrencia;
  }>({ open: false, mode: 'create' });
  const [formTipo, setFormTipo] = useState({
    nome: '',
    descricao: '',
    cor: '#3b82f6',
    situacao: 'A',
  });









  const [loadingTipos, setLoadingTipos] = useState(false);
  const [errorTipos, setErrorTipos] = useState<string | null>(null);

  //Lista os tipos 
  const fetchTipoOcorrencias = async () => {
    setLoadingTipos(true);
    setErrorTipos(null);

    try {
      //const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      if (!urlApi) throw new Error("VITE_API_URL não configurada");
      if (!token) throw new Error("Token de autenticação não encontrado.");

      const response = await fetch(`${urlApi}/controle-de-ponto/lista-tipo-ocorrencias`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao carregar tipos: ${response.status}`);
      }

      const data = await response.json();

      // Mapeia exatamente para o formato da tabela
      const mappedTipos = data.map((tipo: any) => ({
        id: tipo.ID_TIPO,
        nome: tipo.NOME_OCORRENCIA,
        descricao: tipo.DESC_OCORRENCIA || null,
        cor: tipo.COR || '#3b82f6', // cor padrão
        ativo: tipo.SITUACAO === 'A', // true se ativo
        situacao: tipo.SITUACAO,
      }));

      setTipos(mappedTipos);

    } catch (err: any) {
      console.error("Erro ao carregar tipos:", err);
      setErrorTipos(err.message);
      toast({
        title: "Erro ao carregar tipos",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoadingTipos(false);
    }
  };


  const handleEditTipo = (tipo: any) => {
    setFormTipo({
      nome: tipo.nome,
      descricao: tipo.descricao || '',
      cor: tipo.cor || '#3b82f6',
      situacao: tipo.ativo ? 'A' : 'I', // mapeia boolean para 'A'/'I'
    });
    setDialogTipo({
      open: true,
      mode: 'edit',
      data: { id: tipo.id } as TipoOcorrencia,
    });
  };


  //Salva o Tipo
  const isValidColor = (color: string) => /^#[0-9A-Fa-f]{6}$/.test(color);
  const handleSaveTipo = async () => {
    try {
      //const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      if (!urlApi) throw new Error("VITE_API_URL não configurada");

      // Validação básica
      if (!formTipo.nome?.trim()) {
        toast({
          title: "Campo obrigatório",
          description: "O nome do tipo de ocorrência é obrigatório.",
          variant: "destructive",
        });
        return;
      }

      const payload = {
        nome_ocorrencia: formTipo.nome.trim(),
        desc_ocorrencia: formTipo.descricao?.trim() || null,
        situacao: formTipo.situacao, // Sempre "A" ao salvar (pode vir do backend se for edição)
        cor: formTipo.cor && isValidColor(formTipo.cor) ? formTipo.cor : null,
      };

      let response;
      let endpoint;

      if (dialogTipo.mode === 'create') {
        // Criação
        endpoint = `${urlApi}/controle-de-ponto/novo-tipo-ocorrencia`;
        response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      } else if (dialogTipo.data?.id) {
        // Edição
        endpoint = `${urlApi}/controle-de-ponto/editar-tipo-ocorrencia/${dialogTipo.data.id}`;
        response = await fetch(endpoint, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        let message = "Erro na comunicação com o servidor";
        let details = "";

        try {
          const errorBody = await response.json().catch(() => null);

          if (errorBody?.message) {
            message = errorBody.message;
            details = errorBody.details || errorBody.code || "";
          } else {
            message = errorBody?.error || response.statusText || message;
          }
        } catch {
          message = `Erro ${response.status}: ${response.statusText}`;
        }

        const error = new Error(message) as any;
        error.status = response.status;
        error.details = details;

        throw error;
      }



      const result = await response.json();

      toast({
        title: dialogTipo.mode === 'create' ? "Tipo criado com sucesso" : "Tipo atualizado com sucesso",
        description: `"${result.tipo?.nome_ocorrencia || formTipo.nome}" foi salvo.`,
      });

      // Fechar dialog e resetar
      setDialogTipo({ open: false, mode: 'create' });
      setFormTipo({ nome: "", descricao: "" });

      // Recarregar tipos
      fetchTipoOcorrencias();

    } catch (error: any) {
      console.error("Erro ao salvar tipo:", error);

      const isDuplicate = error.message.includes("já existe") || error.message.includes("UK");
      toast({
        title: "Erro ao salvar",
        description: isDuplicate
          ? "Já existe um tipo com esse nome."
          : error.message,
        variant: "destructive",
      });
    }
  };


  // ========== CRUD TIPOS ==========

  const handleDeleteTipo = async (id: number) => {
    if (!confirm('Deseja realmente APAGAR este tipo de ocorrência? Todos os dados serão excluídos permanentemente.')) {
      return;
    }

    try {
      //const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      if (!urlApi) throw new Error("API URL não configurada");

      const response = await fetch(`${urlApi}/controle-de-ponto/deletar-tipo-ocorrencia/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao apagar tipo");
      }

      toast({ title: 'Tipo apagado com sucesso!' });
      fetchTipoOcorrencias(); // recarrega a lista

    } catch (error: any) {
      console.error("Erro ao apagar tipo:", error);
      toast({
        title: 'Erro ao apagar tipo',
        description: error.message,
        variant: 'destructive',
      });
    }
  };


  const [sortConfig, setSortConfig] = useState<{
    key: keyof TipoOcorrencia | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  const handleSort = (key: keyof TipoOcorrencia) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedTipos = [...tipos].sort((a, b) => {
    if (!sortConfig.key) return 0;

    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortConfig.direction === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortConfig.direction === 'asc'
      ? (aValue > bValue ? 1 : -1)
      : (bValue > aValue ? 1 : -1);
  });






  // Estados para Motivos
  const [motivos, setMotivos] = useState<Array<{
    id: number;
    tipoId: number;
    tipoNome: string;
    nome: string;
    descricao: string | null;
    ativo: boolean;
    nome_ocorrencia: string;
    situacao: string;
  }>>([]);

  const [loadingMotivos, setLoadingMotivos] = useState(false);
  const [errosMotivos, setErrosMotivos] = useState<string | null>(null);
  const [dialogMotivo, setDialogMotivo] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data?: { id: number };
  }>({ open: false, mode: 'create' });
  const [formMotivo, setFormMotivo] = useState({
    tipoId: '',
    nome: '',
    descricao: '',
    situacao: 'A',
  });


  //Lista Motivos

  const fetchMotivosOcorrencias = async () => {
    setLoadingMotivos(true);
    setErrosMotivos(null); // limpa erros anteriores
    try {
      const urlApi = (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, "");
      if (!urlApi) throw new Error("VITE_API_URL não configurada");

      const response = await fetch(`${urlApi}/controle-de-ponto/lista-motivo-ocorrencias`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        // mensagem detalhada para exibir na UI
        const msg = `Erro ao carregar motivos: ${response.status} ${text}`.trim();
        setErrosMotivos(msg);
        // opcional: toast também
        toast({ title: "Erro", description: msg, variant: "destructive" });
        return;
      }

      const data = await response.json();

      const mapped = data.map((m: any) => ({
        id: m.ID_MOTIVO,
        tipoId: Number(m.ID_TIPO), // número
        tipoNome: m.NOME_TIPO || "Tipo não encontrado",
        nome: m.NOME_MOTIVO_OCORRENCIA,
        descricao: m.DESC_MOTIVO_OCORRENCIA || null,
        ativo: m.SITUACAO === 'A',
        situacao: m.SITUACAO,
        nome_ocorrencia: m.NOME_OCORRENCIA,
      }));

      setMotivos(mapped);
      fetchTipoOcorrencias();
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : "Erro desconhecido ao carregar motivos";
      setErrosMotivos(msg);
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setLoadingMotivos(false);
    }
  };


  const handleEditMotivo = (motivo: any) => {
    setFormMotivo({
      tipoId: String(motivo.tipoId), // string
      nome: motivo.nome,
      descricao: motivo.descricao || '',
      situacao: motivo.ativo ? 'A' : 'I',
    });
    setDialogMotivo({
      open: true,
      mode: 'edit',
      data: { id: motivo.id },
    });
  };


  // Sala o Motivo
  const handleSaveMotivo = async () => {
    try {
      if (!urlApi) throw new Error("VITE_API_URL não configurada");

      // Validação
      if (!formMotivo.tipoId) {
        toast({ title: "Erro", description: "Selecione um tipo.", variant: "destructive" });
        return;
      }
      if (!formMotivo.nome.trim()) {
        toast({ title: "Erro", description: "Nome do motivo é obrigatório.", variant: "destructive" });
        return;
      }

      const payload = {
        id_tipo: Number(formMotivo.tipoId),
        nome_motivo_ocorrencia: formMotivo.nome.trim(),
        desc_motivo_ocorrencia: formMotivo.descricao?.trim() || null,
        situacao: formMotivo.situacao, // 'A' ou 'I'
      };

      const isEdit = dialogMotivo.mode === 'edit' && dialogMotivo.data?.id;
      const endpoint = isEdit
        ? `${urlApi}/controle-de-ponto/editar-motivo-ocorrencia/${dialogMotivo.data.id}`
        : `${urlApi}/controle-de-ponto/novo-motivo-ocorrencia`;

      const response = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = "Erro na comunicação com o servidor";
        let details = "";

        try {
          const errorBody = await response.json().catch(() => null);

          if (errorBody?.message) {
            message = errorBody.message;
            details = errorBody.details || errorBody.code || "";
          } else {
            message = errorBody?.error || response.statusText || message;
          }
        } catch {
          message = `Erro ${response.status}: ${response.statusText}`;
        }

        const error = new Error(message) as any;
        error.status = response.status;
        error.details = details;

        throw error;
      }

      const result = await response.json();

      toast({
        title: isEdit ? "Motivo atualizado!" : "Motivo criado!",
        description: `"${result.motivo?.nome_motivo_ocorrencia || formMotivo.nome}" salvo.`,
      });

      setDialogMotivo({ open: false, mode: 'create' });
      setFormMotivo({ tipoId: '', nome: '', descricao: '', situacao: 'A' });
      fetchMotivosOcorrencias();

    } catch (error: any) {
      console.error("Erro ao salvar motivo:", error);
      const isDuplicate = error.message.includes("já existe") || error.message.includes("UK");
      toast({
        title: "Erro",
        description: isDuplicate
          ? "Já existe um motivo com esse nome para este tipo."
          : error.message,
        variant: "destructive",
      });
    }
  };


  const handleDeleteMotivo = async (id: number) => {
    if (!confirm('Deseja realmente APAGAR este motivo de ocorrência? Todos os dados serão excluídos permanentemente.')) {
      return;
    }

    try {
      if (!urlApi) throw new Error("VITE_API_URL não configurada");

      const response = await fetch(`${urlApi}/controle-de-ponto/deletar-motivo-ocorrencia/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao apagar motivo");
      }

      toast({ title: "Motivo apagado com sucesso!" });
      fetchMotivosOcorrencias(); // nome correto da função

    } catch (error: any) {
      console.error("Erro ao apagar motivo:", error);
      toast({
        title: "Erro ao apagar motivo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const [sortMotivosConfig, setSortMotivosConfig] = useState<{
    key: keyof MotivoOcorrencia | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });


  const handleSortMotivos = (key: keyof MotivoOcorrencia) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortMotivosConfig.key === key && sortMotivosConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortMotivosConfig({ key, direction });
  };

  const sortedMotivos = [...motivos].sort((a, b) => {
    if (!sortMotivosConfig.key) return 0;

    const aValue = a[sortMotivosConfig.key];
    const bValue = b[sortMotivosConfig.key];

    // Trata null/undefined
    if (aValue == null) return 1;
    if (bValue == null) return -1;

    // Ordenação por string
    const aStr = String(aValue);
    const bStr = String(bValue);

    return sortMotivosConfig.direction === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });



  // Estados para Resposta
  interface RespostaOcorrencia {
    id: number;
    desc_resposta_ocorrencia: string;
    situacao: 'PE' | 'AP' | 'RE' | 'AN';
  }

  const [respostas, setRespostas] = useState<RespostaOcorrencia[]>([]);
  const [loadingRespostas, setLoadingRespostas] = useState(false);
  const [errorRespostas, setErrorRespostas] = useState<string | null>(null);

  const [dialogResposta, setDialogResposta] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data?: { id: number };
  }>({ open: false, mode: 'create' });

  const [formResposta, setFormResposta] = useState({
    desc_resposta_ocorrencia: '',
    situacao: 'PE' as 'PE' | 'AP' | 'RE' | 'AN',
  });

  const fetchRespostasOcorrencia = async () => {
    setLoadingRespostas(true);
    setErrorRespostas(null);

    try {

      if (!urlApi) throw new Error("VITE_API_URL não configurada");

      const response = await fetch(`${urlApi}/controle-de-ponto/lista-resposta-ocorrencias`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        const msg = `Erro ao carregar respostas: ${response.status} ${text}`.trim();
        setErrorRespostas(msg);
        toast({ title: "Erro", description: msg, variant: "destructive" });
        return;
      }

      const result = await response.json();

      const respostasArray = Array.isArray(result) ? result : result.data || [];


      const mapped = respostasArray.map((r: any) => ({
        id: r.ID_RESPOSTA,
        desc_resposta_ocorrencia: r.DESC_RESPOSTA_OCORRENCIA,
        situacao: r.SITUACAO,
      }));

      setRespostas(mapped);

    } catch (err: any) {
      const msg = err?.message ? String(err.message) : "Erro ao carregar respostas";
      setErrorRespostas(msg);
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setLoadingRespostas(false);
    }
  };

  const handleEditResposta = (resposta: RespostaOcorrencia) => {
    setFormResposta({
      desc_resposta_ocorrencia: resposta.desc_resposta_ocorrencia,
      situacao: resposta.situacao,
    });
    setDialogResposta({
      open: true,
      mode: 'edit',
      data: { id: resposta.id },
    });
  };

  const handleSaveResposta = async () => {
    try {

      if (!urlApi) throw new Error("VITE_API_URL não configurada");

      // Validação
      const descricao = formResposta.desc_resposta_ocorrencia.trim();
      if (!descricao) {
        toast({ title: "Erro", description: "A descrição é obrigatória.", variant: "destructive" });
        return;
      }

      if (descricao.length > 100) {
        toast({ title: "Erro", description: "A descrição deve ter no máximo 100 caracteres.", variant: "destructive" });
        return;
      }

      const payload = {
        desc_resposta_ocorrencia: descricao,
        situacao: formResposta.situacao,
      };

      const isEdit = dialogResposta.mode === 'edit' && dialogResposta.data?.id;
      const endpoint = isEdit
        ? `${urlApi}/controle-de-ponto/editar-resposta-ocorrencia/${dialogResposta.data.id}`
        : `${urlApi}/controle-de-ponto/nova-resposta-ocorrencia`;

      const response = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Erro ${response.status}`);
      }

      const result = await response.json();

      toast({
        title: isEdit ? "Resposta atualizada!" : "Resposta criada!",
        description: `"${result.data?.desc_resposta_ocorrencia || descricao}" salva.`,
      });

      setDialogResposta({ open: false, mode: 'create' });
      setFormResposta({ desc_resposta_ocorrencia: '' });
      fetchRespostasOcorrencia();

    } catch (error: any) {
      console.error("Erro ao salvar resposta:", error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar resposta.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteResposta = async (id: number) => {
    if (!confirm('Deseja realmente APAGAR esta resposta? Todos os dados serão excluídos permanentemente.')) {
      return;
    }

    try {

      if (!urlApi) throw new Error("VITE_API_URL não configurada");

      const response = await fetch(`${urlApi}/controle-de-ponto/deletar-resposta-ocorrencia/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao apagar resposta");
      }

      toast({ title: "Resposta apagada com sucesso!" });
      fetchRespostasOcorrencia();

    } catch (error: any) {
      console.error("Erro ao apagar resposta:", error);
      toast({
        title: "Erro ao apagar resposta",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PE":
        return { label: "Pendente", variant: "PE" };
      case "AP":
        return { label: "Aprovada", variant: "AP" };
      case "RE":
        return { label: "Rejeitada", variant: "RE" };
      // case "AN":
      //   return { label: "Em Análise", variant: "AN" };
      default:
        return { label: "Desconhecido", variant: "draft" };
    }
  };



  // Interface para Grupo
  interface Grupo {
    id: number;
    desc_grupo: string;
    situacao: 'A' | 'I';
    situacao_desc?: string; // opcional: "Ativo" ou "Inativo"
  }

  // Estados
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [errorGrupos, setErrorGrupos] = useState<string | null>(null);

  const [dialogGrupo, setDialogGrupo] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data?: { id: number };
  }>({ open: false, mode: 'create' });

  const [formGrupo, setFormGrupo] = useState({
    desc_grupo: '',
    situacao: 'A' as 'A' | 'I',
  });

  const fetchGrupos = async () => {
    setLoadingGrupos(true);
    setErrorGrupos(null);

    try {
      if (!urlApi) throw new Error("VITE_API_URL não configurada");

      const response = await fetch(`${urlApi}/controle-de-ponto/grupos`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        const msg = `Nenhum Grupo Encontrado.`;
        throw new Error(msg);
      }

      const result = await response.json();
      const gruposArray = Array.isArray(result) ? result : result.data || [];

      const mapped = gruposArray.map((g: any) => ({
        id: g.ID_GRUPO,
        desc_grupo: g.DESC_GRUPO,
        situacao: g.SITUACAO,
        situacao_desc: g.SITUACAO_DESC,
      }));

      setGrupos(mapped);


    } catch (err: any) {
      const msg = err?.message || "Erro ao carregar grupos";
      setErrorGrupos(msg);
      toast({ title: "Erro", description: msg });
    } finally {
      setLoadingGrupos(false);
    }
  };

  const handleEditGrupo = (grupo: Grupo) => {
    setFormGrupo({
      desc_grupo: grupo.desc_grupo,
      situacao: grupo.situacao,
    });
    setDialogGrupo({
      open: true,
      mode: 'edit',
      data: { id: grupo.id },
    });
  };

  const handleSaveGrupo = async () => {
    try {
      if (!urlApi) throw new Error("VITE_API_URL não configurada");

      const descricao = formGrupo.desc_grupo.trim();
      if (!descricao) {
        toast({ title: "Erro", description: "A descrição do grupo é obrigatória.", variant: "destructive" });
        return;
      }

      if (descricao.length > 30) {
        toast({ title: "Erro", description: "A descrição deve ter no máximo 30 caracteres.", variant: "destructive" });
        return;
      }

      const payload = {
        desc_grupo: descricao,
        situacao: formGrupo.situacao,
      };

      const isEdit = dialogGrupo.mode === 'edit' && dialogGrupo.data?.id;
      const endpoint = isEdit
        ? `${urlApi}/controle-de-ponto/grupos/${dialogGrupo.data.id}`
        : `${urlApi}/controle-de-ponto/grupos`;

      const response = await fetch(endpoint, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Erro ${response.status}`);
      }

      const result = await response.json();

      toast({
        title: isEdit ? "Grupo atualizado!" : "Grupo criado!",
        description: `"${result.grupo?.desc_grupo || descricao}" salvo.`,
      });

      setDialogGrupo({ open: false, mode: 'create' });
      setFormGrupo({ desc_grupo: '', situacao: 'A' });
      fetchGrupos();

    } catch (error: any) {
      console.error("Erro ao salvar grupo:", error);
      toast({
        title: "Erro",
        description: error.message || "Falha ao salvar grupo.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteGrupo = async (id: number) => {
    if (!confirm('Deseja realmente APAGAR este grupo? Todos os dados relacionados serão excluídos.')) {
      return;
    }

    try {
      if (!urlApi) throw new Error("VITE_API_URL não configurada");

      const response = await fetch(`${urlApi}/controle-de-ponto/grupos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao apagar grupo");
      }

      toast({ title: "Grupo apagado com sucesso!" });
      fetchGrupos();

    } catch (error: any) {
      console.error("Erro ao apagar grupo:", error);
      toast({
        title: "Erro ao apagar grupo",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Interface para Departamento
  interface Departamento {
    cod_departamento: number;
    descricao: string;
    id_grpdepart?: number;
    grupo_descricao?: string;
  }

  // Interface para Departamento vinculado ao grupo
  interface GrupoDepartamento {
    id_grupodpto: number;
    cod_grupo: number;
    cod_departamento: number;
    desc_departamento: string;
  }

  // Estados
  const [grupoSelecionadoDpto, setGrupoSelecionadoDpto] = useState<Grupo | null>(null);
  const [grupoSelecionadoFunc, setGrupoSelecionadoFunc] = useState<Grupo | null>(null);
  const [departamentosVinculados, setDepartamentosVinculados] = useState<GrupoDepartamento[]>([]);
  const [todosDepartamentos, setTodosDepartamentos] = useState<Departamento[]>([]);
  const [loadingDeptos, setLoadingDeptos] = useState(false);
  const [loadingVinculos, setLoadingVinculos] = useState(false);
  const [searchDepto, setSearchDepto] = useState('');



  // Carregar todos os departamentos
  const fetchTodosDepartamentos = async () => {
    setLoadingDeptos(true);
    try {
      const response = await fetch(`${urlApi}/controle-de-ponto/departamentos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Erro ao carregar departamentos");
      }

      const result = await response.json();

      const data = Array.isArray(result.data) ? result.data : [];

      setTodosDepartamentos(data);
      toast({ title: "Sucesso", description: `${validos.length} departamentos carregados.` });

    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoadingDeptos(false);
    }
  };



  // Carregar departamentos vinculados ao grupo
  const fetchDepartamentosDoGrupo = async (id_grupo: number) => {
    setLoadingVinculos(true);
    try {
      const response = await fetch(`${urlApi}/controle-de-ponto/grupos/${id_grupo}/departamentos`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Erro ao carregar departamentos do grupo");

      const result = await response.json();
      setDepartamentosVinculados(result || []);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoadingVinculos(false);
    }
  };

  // Adicionar departamento ao grupo
  const adicionarDepartamentoAoGrupo = async (cod_departamento: number) => {
    if (!grupoSelecionadoDpto) return;


    try {
      const response = await fetch(`${urlApi}/controle-de-ponto/grupos/${grupoSelecionadoDpto.id}/departamentos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cod_grupo: grupoSelecionadoDpto.id, cod_departamento }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro ao vincular");
      }

      toast({ title: "Sucesso", description: "Departamento vinculado!" });
      fetchDepartamentosDoGrupo(grupoSelecionadoDpto.id);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  // Remover departamento do grupo
  const removerDepartamentoDoGrupo = async (id_grupodpto: number) => {
    if (!confirm("Remover este departamento do grupo?")) return;

    try {
      const response = await fetch(`${urlApi}/controle-de-ponto/grupos/departamentos/${id_grupodpto}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Erro ao remover");

      toast({ title: "Removido!", description: "Departamento desvinculado." });
      if (grupoSelecionadoDpto) fetchDepartamentosDoGrupo(grupoSelecionadoDpto.id);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };




  // Interface para Funcionário
  interface Funcionario {
    cod_funcionario: number;
    nome: string;
    cpf: string;
    cod_departamento?: number;
    desc_departamento?: string;
  }

  // Interface para Funcionário vinculado ao grupo
  interface GrupoFuncionario {
    id_func_grupo: number;
    cod_grupo: number;
    cod_funcionario: number;
    nome_funcionario: string;
    cpf: string;
    desc_departamento?: string;
  }

  // Estados (novos)
  const [funcionariosVinculados, setFuncionariosVinculados] = useState<GrupoFuncionario[]>([]);



  const [loadingVinculosFunc, setLoadingVinculosFunc] = useState(false);
  const [searchFunc, setSearchFunc] = useState('');



  const [colaboradoresSelecionados, setColaboradoresSelecionados] = useState<Array<{
    codigo: string;
    nome: string;
  }>>([]);

  const [formData, setFormData] = useState({
    colaborador: "",
    codigo: "",
  });
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  // Carregar todos os funcionários
  const buscarEAdicionarColaborador = async (cracha: string) => {
    if (colaboradoresSelecionados.some(c => c.codigo === cracha)) {
      toast({
        title: "Já adicionado",
        description: `O colaborador com crachá ${cracha} já está na lista.`,
        variant: "destructive",
      });
      setFormData(prev => ({ ...prev, codigo: "" }));
      return;
    }

    setIsLoadingUser(true);
    try {
      const response = await fetch(`${urlApi}/portal/consulta-dados-usuario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cracha }),
      });

      if (!response.ok) throw new Error("Colaborador não encontrado");

      const data = await response.json();
      if (data.length === 0) throw new Error("Nenhum dado retornado");

      const nome = data[0].NOME;
      setColaboradoresSelecionados(prev => [...prev, { codigo: cracha, nome }]);
      toast({ title: "Adicionado", description: `${cracha} - ${nome}` });

      // Limpa o campo
      setFormData(prev => ({ ...prev, codigo: "", colaborador: "" }));
    } catch (error: any) {
      toast({
        title: "Não encontrado",
        description: error.message || "Colaborador não encontrado",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUser(false);
    }
  };

  // Carregar funcionários vinculados ao grupo
  const fetchFuncionariosDoGrupo = async (id_grupo: number) => {
    setLoadingVinculosFunc(true);
    try {
      const response = await fetch(`${urlApi}/controle-de-ponto/grupos/${id_grupo}/funcionarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Erro ao carregar funcionários do grupo");
      const result = await response.json();
      setFuncionariosVinculados(result || []);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoadingVinculosFunc(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);


  const salvarColaboradoresSelecionados = async () => {
    if (!grupoSelecionadoFunc || colaboradoresSelecionados.length === 0) return;

    setIsSaving(true);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Processa um por um com delay para evitar sobrecarga
    for (const col of colaboradoresSelecionados) {
      try {
        await adicionarFuncionarioAoGrupo(col.codigo); // Usa o crachá como cod_funcionario
        successCount++;
      } catch (err: any) {
        errorCount++;
        errors.push(`${col.codigo} - ${col.nome}: ${err.message}`);
      }
      // Pequeno delay para não sobrecarregar o backend
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Feedback final
    if (successCount > 0) {
      toast({
        title: "Sucesso",
        description: `${successCount} funcionário(s) vinculado(s) com sucesso!`,
      });
    }

    if (errorCount > 0) {
      toast({
        title: "Atenção",
        description: `${errorCount} erro(s) ao vincular. Veja detalhes.`,
        variant: "destructive",
      });
      console.error("Erros ao vincular:", errors);
    }

    // Limpa a lista
    setColaboradoresSelecionados([]);
    setFormData(prev => ({ ...prev, codigo: '' }));

    // Recarrega a lista de vinculados
    fetchFuncionariosDoGrupo(grupoSelecionadoFunc.id);

    setIsSaving(false);
  };

  // Adicionar funcionário ao grupo
  const adicionarFuncionarioAoGrupo = async (cod_funcionario: number) => {
    if (!grupoSelecionadoFunc) return;

    try {
      const response = await fetch(`${urlApi}/controle-de-ponto/grupos/${grupoSelecionadoFunc.id}/funcionarios`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ cod_grupo: grupoSelecionadoFunc.id, cod_funcionario }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro ao vincular");
      }

      toast({ title: "Sucesso", description: "Funcionário vinculado!" });
      fetchFuncionariosDoGrupo(grupoSelecionadoFunc.id);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  // Remover funcionário do grupo
  const removerFuncionarioDoGrupo = async (id_func_grupo: number) => {

    if (!confirm("Remover este funcionário do grupo?")) return;



    try {
      const response = await fetch(`${urlApi}/controle-de-ponto/grupos/deletar-funcionarios/${id_func_grupo}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Erro ao remover");
      }

      toast({ title: "Removido!", description: "Funcionário desvinculado." });
      fetchFuncionariosDoGrupo(grupoSelecionadoFunc.id);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações do Sistema</h1>
        <p className="text-muted-foreground mt-1">
          Configure os tipos, motivos e situações de ocorrências
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full min-w-[700px] max-w-4xl grid-cols-6 gap-1 p-1 bg-muted rounded-lg">
          <TabsTrigger value="tipos" className="text-xs">
            Tipos de Ocorrência
          </TabsTrigger>
          <TabsTrigger value="motivos" className="text-xs">
            Motivos
          </TabsTrigger>
          <TabsTrigger value="respostas" className="text-xs">
            Respostas
          </TabsTrigger>
          <TabsTrigger value="grupo" className="text-xs">
            Grupos
          </TabsTrigger>
          <TabsTrigger value="dpto/grupo" className="text-xs">
            Deptos p/ Grupo
          </TabsTrigger>
          <TabsTrigger value="func/grupo" className="text-xs">
            Func p/ Grupo
          </TabsTrigger>
        </TabsList>

        {/* ========== ABA TIPOS ========== */}
        <TabsContent value="tipos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tipos de Ocorrência</CardTitle>
                  <CardDescription>
                    Gerencie os tipos de ocorrências disponíveis no sistema
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={fetchTipoOcorrencias}
                    disabled={loadingTipos}
                  >
                    {loadingTipos ? (
                      <>
                        <div className="w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin mr-2" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Buscar
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setFormTipo({ nome: '', descricao: '', cor: '#6366f1' });
                      setDialogTipo({ open: true, mode: 'create' });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Tipo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('nome')}
                    >
                      <div className="flex items-center gap-1">
                        Nome
                        {sortConfig.key === 'nome' && (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        )}
                      </div>
                    </TableHead>

                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('descricao')}
                    >
                      <div className="flex items-center gap-1">
                        Descrição
                        {sortConfig.key === 'descricao' && (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        )}
                      </div>
                    </TableHead>

                    {/* <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('cor')}
                    >
                      <div className="flex items-center gap-1">
                        Cor
                        {sortConfig.key === 'cor' && (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        )}
                      </div>
                    </TableHead> */}

                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSort('situacao')}
                    >
                      <div className="flex items-center gap-1">
                        Situação
                        {sortConfig.key === 'situacao' && (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        )}
                      </div>
                    </TableHead>

                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>


                <TableBody>
                  {loadingTipos ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                          <span>Carregando tipos...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : errorTipos ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-destructive">
                        Nenhum tipo de ocorrência encontrado.
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-4"
                          onClick={fetchTipoOcorrencias}
                        >
                          Tentar novamente
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : tipos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum tipo de ocorrência encontrado, clique em Buscar.

                      </TableCell>
                    </TableRow>
                  ) : (
                    tipos.map((tipo) => (
                      <TableRow key={tipo.id}>
                        <TableCell className="font-medium">{tipo.nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {tipo.descricao || '-'}
                        </TableCell>
                        {/* <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: tipo.cor }}
                            />
                            <span className="text-xs text-muted-foreground">{tipo.cor}</span>
                          </div>
                        </TableCell> */}

                        <TableCell>

                          {tipo.situacao === 'A' ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="w-3 h-3" />
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => handleEditTipo(tipo)}>
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTipo(tipo.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== ABA MOTIVOS ========== */}
        <TabsContent value="motivos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Motivos de Ocorrência</CardTitle>
                  <CardDescription>
                    Gerencie os motivos disponíveis para cada tipo de ocorrência
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={fetchMotivosOcorrencias}
                    disabled={loadingMotivos}
                  >
                    {loadingMotivos ? (
                      <>
                        <div className="w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin mr-2" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Buscar
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setFormMotivo({ tipoId: '', nome: '', descricao: '', situacao: 'A' });
                      fetchTipoOcorrencias(); // Garante que os tipos estão carregados
                      setDialogMotivo({ open: true, mode: 'create' });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Motivo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSortMotivos('nome_ocorrencia')}
                    >
                      <div className="flex items-center gap-1">
                        Tipo
                        {sortMotivosConfig.key === 'nome_ocorrencia' && (
                          sortMotivosConfig.direction === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        )}
                      </div>
                    </TableHead>

                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSortMotivos('nome')}
                    >
                      <div className="flex items-center gap-1">
                        Motivo
                        {sortMotivosConfig.key === 'nome' && (
                          sortMotivosConfig.direction === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        )}
                      </div>
                    </TableHead>

                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSortMotivos('descricao')}
                    >
                      <div className="flex items-center gap-1">
                        Descrição
                        {sortMotivosConfig.key === 'descricao' && (
                          sortMotivosConfig.direction === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        )}
                      </div>
                    </TableHead>

                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handleSortMotivos('situacao')}
                    >
                      <div className="flex items-center gap-1">
                        Situação
                        {sortMotivosConfig.key === 'situacao' && (
                          sortMotivosConfig.direction === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        )}
                      </div>
                    </TableHead>

                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>



                <TableBody>
                  {loadingMotivos ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                          <span>Carregando motivos...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : errosMotivos ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="space-y-2">
                          Nenhum tipo de ocorrência encontrado.
                          <div className="flex items-center justify-center gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={fetchMotivosOcorrencias}
                            >
                              Tentar novamente
                            </Button>

                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                    : motivos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum motivo de ocorrência encontrado, clique em Buscar.

                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedMotivos.map((motivo) => {
                        const tipo = tipos.find(t => t.id === motivo.tipoId);
                        return (
                          <TableRow key={motivo.id}>
                            <TableCell>
                              <Badge variant="outline" >
                                {motivo?.nome_ocorrencia || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{motivo.nome}</TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                              {motivo.descricao || '-'}
                            </TableCell>

                            <TableCell>
                              {motivo.situacao === 'A' ? (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Ativo
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="gap-1">
                                  <XCircle className="w-3 h-3" />
                                  Inativo
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center gap-2 justify-end">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditMotivo(motivo)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteMotivo(motivo.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== ABA RESPOSTAS ========== */}
        <TabsContent value="respostas" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Respostas Padrão</CardTitle>
                  <CardDescription>
                    Gerencie respostas pré-definidas para ocorrências
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={fetchRespostasOcorrencia}
                    disabled={loadingRespostas}
                  >
                    {loadingRespostas ? (
                      <>
                        <div className="w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin mr-2" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Buscar
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setFormResposta({ desc_resposta_ocorrencia: '' });
                      setDialogResposta({ open: true, mode: 'create' });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Resposta
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loadingRespostas ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                          <span>Carregando respostas...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : errorRespostas ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-destructive">
                        {errorRespostas}
                        <Button variant="ghost" size="sm" className="ml-4" onClick={fetchRespostasOcorrencia}>
                          Tentar novamente
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : respostas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
                        Nenhuma resposta encontrada. Clique em "Buscar".
                      </TableCell>
                    </TableRow>
                  ) : (
                    respostas.map((resposta) => (
                      <TableRow key={resposta.id}>
                        <TableCell className="font-medium max-w-md truncate">
                          {resposta.desc_resposta_ocorrencia}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const statusInfo = getStatusInfo(resposta.situacao);
                            return (
                              <Badge variant={statusInfo.variant} className="font-medium">
                                {statusInfo.label}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditResposta(resposta)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteResposta(resposta.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== ABA GRUPO ========== */}
        <TabsContent value="grupo" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Grupos de Permissão</CardTitle>
                  <CardDescription>
                    Gerencie grupos para controle de registro de ocorrências
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={fetchGrupos}
                    disabled={loadingGrupos}
                  >
                    {loadingGrupos ? (
                      <>
                        <div className="w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin mr-2" />
                        Carregando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Buscar
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      setFormGrupo({ desc_grupo: '', situacao: 'A' });
                      setDialogGrupo({ open: true, mode: 'create' });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Grupo
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {loadingGrupos ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                          <span>Carregando grupos...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : errorGrupos ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-destructive">
                        {errorGrupos}
                        {/* <Button variant="ghost" size="sm" className="ml-4" onClick={fetchGrupos}>
                          Tentar novamente
                        </Button> */}
                      </TableCell>
                    </TableRow>
                  ) : grupos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        Nenhum grupo encontrado. Clique em "Buscar".
                      </TableCell>
                    </TableRow>
                  ) : (
                    grupos.map((grupo) => (
                      <TableRow key={grupo.id}>
                        <TableCell className="font-medium max-w-md">
                          {grupo.desc_grupo}
                        </TableCell>
                        <TableCell>
                          <Badge variant={grupo.situacao === 'A' ? 'default' : 'secondary'}>
                            {grupo.situacao === 'A' ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditGrupo(grupo)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteGrupo(grupo.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== ABA DEPARTAMENTOS POR GRUPOS ========== */}
        <TabsContent value="dpto/grupo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Departamentos por Grupo</CardTitle>
              <CardDescription>
                Selecione um grupo e vincule/desvincule departamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Seleção de Grupo */}
              <div className="flex items-center gap-4">
                <Label className="w-32">Grupo:</Label>
                <Select
                  value={grupoSelecionadoDpto?.id?.toString() || ""}
                  onValueChange={(v) => {
                    const grupo = grupos.find(g => g.id === Number(v)) || null;
                    setGrupoSelecionadoDpto(grupo);
                    if (grupo) fetchDepartamentosDoGrupo(grupo.id);
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Selecione um grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {grupos.map(g => (
                      <SelectItem key={g.id} value={g.id.toString()}>
                        {g.desc_grupo} ({g.situacao === 'A' ? 'Ativo' : 'Inativo'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" disabled={loadingGrupos} onClick={() => {
                  fetchGrupos();
                }}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Buscar
                </Button>
              </div>

              {/* Departamentos Vinculados */}
              {grupoSelecionadoDpto && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">Departamentos Vinculados</h4>

                    {loadingVinculos ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                      </div>
                    ) : departamentosVinculados.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">
                        Nenhum departamento vinculado.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {departamentosVinculados.map(depto => (
                          <div
                            key={depto.ID_GRUPODPTO}
                            className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                          >
                            <div>
                              <p className="font-medium">{depto.DESC_DEPARTAMENTO}</p>
                              <p className="text-sm text-muted-foreground">
                                Código: {depto.COD_DEPARTAMENTO}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removerDepartamentoDoGrupo(depto.ID_GRUPODPTO)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-6 h-6" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />


                  {/* Adicionar Novo Departamento */}
                  <div>
                    <h4 className="font-medium mb-3">Adicionar Departamento</h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Buscar departamento..."
                        value={searchDepto}
                        onChange={(e) => setSearchDepto(e.target.value)}
                        className="w-64"
                      />
                      <Button onClick={fetchTodosDepartamentos} disabled={loadingDeptos} variant="outline">
                        <RefreshCw className={loadingDeptos ? "w-4 h-4 mr-2 animate-spin" : "w-4 h-4 mr-2"} />
                        {loadingDeptos ? "Buscando..." : "Buscar"}
                      </Button>
                    </div>

                    {loadingDeptos ? (
                      <p className="text-sm text-muted-foreground mt-2">Carregando departamentos...</p>
                    ) : todosDepartamentos.length === 0 ? (
                      <p className="text-sm text-muted-foreground mt-2">Nenhum departamento disponível. Clique em "Carregar".</p>
                    ) : (
                      <div className="mt-3 max-h-64 overflow-y-auto border rounded-lg">
                        {/* === ÚNICO FILTRO + MAP === */}
                        {todosDepartamentos

                          .filter(d => {
                            const desc = (d.DESCRICAO ?? '').toLowerCase();
                            const codigo = (d.COD_DEPARTAMENTO?.toString() ?? '');
                            const termo = searchDepto.toLowerCase().trim();
                            return termo === '' || desc.includes(termo) || codigo.includes(termo);
                          })
                          .filter(d => !departamentosVinculados.some(v => v.COD_DEPARTAMENTO === d.COD_DEPARTAMENTO))

                          .map(depto => (
                            <div
                              key={depto.COD_DEPARTAMENTO}
                              className="flex items-center justify-between p-2 hover:bg-muted cursor-pointer border-b last:border-b-0"
                              onClick={() => adicionarDepartamentoAoGrupo(depto.COD_DEPARTAMENTO)}
                            >
                              <div>
                                <p className="font-medium text-sm">{depto.DESCRICAO}</p>
                                <p className="text-xs text-muted-foreground">Cód: {depto.COD_DEPARTAMENTO}</p>
                              </div>
                              <Plus className="w-6 h-6 text-green-600" />
                            </div>
                          ))}

                        {/* Mensagem se não houver resultados */}
                        {todosDepartamentos
                          .filter((d): d is Departamento => !!d && typeof d?.COD_DEPARTAMENTO === 'number' && typeof d?.DESCRICAO === 'string')
                          .filter(d => {
                            const desc = (d.DESCRICAO ?? '').toLowerCase();
                            const codigo = (d.COD_DEPARTAMENTO?.toString() ?? '');
                            const termo = searchDepto.toLowerCase().trim();
                            return termo !== '' && (desc.includes(termo) || codigo.includes(termo));
                          })
                          .filter(d => !departamentosVinculados.some(v => v.COD_DEPARTAMENTO === d.COD_DEPARTAMENTO))
                          .length === 0 && searchDepto && (
                            <p className="text-center text-muted-foreground py-4 text-sm">
                              Nenhum departamento encontrado para "{searchDepto}"
                            </p>
                          )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========== ABA FUNCIONARIOS POR GRUPOS ========== */}
        <TabsContent value="func/grupo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Funcionários por Grupo</CardTitle>
              <CardDescription>
                Selecione um grupo e vincule/desvincule funcionários
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Seleção de Grupo */}
              <div className="flex items-center gap-4">
                <Label className="w-32">Grupo:</Label>
                <Select
                  value={grupoSelecionadoFunc?.id?.toString() || ""}
                  onValueChange={(v) => {
                    const grupo = grupos.find(g => g.id === Number(v)) || null;
                    setGrupoSelecionadoFunc(grupo);
                    if (grupo) {
                      fetchFuncionariosDoGrupo(grupo.id);
                      setSearchFunc(''); // Limpa busca
                    }
                  }}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Selecione um grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {grupos.map(g => (
                      <SelectItem key={g.id} value={g.id.toString()}>
                        {g.desc_grupo} ({g.situacao === 'A' ? 'Ativo' : 'Inativo'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={fetchGrupos} disabled={loadingGrupos}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Carregar
                </Button>
              </div>

              {/* Funcionários Vinculados */}
              {grupoSelecionadoFunc && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">Funcionários Vinculados</h4>

                    {loadingVinculosFunc ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                      </div>
                    ) : funcionariosVinculados.length === 0 ? (
                      <p className="text-center text-muted-foreground py-6">
                        Nenhum funcionário vinculado.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {funcionariosVinculados.map(func => (
                          <div
                            key={func.id_func_grupo}
                            className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                          >
                            <div>
                              <p className="font-medium">{func.COD_FUNCIONARIO} - {func.NOME_FUNCIONARIO}</p>
                              <p className="text-sm text-muted-foreground">
                                {func.DESC_DEPARTAMENTO}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removerFuncionarioDoGrupo(func.ID_FUNC_GRUPO)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Adicionar Novo Funcionário */}
                  <div>
                    <h4 className="font-medium mb-3">Adicionar Funcionário</h4>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Digite o crachá e pressione Enter"
                        value={formData.codigo}
                        onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter" && formData.codigo.trim()) {
                            await buscarEAdicionarColaborador(formData.codigo.trim());
                          }
                        }}
                        disabled={isLoadingUser}
                      />
                      <Button
                        type="button"
                        onClick={() => formData.codigo.trim() && buscarEAdicionarColaborador(formData.codigo.trim())}
                        disabled={isLoadingUser || !formData.codigo.trim()}
                      >
                        {isLoadingUser ? "Buscando..." : "Buscar"}
                      </Button>

                      <Button
                        onClick={salvarColaboradoresSelecionados}
                        disabled={isSaving || colaboradoresSelecionados.length === 0}
                        className="flex items-center gap-2"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Salvar Selecionados ({colaboradoresSelecionados.length})
                          </>
                        )}
                      </Button>
                    </div>

                    {colaboradoresSelecionados.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md px-3 py-2 mt-02">
                        {colaboradoresSelecionados.map((col) => (
                          <div
                            key={col.codigo}
                            className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-md text-sm"
                          >
                            <div>
                              <span className="font-medium">{col.codigo}</span> - {col.nome}
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setColaboradoresSelecionados(prev =>
                                  prev.filter(c => c.codigo !== col.codigo)
                                );
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground px-3 py-2 mt-02">Nenhum colaborador selecionado</p>
                    )}

                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>


      </Tabs>

      {/* ========== DIALOG TIPO ========== */}
      <Dialog open={dialogTipo.open} onOpenChange={(open) => setDialogTipo({ ...dialogTipo, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogTipo.mode === 'create' ? 'Novo Tipo de Ocorrência' : 'Editar Tipo'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do tipo de ocorrência
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tipo-nome">Nome *</Label>
              <Input
                id="tipo-nome"
                value={formTipo.nome}
                onChange={(e) => setFormTipo({ ...formTipo, nome: e.target.value })}
                placeholder="Ex: Mudança de Escala"
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formTipo.nome.length}/30
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo-descricao">Descrição (opcional)</Label>
              <Textarea
                id="tipo-descricao"
                value={formTipo.descricao}
                onChange={(e) => setFormTipo({ ...formTipo, descricao: e.target.value })}
                placeholder="Descrição opcional"
                rows={3}
                maxLength={100}
              />
               <p className="text-xs text-muted-foreground text-right">
                {formTipo.descricao.length}/100
              </p>
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="tipo-cor">Cor</Label>
              <Input
                id="tipo-cor"
                type="color"
                value={formTipo.cor}
                onChange={(e) => setFormTipo({ ...formTipo, cor: e.target.value })}
              />
            </div> */}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo-situacao">Situação *</Label>
            <Select
              value={formTipo.situacao}
              onValueChange={(value) => setFormTipo({ ...formTipo, situacao: value })}
            >
              <SelectTrigger id="tipo-situacao">
                <SelectValue placeholder="Selecione a situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Ativo
                  </div>
                </SelectItem>
                <SelectItem value="I">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Inativo
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogTipo({ open: false, mode: 'create' })}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveTipo}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== DIALOG MOTIVO ========== */}
      <Dialog open={dialogMotivo.open} onOpenChange={(open) => setDialogMotivo({ ...dialogMotivo, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMotivo.mode === 'create' ? 'Novo Motivo' : 'Editar Motivo'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados do motivo de ocorrência
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivo-tipo">Tipo de Ocorrência *</Label>

              <Select
                value={formMotivo.tipoId}
                onValueChange={(value) =>
                  setFormMotivo({ ...formMotivo, tipoId: value })
                }
              >
                <SelectTrigger id="motivo-tipo">
                  <SelectValue placeholder="Selecione o tipo">
                    {/* Mostra o nome do tipo selecionado com badge colorido */}
                    {formMotivo.tipoId && (
                      <div
                        variant="outline"
                        style={{
                          borderColor:
                            tipos.find((t) => t.id === Number(formMotivo.tipoId))?.cor ||
                            '#ccc',
                        }}
                        className="mr-2"
                      >
                        {tipos.find((t) => t.id === Number(formMotivo.tipoId))?.nome ||
                          'Tipo não encontrado'}
                      </div>
                    )}
                    {!formMotivo.tipoId && 'Selecione o tipo'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {tipos
                    .filter((t) => t.ativo)
                    .map((tipo) => (
                      <SelectItem key={tipo.id} value={String(tipo.id)}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"

                          />
                          {tipo.nome}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo-nome">Nome *</Label>
              <Input
                id="motivo-nome"
                value={formMotivo.nome}
                onChange={(e) => setFormMotivo({ ...formMotivo, nome: e.target.value })}
                placeholder="Ex: Consulta médica"
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formMotivo.nome.length}/30
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="motivo-descricao">Descrição (opcional)</Label>
              <Textarea
                id="motivo-descricao"
                value={formMotivo.descricao}
                onChange={(e) => setFormMotivo({ ...formMotivo, descricao: e.target.value })}
                placeholder="Descrição opcional"
                maxLength={100}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formMotivo.descricao.length}/100
              </p>
            </div>


          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo-situacao">Situação *</Label>
            <Select
              value={formMotivo.situacao}
              onValueChange={(value) => setFormMotivo({ ...formMotivo, situacao: value })}
            >
              <SelectTrigger id="motivo-situacao">
                <SelectValue placeholder="Selecione a situação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Ativo
                  </div>
                </SelectItem>
                <SelectItem value="I">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    Inativo
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogMotivo({ open: false, mode: 'create' })}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveMotivo}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== DIALOG RESPOSTA ========== */}
      <Dialog open={dialogResposta.open} onOpenChange={(open) => setDialogResposta({ ...dialogResposta, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogResposta.mode === 'create' ? 'Nova Resposta' : 'Editar Resposta'}
            </DialogTitle>
            <DialogDescription>
              Configure uma resposta padrão para uso em ocorrências
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resposta-desc">Descrição *</Label>
              <Textarea
                id="resposta-desc"
                value={formResposta.desc_resposta_ocorrencia}
                onChange={(e) => setFormResposta({ desc_resposta_ocorrencia: e.target.value })}
                placeholder="Ex: Aprovado pelo gestor"
                maxLength={100}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formResposta.desc_resposta_ocorrencia.length}/100
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Situação *</Label>
            <Select
              value={formResposta.situacao}
              onValueChange={(v) => setFormResposta({ ...formResposta, situacao: v as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PE">
                  <div className="flex items-center gap-2">
                    <div  />
                    Pendente
                  </div>
                </SelectItem>
                <SelectItem value="AP">
                  <div className="flex items-center gap-2">
                    <div />
                    Aprovada
                  </div>
                </SelectItem>
                <SelectItem value="RE">
                  <div className="flex items-center gap-2">
                    <div  />
                    Rejeitada
                  </div>
                </SelectItem>
                {/* <SelectItem value="AN">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    Em Análise
                  </div>
                </SelectItem> */}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogResposta({ open: false, mode: 'create' })}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveResposta}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== DIALOG GRUPOS ========== */}
      <Dialog open={dialogGrupo.open} onOpenChange={(open) => setDialogGrupo({ ...dialogGrupo, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogGrupo.mode === 'create' ? 'Novo Grupo' : 'Editar Grupo'}
            </DialogTitle>
            <DialogDescription>
              Configure um grupo para permissão de registro de ocorrências
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grupo-desc">Descrição *</Label>
              <Input
                id="grupo-desc"
                value={formGrupo.desc_grupo}
                onChange={(e) => setFormGrupo({ ...formGrupo, desc_grupo: e.target.value })}
                placeholder="Ex: RH, AGRO, TEC"
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formGrupo.desc_grupo.length}/30
              </p>
            </div>

            <div className="space-y-2">
              <Label>Situação *</Label>
              <Select
                value={formGrupo.situacao}
                onValueChange={(v) => setFormGrupo({ ...formGrupo, situacao: v as 'A' | 'I' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      Ativo
                    </div>
                  </SelectItem>
                  <SelectItem value="I">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                      Inativo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogGrupo({ open: false, mode: 'create' })}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveGrupo}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========== DIALOG FUNCIONARIO ========== */}
      <Dialog open={dialogGrupo.open} onOpenChange={(open) => setDialogGrupo({ ...dialogGrupo, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogGrupo.mode === 'create' ? 'Novo Grupo' : 'Editar Grupo'}
            </DialogTitle>
            <DialogDescription>
              Configure um grupo para permissão de registro de ocorrências
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="grupo-desc">Descrição *</Label>
              <Input
                id="grupo-desc"
                value={formGrupo.desc_grupo}
                onChange={(e) => setFormGrupo({ ...formGrupo, desc_grupo: e.target.value })}
                placeholder="Ex: RH, AGRO, TEC"
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formGrupo.desc_grupo.length}/30
              </p>
            </div>

            <div className="space-y-2">
              <Label>Situação *</Label>
              <Select
                value={formGrupo.situacao}
                onValueChange={(v) => setFormGrupo({ ...formGrupo, situacao: v as 'A' | 'I' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      Ativo
                    </div>
                  </SelectItem>
                  <SelectItem value="I">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                      Inativo
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogGrupo({ open: false, mode: 'create' })}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSaveGrupo}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}