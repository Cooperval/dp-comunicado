import { useMemo, useState, useCallback, Fragment, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ChevronRight, ChevronDown, RotateCcw, Filter, ChevronsUpDown, Search } from "lucide-react";
import { useMovimentacao } from "@/pages/apps/fluxo-de-caixa/hooks/use-movimentacoes";
import { useGrupo } from "@/pages/apps/fluxo-de-caixa/hooks/use-grupo";
import { Label } from "@/components/ui/label";
import { useTipoContas } from "@/pages/apps/fluxo-de-caixa/hooks/use-contabacaria";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** ==== Tipos e helpers mínimos ==== */
type LancamentoBancario = {
  COD_AGENCIA: number;
  COD_BANCO: number;
  DESC_BANCO: string;
  COD_CONTABANCARIA: number;
  COD_GRUPOEMPRESA: number;
  COD_OPERACAOBAIXA: number;
  DESC_OPERACAOBAIXA: string;
  COD_TIPOCONTA: number;
  COD_TIPOMOVIMENTO: number;
  DATAMOVIMENTO: string;
  DESCRICAO: string;
  DESC_TIPOCONTA: string;
  DESC_TIPOMOVIMENTO: string;
  DOCUMENTO: number;
  NUM_LANCAMENTOBANCARIO: number;
  VALOR_FINAL: number;
};

type GrupoBanco = {
  codBanco: number;
  descBanco: string;
  itens: LancamentoBancario[];
  total: number;
  qtd: number;
};

type GrupoTipoConta = {
  codTipoConta: number;
  descTipoConta: string;
  itens: LancamentoBancario[];
  total: number;
  qtd: number;
};

const formatCurrencyBRL = (n: number | null | undefined) =>
  n == null ? "—" : new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

const safeDateFromISO = (iso?: string | null) => {
  if (!iso) return null;
  const d = new Date(iso);
  return isNaN(d.getTime()) ? null : d;
};

const formatDateBR = (iso?: string | null) => {
  const d = safeDateFromISO(iso);
  return d ? d.toLocaleDateString("pt-BR") : "—";
};

const isDebito = (v: number) => v < 0;

const norm = (s?: string) =>
  (s ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();

const isTipo = (l: LancamentoBancario, tipo: "credito" | "debito") => {
  const t = norm(l.DESC_TIPOMOVIMENTO);
  if (tipo === "credito") return t.includes("credito");
  if (tipo === "debito") return t.includes("debito");
  return false;
};

const sumByTipoAbs = (data: LancamentoBancario[], tipo: "credito" | "debito") =>
  data.reduce((acc, l) => acc + (isTipo(l, tipo) ? Math.abs(Number(l.VALOR_FINAL || 0)) : 0), 0);

const sumComSinal = (data: LancamentoBancario[]) =>
  data.reduce((acc, l) => acc + Number(l.VALOR_FINAL || 0), 0);

/** ==== Componente enxuto ==== */
const Movimentacoes = () => {
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [codTipo, setCodTipo] = useState<string[]>(["all"]);

  const [filtroOperacao, setFiltroOperacao] = useState<string>("todos");
  const [filtroTipoMovimento, setFiltroTipoMovimento] = useState<string>("todos");

  const { movimentacoes2, loading2, error, fetchData } = useMovimentacao();
  const { tipos, errorTipos, fetchDataTipos } = useTipoContas();
  useEffect(() => { fetchDataTipos(); }, [fetchDataTipos]);


  const { grupo, fetchDataGrupo } = useGrupo();
  const [grupoSelecionado, setGrupoSelecionado] = useState<any>(null);


  useEffect(() => { fetchDataGrupo(); }, [fetchDataGrupo]);

  const onCarregar = useCallback(() => {
    if (dataInicio && dataFim && dataInicio > dataFim) {
      alert("Data início não pode ser maior que data fim.");
      return;
    }

    // Prepara os tipos de conta para enviar ao backend
    const tiposContaParaEnviar = codTipo.includes("all") || codTipo.length === 0
      ? [] // "all" ou nenhum = não filtrar no backend (ou enviar null, dependendo da API)
      : codTipo.filter(t => t !== "all"); // remove "all" se estiver misturado

    fetchData({
      dataInicio,
      dataFim,
      tiposConta: tiposContaParaEnviar,
      grupoEmpresa: grupoSelecionado.COD_GRUPOEMPRESA,
    });

  }, [dataInicio, dataFim, codTipo, fetchData, grupoSelecionado]);


  const lancamentosBancarios = useMemo(
    () => (Array.isArray(movimentacoes2) ? (movimentacoes2 as LancamentoBancario[]) : []),
    [movimentacoes2]
  );


  // --- NOVO: tipos de conta (lista única com código + descrição)
  const tiposConta = useMemo(() => {
    const map = new Map<number, string>();
    for (const l of lancamentosBancarios) {
      const cod = Number(l.COD_TIPOCONTA ?? -1);
      if (!map.has(cod)) map.set(cod, l.DESC_TIPOCONTA ?? String(cod));
    }
    return Array.from(map.entries()).map(([cod, desc]) => ({ value: String(cod), label: `${desc}` }));
  }, [lancamentosBancarios]);


  const [tipoContaFilter, setTipoContaFilter] = useState("todos");
  const [operacaoCaixaFilter, setOperacaoCaixaFilter] = useState("todas");



  // --- NOVO: operações de caixa (código + descrição)
  const operacoesCaixa = useMemo(() => {
    const map = new Map<number, string>();
    for (const l of lancamentosBancarios) {
      const cod = Number(l.COD_OPERACAOBAIXA ?? -1);
      if (cod !== -1 && !map.has(cod)) {
        map.set(cod, `${l.DESC_OPERACAOBAIXA || "Sem descrição"}`.trim());
      }
    }
    return Array.from(map.entries())
      .map(([cod, label]) => ({ value: String(cod), label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [lancamentosBancarios]);





  const lancamentosFiltrados = useMemo(() => {
    return lancamentosBancarios
      .filter(l => (tipoContaFilter === "todos" ? true : String(l.COD_TIPOCONTA) === tipoContaFilter))
      // NOVO FILTRO
      .filter(l =>
        operacaoCaixaFilter === "todas"
          ? true
          : String(l.COD_OPERACAOBAIXA) === operacaoCaixaFilter
      );
  }, [
    lancamentosBancarios,

    tipoContaFilter,
    operacaoCaixaFilter, // ← não esqueça de adicionar aqui!
  ]);

  // Totais por tipo + total geral (saldo líquido)
  const totalCredito = useMemo(() => sumByTipoAbs(lancamentosFiltrados, "credito"), [lancamentosFiltrados]);
  const totalDebito = useMemo(() => sumByTipoAbs(lancamentosFiltrados, "debito"), [lancamentosFiltrados]);
  const totalGeral = useMemo(() => sumComSinal(lancamentosFiltrados), [lancamentosFiltrados]);

  const columns = useMemo(
    () => [
      { header: "Banco", key: "COD_BANCO" },
      { header: "Agência", key: "COD_AGENCIA" },
      { header: "Conta", key: "COD_CONTABANCARIA" },
      { header: "Tipo Conta", key: "DESC_TIPOCONTA" },
      { header: "Tipo Mov.", key: "DESC_TIPOMOVIMENTO" },
      { header: "Documento", key: "DOCUMENTO" },
      { header: "Nº Lançamento", key: "NUM_LANCAMENTOBANCARIO" },
      { header: "Data", key: "DATAMOVIMENTO" },
      { header: "Descrição", key: "DESCRICAO" },
      { header: "Valor", key: "VALOR_FINAL" },
    ],
    []
  );

  const dataForExport = useMemo(
    () =>
      lancamentosFiltrados.map(l => ({
        ...l,
        DATAMOVIMENTO: formatDateBR(l.DATAMOVIMENTO),
      })),
    [lancamentosFiltrados]
  );

  const filenameBase = useMemo(() => {
    const selTipoConta = tipoContaFilter === "todos" ? "todos" : `tipoConta-${tipoContaFilter}`;
    const dt = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return `movimentacoes-${selTipoConta}-${dt}`;
  }, [tipoContaFilter]);



  // ===== Paginação simples para evitar render de milhares de linhas =====
  const [page, setPage] = useState(1);
  const pageSize = 200; // ajuste fino conforme volume
  const totalPages = Math.max(1, Math.ceil(lancamentosFiltrados.length / pageSize));
  const pageData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return lancamentosFiltrados.slice(start, start + pageSize);
  }, [lancamentosFiltrados, page]);

  const grupos = useMemo<GrupoBanco[]>(() => {
    const map = new Map<number, GrupoBanco>();
    for (const l of pageData) {
      const cod = Number(l.COD_BANCO);
      const existente = map.get(cod);
      if (existente) {
        existente.itens.push(l);
        existente.total += Number(l.VALOR_FINAL ?? 0);
        existente.qtd += 1;
      } else {
        map.set(cod, {
          codBanco: cod,
          descBanco: l.DESC_BANCO || String(cod),
          itens: [l],
          total: Number(l.VALOR_FINAL ?? 0),
          qtd: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [pageData]);

  // bancos expandidos (set de cod_banco)
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const toggleGroup = useCallback((cod: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(cod)) next.delete(cod);
      else next.add(cod);
      return next;
    });
  }, []);

  // tipos de conta expandidos por banco: chave = `${codBanco}-${codTipoConta}`
  const [expandedTipos, setExpandedTipos] = useState<Set<string>>(new Set());
  const toggleTipo = useCallback((codBanco: number, codTipoConta: number) => {
    const key = `${codBanco}-${codTipoConta}`;
    setExpandedTipos(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);





  function agruparPorTipoConta(itens: LancamentoBancario[]): GrupoTipoConta[] {
    const map = new Map<number, GrupoTipoConta>();
    for (const l of itens) {
      const cod = Number(l.COD_TIPOCONTA);
      const ex = map.get(cod);
      if (ex) {
        ex.itens.push(l);
        ex.total += Number(l.VALOR_FINAL ?? 0);
        ex.qtd += 1;
      } else {
        map.set(cod, {
          codTipoConta: cod,
          descTipoConta: l.DESC_TIPOCONTA || String(cod),
          itens: [l],
          total: Number(l.VALOR_FINAL ?? 0),
          qtd: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.descTipoConta.localeCompare(b.descTipoConta, "pt-BR"));
  }

  function toggleTipo2(tipo: string) {
    if (tipo === "all") {
      setCodTipo(["all"]);
      return;
    }

    setCodTipo(prev => {
      const current = prev.includes("all") ? [] : [...prev];
      const has = current.includes(tipo);
      const next = has ? current.filter(t => t !== tipo) : [...current, tipo];
      return next.length === 0 ? ["all"] : next;
    });
  }

  


  // Reative o loading para evitar interação durante fetch
  if (loading2) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-muted-foreground">Carregando movimentações...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive">
        Erro ao carregar movimentações. {String(error)}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <Card className="w-full border shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filtros
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Linha única com todos os filtros + botões alinhados na base */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 items-end">


            <div className="lg:col-span-1 space-y-1">
              <Label className="text-sm font-medium">Grupo</Label>

              <Select
                value={grupoSelecionado ? String(grupoSelecionado.COD_GRUPOEMPRESA) : ""}
                onValueChange={(value) => {
                  const selecionado = grupo.find(
                    (g) => String(g.COD_GRUPOEMPRESA) === value
                  );
                  setGrupoSelecionado(selecionado || null);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione um grupo" />
                </SelectTrigger>

                <SelectContent>
                  {grupo.map((g) => (
                    <SelectItem
                      key={g.COD_GRUPOEMPRESA}
                      value={String(g.COD_GRUPOEMPRESA)}
                    >
                      {g.DESCRICAO}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>




            {/* Tipo de Conta - 3 colunas (mais espaço) */}
            <div className="lg:col-span-1 space-y-1">
              <Label className="text-sm font-medium">Tipo de Conta</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-9 font-normal">
                    <span className="truncate text-left">
                      {codTipo.includes("all") || codTipo.length === 0
                        ? "Todos os tipos"
                        : codTipo.length === 1
                          ? tipos?.find(t => String(t.COD_TIPOCONTABANCARIA) === codTipo[0])?.DESCRICAO || "1 selecionado"
                          : `${codTipo.length} tipos selecionados`}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-full min-w-[280px]" align="start">
                  <DropdownMenuCheckboxItem
                    checked={codTipo.includes("all") || codTipo.length === 0}
                    onCheckedChange={() => toggleTipo2("all")}
                  >
                    <span className="font-medium">Todos os tipos</span>
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                  <div className="max-h-64 overflow-y-auto">
                    {(tipos ?? [])
                      .sort((a, b) => a.DESCRICAO.localeCompare(b.DESCRICAO))
                      .map((t) => (
                        <DropdownMenuCheckboxItem
                          key={t.COD_TIPOCONTABANCARIA}
                          checked={codTipo.includes(String(t.COD_TIPOCONTABANCARIA))}
                          onCheckedChange={() => toggleTipo2(String(t.COD_TIPOCONTABANCARIA))}
                        >
                          {t.DESCRICAO}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              {errorTipos && <p className="text-xs text-destructive mt-1">Erro ao carregar tipos de conta</p>}
            </div>
            {/* Data Início - 2 colunas */}
            <div className="lg:col-span-1 space-y-1">
              <Label htmlFor="data-inicio" className="text-sm font-medium">
                Data Início
              </Label>
              <Input
                id="data-inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Data Fim - 2 colunas */}
            <div className="lg:col-span-1 space-y-1">
              <Label htmlFor="data-fim" className="text-sm font-medium">
                Data Fim
              </Label>
              <Input
                id="data-fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="h-9"
              />
            </div>


          </div>
          <div className="flex gap-3 justify-end">
            <Button
              onClick={onCarregar}
              className="h-9 px-6 font-medium"
            >
              <Search className="w-4 h-4 mr-2" />
              Carregar
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDataInicio("");
                setDataFim("");
                setCodTipo(["all"]);
                setGrupoSelecionado(null);
              }}
              className="h-9 px-5"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Crédito</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrencyBRL(totalCredito)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Débito</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrencyBRL(totalDebito)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            {totalGeral >= 0 ? (
              <TrendingUp className="h-4 w-4 text-success" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalGeral >= 0 ? "text-success" : "text-destructive"}`}>
              {formatCurrencyBRL(totalGeral)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtro + Export */}
      <Card>
        {/* Tabela */}
        <CardContent className="p-0">
          <div className="rounded-md border overflow-hidden">
            <Table className="w-full">
              <TableBody>
                {/* Mensagem vazia */}
                {grupos.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                      Nenhum lançamento encontrado para o filtro selecionado.
                    </TableCell>
                  </TableRow>
                )}

                {grupos.map((g) => {
                  const isActiveBank = expanded.has(g.codBanco);
                  const subGrupos = isActiveBank ? agruparPorTipoConta(g.itens) : [];

                  return (
                    <Fragment key={`grupo-${g.codBanco}`}>
                      {/* === CABEÇALHO DO BANCO === */}
                      <TableRow
                        className={`
                  bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer
                  ${isActiveBank ? "bg-primary/5 hover:bg-primary/10" : ""}
                `}
                        onClick={() => toggleGroup(g.codBanco)}
                      >
                        <TableCell colSpan={10} className="py-3 px-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`transition-transform duration-200 ${isActiveBank ? "rotate-90" : ""}`}>
                                {isActiveBank ? (
                                  <ChevronDown className="h-5 w-5 text-primary" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                )}
                              </span>
                              <div>
                                <span className={`font-semibold text-base ${isActiveBank ? "text-primary" : "text-foreground"}`}>
                                  {g.descBanco}
                                </span>
                              </div>
                            </div>
                            {/* Total do banco (opcional) */}
                            {g.total !== 0 && (
                              <span className={`font-semibold ${g.total >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                {formatCurrencyBRL(g.total)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* === SUBGRUPOS POR TIPO DE CONTA === */}
                      {isActiveBank &&
                        subGrupos.map((sg) => {
                          const key = `${g.codBanco}-${sg.codTipoConta}`;
                          const abertoTipo = expandedTipos.has(key);

                          return (
                            <Fragment key={`tipo-${key}`}>
                              {/* Header do Tipo de Conta */}
                              <TableRow
                                className="bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                                onClick={() => toggleTipo(g.codBanco, sg.codTipoConta)}
                              >
                                <TableCell colSpan={10} className="py-2.5 px-8">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <span className={`transition-transform duration-200 ${abertoTipo ? "rotate-90" : ""}`}>
                                        {abertoTipo ? (
                                          <ChevronDown className="h-4 w-4 text-primary" />
                                        ) : (
                                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </span>
                                      <span className="font-medium text-foreground">
                                        {sg.descTipoConta}

                                      </span>
                                    </div>
                                    <span className={`font-semibold ${sg.total >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                                      {formatCurrencyBRL(sg.total)}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>

                              {/* === CABEÇALHO DAS COLUNAS (só aparece quando aberto) === */}
                              {abertoTipo && (
                                <TableRow className="bg-muted/20 border-y">
                                  <TableHead className="px-8 py-3 font-medium text-foreground">Agência</TableHead>
                                  <TableHead className="py-3 font-medium text-foreground">Conta</TableHead>
                                  <TableHead className="py-3 font-medium text-foreground">Tipo Mov.</TableHead>
                                  <TableHead className="py-3 font-medium text-foreground">Data</TableHead>
                                  <TableHead className="py-3 font-medium text-foreground">Operação Caixa</TableHead>
                                  <TableHead className="py-3 font-medium text-foreground">Descrição</TableHead>
                                  <TableHead className="py-3 text-right pr-8 font-medium text-foreground">Valor</TableHead>
                                </TableRow>
                              )}

                              {/* === LINHAS DETALHADAS === */}
                              {abertoTipo &&
                                sg.itens.map((l, i) => {
                                  const valor = Number(l.VALOR_FINAL ?? 0);
                                  const isDebito = valor < 0;
                                  const isLast = i === sg.itens.length - 1;

                                  return (
                                    <TableRow
                                      key={`${l.NUM_LANCAMENTOBANCARIO}-${i}`}
                                      className={`
                                hover:bg-muted/40 transition-colors
                                ${isLast ? "" : "border-b"}
                              `}
                                    >
                                      <TableCell className="px-8 py-3 font-medium text-muted-foreground">
                                        {l.COD_AGENCIA}
                                      </TableCell>
                                      <TableCell className="py-3 font-semibold">{l.COD_CONTABANCARIA}</TableCell>
                                      <TableCell className="py-3">
                                        <Badge
                                          variant="secondary"
                                          className={`
                                    border-0 text-xs font-medium
                                    ${isDebito
                                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                                              : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                            }
                                  `}
                                        >
                                          {l.DESC_TIPOMOVIMENTO}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="py-3 text-muted-foreground">
                                        {formatDateBR(l.DATAMOVIMENTO)}
                                      </TableCell>
                                      <TableCell className="py-3 max-w-xs truncate" title={l.DESC_OPERACAOBAIXA}>
                                        {l.DESC_OPERACAOBAIXA}
                                      </TableCell>
                                      <TableCell className="py-3 max-w-lg truncate" title={l.DESCRICAO}>
                                        {l.DESCRICAO}
                                      </TableCell>
                                      <TableCell
                                        className={`
                                  py-3 text-right pr-8 font-bold tabular-nums
                                  ${isDebito ? "text-red-600" : "text-emerald-600"}
                                `}
                                      >
                                        {formatCurrencyBRL(Math.abs(valor))}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                            </Fragment>
                          );
                        })}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Movimentacoes;
