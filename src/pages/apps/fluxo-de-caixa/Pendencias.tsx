import { useMemo, useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp, Pencil, RotateCcw, Search, Filter, Loader2, Brush, ArrowUpDown } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useMovimentacao } from "@/pages/apps/fluxo-de-caixa/hooks/use-pendencias";
import { upsertPendencia } from "@/pages/apps/fluxo-de-caixa/lib/api";
import { useGef } from "@/pages/apps/fluxo-de-caixa/hooks/use-gef";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

/* --------------------------------------------------------------------------------
 * Tipos que vêm da API (mantemos as chaves em UPPERCASE para casar com o backend)
 * Incluí DATA_SUGERIDA?, pois ela pode ou não vir do join/consulta
 * -------------------------------------------------------------------------------*/
type ApiMov = {
  COD_GRUPOEMPRESA: number;
  COD_EMPRESA: number;
  COD_FILIAL: number;
  COD_TIPOCONTASPAGAR: number;
  DESCRICAO: string;
  DOCUMENTO: number;
  PARCELA: number | null;
  DATAVCTO: string | null;
  DATA_SUGERIDA?: string | null;
  COD_TIPOCOBRANCA: number | null;
  DESCRICAOTIPOCOBRANCA: string | null;
  COD_EMPENHO: number | null;
  DESC_EMPENHO: string | null;
  COD_FORNECEDOR: number | null;
  DESC_FORNECEDOR: string | null;
  COD_SITUACAO: number | null;
  DESC_SITUACAO: string | null;
  VALORPARCELA: number;
  DATAPGTO: string | null;
  CONFIRMAPAGAMENTO: any;
  VALORPAGO: number | null;
  DATAENTRADA: string | null;
  OBSERVACAO: string | null;
  ORIGEM: number | null;
  DESC_ORIGEM: string | null;
  PROVISAO: "S" | "N" | null;
  DATAENTRADANF: string | null;
  DATAVCTO_ORIG: string | null;
  PARCELABAIXADA: "S" | "N" | null;
  TIPO: "R" | "P";
  DESC_TIPO: "Receber" | "Pagar";
};

/* --------------------------------------------------------------------------------
 * Tipo que usamos na UI (normalizamos datas e adicionamos metadados p/ update)
 * -------------------------------------------------------------------------------*/
type MovimentacaoUI = {
  id: string;
  descricao: string;
  documento: number;
  valor: number;
  valorPago: number | null;
  data_original: string;         // YYYY-MM-DD
  data_sugerida: string | null;  // YYYY-MM-DD | null
  banco_id: string;
  tipo: "pagar" | "receber";
  situacao: "pendente" | "realizado";
  desc_situacao: string;
  bancos: { nome: string };
  created_at: string;            // YYYY-MM-DD
  updated_at: string;            // ISO date-ish
  meta: {
    cod_grupoempresa: number;
    cod_tipocontaspagar: number;
    documento: number;
    parcela: number | null;
  };
};

/* --------------------------------------------------------------------------------
 * Utils: moeda e datas
 * - toISODate: normaliza string para 'YYYY-MM-DD' usando Date (cuidado com fuso)
 * - pickISODate: aceita 'YYYY-MM-DDTHH:mm...' ou 'DD/MM/YYYY' e retorna 'YYYY-MM-DD'
 *   (quando nada bater, tenta toISODate como fallback)
 * - T12 no render: ao converter para locale, somo 'T12:00:00' p/ evitar problemas de fuso/DST
 * -------------------------------------------------------------------------------*/
const currencyBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const toISODate = (d?: string | null) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

const pickISODate = (s?: string | null) => {
  if (!s) return "";
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/); // '2025-09-19T03:00:00.000Z' -> '2025-09-19'
  if (m) return m[1];
  const br = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); // '17/09/2025' -> '2025-09-17'
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return toISODate(s);
};

/* --------------------------------------------------------------------------------
 * Mapper: ApiMov[] -> MovimentacaoUI[]
 * - Garante datas em ISO (YYYY-MM-DD) para a UI
 * - Define 'situacao' baseado na descrição de situação
 * -------------------------------------------------------------------------------*/
const mapApiToUI = (items: ApiMov[]): MovimentacaoUI[] =>
  items.map((it, idx) => {
    const id = `${it.COD_EMPRESA}-${it.DOCUMENTO}-${it.PARCELA ?? idx}`;

    const dataOriginal =
      toISODate(it.DATAVCTO) ||
      toISODate(it.DATAVCTO_ORIG) ||
      toISODate(it.DATAENTRADA) ||
      "";

    const dataSugeridaISO = pickISODate(it.DATA_SUGERIDA);

    const situacao: MovimentacaoUI["situacao"] =
      (it.DESC_SITUACAO ?? "").toUpperCase().includes("REALIZ") ||
        (it.DESC_SITUACAO ?? "").toUpperCase().includes("PAGO")
        ? "realizado"
        : "pendente";

    return {
      id,
      descricao: it.DESCRICAO ?? `Doc ${it.DOCUMENTO}`,
      documento: it.DOCUMENTO,
      valor: Number(it.VALORPARCELA ?? 0),
      valorPago: it.VALORPAGO ?? null,
      data_original: dataOriginal,
      data_sugerida: dataSugeridaISO || null,
      banco_id: String(it.COD_FORNECEDOR ?? it.COD_EMPRESA),
      tipo: it.TIPO === "R" ? "receber" : "pagar",
      situacao,
      desc_situacao: it.DESC_SITUACAO ?? "—",
      bancos: { nome: it.DESC_FORNECEDOR ?? it.DESCRICAOTIPOCOBRANCA ?? "—" },
      created_at: toISODate(it.DATAENTRADA) || new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
      meta: {
        cod_grupoempresa: it.COD_GRUPOEMPRESA,
        cod_tipocontaspagar: it.COD_TIPOCONTASPAGAR,
        documento: it.DOCUMENTO,
        parcela: it.PARCELA ?? null,
      },
    };
  });

/* =================================================================================
 * Componente principal
 * =================================================================================*/
const Movimentacoes = () => {
  const { token } = useAuth();

  const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');

  /* ------------------------ Filtros de busca (datas) ------------------------ */
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");

  /* ------------------------ Busca de dados do hook -------------------------- */
  const { movimentacoes2, loading2, error, fetchData } = useMovimentacao();
  const { gef, loadingGef, errorGef, fetchDataGef } = useGef();
  const [gefSelecionado, setGefSelecionado] = useState<any>(null);


  useEffect(() => { fetchDataGef(); }, [fetchDataGef]);

  const getGefKey = (item: any) =>
    `${item.COD_GRUPOEMPRESA}-${item.COD_EMPRESA}-${item.COD_FILIAL}`;


  const [fornecedorId, setFornecedorId] = useState<string>("");
  const [fornecedor, setFornecedor] = useState<any>(null);

  const [loadingFornecedor, setLoadingFornecedor] = useState(false);
  const limparFornecedor = () => {
    setFornecedorId("");
    setFornecedor("");
  };

  const buscarFornecedor = async () => {
    if (!fornecedorId) {
      toast({ title: "Erro", description: "Digite um ID válido", variant: "destructive" });
      return;
    }

    setLoadingFornecedor(true);
    setFornecedor(null);

    try {
      const res = await fetch(`${urlApi}/fluxo-caixa/consultar-fornecedor/${fornecedorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 404) throw new Error("Fornecedor não encontrado.");
        throw new Error("Erro ao consultar fornecedor.");
      }

      const data = await res.json();
      setFornecedor(data);

      toast({
        title: "Fornecedor encontrado",
        description: `${data.nome || data.NOME || "Fornecedor"} carregado.`,
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Erro",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoadingFornecedor(false);
    }
  };



  const [sorting, setSorting] = useState<{
    column: keyof typeof g.items[0] | null;
    direction: "asc" | "desc";
  }>({
    column: null,
    direction: "asc",
  });

  const getSortedGroups = () => {
    const groupsCopy = [...groups];

    groupsCopy.forEach((group) => {
      if (!sorting.column) {
        group.items.sort((a, b) => new Date(b.data_original || "").getTime() - new Date(a.data_original || "").getTime());
        return;
      }

      group.items.sort((a: any, b: any) => {
        let aValue = a[sorting.column];
        let bValue = b[sorting.column];

        // Tratamento especial para datas (data_original e data_sugerida)
        if (sorting.column === "data_original" || sorting.column === "data_sugerida") {
          aValue = aValue ? new Date(aValue + "T12:00:00").getTime() : 0;
          bValue = bValue ? new Date(bValue + "T12:00:00").getTime() : 0;
        }

        // Tratamento para valores numéricos
        if (sorting.column === "valor") {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        }

        // Tratamento para strings
        if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sorting.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sorting.direction === "asc" ? 1 : -1;
        return 0;
      });
    });

    return groupsCopy;
  };



  const onCarregar = useCallback(() => {
    if (dataInicio && dataFim && dataInicio > dataFim) {
      alert("Data início não pode ser maior que data fim.");
      return;
    }

    if (!gefSelecionado || !gefSelecionado.COD_GRUPOEMPRESA) {
      toast({
        title: "Selecione uma empresa",
        description: "Escolha uma empresa/filial para continuar.",
        variant: "destructive",
      });
      return;
    }

    // monta payload de filtros
    const payload: any = {
      dataInicio,
      dataFim,
      codGrupoEmpresa: gefSelecionado.COD_GRUPOEMPRESA,
      codEmpresa: gefSelecionado.COD_EMPRESA,
      codFilial: gefSelecionado.COD_FILIAL,
      codFornecedor: fornecedorId,
    };

    // se houver fornecedor encontrado, envia o código (nome do bind depende da sua API)
    if (fornecedor && (fornecedor.cod_fornecedor || fornecedor.COD_FORNECEDOR || fornecedor.id)) {
      payload.codFornecedor =
        fornecedor.cod_fornecedor ?? fornecedor.COD_FORNECEDOR ?? fornecedor.id;
    } else if (fornecedorId && !fornecedor) {
      // se digitou ID mas não buscou/existe, avisa (opcional)
      toast({
        title: "Fornecedor não carregado",
        description: "Digite o ID e clique em Buscar para carregar o fornecedor.",
        variant: "destructive",
      });
      return;
    }

    fetchData(payload);
  }, [
    dataInicio,
    dataFim,
    gefSelecionado,
    fornecedor,
    fornecedorId,
    fetchData,

  ]);


  /* ------------------------ Normalização p/ UI ------------------------------ */
  const movsUI = useMemo(
    () => mapApiToUI((movimentacoes2 ?? []) as ApiMov[]),
    [movimentacoes2]
  );

  /* ------------------------ Estado do modal de edição ----------------------- */
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMovimentacao, setEditingMovimentacao] = useState<{
    ui: MovimentacaoUI;
    api: ApiMov;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ data_sugerida: "" }); // sempre YYYY-MM-DD ou ""


  // Adicione esse estado
  const [pendenciasOriginais, setPendenciasOriginais] = useState<ApiMov[]>([]);

  // No seu hook useMovimentacao, quando receber os dados:
  useEffect(() => {
    if (movimentacoes2) {
      setPendenciasOriginais(movimentacoes2 as ApiMov[]);
    }
  }, [movimentacoes2]);

  // No onEdit:
  const onEdit = useCallback((m: MovimentacaoUI) => {
    // Busca o registro completo vindo da API (não o normalizado)
    const originalApiItem = (movimentacoes2 as ApiMov[] | undefined)?.find(item =>
      item.DOCUMENTO === m.documento &&
      (item.PARCELA ?? 0) === (m.meta.parcela ?? 0) &&
      item.COD_TIPOCONTASPAGAR === m.meta.cod_tipocontaspagar &&
      item.COD_GRUPOEMPRESA === m.meta.cod_grupoempresa
    );

    if (!originalApiItem) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados completos da pendência.",
        variant: "destructive",
      });
      return;
    }

    setEditingMovimentacao({
      ui: m,
      api: originalApiItem,
    });

    setFormData({ data_sugerida: m.data_sugerida || "" });
    setDialogOpen(true);
  }, [movimentacoes2]);

  /* ------------------------ Salvar (upsert) data_sugerida ------------------- */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovimentacao) return;

    try {
      setSaving(true);

      await upsertPendencia({
        cod_grupoempresa: editingMovimentacao.ui.meta.cod_grupoempresa,
        cod_tipocontaspagar: editingMovimentacao.ui.meta.cod_tipocontaspagar,
        documento: editingMovimentacao.ui.meta.documento,
        parcela: editingMovimentacao.ui.meta.parcela ?? 0,
        data_sugerida: formData.data_sugerida?.trim() || null,
      });

      toast({
        title: "Sucesso",
        description: "Data sugerida atualizada com sucesso!"
      });

      setDialogOpen(false);
      setEditingMovimentacao(null);
      setFormData({ data_sugerida: "" });

      // Refetch para atualizar a lista
      fetchData({ dataInicio, dataFim });
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description: err?.message ?? "Falha ao atualizar a pendência.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }, [
    editingMovimentacao,
    formData.data_sugerida,
    dataInicio,
    dataFim,
    fetchData
  ]);

  /* ------------------------ Filtros de UI (tipo/situação/descrição) -------- */
  const [activeTab, setActiveTab] = useState<"todas" | "pagar" | "receber">("todas");
  const [descSituacaoFilter, setDescSituacaoFilter] = useState<string>("all");
  const [descricaoFilter, setDescricaoFilter] = useState<string>("all");

  // opções únicas para select de situação (ex.: "A RECEBER", "PAGO", etc.)
  const descSituacoes = useMemo(() => {
    const s = new Set<string>();
    movsUI.forEach((m) => {
      const label = (m.desc_situacao ?? "—").trim();
      if (label) s.add(label);
    });
    return ["all", ...Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [movsUI]);

  // aplica filtros de tipo e situação
  const filteredMovimentacoes = useMemo(() => {
    return movsUI.filter((mov) => {
      if (activeTab === "pagar" && mov.tipo !== "pagar") return false;
      if (activeTab === "receber" && mov.tipo !== "receber") return false;
      if (descSituacaoFilter !== "all" && (mov.desc_situacao ?? "—") !== descSituacaoFilter) return false;
      return true;
    });
  }, [movsUI, activeTab, descSituacaoFilter]);

  /* ------------------------ Agrupamento por descrição ----------------------- */
  type Group = {
    descricao: string;
    items: MovimentacaoUI[];
    count: number;
    totalReceber: number;
    totalPagar: number;
    totalLiquido: number;
  };

  // options únicas para select de descrição
  const descricaoOptions = useMemo(() => {
    const s = new Set<string>();
    filteredMovimentacoes.forEach((m) => {
      const k = (m.descricao || "—").trim();
      if (k) s.add(k);
    });
    return ["all", ...Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [filteredMovimentacoes]);

  // efetivo agrupamento
  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Group>();
    for (const m of filteredMovimentacoes) {
      const key = (m.descricao || "—").trim();
      if (descricaoFilter !== "all" && key !== descricaoFilter) continue;

      if (!map.has(key)) {
        map.set(key, {
          descricao: key,
          items: [],
          count: 0,
          totalReceber: 0,
          totalPagar: 0,
          totalLiquido: 0,
        });
      }
      const g = map.get(key)!;
      g.items.push(m);
      g.count += 1;
      if (m.tipo === "receber") g.totalReceber += m.valor;
      else g.totalPagar += m.valor;
      g.totalLiquido = g.totalReceber - g.totalPagar;
    }
    return Array.from(map.values()).sort((a, b) => a.descricao.localeCompare(b.descricao, "pt-BR"));
  }, [filteredMovimentacoes, descricaoFilter]);



  /* ------------------------ Totais (cards) ---------------------------------- */
  const totalAReceber = useMemo(
    () => filteredMovimentacoes.filter((m) => m.tipo === "receber" && m.situacao === "pendente")
      .reduce((sum, m) => sum + m.valor, 0),
    [filteredMovimentacoes]
  );

  const totalAPagar = useMemo(
    () => filteredMovimentacoes.filter((m) => m.tipo === "pagar" && m.situacao === "pendente")
      .reduce((sum, m) => sum + m.valor, 0),
    [filteredMovimentacoes]
  );

  const saldoLiquido = totalAReceber - totalAPagar;

  /* ------------------------ Loading/erro ------------------------------------ */
  if (loading2) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando movimentações...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // opcional: tratar erro do hook de forma amigável
    // @ts-ignore (dependendo do tipo do error no hook)
    const message = error?.message || "Falha ao carregar dados.";
    return <p className="text-destructive">{message}</p>;
  }

  const formatDateBR = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-BR");
    } catch {
      return "—";
    }
  };



  const SortableTableHead = ({
    children,
    column,
  }: {
    children: React.ReactNode;
    column: keyof (typeof groups)[0]["items"][0];
  }) => {
    const isSorted = sorting.column === column;
    const direction = isSorted ? sorting.direction : "asc";

    return (
      <TableHead
        className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
        onClick={() => {
          if (isSorted) {
            setSorting({
              column,
              direction: direction === "asc" ? "desc" : "asc",
            });
          } else {
            setSorting({ column, direction: "asc" });
          }
        }}
      >
        <div className="flex items-center justify-between">
          {children}
          {isSorted && (
            <span className="ml-2">
              {direction === "asc" ? (
                <ArrowUp className="h-3 w-3" />
              ) : (
                <ArrowDown className="h-3 w-3" />
              )}
            </span>
          )}
          {!isSorted && <ArrowUpDown className="h-3 w-3 ml-2 opacity-30" />}
        </div>
      </TableHead>
    );
  };

  /* ------------------------ Render ----------------------------------------- */
  return (
    <div className="space-y-6">
      {/* Filtro por datas */}

      <Card className="w-full border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filtros
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* GRID: 1 col mobile, 2 cols sm, 3 cols md, 6 cols lg.
        Reservamos col-span para inputs maiores e uma coluna fixa para ações. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">



            {/* Empresa/Filial */}
            <div className="space-y-2 col-span-1 md:col-span-1 lg:col-span-1">
              <Label className="text-sm font-medium">Empresa/Filial</Label>
              {loadingGef ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando empresas...
                </div>
              ) : errorGef ? (
                <p className="text-xs text-red-600">Erro ao carregar empresas</p>
              ) : (
                <Select
                  value={gefSelecionado ? getGefKey(gefSelecionado) : ""}
                  onValueChange={(value) => {
                    const selecionado = gef.find((g) => getGefKey(g) === value);
                    setGefSelecionado(selecionado || null);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione uma empresa/filial" />
                  </SelectTrigger>
                  <SelectContent>
                    {gef.map((item) => (
                      <SelectItem key={getGefKey(item)} value={getGefKey(item)}>
                        {item.NOMEFANTASIA}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {/* Data Início */}
            <div className="space-y-1.5 col-span-1">
              <Label htmlFor="data-inicio" className="text-sm font-medium">Data Início</Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="h-9 w-full"
              />
            </div>

            {/* Data Fim */}
            <div className="space-y-1.5 col-span-1">
              <Label htmlFor="data-fim" className="text-sm font-medium">Data Fim</Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="h-9 w-full"
              />
            </div>

            {/* Fornecedor ID (ocupa mais espaço em telas grandes) */}
            <div className="col-span-1 md:col-span-1 lg:col-span-1 space-y-1.5">
              <Label className="text-sm font-medium">Código do Fornecedor</Label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="h-9 w-full border rounded px-2"
                  placeholder="ID do fornecedor"
                  value={fornecedorId}
                  onChange={(e) => setFornecedorId(e.target.value)}
                  aria-label="ID do fornecedor"
                />

                <Button
                  onClick={buscarFornecedor}
                  disabled={loadingFornecedor}
                  className="h-9 px-3 shrink-0"
                  aria-label="Buscar fornecedor"
                >
                  {loadingFornecedor ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>

                {/* Botão de limpar */}
                <Button
                  variant="secondary"
                  onClick={limparFornecedor}
                  className="h-9 px-3 shrink-0"
                  aria-label="Limpar fornecedor"
                >
                  <Brush className="w-4 h-4" />
                </Button>
              </div>



            </div>

            <div className="space-y-2 col-span-1 md:col-span-1 lg:col-span-1">
              <Label className="text-sm font-medium">Descrição Fornecedor</Label>
              <Input
                type="text"
                className="h-9 w-full border rounded px-2 mt-1"
                placeholder="Fornecedor"
                value={fornecedor?.DESC_FORNECEDOR || ""}
                disabled
                aria-label="Resumo do fornecedor"
              />
            </div>

          </div>

          <div className="flex gap-3 justify-end">
            <Button
              onClick={onCarregar}
              className="h-9 px-4 font-medium"
              disabled={loading2}
            >
              {loading2 ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Carregar
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setDataInicio("");
                setDataFim("");
                setFornecedor(null);
                setFornecedorId("");
                setGefSelecionado(null);
              }}
              className="h-9 px-4"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>

        </CardContent>
      </Card>


      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Receber</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{currencyBRL(totalAReceber)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{currencyBRL(totalAPagar)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            {saldoLiquido >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoLiquido >= 0 ? "text-success" : "text-destructive"}`}>
              {currencyBRL(saldoLiquido)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros de UI + Lista */}
      <Card>
        <CardHeader />
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "todas" | "pagar" | "receber")}>
            <TabsContent value={activeTab} className="mt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">

                {/* Filtro: Descrição */}
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Descrição:</span>
                  <Select value={descricaoFilter} onValueChange={setDescricaoFilter}>
                    <SelectTrigger className="w-[260px]">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {descricaoOptions.filter((v) => v !== "all").map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro: Tab tipo */}
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Exibir:</span>
                  <Select value={activeTab} onValueChange={(v) => setActiveTab(v as "todas" | "pagar" | "receber")}>
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">Todas</SelectItem>
                      <SelectItem value="pagar">A Pagar</SelectItem>
                      <SelectItem value="receber">A Receber</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro: Situação (texto) */}
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Situação (descrição):</span>
                  <Select value={descSituacaoFilter} onValueChange={setDescSituacaoFilter}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {descSituacoes.filter((v) => v !== "all").map((v) => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Lista agrupada por Descrição */}
              <Accordion type="multiple" className="w-full">
                {getSortedGroups().map((g) => (
                  <AccordionItem key={g.descricao} value={`desc-${g.descricao}`}>
                    <AccordionTrigger className="w-full">
                      <div className="flex w-full items-center justify-between gap-3 pr-6">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="font-semibold truncate">{g.descricao}</span>
                        </div>
                        <div className={`text-right font-semibold tabular-nums ${g.totalLiquido >= 0 ? "text-success" : "text-destructive"}`}>
                          {currencyBRL(g.totalLiquido)}
                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <SortableTableHead column="documento">Documento</SortableTableHead>
                            <TableHead >Fornecedor</TableHead>
                            <TableHead >Tipo</TableHead>
                            <TableHead >Situação</TableHead>
                            <SortableTableHead column="data_original">Data Vencimento</SortableTableHead>
                            <SortableTableHead column="data_sugerida">Data Sugerida</SortableTableHead>
                            <SortableTableHead column="valor">Valor</SortableTableHead>
                            <TableHead className="text-right">Ações</TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {g.items.map((mov) => (
                            <TableRow key={mov.id}>
                              <TableCell>{mov.documento}</TableCell>
                              <TableCell>{mov.banco_id ?? "—"} - {mov.bancos?.nome ?? "—"}</TableCell>
                              <TableCell>
                                <Badge variant={mov.tipo === "receber" ? "default" : "destructive"}>
                                  {mov.tipo === "receber" ? (
                                    <>
                                      <ArrowUp className="w-3 h-3 mr-1" /> Receber
                                    </>
                                  ) : (
                                    <>
                                      <ArrowDown className="w-3 h-3 mr-1" /> Pagar
                                    </>
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={mov.situacao === "realizado" ? "default" : "secondary"}>
                                  {mov.desc_situacao}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {mov.data_original
                                  ? new Date(mov.data_original + "T12:00:00").toLocaleDateString("pt-BR")
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                {mov.data_sugerida
                                  ? new Date(mov.data_sugerida + "T12:00:00").toLocaleDateString("pt-BR")
                                  : "-"}
                              </TableCell>
                              <TableCell>
                                <div className={`font-medium ${mov.tipo === "receber" ? "text-success" : "text-destructive"}`}>
                                  {mov.tipo === "receber" ? "+" : "-"}{currencyBRL(mov.valor)}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onEdit(mov)}
                                  title="Editar data sugerida"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de edição da data_sugerida */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingMovimentacao(null);
            setFormData({ data_sugerida: "" });
          }
        }}
      >
        <DialogContent className="sm:max-w-[680px]">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Editar Pendência</DialogTitle>
              <DialogDescription>
                Ajuste a <b>data sugerida</b> para este documento/parcela.
              </DialogDescription>
            </DialogHeader>

            {editingMovimentacao && (
              <div className="space-y-6 py-4">

                {/* Cabeçalho com valor e tipo */}
                <div className="flex items-center justify-between p-6 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`text-3xl font-bold ${editingMovimentacao.api.TIPO === "P" ? "text-red-600" : "text-green-600"}`}>
                      {currencyBRL(editingMovimentacao.api.VALORPARCELA)}
                    </div>
                    <Badge variant={editingMovimentacao.api.TIPO === "P" ? "destructive" : "default"} size="lg">
                      {editingMovimentacao.api.DESC_TIPO}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground text-right">
                    <div>Vencimento original</div>
                    <div className="font-semibold text-foreground">
                      {formatDateBR(editingMovimentacao.api.DATAVCTO) || "—"}
                    </div>
                  </div>
                </div>

                {/* Grid com informações */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-3">
                    <div><span className="font-medium">Documento:</span> {editingMovimentacao.api.DOCUMENTO}</div>
                    <div><span className="font-medium">Parcela:</span> {editingMovimentacao.api.PARCELA ?? "Única"}</div>
                    <div><span className="font-medium">Descrição:</span> {editingMovimentacao.api.DESCRICAO}</div>
                    <div><span className="font-medium">Fornecedor/Cliente:</span> {editingMovimentacao.api.DESC_FORNECEDOR || editingMovimentacao.api.DESCRICAOTIPOCOBRANCA || "—"}</div>
                  </div>

                  <div className="space-y-3">
                    <div><span className="font-medium">Situação:</span> <Badge variant="outline">{editingMovimentacao.api.DESC_SITUACAO || "Pendente"}</Badge></div>
                    <div><span className="font-medium">Empenho:</span> {editingMovimentacao.api.DESC_EMPENHO || "—"}</div>
                    <div><span className="font-medium">Origem:</span> {editingMovimentacao.api.DESC_ORIGEM || "Manual"}</div>
                    <div><span className="font-medium">Provisão:</span> {editingMovimentacao.api.PROVISAO === "S" ? "Sim" : "Não"}</div>
                  </div>
                </div>

                {/* Data sugerida atual (só leitura) */}
                {editingMovimentacao.ui.data_sugerida && (
                  <div className="text-sm text-muted-foreground border-t pt-3">
                    <span className="font-medium">Data sugerida atual:</span>{" "}
                    {new Date(editingMovimentacao.ui.data_sugerida + "T12:00:00").toLocaleDateString("pt-BR")}
                  </div>
                )}

                {/* Campo para nova data sugerida */}
                <div className="grid grid-cols-4 items-center gap-4 mt-6 border-t pt-6">
                  <Label htmlFor="data_sugerida" className="text-right font-medium text-base">
                    Nova data sugerida
                  </Label>
                  <Input
                    id="data_sugerida"
                    type="date"
                    value={formData.data_sugerida || ""}
                    onChange={(e) => setFormData({ data_sugerida: e.target.value || "" })}
                    className="col-span-3 text-base"
                    placeholder="Deixe vazio para remover"
                  />
                </div>

                {/* Informações de pagamento */}
                {(editingMovimentacao.api.VALORPAGO ?? 0) > 0 && (
                  <div className="text-sm border-t pt-4 space-y-1">
                    <div className="text-green-600 font-medium">
                      Pago: {currencyBRL(editingMovimentacao.api.VALORPAGO!)}
                      {editingMovimentacao.api.DATAPGTO && ` em ${formatDateBR(editingMovimentacao.api.DATAPGTO)}`}
                    </div>
                  </div>
                )}

                {editingMovimentacao.api.OBSERVACAO && (
                  <div className="text-xs italic text-muted-foreground border-t pt-4">
                    Obs: {editingMovimentacao.api.OBSERVACAO}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Movimentacoes;
