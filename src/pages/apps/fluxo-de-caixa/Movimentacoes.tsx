import { useMemo, useState, useCallback, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowUp, FileSpreadsheet, FileText, ChevronRight, ChevronDown } from "lucide-react";
import { useMovimentacao } from "@/hooks/fluxo-de-caixa/use-movimentacoes";

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

const isTipo = (l: LancamentoBancario, tipo: "credito" | "debito" | "deposito") => {
  const t = norm(l.DESC_TIPOMOVIMENTO);
  if (tipo === "credito") return t.includes("credito");
  if (tipo === "debito") return t.includes("debito");
  if (tipo === "deposito") return t.includes("deposito");
  return false;
};

const sumByTipoAbs = (data: LancamentoBancario[], tipo: "credito" | "debito" | "deposito") =>
  data.reduce((acc, l) => acc + (isTipo(l, tipo) ? Math.abs(Number(l.VALOR_FINAL || 0)) : 0), 0);

const sumComSinal = (data: LancamentoBancario[]) =>
  data.reduce((acc, l) => acc + Number(l.VALOR_FINAL || 0), 0);

/** ==== Componente enxuto ==== */
const Movimentacoes = () => {
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");

  const { movimentacoes2, loading2, error, fetchData } = useMovimentacao();



  const onCarregar = useCallback(() => {
    if (dataInicio && dataFim && dataInicio > dataFim) {
      alert("Data início não pode ser maior que data fim.");
      return;
    }
    fetchData({ dataInicio, dataFim });
  }, [dataInicio, dataFim, fetchData]);

  const lancamentosBancarios = useMemo(
    () => (Array.isArray(movimentacoes2) ? (movimentacoes2 as LancamentoBancario[]) : []),
    [movimentacoes2]
  );

  const tiposMovimento = useMemo(
    () => Array.from(new Set(lancamentosBancarios.map(l => l.DESC_TIPOMOVIMENTO))).filter(Boolean),
    [lancamentosBancarios]
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

  const [tipoMovimentoFilter, setTipoMovimentoFilter] = useState("todas");
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
      .filter(l => (tipoMovimentoFilter === "todas" ? true : l.DESC_TIPOMOVIMENTO === tipoMovimentoFilter))
      .filter(l => (tipoContaFilter === "todos" ? true : String(l.COD_TIPOCONTA) === tipoContaFilter))
      // NOVO FILTRO
      .filter(l =>
        operacaoCaixaFilter === "todas"
          ? true
          : String(l.COD_OPERACAOBAIXA) === operacaoCaixaFilter
      );
  }, [
    lancamentosBancarios,
    tipoMovimentoFilter,
    tipoContaFilter,
    operacaoCaixaFilter, // ← não esqueça de adicionar aqui!
  ]);

  // Totais por tipo + total geral (saldo líquido)
  const totalCredito = useMemo(() => sumByTipoAbs(lancamentosFiltrados, "credito"), [lancamentosFiltrados]);
  const totalDebito = useMemo(() => sumByTipoAbs(lancamentosFiltrados, "debito"), [lancamentosFiltrados]);
  const totalDeposito = useMemo(() => sumByTipoAbs(lancamentosFiltrados, "deposito"), [lancamentosFiltrados]);
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
    const selMov = tipoMovimentoFilter === "todas" ? "todas" : tipoMovimentoFilter;
    const selTipoConta = tipoContaFilter === "todos" ? "todos" : `tipoConta-${tipoContaFilter}`;
    const dt = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    return `movimentacoes-${selMov}-${selTipoConta}-${dt}`;
  }, [tipoMovimentoFilter, tipoContaFilter]);

  // ===== LAZY IMPORTS (reduz drasticamente o bundle inicial) =====
  const exportToExcel = useCallback(async () => {
    try {
      const XLSX = await import("xlsx");
      const wsData = [
        columns.map(c => c.header),
        ...dataForExport.map(l => columns.map(c => (l as any)[c.key])),
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = columns.map(() => ({ wch: 18 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Movimentações");
      XLSX.writeFile(wb, `${filenameBase}.xlsx`);
    } catch (e) {
      console.error(e);
      alert("Falha ao exportar Excel.");
    }
  }, [columns, dataForExport, filenameBase]);

  const exportToPDF = useCallback(async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "A4" });
      const title = "Movimentações Bancárias";
      const filtro = `Filtro: ${tipoMovimentoFilter === "todas" ? "Todas" : tipoMovimentoFilter} | Tipo Conta: ${tipoContaFilter === "todos" ? "Todos" : tipoContaFilter}`;

      doc.setFontSize(14);
      doc.text(title, 40, 40);
      doc.setFontSize(10);
      doc.text(filtro, 40, 60);

      autoTable(doc, {
        startY: 80,
        head: [columns.map(c => c.header)],
        body: dataForExport.map(l =>
          columns.map(c => {
            const v = (l as any)[c.key];
            if (c.key === "VALOR_FINAL") {
              const num = Number(v ?? 0);
              return (num < 0 ? "-" : "+") + " " + formatCurrencyBRL(Math.abs(num));
            }
            return String(v ?? "");
          })
        ),
        styles: { fontSize: 9, cellPadding: 6 },
        headStyles: { fillColor: [33, 150, 243] },
        columnStyles: {
          [columns.length - 1]: { halign: "right" },
        },
      });

      doc.save(`${filenameBase}.pdf`);
    } catch (e) {
      console.error(e);
      alert("Falha ao exportar PDF.");
    }
  }, [columns, dataForExport, filenameBase, tipoMovimentoFilter, tipoContaFilter]);

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


      <div className="flex flex-col items-center md:flex-row md:items-end gap-4">
        <div>
          <span className="block text-sm font-medium mb-1">Data Início</span>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="h-9 w-[180px] rounded-md border px-2 text-sm"
          />
        </div>

        <div>
          <span className="block text-sm font-medium mb-1">Data Fim</span>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="h-9 w-[180px] rounded-md border px-2 text-sm"
          />
        </div>
        <button onClick={onCarregar} className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
          Carregar
        </button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Total Depósito</CardTitle>
            <ArrowUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrencyBRL(totalDeposito)}</div>
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
        <CardHeader className="flex flex-row items-center justify-between gap-4 ">
          <div className="w-64">
            <span className="text-sm font-medium">Tipo de Movimento</span>
            <Select value={tipoMovimentoFilter} onValueChange={(v) => { setTipoMovimentoFilter(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {tiposMovimento.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-64">
            <span className="text-sm font-medium">Tipo de Conta</span>
            <Select value={tipoContaFilter} onValueChange={(v) => { setTipoContaFilter(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {tiposConta.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-64">
            <span className="text-sm font-medium">Operação Caixa</span>
            <Select value={operacaoCaixaFilter} onValueChange={(v) => { setOperacaoCaixaFilter(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as operações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as operações</SelectItem>
                {operacoesCaixa.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportToPDF}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
              title="Exportar PDF"
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>

            <button
              onClick={exportToExcel}
              className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
              title="Exportar Excel"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </button>
          </div>
        </CardHeader>

        {/* Tabela */}
        <CardContent>
          <Table className="w-full border-separate border-spacing-0 ">

            <TableBody>
              {grupos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                    Nenhum lançamento encontrado para o filtro selecionado.
                  </TableCell>
                </TableRow>
              )}

              {grupos.map((g) => {
                const isActiveBank = expanded.has(g.codBanco); // 👈 use isso pra estilizar
                const subGrupos = isActiveBank ? agruparPorTipoConta(g.itens) : [];

                return (
                  <Fragment key={`grupo-${g.codBanco}`}>
                    {/* Cabeçalho do BANCO */}
                    <TableRow
                      className={`cursor-pointer transition-colors ${isActiveBank ? "bg-[#f8f9fa]" : "hover:bg-muted"}`}
                      onClick={() => toggleGroup(g.codBanco)}
                      aria-expanded={isActiveBank}
                    >
                      <TableCell colSpan={10} className={`py-2 ${isActiveBank ? "border border-[#dee2e6] rounded-t-xl" : ""}`}>
                        <div className="flex items-center justify-between h-10">
                          <div className="flex items-center gap-1">
                            <span className={`transition-transform ${isActiveBank ? "rotate-90" : ""}`}>
                              {isActiveBank ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </span>

                            {/* Nome do banco destacado quando aberto */}
                            <span className={`font-medium ${isActiveBank ? "text-primary" : ""}`}>
                              {g.descBanco} <span className="text-muted-foreground">({g.codBanco})</span>
                            </span>

                            <span className="ml-3 text-xs text-muted-foreground">
                              {g.qtd} movimentação{g.qtd > 1 ? "es" : ""}
                            </span>
                          </div>

                          <div
                            className={`text-sm font-semibold tabular-nums ${g.total >= 0 ? "text-success" : "text-destructive"
                              }`}
                          >
                            {formatCurrencyBRL(g.total)}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* SUBGRUPOS por TIPO DE CONTA */}
                    {isActiveBank &&
                      subGrupos.map((sg) => {
                        const key = `${g.codBanco}-${sg.codTipoConta}`;
                        const abertoTipo = expandedTipos.has(key);

                        return (
                          <Fragment key={`tipo-${key}`}>
                            {/* Header do TIPO: herda destaque do banco aberto */}
                            <TableRow
                              className={`cursor-pointer transition-colors ${isActiveBank ? "bg-[#f8f9fa] hover:bg-[#fafafa]" : "hover:bg-muted"}`}
                              onClick={() => toggleTipo(g.codBanco, sg.codTipoConta)}
                              aria-expanded={abertoTipo}
                            >
                              <TableCell
                                colSpan={9}
                                className={`py-2 ${isActiveBank ? "border-x border-b border-[#dee2e6]" : ""}`}
                              >
                                <div className="flex items-center justify-between pl-2 h-10">
                                  <div className={`flex items-center gap-2 ${isActiveBank ? "text-primary" : ""}`}>
                                    <span className={`transition-transform ${abertoTipo ? "rotate-90" : ""}`}>
                                      {abertoTipo ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </span>
                                    <span className="font-medium">
                                      {sg.descTipoConta}{" "}
                                      <span className="text-muted-foreground">({sg.codTipoConta})</span>
                                    </span>
                                    <span className="ml-3 text-xs text-muted-foreground">{sg.qtd} mov.</span>
                                  </div>

                                  <div
                                    className={`text-sm font-semibold tabular-nums ${sg.total >= 0 ? "text-success" : "text-destructive"
                                      }`}
                                  >
                                    {formatCurrencyBRL(sg.total)}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Cabeçalho das colunas dentro do tipo */}
                            {abertoTipo && (
                              <TableRow className="bg-[#f8f9fa] text-[#6c757d] ">
                                <TableHead className="border-y border-l border-[#dee2e6] font-medium">Agência</TableHead>
                                <TableHead className="border-y border-[#dee2e6] font-medium">Conta</TableHead>
                                <TableHead className="border-y border-[#dee2e6] font-medium">Tipo Conta</TableHead>
                                <TableHead className="border-y border-[#dee2e6] font-medium">Tipo Mov.</TableHead>
                                <TableHead className="border-y border-[#dee2e6] font-medium">Documento</TableHead>
                                <TableHead className="border-y border-[#dee2e6] font-medium">Nº Lançamento</TableHead>
                                <TableHead className="border-y border-[#dee2e6] font-medium">Data</TableHead>
                                <TableHead className="border-y border-[#dee2e6] font-medium">Descrição</TableHead>
                                <TableHead className="text-right border-y border-r border-[#dee2e6] font-medium">Valor</TableHead>
                              </TableRow>
                            )}


                            {/* Linhas detalhadas */}
                            {abertoTipo && sg.itens.map((l, i) => {
                              const valor = Number(l.VALOR_FINAL ?? 0);
                              const debito = isDebito(valor);
                              const isLastRow = i === sg.itens.length - 1;

                              return (
                                <TableRow key={`${l.NUM_LANCAMENTOBANCARIO}-${l.DOCUMENTO}-${l.DATAMOVIMENTO}-${i}`} className="bg-white">
                                  {/* parede ESQ */}
                                  <TableCell className={`border-l border-[#dee2e6] border-b border-[#eef1f4] ${isLastRow ? "rounded-bl-xl" : ""}`}>
                                    {l.COD_AGENCIA}
                                  </TableCell>

                                  <TableCell className="border-b border-[#eef1f4] whitespace-nowrap font-medium">{l.COD_CONTABANCARIA}</TableCell>
                                  <TableCell className="border-b border-[#eef1f4] text-[#495057]">{l.DESC_TIPOCONTA}</TableCell>
                                  <TableCell className="border-b border-[#eef1f4]">
                                    <Badge
                                      className={`${debito ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"} border-0`}
                                      variant="outline"
                                    >
                                      {l.DESC_TIPOMOVIMENTO}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="border-b border-[#eef1f4] tabular-nums">{l.DOCUMENTO}</TableCell>
                                  <TableCell className="border-b border-[#eef1f4] tabular-nums">{l.NUM_LANCAMENTOBANCARIO}</TableCell>
                                  <TableCell className="border-b border-[#eef1f4] whitespace-nowrap">{formatDateBR(l.DATAMOVIMENTO)}</TableCell>
                                  <TableCell className="border-b border-[#eef1f4] max-w-[360px] truncate" title={l.DESCRICAO}>{l.DESCRICAO}</TableCell>

                                  {/* parede DIR + base */}
                                  <TableCell
                                    className={`border-r border-[#dee2e6] border-b ${isLastRow ? "rounded-br-xl border-b-[#dee2e6]" : "border-b-[#eef1f4]"} text-right font-semibold tabular-nums ${debito ? "text-red-600" : "text-emerald-700"}`}
                                    title={formatCurrencyBRL(valor)}
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


        </CardContent>
      </Card>
    </div>
  );
};

export default Movimentacoes;
