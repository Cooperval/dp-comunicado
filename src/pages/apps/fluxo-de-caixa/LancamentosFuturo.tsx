import { useMemo, useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp, Plus, Pencil, Trash2 } from "lucide-react";
import { useMovimentacao } from "@/hooks/fluxo-de-caixa/use-lancamento";
import { useMovimentacao2 } from "@/hooks/fluxo-de-caixa/use-contabacaria";
import { enviarLancamento, atualizarLancamento, deletarLancamento } from "@/lib/fluxo-de-caixa/api";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

type Movimentacao = {
  id: string;
  descricao: string;
  documento: number;
  valor: number;
  valorPago: number | null;
  data_original: string;
  data_sugerida: string | null;
  banco_id: string;
  tipo: "pagar" | "receber";
  situacao: "pendente" | "realizado";
  desc_situacao: string;
  bancos: { nome: string };
  cod_banco?: number | null;
  cod_agencia?: number | null;
  cod_contabancaria?: number | null;
  created_at: string;
  updated_at: string;
};

type ContaBancaria = {
  COD_AGENCIA: number;
  COD_BANCO: number;
  COD_CONTABANCARIA: number;
  COD_TIPO: number;
  DESC_BANCO: string;
  DESC_TIPOCONTA: string;
  DIGITO: string;
};

const currencyBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

const toISODate = (d?: string | null) =>
  d ? new Date(d).toISOString().slice(0, 10) : "";

const toISOFromBR = (s?: string | null) => {
  if (!s) return "";
  const [dd, mm, yyyy] = s.split("/");
  if (!dd || !mm || !yyyy) return "";
  return `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;
};

const Movimentacoes = () => {
  const [dataInicio, setDataInicio] = useState<string>(() => {
    const y = new Date().getFullYear();
    return `${y}-01-01`;
  });

  const [dataFim, setDataFim] = useState<string>(() => {
    const y = new Date().getFullYear();
    return `${y}-12-31`;
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMovimentacao, setEditingMovimentacao] = useState<Movimentacao | null>(null);

  const { movimentacoes2, loading2, error, fetchData } = useMovimentacao();
  const { movimentacoes3, loading3, error3, fetchData3 } = useMovimentacao2();

  const [deleteTarget, setDeleteTarget] = useState<Movimentacao | null>(null);
  const [deleting, setDeleting] = useState(false);


  // estado do form
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data_original: "",
    data_sugerida: "",
    tipo: "pagar" as "pagar" | "receber",
    situacao: "pendente" as "pendente" | "realizado",
    documento: "",
    cod_banco: "",
    cod_contabancaria: "",
    cod_agencia: "",
    digito: "",
  });

  const onCarregar = useCallback(() => {
    if (!dataInicio || !dataFim) {
      alert("Informe Data Início e Data Fim.");
      return;
    }
    if (dataInicio > dataFim) {
      alert("Data início não pode ser maior que data fim.");
      return;
    }
    fetchData({ dataInicio, dataFim });
  }, [dataInicio, dataFim, fetchData]);


  // aceita tanto o formato novo (DESC_MOVIMENTO, datas formatadas) quanto antigo
  const mapApiToUIFlexible = (items: any[]): Movimentacao[] =>
    items.map((it: any, idx: number) => {
      if ("DESC_MOVIMENTO" in it) {
        const dataOriginalISO = toISOFromBR(it.DATA_ORIGINAL_FORMATADA);
        const dataSugeridaISO = it.DATA_SUGERIDA_FORMATADA ? toISOFromBR(it.DATA_SUGERIDA_FORMATADA) : null;

        const situacao =
          (it.DESC_SITUACAO ?? "").toUpperCase().includes("REALIZ") ? "realizado" : "pendente";

        return {
          id: String(it.ID_MOVIMENTO ?? `${idx}`),
          descricao: it.DESC_MOVIMENTO ?? "—",
          documento: Number(it.DOCUMENTO ?? 0),
          valor: Number(it.VALOR ?? 0),
          valorPago: null,
          data_original: dataOriginalISO,
          data_sugerida: dataSugeridaISO,
          banco_id: String(it.COD_CONTABANCARIA ?? ""),
          tipo: it.TIPO === "R" ? "receber" : "pagar",
          situacao,
          desc_situacao: it.DESC_SITUACAO ?? "—",
          bancos: { nome: it.DESCRICAO ?? "—" },
          // ⬇️ popula os códigos da conta
          cod_banco: it.COD_BANCO ?? null,
          cod_agencia: it.COD_AGENCIA ?? null,
          cod_contabancaria: it.COD_CONTABANCARIA ?? null,
          created_at: dataOriginalISO || new Date().toISOString().slice(0, 10),
          updated_at: new Date().toISOString(),
        } as Movimentacao;
      }

      // formato antigo (não tem esses códigos)
      const id = `${it.COD_EMPRESA}-${it.DOCUMENTO}-${it.PARCELA ?? idx}`;
      const dataOriginal =
        toISODate(it.DATAVCTO) || toISODate(it.DATAVCTO_ORIG) || toISODate(it.DATAENTRADA) || "";

      const situacaoAntiga =
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
        data_sugerida: null,
        banco_id: String(it.COD_FORNECEDOR ?? it.COD_EMPRESA),
        tipo: it.TIPO === "R" ? "receber" : "pagar",
        situacao: situacaoAntiga,
        desc_situacao: it.DESC_SITUACAO ?? "—",
        bancos: { nome: it.DESC_FORNECEDOR ?? it.DESCRICAOTIPOCOBRANCA ?? "—" },
        cod_banco: null,
        cod_agencia: null,
        cod_contabancaria: null,
        created_at: toISODate(it.DATAENTRADA) || new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      } as Movimentacao;
    });


  const movsUI = useMemo(() => mapApiToUIFlexible(movimentacoes2 ?? []), [movimentacoes2]);

  // filtros
  const [activeTab, setActiveTab] = useState<"todas" | "pagar" | "receber">("todas");
  const [descSituacaoFilter, setDescSituacaoFilter] = useState<string>("all");
  const [bancoFilter, setBancoFilter] = useState<string>("all");

  const descSituacoes = useMemo(() => {
    const s = new Set<string>();
    movsUI.forEach((m) => {
      const label = (m.desc_situacao ?? "—").trim();
      if (label) s.add(label);
    });
    return ["all", ...Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [movsUI]);

  const filteredMovimentacoes = useMemo(() => {
    return movsUI.filter((mov) => {
      if (activeTab === "pagar" && mov.tipo !== "pagar") return false;
      if (activeTab === "receber" && mov.tipo !== "receber") return false;
      if (descSituacaoFilter !== "all" && (mov.desc_situacao ?? "—") !== descSituacaoFilter) return false;
      return true;
    });
  }, [movsUI, activeTab, descSituacaoFilter]);

  const contaById = useMemo(() => {
    const m = new Map<string, ContaBancaria>();
    (movimentacoes3 as ContaBancaria[]).forEach((c) => {
      m.set(String(c.COD_CONTABANCARIA), c);
    });
    return m;
  }, [movimentacoes3]);

  const bancoOptions = useMemo(() => {
    const s = new Set<string>();
    filteredMovimentacoes.forEach((m) => {
      const k = (m.bancos?.nome || "—").trim();
      if (k) s.add(k);
    });
    return ["all", ...Array.from(s).sort((a, b) => a.localeCompare(b, "pt-BR"))];
  }, [filteredMovimentacoes]);

  const displayedMovimentacoes = useMemo(() => {
    return filteredMovimentacoes.filter((m) => {
      if (bancoFilter === "all") return true;
      return (m.bancos?.nome || "—").trim() === bancoFilter;
    });
  }, [filteredMovimentacoes, bancoFilter]);

  const baseForTotals = useMemo(() => {
    return (movsUI ?? [])
      .filter(m => descSituacaoFilter === "all" || (m.desc_situacao ?? "—") === descSituacaoFilter)
      .filter(m => bancoFilter === "all" || (m.bancos?.nome || "—").trim() === bancoFilter);
  }, [movsUI, descSituacaoFilter, bancoFilter]);


  // 2) Totais dos cards calculados sobre a base estável
  const totalAReceber = useMemo(
    () => baseForTotals
      .filter(m => m.tipo === "receber" && m.situacao === "pendente")   // <-- só pendentes
      .reduce((sum, m) => sum + (Number.isFinite(m.valor) ? m.valor : 0), 0),
    [baseForTotals]
  );

  const totalAPagar = useMemo(
    () => baseForTotals
      .filter(m => m.tipo === "pagar" && m.situacao === "pendente")      // <-- só pendentes
      .reduce((sum, m) => sum + (Number.isFinite(m.valor) ? m.valor : 0), 0),
    [baseForTotals]
  );

  const saldoLiquido = totalAReceber - totalAPagar;

  const resetForm = () => {
    setFormData({
      descricao: "",
      valor: "",
      data_original: "",
      data_sugerida: "",
      tipo: "pagar",
      situacao: "pendente",
      documento: "",
      cod_banco: "",
      cod_contabancaria: "",
      cod_agencia: "",
      digito: "",
    });
    setEditingMovimentacao(null);
  };



  const onEdit = useCallback((m: Movimentacao) => {
    setEditingMovimentacao(m);
    setDialogOpen(true);
    fetchData3(); // para garantir as contas do banco

    setFormData({
      descricao: m.descricao ?? "",
      valor: String(m.valor ?? ""),
      data_original: m.data_original || "",
      data_sugerida: m.data_sugerida || "",
      documento: String(m.documento ?? ""),
      tipo: m.tipo,
      situacao: m.situacao,
      cod_banco: m.cod_banco != null ? String(m.cod_banco) : "",
      cod_contabancaria: m.cod_contabancaria != null ? String(m.cod_contabancaria) : "",
      cod_agencia: m.cod_agencia != null ? String(m.cod_agencia) : "",
      digito: "", // preencha aqui se você também salvar o dígito por lançamento
    });
  }, [fetchData3]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();



    try {
      if (editingMovimentacao) {
        await atualizarLancamento(editingMovimentacao.id, {
          descricao: formData.descricao,
          valor: formData.valor,
          tipo: formData.tipo,
          documento: formData.documento,
          cod_banco: formData.cod_banco,
          cod_agencia: formData.cod_agencia,
          cod_contabancaria: formData.cod_contabancaria,
          digito: formData.digito,

          data_sugerida: formData.data_sugerida,
          situacao: formData.situacao,
        });
        toast({ title: "Laçamentos Atualizados", description: "Alterações salvas com sucesso." });
      } else {
        await enviarLancamento({
          descricao: formData.descricao,
          valor: formData.valor,
          tipo: formData.tipo,
          documento: formData.documento,
          cod_banco: formData.cod_banco,
          cod_agencia: formData.cod_agencia,
          cod_contabancaria: formData.cod_contabancaria,
          digito: formData.digito,

          data_sugerida: formData.data_sugerida,
          situacao: formData.situacao,
        });
        toast({ title: "Lançamento adicionado", description: "O lançamento foi salvo com sucesso." });
      }

      setDialogOpen(false);
      resetForm();
      // recarrega com o filtro atual, se existir
      if (dataInicio && dataFim) fetchData({ dataInicio, dataFim });
      else fetchData({});
    } catch (err) {
      console.error("Erro salvar (frontend) ->", err);
      // se err.response?.data?.error existe, logue também:
      if (err?.response?.data) console.error("Resposta da API:", err.response.data);
      toast({ title: "Erro ao salvar", description: err?.message ?? "Não foi possível salvar.", variant: "destructive" });
    }

  };


  const formatContaLabel = (c: ContaBancaria) =>
    `Ag ${c.COD_AGENCIA} • Conta ${c.COD_CONTABANCARIA} • ${c.DIGITO}  -  ${c.DESC_TIPOCONTA}`;

  const bancosOptions = useMemo(() => {
    const map = new Map<number, string>();
    (movimentacoes3 as ContaBancaria[]).forEach((c) => {
      if (!map.has(c.COD_BANCO)) map.set(c.COD_BANCO, c.DESC_BANCO);
    });
    return Array.from(map.entries())
      .map(([cod, nome]) => ({ value: String(cod), label: nome }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [movimentacoes3]);

  const contasOptions = useMemo(() => {
    if (!formData.cod_banco) return [];
    return (movimentacoes3 as ContaBancaria[])
      .filter((c) => String(c.COD_BANCO) === String(formData.cod_banco))
      .map((c) => ({
        value: String(c.COD_CONTABANCARIA),
        label: formatContaLabel(c),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [movimentacoes3, formData.cod_banco]);

  useEffect(() => {
    if (dialogOpen) fetchData3();
  }, [dialogOpen, fetchData3]);




  const confirmDelete = useCallback((m: Movimentacao) => {
    setDeleteTarget(m);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await deletarLancamento(deleteTarget.id);
      toast({ title: "Lançamento excluído", description: "Removido com sucesso." });
      setDeleteTarget(null);
      // recarrega com o filtro atual, se existir
      if (dataInicio && dataFim) fetchData({ dataInicio, dataFim });
      else fetchData({});
    } catch (err: any) {
      toast({
        title: "Erro ao excluir",
        description: err?.message ?? "Não foi possível excluir.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  }, [deleteTarget, dataInicio, dataFim, fetchData]);

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

  return (
    <div className="space-y-6">
      {/* Datas e carregar */}
      <div className="flex flex-col items-center md:flex-row md:items-end gap-4 justify-between">
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

          <button
            onClick={onCarregar}
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent"
          >
            Carregar
          </button>
        </div>


        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Lançamento Futuro
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[525px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingMovimentacao ? "Editar Lançamento Futuro" : "Novo Lançamento Futuro"}
                </DialogTitle>
                <DialogDescription>
                  {editingMovimentacao
                    ? "Atualize as informações do lançamento."
                    : "Adicione um novo lançamento à sua lista."}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="descricao" className="text-right">Descrição *</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="valor" className="text-right">Valor *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="tipo" className="text-right">Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: "pagar" | "receber") => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pagar">A Pagar</SelectItem>
                      <SelectItem value="receber">A Receber</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="documento" className="text-right">Documento</Label>
                  <Input
                    id="documento"
                    value={formData.documento}
                    onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                    className="col-span-3"

                  />
                </div>

                {/* Banco */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cod_banco" className="text-right">Banco</Label>
                  <Select
                    value={formData.cod_banco}
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        cod_banco: value,
                        cod_contabancaria: "",
                        cod_agencia: "",
                        digito: "",
                      });
                    }}
                  >
                    <SelectTrigger className="col-span-3" id="cod_banco">
                      <SelectValue placeholder={loading3 ? "Carregando bancos..." : "Selecione um banco"} />
                    </SelectTrigger>
                    <SelectContent>
                      {error3 && (
                        <div className="px-3 py-2 text-sm text-destructive">Falha ao carregar bancos</div>
                      )}
                      {!error3 && bancosOptions.length === 0 && !loading3 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Nenhum banco encontrado</div>
                      )}
                      {bancosOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Conta (filtrada pelo banco) */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cod_contabancaria" className="text-right">Conta</Label>
                  <Select
                    value={formData.cod_contabancaria}
                    onValueChange={(value) => {
                      const conta = contaById.get(value);
                      setFormData({
                        ...formData,
                        cod_contabancaria: value,
                        cod_agencia: conta ? String(conta.COD_AGENCIA) : "",
                        digito: conta ? String(conta.DIGITO) : "",
                      });
                    }}
                  >
                    <SelectTrigger
                      className="col-span-3"
                      id="cod_contabancaria"
                      disabled={!formData.cod_banco}
                    >
                      <SelectValue
                        placeholder={
                          !formData.cod_banco
                            ? "Selecione um banco primeiro"
                            : (loading3 ? "Carregando contas..." : "Selecione a conta")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {!formData.cod_banco && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Selecione um banco primeiro</div>
                      )}
                      {formData.cod_banco && contasOptions.length === 0 && !loading3 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">Nenhuma conta para este banco</div>
                      )}
                      {contasOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>



                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="data_sugerida" className="text-right">Data Sugerida *</Label>
                  <Input
                    id="data_sugerida"
                    type="date"
                    value={formData.data_sugerida}
                    onChange={(e) => setFormData({ ...formData, data_sugerida: e.target.value })}
                    className="col-span-3"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="situacao" className="text-right">Situação *</Label>
                  <Select
                    value={formData.situacao}
                    onValueChange={(value: "pendente" | "realizado") => setFormData({ ...formData, situacao: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="realizado">Realizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="submit">
                  {editingMovimentacao ? "Atualizar" : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards */}
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
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
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

      {/* Filtros + Tabela */}
      <Card>
        <CardHeader />
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Banco:</span>
              <Select value={bancoFilter} onValueChange={setBancoFilter}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {bancoOptions
                    .filter((v) => v !== "all")
                    .map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>


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

            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Situação (descrição):</span>
              <Select value={descSituacaoFilter} onValueChange={setDescSituacaoFilter}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {descSituacoes
                    .filter((v) => v !== "all")
                    .map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="mb-3 text-sm text-destructive">
              Ocorreu um erro ao carregar as movimentações.
            </div>
          )}

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Banco</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead>Data Sugerida</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedMovimentacoes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-6">
                      Nenhuma movimentação encontrada com os filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedMovimentacoes.map((movimentacao) => (
                    <TableRow key={movimentacao.id}>
                      <TableCell className="max-w-[320px] truncate">{movimentacao.descricao}</TableCell>
                      <TableCell>{movimentacao.documento}</TableCell>
                      <TableCell>{movimentacao.cod_banco ?? "—"} - {movimentacao.bancos?.nome ?? "—"}</TableCell>
                      <TableCell> Ag {movimentacao.cod_agencia ?? "—"} / Conta {movimentacao.cod_contabancaria ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={movimentacao.tipo === "receber" ? "default" : "destructive"}>
                          {movimentacao.tipo === "receber" ? (
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
                        <Badge variant={movimentacao.situacao === "realizado" ? "default" : "secondary"}>
                          {movimentacao.desc_situacao}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {movimentacao.data_sugerida
                          ? new Date(movimentacao.data_sugerida + "T12:00:00").toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div >
                          {currencyBRL(movimentacao.valor)}
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(movimentacao)}
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => confirmDelete(movimentacao)}
                            title="Excluir"
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
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `Você está prestes a excluir "${deleteTarget.descricao}" (doc ${deleteTarget.documento}). Essa ação não pode ser desfeita.`
                : "Essa ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default Movimentacoes;
