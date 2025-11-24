// src/pages/AnaliseMatriz.tsx
import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, ChevronRight, Calendar, Search, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useFluxoCaixaConsolidado } from "@/hooks/fluxo-de-caixa/use-fc-consolidado";


const AnaliseMatriz = () => {
  const [dataInicio, setDataInicio] = useState(() => {
    const hoje = new Date();
    const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return inicio.toISOString().split("T")[0];
  });
  const [dataFim, setDataFim] = useState(() => {
    const hoje = new Date();
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    return fim.toISOString().split("T")[0];
  });

  const { data, loading, error, fetchData } = useFluxoCaixaConsolidado();

  const [show, setShow] = useState<{ mov: boolean; pend: boolean; prev: boolean }>(() => {
    // tenta carregar do localStorage
    try {
      const raw = localStorage.getItem("analiseMatriz.show");
      if (raw) return JSON.parse(raw);
    } catch { }
    return { mov: true, pend: true, prev: true };
  });

  // persiste mudanças
  useEffect(() => {
    try {
      localStorage.setItem("analiseMatriz.show", JSON.stringify(show));
    } catch { }
  }, [show]);

  const toggleShow = (key: keyof typeof show) => {
    setShow((s) => {
      const next = { ...s, [key]: !s[key] };
      // se já buscou, refetch reativo com os novos flags
      if (hasSearched) {
        fetchData({
          dataInicio,
          dataFim,
          show: next, 
        });
      }
      return next;
    });
  };
  const selectAll = (val: boolean) => {
    const next = { mov: val, pend: val, prev: val };
    setShow(next);
    if (hasSearched) {
      fetchData({ dataInicio, dataFim, show: next }); // <<<<<<<<<<<<<<
    }
  };
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedTotal, setExpandedTotal] = useState<boolean>(false);
  const [expandedTipos, setExpandedTipos] = useState<Record<string, boolean>>({});

  const navigate = useNavigate();

  const dateRange = useMemo(() => {
    const dates = data.map(d => d.data_iso);
    dates.sort(); // já vem no ORDER BY, mas garantimos
    return dates;
  }, [data]);

  const byDate = useMemo(() => {
    const map: Record<string, (typeof data)[number]> = {};
    for (const row of data) map[row.data_iso] = row;
    return map;
  }, [data]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);

  const handleNavigateToMovimentacoes = (date?: string) => {
    const params = new URLSearchParams();
    if (date) {
      params.set("dataInicio", date);
      params.set("dataFim", date);
    }
    navigate(`/movimentacoes?${params.toString()}`);
  };

  const handleNavigateToSaldos = () => navigate("/saldos-bancarios");

  const onBuscar = async () => {
    if (!dataInicio || !dataFim) {
      toast({ title: "Datas obrigatórias", description: "Selecione início e fim.", variant: "destructive" });
      return;
    }
    if (new Date(dataInicio) > new Date(dataFim)) {
      toast({ title: "Datas inválidas", description: "Início deve ser <= fim.", variant: "destructive" });
      return;
    }
    await fetchData({ dataInicio, dataFim, show }); // <<<<<<<<<<< envia flags
    setHasSearched(true);
  };


  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Período de Análise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 max-w-2xl">
            <div className="space-y-2 w-48">
              <Label htmlFor="data-inicio">Data Início</Label>
              <Input id="data-inicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>
            <div className="space-y-2 w-48">
              <Label htmlFor="data-fim">Data Fim</Label>
              <Input id="data-fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
            <Button onClick={onBuscar} disabled={loading} className="w-32">
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
          <div className="flex flex-wrap items-center gap-4">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={show.mov}
                onChange={() => toggleShow("mov")}
                className="h-4 w-4"
              />
              <span className="text-sm">Movimentações (Receber/Pagar realizados)</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={show.pend}
                onChange={() => toggleShow("pend")}
                className="h-4 w-4"
              />
              <span className="text-sm">Pendências (A receber / A pagar)</span>
            </label>

            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={show.prev}
                onChange={() => toggleShow("prev")}
                className="h-4 w-4"
              />
              <span className="text-sm">Lançamentos Futuros (A receber / A pagar)</span>
            </label>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => selectAll(true)}>
                Selecionar tudo
              </Button>
              <Button variant="ghost" size="sm" onClick={() => selectAll(false)}>
                Limpar
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-red-500 mt-2">Erro: {error}</p>}
        </CardContent>
      </Card>

      {/* Matriz Consolidada */}
      {hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Matriz Consolidada do Fluxo de Caixa

            </CardTitle>
            <CardDescription>
              Saldo inicial, valores realizados, pendências e lançamentos previstos — consolidados por dia (todos os bancos).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {dateRange.length > 0 ? (
                  <>
                    {/* Header com datas */}
                    <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: `300px repeat(${dateRange.length}, 140px)` }}>
                      <div className="font-semibold text-sm py-2 px-4 bg-muted rounded">Consolidado</div>
                      {dateRange.map((date) => (
                        <div key={date} className="font-semibold text-xs py-2 px-2 bg-muted rounded text-center">
                          {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                        </div>
                      ))}
                    </div>

                    {/* Linha “Consolidado = Saldo Final” */}
                    <div
                      className="grid gap-1 hover:bg-muted/50 cursor-pointer bg-muted/20 border rounded-lg"
                      style={{ gridTemplateColumns: `300px repeat(${dateRange.length}, 140px)` }}
                      onClick={() => setExpandedTotal((v) => !v)}
                    >
                      <div className="flex items-center gap-2 py-3 px-4 font-semibold">
                        {expandedTotal ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        Consolidado
                      </div>
                      {dateRange.map((date) => (
                        <div key={date} className="py-3 px-2 text-center text-sm font-semibold">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleNavigateToMovimentacoes(date); }}
                            className="hover:underline text-primary"
                          >
                            {formatCurrency(byDate[date]?.saldofinal ?? 0)}
                          </button>

                          {(byDate[date]?.isOverrideDia === 1) && (
                            <span
                              className="ml-1 inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300"
                              title={`Manual: ${formatCurrency(byDate[date]?.saldoManualDia ?? 0)} | Δ ${formatCurrency(byDate[date]?.ajusteManualDia ?? 0)}`}
                            >
                              Manual
                            </span>
                          )}
                        </div>

                      ))}
                    </div>

                    {/* Detalhes */}
                    {/* Detalhes */}
                    {expandedTotal && (
                      <div className="ml-4 mt-2 border-l-2 border-muted ">
                        {/* Saldo Inicial (sempre mostra) */}
                        <div className="grid gap-1 hover:bg-muted/30" style={{ gridTemplateColumns: `296px repeat(${dateRange.length}, 140px)` }}>
                          <div className="py-2 px-4 text-sm text-muted-foreground">Saldo Inicial</div>
                          {dateRange.map((date) => (
                            <div key={date} className="py-2 px-2 text-center text-sm">
                              {formatCurrency(byDate[date]?.saldoinicial ?? 0)}
                            </div>
                          ))}
                        </div>

                        {/* ===== Movimentações (realizados) ===== */}
                        {show.mov && (
                          <>
                            {/* Receber (realizado) */}
                            <div
                              className="grid gap-1 hover:bg-muted/30 cursor-pointer border-t pt-2 text-green-600"
                              style={{ gridTemplateColumns: `296px repeat(${dateRange.length}, 140px)` }}
                              onClick={() => setExpandedTipos((s) => ({ ...s, receber: !s.receber }))}
                            >
                              <div className="flex items-center gap-2 py-2 px-4 text-sm">
                                [Movimentações] Contas a Receber
                              </div>
                              {dateRange.map((date) => (
                                <div key={date} className="py-2 px-2 text-center text-sm">
                                  {formatCurrency(byDate[date]?.contasreceber ?? 0)}
                                </div>
                              ))}
                            </div>

                            {/* Pagar (realizado) */}
                            <div
                              className="grid gap-1 hover:bg-muted/30 cursor-pointer text-red-600"
                              style={{ gridTemplateColumns: `296px repeat(${dateRange.length}, 140px)` }}
                              onClick={() => setExpandedTipos((s) => ({ ...s, pagar: !s.pagar }))}
                            >
                              <div className="flex items-center gap-2 py-2 px-4 text-sm">
                                [Movimentações] Contas a Pagar
                              </div>
                              {dateRange.map((date) => (
                                <div key={date} className="py-2 px-2 text-center text-sm">
                                  {formatCurrency(byDate[date]?.contaspagar ?? 0)}
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* ===== Pendências ===== */}
                        {show.pend && (
                          <>
                            <div
                              className="grid gap-1 hover:bg-muted/30 text-green-600 border-t pt-2"
                              style={{ gridTemplateColumns: `296px repeat(${dateRange.length}, 140px)` }}
                            >
                              <div className="py-2 px-4 text-sm">[Pendências] A Receber</div>
                              {dateRange.map((date) => (
                                <div key={date} className="py-2 px-2 text-center text-sm">
                                  {formatCurrency(byDate[date]?.pendreceber ?? 0)}
                                </div>
                              ))}
                            </div>

                            <div
                              className="grid gap-1 hover:bg-muted/30 text-red-600"
                              style={{ gridTemplateColumns: `296px repeat(${dateRange.length}, 140px)` }}
                            >
                              <div className="py-2 px-4 text-sm">[Pendências] A Pagar</div>
                              {dateRange.map((date) => (
                                <div key={date} className="py-2 px-2 text-center text-sm">
                                  {formatCurrency(byDate[date]?.pendpagar ?? 0)}
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* ===== Lançamentos Futuros ===== */}
                        {show.prev && (
                          <>
                            <div
                              className="grid gap-1 hover:bg-muted/30 text-green-600 border-t pt-2"
                              style={{ gridTemplateColumns: `296px repeat(${dateRange.length}, 140px)` }}
                            >
                              <div className="py-2 px-4 text-sm">[Lançamentos Futuros] A Receber</div>
                              {dateRange.map((date) => (
                                <div key={date} className="py-2 px-2 text-center text-sm">
                                  {formatCurrency(byDate[date]?.laprevreceber ?? 0)}
                                </div>
                              ))}
                            </div>

                            <div
                              className="grid gap-1 hover:bg-muted/30 text-red-600"
                              style={{ gridTemplateColumns: `296px repeat(${dateRange.length}, 140px)` }}
                            >
                              <div className="py-2 px-4 text-sm">[Lançamentos Futuros] A Pagar</div>
                              {dateRange.map((date) => (
                                <div key={date} className="py-2 px-2 text-center text-sm">
                                  {formatCurrency(byDate[date]?.laprevpagar ?? 0)}
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        {/* Saldo Final (sempre mostra) */}
                        <div
                          className="grid gap-1 hover:bg-muted/30 border-t pt-2"
                          style={{ gridTemplateColumns: `296px repeat(${dateRange.length}, 140px)` }}
                        >
                          <div className="py-2 px-4 text-sm font-medium">= Saldo Final</div>
                          {dateRange.map((date) => (
                            <div key={date} className="py-2 px-2 text-center text-sm font-medium">
                              <button onClick={() => handleNavigateToMovimentacoes(date)} className="hover:underline text-primary">
                                {formatCurrency(byDate[date]?.saldofinal ?? 0)}
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
