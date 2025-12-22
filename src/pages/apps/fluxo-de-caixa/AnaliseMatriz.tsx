import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, ChevronRight, Calendar, Search, Loader2, ChevronsUpDown, Filter} from "lucide-react";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useFluxoCaixaConsolidado } from "@/pages/apps/fluxo-de-caixa/hooks/use-fc-consolidado";
import { useTipoContas } from "@/pages/apps/fluxo-de-caixa/hooks/use-contabacaria";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useGef } from "@/pages/apps/fluxo-de-caixa/hooks/use-gef";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFluxoCaixaDetalhes } from '@/pages/apps/fluxo-de-caixa/hooks/use-fc-detalhes';
import { Detail } from "@/pages/apps/fluxo-de-caixa/components/Detail";

const get = (obj: any, ...keys: string[]) => {
  for (const k of keys) {
    if (obj == null) continue;
    if (k in obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
    const lk = k.toLowerCase();
    if (lk in obj && obj[lk] !== undefined && obj[lk] !== null) return obj[lk];
  }
  return undefined;
};

const fmtCurrency = (v: any) => {
  const n = Number(v ?? 0);
  return Number.isNaN(n) ? "—" : n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const fmtDate = (d: any) => {
  if (!d) return "—";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString("pt-BR");
};

/* ESTILO UNIFICADO - Todos com o mesmo visual */
const CardWrapper = ({ children, tipo }: { children: React.ReactNode; tipo: "mov" | "pend" | "prev" }) => {
  const bg = tipo === "mov" ? "bg-blue-50/30 border-blue-200" :
    tipo === "pend" ? "bg-blue-50/30 border-blue-200" :
      "bg-blue-50/30 border-blue-200";

  return (
    <div className={`border rounded-lg p-4 bg-muted/30 shadow-sm ${bg} hover:shadow-md transition-shadow`}>
      {children}
    </div>
  );
};

/* 1 - Movimentações Realizadas */
const renderMovimentacoes = (items: any[]) => (
  <div className="space-y-4">
    {items.map((item: any, idx: number) => (
      <CardWrapper key={idx} tipo="mov">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="font-bold text-lg text-blue-700">
              #{get(item, "NUM_LANCAMENTOBANCARIO") || "—"} | {get(item, "DESCRICAO") || "Movimentação"}
            </div>
            <div className="text-sm text-muted-foreground">
              {get(item, "DESC_TIPOMOVIMENTO") || "Tipo não informado"}
            </div>
          </div>
          <div className={`font-bold text-lg ${get(item, "OPERACAO") === "C" ? "text-green-600" : "text-red-600"}`}>
            {get(item, "OPERACAO") === "C" ? "+" : "-"} {fmtCurrency(get(item, "VALOR"))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
          <Detail label="Data" value={fmtDate(get(item, "DATAMOVIMENTO"))} />
          <Detail label="Banco" value={get(item, "DESC_BANCO") ?? "—"} />
          <Detail label="Ag/Conta" value={`${get(item, "COD_AGENCIA") ?? ""}-${get(item, "COD_CONTABANCARIA") ?? ""}${get(item, "DIGITO") ? `-${get(item, "DIGITO")}` : ""}`} />
          <Detail label="Documento" value={get(item, "DOCUMENTO") ?? "—"} />
          <Detail label="Operação" value={get(item, "OPERACAO") === "C" ? "Crédito" : "Débito"} />
          <Detail label="Baixa" value={get(item, "DESC_OPERACAOBAIXA") ?? "—"} />
        </div>
      </CardWrapper>
    ))}
  </div>
);

/* 2 - Pendências (a pagar/receber) */
const renderPendencias = (items: any[]) => (
  <div className="space-y-4">
    {items.map((item: any, idx: number) => {
      const isReceber = get(item, "PAGARRECEBER") === "R" || get(item, "TIPO") === "R";
      const valorAberto = (get(item, "VALORPARCELA") || 0) - (get(item, "VALORPAGO") || 0);

      return (
        <CardWrapper key={idx} tipo="pend">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="font-bold text-lg text-orange-700">
                #{get(item, "DOCUMENTO") || get(item, "DESC_EMPENHO") || "Título sem nº"}
              </div>
              <div className="text-sm text-muted-foreground">
                {get(item, "DESC_FORNECEDOR") || get(item, "DESC_CLIENTE") || "Sem favorecido"}
              </div>
            </div>
            <div className={`font-bold text-lg ${isReceber ? "text-green-600" : "text-red-600"}`}>
              {isReceber ? "+" : "-"} {fmtCurrency(valorAberto)}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
            <Detail label="Vencimento" value={fmtDate(get(item, "DATAVCTO"))} />
            <Detail label="Parcela" value={get(item, "PARCELA") ?? "—"} />
            <Detail label="Valor Total" value={fmtCurrency(get(item, "VALORPARCELA"))} />
            <Detail label="Situação" value={get(item, "DESC_SITUACAO") ?? "—"} />
          </div>

          {get(item, "OBSERVACAO") && (
            <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
              <span className="font-medium">Obs:</span> {get(item, "OBSERVACAO")}
            </div>
          )}
        </CardWrapper>
      );
    })}
  </div>
);

/* 3 - Lançamentos Futuros / Previstos */
const renderLancamentosFuturos = (items: any[]) => (
  <div className="space-y-4">
    {items.map((item: any, idx: number) => {
      const isReceita = get(item, "TIPO") === "R";

      return (
        <CardWrapper key={idx} tipo="prev">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="font-bold text-lg text-purple-700">
                {get(item, "DESC_MOVIMENTO") || "Lançamento Previsto"}
              </div>
              <div className="text-sm text-muted-foreground">
                ID: #{get(item, "ID_MOVIMENTO")} • {get(item, "DESC_SITUACAO") || "Pendente"}
              </div>
            </div>
            <div className={`font-bold text-lg ${isReceita ? "text-green-600" : "text-red-600"}`}>
              {isReceita ? "+" : "-"} {fmtCurrency(get(item, "VALOR"))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
            <Detail label="Tipo" value={isReceita ? "A Receber" : "A Pagar"} />
            <Detail label="Data Sugerida" value={get(item, "DATA_SUGERIDA_FORMATADA") || fmtDate(get(item, "DATA_SUGERIDA")) || "—"} />
            <Detail label="Documento" value={get(item, "DOCUMENTO") ?? "—"} />
            <Detail label="Descrição" value={get(item, "DESCRICAO") ?? "—"} />

            {get(item, "COD_BANCO") && (
              <Detail
                label="Conta"
                value={`${get(item, "COD_BANCO")}-${get(item, "COD_AGENCIA") || "000"}-${get(item, "COD_CONTABANCARIA") || "000000"}${get(item, "DIGITO") ? `-${get(item, "DIGITO")}` : ""}`}
              />
            )}
          </div>
        </CardWrapper>
      );
    })}
  </div>
);

/* Handler genérico: adiciona novos renderers quando precisar */
const renderDetalhesPorTipo = (type: string | null | undefined, items: any[]) => {
  if (!type) return <p className="text-muted-foreground">Tipo desconhecido</p>;

  switch (type) {
    case "contasreceber":
    case "contaspagar":
      return renderMovimentacoes(items);

    case "pendreceber":
    case "pendpagar":
      return renderPendencias(items);

    case "laprevreceber":
    case "laprevpagar":
      return renderLancamentosFuturos(items);



    // adicione aqui outros types e renderers
    default:
      // fallback genérico: mostra todos os campos dinamicamente
      return (
        <div className="space-y-3">
          {items.map((it: any, i: number) => (
            <div key={i} className="border rounded-lg p-3 bg-muted/30 shadow-sm">
              <div className="font-semibold mb-2">{get(it, "DESCRICAO", "descricao", "DOCUMENTO")}</div>
              <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(it, null, 2)}</pre>
            </div>
          ))}
        </div>
      );
  }
};

type TipoConta = {
  COD_TIPOCONTABANCARIA: number;
  DESCRICAO: string;
};
// Componente principal: Análise Matriz do Fluxo de Caixa
const AnaliseMatriz = () => {
  const [visao, setVisao] = useState<"dia" | "semana" |"mes">("dia"); // novo estado


  // Estado das datas: início e fim do período (padrão = mês atual)
  const [dataInicio, setDataInicio] = useState(() => {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1); // dia 1 do mês atual
    return inicio.toISOString().split("T")[0]; // formato YYYY-MM-DD
  });

  const { gef, loadingGef, errorGef, fetchDataGef } = useGef();
  const [gefSelecionado, setGefSelecionado] = useState<any>(null);
  useEffect(() => { fetchDataGef(); }, [fetchDataGef]);


  const today = useMemo(() => {
    return new Date().toISOString().split("T")[0]; // "2025-04-05"
  }, []);

  const [dataFim, setDataFim] = useState(() => {
    const hoje = new Date();
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0); // último dia do mês atual
    return fim.toISOString().split("T")[0];
  });

  const [codTipo, setCodTipo] = useState<string>("all");         // filtro por tipo de conta
  const { tipos, loadingTipos, errorTipos, fetchDataTipos } = useTipoContas();
  // Carrega os tipos de conta ao montar a página
  useEffect(() => { fetchDataTipos(); }, [fetchDataTipos]);

  // Hook personalizado que faz a consulta ao backend
  // Retorna: dados, loading, erro e função para buscar novamente
  const { data, loading, error, fetchData } = useFluxoCaixaConsolidado();

  console.log("Dados do consolidado:", data);

  // Estado para controlar quais seções são exibidas: movimentações, pendências e previsões
  const [show, setShow] = useState<{ mov: boolean; pend: boolean; prev: boolean; folha: boolean; orcado: boolean; projecao: boolean }>(() => {
    // Tenta carregar preferência salva do usuário no localStorage
    try {
      const raw = localStorage.getItem("analiseMatriz.show");
      if (raw) return JSON.parse(raw);
    } catch { }
    return { mov: true, pend: true, prev: true, folha: true, orcado: true, projecao: true }; // padrão: tudo visível
  });

  // Salva no localStorage sempre que o usuário muda as caixas de seleção
  useEffect(() => {
    try {
      localStorage.setItem("analiseMatriz.show", JSON.stringify(show));
    } catch { }
  }, [show]);

  // Função para alternar exibição de uma seção (mov, pend ou prev)
  const toggleShow = (key: keyof typeof show) => {
    setShow((s) => {
      const next = { ...s, [key]: !s[key] };
      // Se já fez uma busca antes, refaz a consulta com os novos filtros
      if (hasSearched) {
        fetchData({ dataInicio, dataFim, show: next });
      }
      return next;
    });
  };

  // Marca ou desmarca todas as caixas de uma vez
  const selectAll = (val: boolean) => {
    const next = { mov: val, pend: val, prev: val, folha: val, orcado: val, projecao: val };
    setShow(next);
    if (hasSearched) {
      fetchData({ dataInicio, dataFim, show: next });
    }
  };




  const [modalInfo, setModalInfo] = useState({
    open: false,
    date: null,
    type: null,
  });

  const { data: detalhes, loading: loadingDetalhes, error: detalhesError, fetchDetalhes, setData: setDetalhesData } = useFluxoCaixaDetalhes();

  // abrirDetalhes agora abre o modal e dispara o fetch (não precisa esperar)
  const abrirDetalhes = (date: string, type: string) => {
    setModalInfo({ open: true, date, type });
    const tiposSelecionados = codTipo.includes("all") ? undefined : codTipo;
    // dispara o fetch com os códigos do GEF (use o mesmo gefSelecionado que você já tem)
    fetchDetalhes({
      date,
      type,
      codTipoConta: tiposSelecionados,
      codGrupoEmpresa: gefSelecionado?.COD_GRUPOEMPRESA,
      codEmpresa: gefSelecionado?.COD_EMPRESA,
      codFilial: gefSelecionado?.COD_FILIAL,
    });
  };

  // Controla se o usuário já clicou em "Buscar" pelo menos uma vez
  const [hasSearched, setHasSearched] = useState(false);

  // Controla se a linha "Consolidado" está expandida (mostrando detalhes)
  const [expandedTotal, setExpandedTotal] = useState<boolean>(false);

  // Controla expansão individual de tipos (ex: Contas a Receber, Contas a Pagar)
  const [expandedTipos, setExpandedTipos] = useState<Record<string, boolean>>({});

  const navigate = useNavigate();

  // Lista ordenada de datas que vieram do backend (ex: ["2025-04-01", "2025-04-02", ...])
  const dateRange = useMemo(() => {
    const dates = data.map(d => d.data_iso);
    dates.sort(); // garante ordem cronológica
    return dates;
  }, [data]);

  // Mapa rápido: data_iso → objeto completo do dia
  const byDate = useMemo(() => {
    const map: Record<string, (typeof data)[number]> = {};
    for (const row of data) map[row.data_iso] = row;
    return map;
  }, [data]);

  // Formata número para moeda brasileira (R$ 1.234.567)
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);


  const onBuscar = async () => {
    if (!gefSelecionado) {
      toast({ title: "Selecione uma empresa", variant: "destructive" });
      return;
    }

    let inicio: string, fim: string;

    if (visao === "dia") {
      if (!dataInicio || !dataFim) {
        toast({ title: "Datas obrigatórias", variant: "destructive" });
        return;
      }
      if (new Date(dataInicio) > new Date(dataFim)) {
        toast({ title: "Data início deve ser menor", variant: "destructive" });
        return;
      }
      inicio = dataInicio;
      fim = dataFim;
    } else {
      if (!mesInicio || !mesFim) {
        toast({ title: "Selecione os meses", variant: "destructive" });
        return;
      }
      if (mesInicio > mesFim) {
        toast({ title: "Mês início deve ser anterior", variant: "destructive" });
        return;
      }

      // Converte "2025-04" → primeiro e último dia do mês
      const [anoI, mesI] = mesInicio.split("-").map(Number);
      const [anoF, mesF] = mesFim.split("-").map(Number);

      inicio = `${anoI}-${mesI}-01`;
      fim = new Date(anoF, mesF, 0).toISOString().split("T")[0]; // último dia do mês
    }

    const tiposSelecionados = codTipo.includes("all") ? undefined : codTipo;

    await fetchData({
      dataInicio: inicio,
      dataFim: fim,
      show,
      codTipoConta: tiposSelecionados,
      codGrupoEmpresa: gefSelecionado.COD_GRUPOEMPRESA,
      codEmpresa: gefSelecionado.COD_EMPRESA,
      codFilial: gefSelecionado.COD_FILIAL,
      visao,
    });

    setHasSearched(true);
  };


  function toggleTipo(tipo: string) {
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

  const getGefKey = (item: any) =>
    `${item.COD_GRUPOEMPRESA}-${item.COD_EMPRESA}-${item.COD_FILIAL}`;


  const [mesInicio, setMesInicio] = useState<string>("");
  const [mesFim, setMesFim] = useState<string>("");
  const gerarOpcoesMeses = () => {
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth(); // 0-11

    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const opcoes: { value: string; label: string }[] = [];

    // Últimos 5 anos + este ano + próximos 2 anos
    for (let ano = anoAtual - 5; ano <= anoAtual + 2; ano++) {
      for (let mes = 0; mes < 12; mes++) {
        // Só adiciona meses futuros se estiver no ano atual ou futuro
        if (ano > anoAtual || (ano === anoAtual && mes <= mesAtual) || ano < anoAtual) {
          const valor = `${ano}-${String(mes + 1).padStart(2, "0")}`; // "2025-04"
          const rotulo = `${meses[mes]} ${ano}`;
          opcoes.push({ value: valor, label: rotulo });
        }
      }
    }

    return opcoes.reverse(); // mais recente primeiro
  };

  const opcoesMeses = useMemo(gerarOpcoesMeses, []);


  // Substitua o useState antigo de dataInicio/dataFim por este:
  useEffect(() => {
    const hoje = new Date();
    const anoMesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

    // Padrão: mês atual
    setMesInicio(anoMesAtual);
    setMesFim(anoMesAtual);

    // Data início/fim padrão (mantido para visão diária)
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    setDataInicio(inicio.toISOString().split("T")[0]);
    setDataFim(fim.toISOString().split("T")[0]);
  }, []);






  // Colunas únicas (dia ou mês)
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Array.from(new Set(data.map(row => row.data_iso))).sort();
  }, [data]);

  // Mapa de acesso rápido: chave (YYYY-MM-DD ou YYYY-MM) → dados
  const byKey = useMemo(() => {
    const map: Record<string, any> = {};
    data.forEach(row => {
      const key = visao === "mes" && row.data_iso.length === 10
        ? row.data_iso.substring(0, 7)
        : row.data_iso;
      map[key] = row;
    });
    return map;
  }, [data, visao]);

  return (
    <div className="space-y-6">
      {/* ==================== CARD DE FILTROS ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>


        </CardHeader>
        <CardContent>
          {/* Top row: 4 colunas em desktop, 2 em tablet, 1 em mobile */}
          <div className="grid grid-cols-[200px_200px_200px_200px_200px_1fr_auto]  gap-4 items-end">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Visão</Label>
              <Select value={visao} onValueChange={(v) => setVisao(v as "dia" | "semana" | "mes")}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dia">Por Dia</SelectItem>
                  <SelectItem value="semana">Por Semana</SelectItem>
                  <SelectItem value="mes">Por Mês</SelectItem>
                </SelectContent>
              </Select>
            </div>


            {/* Empresa / Filial */}
            <div className="space-y-1">
              <Label className="text-sm font-medium">Empresa/Filial</Label>
              {loadingGef ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Carregando empresas...
                </div>
              ) : errorGef ? (
                <p className="text-xs text-red-600">Erro ao carregar empresas</p>
              ) : (
                <Select value={gefSelecionado ? getGefKey(gefSelecionado) : ""} onValueChange={(value) => {
                  const selecionado = gef.find((g) => getGefKey(g) === value);
                  setGefSelecionado(selecionado || null);
                }}>
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

            {/* Tipo de Conta + Botão Buscar (colocado junto para ocupar a 4ª coluna) */}
            <div className="space-y-1">
              <Label className="text-sm font-medium">Tipo de Conta</Label>

              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="truncate">
                        {codTipo.includes("all")
                          ? "Todos os tipos"
                          : codTipo.length === 0
                            ? "Selecione..."
                            : `${codTipo.length} selecionado(s)`}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full min-w-[240px]" align="start">
                    <DropdownMenuCheckboxItem checked={codTipo.includes("all")} onCheckedChange={() => toggleTipo("all")}>
                      Todos os tipos
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    {(tipos ?? [])
                      .sort((a, b) => a.DESCRICAO.localeCompare(b.DESCRICAO))
                      .map((t) => (
                        <DropdownMenuCheckboxItem
                          key={t.COD_TIPOCONTABANCARIA}
                          checked={codTipo.includes(String(t.COD_TIPOCONTABANCARIA))}
                          onCheckedChange={() => toggleTipo(String(t.COD_TIPOCONTABANCARIA))}
                        >
                          {t.DESCRICAO}
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>


              </div>


            </div>

            {/* Data Início */}
            {/* Campos de Data - agora inteligentes */}
            {visao === "dia" ? (
              <>
                {/* Data Início */}
                <div className="space-y-1">
                  <Label htmlFor="data-inicio">Data Início</Label>
                  <Input
                    id="data-inicio"
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Data Fim */}
                <div className="space-y-1">
                  <Label htmlFor="data-fim">Data Fim</Label>
                  <Input
                    id="data-fim"
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Mês Início */}
                <div className="space-y-1">
                  <Label>Mês Início</Label>
                  <Select value={mesInicio} onValueChange={setMesInicio}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o mês inicial" />
                    </SelectTrigger>
                    <SelectContent className="max-h-96">
                      {opcoesMeses.map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Mês Fim */}
                <div className="space-y-1">
                  <Label>Mês Fim</Label>
                  <Select value={mesFim} onValueChange={setMesFim}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o mês final" />
                    </SelectTrigger>
                    <SelectContent className="max-h-96">
                      {opcoesMeses
                        .filter((op) => op.value >= mesInicio) // só permite meses iguais ou posteriores
                        .map((op) => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}






            {/* Tipo de Conta + Botão Buscar (colocado junto para ocupar a 4ª coluna) */}
            <div className="space-y-1">


              <div className="flex gap-2">
                {/* Botão Buscar fica ao lado do dropdown em telas largas — em mobile, a grid empilha */}
                <Button onClick={onBuscar} disabled={loading} className="whitespace-nowrap">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                      Buscando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>


              </div>


            </div>
          </div>

          {/* Linha de checkboxes — ocupa a largura inteira abaixo do top row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-3 mt-6">
            <div className="flex flex-wrap gap-4 items-center">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={show.mov} onChange={() => toggleShow("mov")} className="h-4 w-4" />
                <span className="text-sm">Movimentações</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={show.pend} onChange={() => toggleShow("pend")} className="h-4 w-4" />
                <span className="text-sm">Pendências</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={show.prev} onChange={() => toggleShow("prev")} className="h-4 w-4" />
                <span className="text-sm">Lançamentos Futuros</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={show.folha} onChange={() => toggleShow("folha")} className="h-4 w-4" />
                <span className="text-sm">Folha CS</span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={show.projecao} onChange={() => toggleShow("projecao")} className="h-4 w-4" />
                <span className="text-sm">Folha Projeção</span>
              </label>

              {visao === "mes" && (
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={show.orcado} onChange={() => toggleShow("orcado")} className="h-4 w-4" />
                  <span className="text-sm">Folha Orçado</span>
                </label>
              )}

            </div>

            {/* botões selecionar/limpar alinhados à direita em telas maiores */}
            <div className="mt-3 sm:mt-0 sm:ml-auto flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => selectAll(true)}>Selecionar tudo</Button>
              <Button variant="ghost" size="sm" onClick={() => selectAll(false)}>Limpar</Button>
            </div>
          </div>

          {error && <p className="text-sm text-red-500 mt-4">Erro: {error}</p>}
        </CardContent>

      </Card>

      {/* ==================== TABELA MATRIZ (só aparece após buscar) ==================== */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>
              Matriz Consolidada do Fluxo de Caixa — Visão {visao === "dia" ? "Diária" : "Mensal"}
            </CardTitle>
            <CardDescription>
              Saldo inicial, valores realizados, pendências e lançamentos previstos — consolidados por {visao === "dia" ? "dia" : "mês"} (todos os bancos).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-full">

                {columns.length > 0 ? (
                  <>
                    {/* Cabeçalho com as datas ou meses */}
                    <div className="grid gap-1 mb-4 mt-4" style={{ gridTemplateColumns: `300px repeat(${columns.length}, 140px)` }}>
                      <div className="font-semibold text-sm py-2 px-4 bg-muted rounded">Consolidado</div>
                      {columns.map((col) => {
                        const isCurrent = visao === "dia"
                          ? col === today
                          : col === today.substring(0, 7);

                        const label = visao === "mes"
                          ? new Date(col + "-02").toLocaleDateString("pt-BR", {
                            month: "short",
                            year: "numeric"
                          }).replace(".", "").toUpperCase()
                          : new Date(col + "T12:00:00").toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit"
                          });

                        return (
                          <div
                            key={col}
                            className={`
                        font-semibold text-xs py-2 px-2 bg-muted rounded text-center 
                        ${isCurrent ? "ring-2 ring-blue-500 ring-offset-1 bg-blue-50 font-bold text-blue-700" : ""}
                      `}
                          >
                            {label}
                            {isCurrent && <span className="block text-[9px] mt-0.5">{visao === "dia" ? "HOJE" : "ATUAL"}</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Linha principal "Consolidado" (clicável para expandir) */}
                    <div
                      className="grid gap-1 hover:bg-muted/50 cursor-pointer bg-muted/20 border rounded-lg"
                      style={{ gridTemplateColumns: `300px repeat(${columns.length}, 140px)` }}
                      onClick={() => setExpandedTotal((v) => !v)}
                    >
                      <div className="flex items-center gap-2 py-3 px-4 font-semibold">
                        {expandedTotal ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        Consolidado
                      </div>
                      {columns.map((col) => (
                        <div key={col} className="py-3 px-2 text-center text-sm font-semibold">
                          <button className="text-primary">
                            {formatCurrency(byKey[col]?.saldofinal ?? 0)}
                          </button>

                          {(byKey[col]?.isOverrideDia === 1) && (
                            <span
                              className="ml-1 inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300"
                              title={`Manual: ${formatCurrency(byKey[col]?.saldoManualDia ?? 0)} | Δ ${formatCurrency(byKey[col]?.ajusteAberturaDia ?? 0)}`}
                            >
                              Manual
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* ==================== DETALHES EXPANDIDOS ==================== */}
                    {expandedTotal && (
                      <div className="ml-4 mt-2 border-l-2 border-muted">

                        {/* Saldo Inicial */}
                        <div className="grid gap-1 hover:bg-muted/30" style={{ gridTemplateColumns: `296px repeat(${columns.length}, 140px)` }}>
                          <div className="py-2 px-4 text-sm text-muted-foreground">Saldo Inicial</div>
                          {columns.map((col) => (
                            <div key={col} className="py-2 px-2 text-center text-sm">
                              {formatCurrency(byKey[col]?.saldoinicial ?? 0)}
                            </div>
                          ))}
                        </div>

                        {/* Movimentações */}
                        {show.mov && (
                          <>
                            <div className="grid gap-1 hover:bg-muted/30 cursor-pointer border-t pt-2 text-green-600"
                              style={{ gridTemplateColumns: `296px repeat(${columns.length}, 140px)` }}
                              onClick={() => setExpandedTipos((s) => ({ ...s, receber: !s.receber }))}>
                              <div className="flex items-center gap-2 py-2 px-4 text-sm">[Movimentações] Contas a Receber</div>
                              {columns.map((col) => (
                                <div key={col} className="py-2 px-2 text-center text-sm" onClick={() => abrirDetalhes(col, "contasreceber")}>
                                  {formatCurrency(byKey[col]?.contasreceber ?? 0)}
                                </div>
                              ))}
                            </div>

                            <div className="grid gap-1 hover:bg-muted/30 cursor-pointer text-red-600"
                              style={{ gridTemplateColumns: `296px repeat(${columns.length}, 140px)` }}
                              onClick={() => setExpandedTipos((s) => ({ ...s, pagar: !s.pagar }))}>
                              <div className="flex items-center gap-2 py-2 px-4 text-sm">[Movimentações] Contas a Pagar</div>
                              {columns.map((col) => (
                                <div key={col} className="py-2 px-2 text-center text-sm" onClick={() => abrirDetalhes(col, "contaspagar")}>
                                  {formatCurrency(byKey[col]?.contaspagar ?? 0)}
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Pendências */}
                        {show.pend && (
                          <>
                            <div className="grid gap-1 hover:bg-muted/30 text-green-600 border-t pt-2"
                              style={{ gridTemplateColumns: `296px repeat(${columns.length}, 140px)` }}>
                              <div className="py-2 px-4 text-sm">[Pendências] A Receber</div>
                              {columns.map((col) => (
                                <div key={col} className="py-2 px-2 text-center text-sm" onClick={() => abrirDetalhes(col, "pendreceber")}>
                                  {formatCurrency(byKey[col]?.pendreceber ?? 0)}
                                </div>
                              ))}
                            </div>

                            <div className="grid gap-1 hover:bg-muted/30 text-red-600"
                              style={{ gridTemplateColumns: `296px repeat(${columns.length}, 140px)` }}>
                              <div className="py-2 px-4 text-sm">[Pendências] A Pagar</div>
                              {columns.map((col) => (
                                <div key={col} className="py-2 px-2 text-center text-sm" onClick={() => abrirDetalhes(col, "pendpagar")}>
                                  {formatCurrency(byKey[col]?.pendpagar ?? 0)}
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Lançamentos Futuros */}
                        {show.prev && (
                          <>
                            <div className="grid gap-1 hover:bg-muted/30 text-green-600 border-t pt-2"
                              style={{ gridTemplateColumns: `296px repeat(${columns.length}, 140px)` }}>
                              <div className="py-2 px-4 text-sm">[Lançamentos Futuros] A Receber</div>
                              {columns.map((col) => (
                                <div key={col} className="py-2 px-2 text-center text-sm" onClick={() => abrirDetalhes(col, "laprevreceber")}>
                                  {formatCurrency(byKey[col]?.laprevreceber ?? 0)}
                                </div>
                              ))}
                            </div>

                            <div className="grid gap-1 hover:bg-muted/30 text-red-600"
                              style={{ gridTemplateColumns: `296px repeat(${columns.length}, 140px)` }}>
                              <div className="py-2 px-4 text-sm">[Lançamentos Futuros] A Pagar</div>
                              {columns.map((col) => (
                                <div key={col} className="py-2 px-2 text-center text-sm" onClick={() => abrirDetalhes(col, "laprevpagar")}>
                                  {formatCurrency(byKey[col]?.laprevpagar ?? 0)}
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Folha */}
                        {show.folha && (
                          <div className="grid gap-1 hover:bg-muted/30 text-red-600 border-t pt-2"
                            style={{ gridTemplateColumns: `296px repeat(${columns.length}, 140px)` }}>
                            <div className="py-2 px-4 text-sm">[Folha CS] A Pagar</div>
                            {columns.map((col) => (
                              <div key={col} className="py-2 px-2 text-center text-sm">
                                {formatCurrency(byKey[col]?.folha ?? 0)}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Projecao */}
                        {show.projecao && (
                          <div className="grid gap-1 hover:bg-muted/30 text-red-600 border-t pt-2"
                            style={{ gridTemplateColumns: `296px repeat(${columns.length}, 140px)` }}>
                            <div className="py-2 px-4 text-sm">[Folha Projeção] A Pagar</div>
                            {columns.map((col) => (
                              <div key={col} className="py-2 px-2 text-center text-sm">
                                {formatCurrency(byKey[col]?.projecao ?? 0)}
                              </div>
                            ))}
                          </div>
                        )}

                        {show.orcado && visao === "mes" && (
                          <>
                            {show.orcado && (
                              <div className="grid gap-1 hover:bg-muted/30 text-red-600 border-t pt-2"
                                style={{ gridTemplateColumns: `296px repeat(${columns.length}, 140px)` }}>
                                <div className="py-2 px-4 text-sm">[Folha Orçado] A Pagar</div>
                                {columns.map((col) => (
                                  <div key={col} className="py-2 px-2 text-center text-sm">
                                    {formatCurrency(byKey[col]?.orcado ?? 0)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}

                        {/* Saldo Final */}
                        <div className="grid gap-1 hover:bg-muted/30 border-t pt-2 font-medium"
                          style={{ gridTemplateColumns: `296px repeat(${columns.length}, 140px)` }}>
                          <div className="py-2 px-4 text-sm font-medium">= Saldo Final</div>
                          {columns.map((col) => (
                            <div key={col} className="py-2 px-2 text-center text-sm font-medium">
                              <button className="hover:underline text-primary">
                                {formatCurrency(byKey[col]?.saldofinal ?? 0)}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {loading ? "Carregando..." : "Nenhum dado para o período selecionado"}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={modalInfo.open} onOpenChange={(open) => setModalInfo({ open, date: null, type: null })}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Detalhes — {modalInfo.type} — {modalInfo.date}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 overflow-y-auto pr-2 flex-1">
            {loadingDetalhes && <p>Carregando detalhes...</p>}
            {detalhesError && <p className="text-red-600">{detalhesError}</p>}

            {!loadingDetalhes && !detalhesError && detalhes?.length === 0 && (
              <p className="text-muted-foreground">Nenhuma movimentação encontrada para essa data/tipo.</p>
            )}

            {!loadingDetalhes && detalhes?.length > 0 && (
              // renderiza dinamicamente conforme modalInfo.type
              <div className="space-y-3">
                {renderDetalhesPorTipo(modalInfo.type, detalhes)}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>



      {/* Mensagem inicial quando ainda não buscou nada */}
      {!hasSearched && !loading && (
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Selecione o período</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Escolha as datas e clique em "Buscar" para visualizar a matriz consolidada.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnaliseMatriz;