import { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Pencil, Trash2, Loader2, Filter, ChevronsUpDown, FileSpreadsheet, Search, RotateCcw } from "lucide-react";
import { useMovimentacao } from "@/pages/apps/fluxo-de-caixa/hooks/use-saldo";
import { useTipoContas } from "@/pages/apps/fluxo-de-caixa/hooks/use-contabacaria";
import { useMovimentacaoLogs } from "@/pages/apps/fluxo-de-caixa/hooks/use-logs";
import { useGef } from "@/pages/apps/fluxo-de-caixa/hooks/use-gef";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import * as XLSX from "xlsx";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/pages/apps/fluxo-de-caixa/hooks/use-toast";
import { enviarContaParaEdicao, atualizarContaSaldo, deletarContaSaldo } from "@/pages/apps/fluxo-de-caixa/lib/api";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
// se você tem o componente exportado em src/components/ui/dropdown-menu.tsx (shadcn)
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

import { useAuth } from '@/contexts/AuthContext';

/* ============================================================================
 * TIPOS
 * ========================================================================== */

/** Linha retornada pela query de saldos no Oracle */
type MovOracle = {
  COD_BANCO: number;
  COD_AGENCIA: number;
  COD_CONTABANCARIA: number;
  DIGITO: string;
  DESC_BANCO: string;
  COD_TIPO: number;
  DESC_TIPOCONTA: string;
  SALDO: number;                 // saldo calculado pela função
  NOVO_SALDO?: number | null;    // 👈 do LEFT JOIN novos
  DATA_LANCAMENTO?: string | null;
  MOTIVO?: string | null;
  SALDO_NAO_BAIXADO?: number | null;
};


/* ============================================================================
 * HELPERS (formatação / utilidades)
 * ========================================================================== */

/** Cor do saldo (positivo, negativo, zero) */
const moneyColor = (v: number) =>
  v > 0 ? "text-emerald-600" : v < 0 ? "text-red-600" : "text-muted-foreground";

/** Formata número em BRL (sem quebrar em undefined/null) */
const currencyBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);

/** Data de hoje no formato YYYY-MM-DD */
const todayISO = () => new Date().toISOString().slice(0, 10);

/** Largura automática de colunas para XLSX */
const fitToColumn = (rows: Record<string, any>[]) => {
  const cols = Object.keys(rows[0] || {});
  return cols.map((col) => {
    const maxLen = Math.max(
      col.length,
      ...rows.map((r) => String(r[col] ?? "").length)
    );
    return { wch: Math.min(Math.max(maxLen + 2, 10), 50) }; // min 10, max 50
  });
};
/** Para tratar o novo saldo**/
/** Para tratar o novo saldo (corrigida) */
const parseBRL = (s: string | undefined | null) => {
  if (!s) return null;
  const str = String(s).trim();

  // Remove "R$", espaços
  let cleaned = str.replace(/[R$\s]/g, "");

  // Se houver parênteses para negativo: "(1.234,56)" => -1234.56
  const isNegative = /^\(.*\)$/.test(cleaned);
  if (isNegative) cleaned = cleaned.replace(/^\(|\)$/g, "");

  // Remove separador de milhares (pontos), troca vírgula decimal por ponto
  cleaned = cleaned.replace(/\./g, "").replace(/,/g, ".");

  // Agora tenta converter
  const n = Number(cleaned);
  const final = Number.isFinite(n) ? (isNegative ? -n : n) : null;
  return final;
};



/* ============================================================================
 * COMPONENTE
 * ========================================================================== */

const SaldosBancarios = () => {

  const { token } = useAuth();
  // -----------------------------
  // ESTADO LOCAL
  // -----------------------------
  const [dataFim, setDataFim] = useState<string>("");            // data referência (YYYY-MM-DD)
  const [codTipo, setCodTipo] = useState<string[]>(["all"]);      // filtro por tipo de conta


  // -----------------------------
  // HOOKS DE DADOS
  // -----------------------------
  const { saldos, loading2, error, fetchData } = useMovimentacao();           // saldos
  const { tipos, errorTipos, fetchDataTipos } = useTipoContas();        // tipos de conta
  const { movimentacoesLogs, loadingLogs, errorLogs, fetchDataLogs } = useMovimentacaoLogs();
  const { gef, loadingGef, errorGef, fetchDataGef } = useGef();
  const [gefSelecionado, setGefSelecionado] = useState<any>(null);



  // Carrega os tipos de conta ao montar a página
  useEffect(() => { fetchDataTipos(); }, [fetchDataTipos]);
  useEffect(() => { fetchDataGef(); }, [fetchDataGef]);

  // -----------------------------
  // AÇÕES DE TELA
  // -----------------------------

  /** Dispara a busca de saldos com os filtros atuais */
  const onCarregar = () => {
    const ref = dataFim || todayISO();
    const tiposSelecionados = codTipo.includes("all") ? undefined : codTipo;

    // Se não tiver GEF selecionado, avisa ou bloqueia
    if (!gefSelecionado) {
      toast({
        title: "Selecione uma empresa",
        description: "Escolha uma empresa/filial para continuar.",
        variant: "destructive",
      });
      return;
    }

    fetchData({
      dataFim: ref,
      codTipo: tiposSelecionados,

      // Envia os 3 códigos do GEF
      codGrupoEmpresa: gefSelecionado.COD_GRUPOEMPRESA,
      codEmpresa: gefSelecionado.COD_EMPRESA,
      codFilial: gefSelecionado.COD_FILIAL,
    });
  };




  // ====== ESTADO E AÇÕES DE EDIÇÃO ======
  type SelectedConta = {
    cod_banco: number;
    cod_agencia: number;
    cod_contabancaria: number;
    digito: string;
    saldo: number;
    cod_tipo: number;
    jaAjustada?: boolean; // 👈
    label?: string;
    motivo?: string | null; // <- novo
  };


  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedConta, setSelectedConta] = useState<SelectedConta | null>(null);
  const [novoSaldoInput, setNovoSaldoInput] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");

  const [logsOpen, setLogsOpen] = useState(false);
  const handleReload = () => {
    fetchDataLogs();
  };

  useEffect(() => {
    if (logsOpen) {
      handleReload();
    }
  }, [logsOpen]);

  // abre modal com a conta selecionada
  const handleEditClick = useCallback(
    (bank: { codBanco: number; descBanco: string }, conta: { agencia: number; conta: number; digito: string; saldo: number; cod_tipo: number; motivo?: string | null }) => {

      setSelectedConta({
        cod_banco: bank.codBanco,
        cod_agencia: conta.agencia,
        cod_contabancaria: conta.conta,
        cod_tipo: conta.cod_tipo,
        digito: conta.digito,
        saldo: conta.saldo,
        label: `${bank.descBanco} · Ag ${conta.agencia} · Cc ${conta.conta}-${conta.digito}`,
        jaAjustada: (conta as any).jaAjustada ?? false,
        motivo: conta.motivo ?? null,
      });


      setNovoSaldoInput(
        String(conta.saldo ?? 0).replace(".", ",")
      );
      // preenche motivo
      setMotivo(conta.motivo ?? "");
      setEditOpen(true);
    },
    []
  );

  useEffect(() => {
    if (!selectedConta) {
      setNovoSaldoInput("");
      setMotivo("");
      return;
    }
    // pré-preenche com o saldo atual formatado (pt-BR)
    setNovoSaldoInput(String(selectedConta.saldo ?? 0).replace(".", ","));
    setMotivo(selectedConta.motivo ?? "");
  }, [selectedConta]);





  // envia para API (somente os identificadores solicitados)
  const onConfirmEdit = useCallback(async () => {
    if (!selectedConta) return;

    const parsed = parseBRL(novoSaldoInput);
    if (parsed == null) {
      toast({ title: "Valor inválido", description: "Informe um novo saldo válido (ex: 1.234,56).", variant: "destructive" });
      return;
    }

    if (!motivo || motivo.trim().length < 5) {
      toast({ title: "Motivo necessário", description: "Informe um motivo (mínimo 5 caracteres).", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);

      const basePayload = {
        cod_banco: selectedConta.cod_banco,
        cod_agencia: selectedConta.cod_agencia,
        cod_contabancaria: selectedConta.cod_contabancaria,
        cod_tipo: selectedConta.cod_tipo,
        digito: selectedConta.digito,
        saldo_antigo: selectedConta.saldo,
        novo_saldo: parsed,
        motivo: motivo.trim(),
      };

      const dataRef = dataFim || todayISO(); // mesma data do POST/PUT

      if (selectedConta.jaAjustada) {
        // passe token COMO SEGUNDO ARGUMENTO (não dentro do objeto)
        await atualizarContaSaldo({ ...basePayload, data: dataRef }, token);
      } else {
        await enviarContaParaEdicao({ ...basePayload, data: dataRef }, token);
      }

      toast({ title: "Conta salva", description: "Saldo ajustado com sucesso." });
      setEditOpen(false);
      setSelectedConta(null);

      // Recarrega a lista para refletir o ajuste
      onCarregar();
    } catch (e: any) {
      console.error("Erro ao salvar saldo:", e);
      toast({ title: "Erro", description: e?.message ?? "Falha ao salvar saldo.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [selectedConta, novoSaldoInput, motivo, dataFim]);


  // -----------------------------
  // DERIVADOS / AGRUPAMENTOS
  // -----------------------------

  /**
   * Agrupa o array do Oracle por:
   * Banco -> Tipo de Conta -> Contas
   * Também calcula totais por banco e por tipo.
   */
  const grouped = useMemo(() => {
    const rowsAll = (saldos as MovOracle[]) || [];

    const normalizeCodTipoToSet = (ct: any): Set<number> | null => {
      if (ct === undefined || ct === null) return null;
      if (Array.isArray(ct)) {
        const s = new Set(ct.map((x) => Number(x)).filter((n) => Number.isInteger(n)));
        return s.size ? s : null;
      }
      const raw = String(ct).trim();
      if (raw === "" || /^all$/i.test(raw)) return null;
      if (raw.includes(",")) {
        const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
        const s = new Set(parts.map((p) => Number(p)).filter((n) => Number.isInteger(n)));
        return s.size ? s : null;
      }
      const n = Number(raw);
      return Number.isInteger(n) ? new Set([n]) : null;
    };

    const codTipoSet = normalizeCodTipoToSet(codTipo);

    // Mapa principal por banco (adicionado campos de 'nao baixado')
    const byBank = new Map<
      number,
      {
        codBanco: number;
        descBanco: string;
        totalBanco: number;
        totalBancoOriginal: number;
        totalBancoEfetivo: number;
        totalBancoNaoBaixado: number; // novo
        tipos: Map<
          number,
          {
            codTipo: number;
            descTipo: string;
            totalTipo: number;
            totalTipoOriginal: number;
            totalTipoEfetivo: number;
            totalTipoNaoBaixado: number; // novo
            contas: Array<{
              agencia: number;
              conta: number;
              digito: string;
              saldo: number;
              saldoOracle: number;
              novo_saldo: number | null;
              motivo: string | null;
              saldo_nao_baixado: number; // novo
            }>;
          }
        >;
      }
    >();

    // Agregação
    for (const r of rowsAll) {
      const saldoOriginal = Number(r.SALDO) || 0;
      const saldoNovo = r.NOVO_SALDO == null ? null : Number(r.NOVO_SALDO);
      const saldoEfetivo = saldoNovo ?? saldoOriginal;

      // novo: saldo não baixado vindo do Oracle
      const saldoNaoBaixado = Number(r.SALDO_NAO_BAIXADO) || 0;

      const codBanco = Number(r.COD_BANCO);
      const codTipoNum = Number(r.COD_TIPO);

      if (!byBank.has(codBanco)) {
        byBank.set(codBanco, {
          codBanco,
          descBanco: r.DESC_BANCO ?? "",
          totalBanco: 0,
          totalBancoOriginal: 0,
          totalBancoEfetivo: 0,
          totalBancoNaoBaixado: 0,
          tipos: new Map(),
        });
      }
      const bank = byBank.get(codBanco)!;
      bank.totalBanco += saldoEfetivo;
      bank.totalBancoOriginal += saldoOriginal;
      bank.totalBancoEfetivo += saldoEfetivo;
      bank.totalBancoNaoBaixado += saldoNaoBaixado; // acumula não baixado

      if (!bank.tipos.has(codTipoNum)) {
        bank.tipos.set(codTipoNum, {
          codTipo: codTipoNum,
          descTipo: r.DESC_TIPOCONTA ?? "",
          totalTipo: 0,
          totalTipoOriginal: 0,
          totalTipoEfetivo: 0,
          totalTipoNaoBaixado: 0,
          contas: [],
        });
      }

      const tipo = bank.tipos.get(codTipoNum)!;
      tipo.totalTipo += saldoEfetivo;
      tipo.totalTipoOriginal += saldoOriginal;
      tipo.totalTipoEfetivo += saldoEfetivo;
      tipo.totalTipoNaoBaixado += saldoNaoBaixado;

      tipo.contas.push({
        agencia: Number(r.COD_AGENCIA),
        conta: Number(r.COD_CONTABANCARIA),
        digito: String(r.DIGITO ?? ""),
        // mantenha ambos os valores:
        saldoOracle: saldoOriginal,                          // “original”
        novo_saldo: saldoNovo,                               // “novo”, se houver
        saldo: saldoEfetivo,                                 // “efetivo”
        motivo: r.MOTIVO ?? null,
        saldo_nao_baixado: saldoNaoBaixado,                  // novo campo
      });
    }

    // Converte Maps em arrays e ordena
    const banksArr = Array.from(byBank.values())
      .map((bank) => ({
        ...bank,
        tipos: Array.from(bank.tipos.values()).sort((a, b) =>
          a.descTipo.localeCompare(b.descTipo)
        ),
      }))
      .sort((a, b) => a.descBanco.localeCompare(b.descBanco));

    return banksArr;
  }, [saldos, codTipo]);



  /** Soma final para o card de resumo */
  const totalOriginal = useMemo(
    () => grouped.reduce((sum, b) => sum + b.totalBancoOriginal, 0),
    [grouped]
  );

  const totalEfetivo = useMemo(
    () => grouped.reduce((sum, b) => sum + b.totalBancoEfetivo, 0),
    [grouped]
  );

  const totalNaoBaixado = useMemo(
    () => grouped.reduce((sum, b) => sum + (b.totalBancoNaoBaixado || 0), 0),
    [grouped]
  );

  const totalProjetado = totalEfetivo + totalNaoBaixado;





  // handlers instrumentados — cole no componente no lugar dos atuais handleEditLog / handleDeleteLog

  const handleEditLog = useCallback((log: any) => {
    try {
      console.log("[Saldos] handleEditLog chamado:", log);
      if (!log) return;

      const codBanco = Number(log.COD_BANCO ?? log.cod_banco ?? log.bank_code);
      const codAg = Number(log.COD_AGENCIA ?? log.cod_agencia ?? log.agencia);
      const codConta = Number(log.COD_CONTABANCARIA ?? log.cod_contabancaria ?? log.conta);
      const digito = String(log.DIGITO ?? log.digito ?? "");
      const codTipo = Number(log.COD_TIPO ?? log.COD_TIPOCONTABANCARIA ?? log.cod_tipo ?? 0);

      setSelectedConta({
        cod_banco: codBanco,
        cod_agencia: codAg,
        cod_contabancaria: codConta,
        digito,
        saldo: Number(log.SALDO_ANTIGO ?? log.SALDO ?? 0),
        cod_tipo: codTipo,
        jaAjustada: true,
        label: `${log.DESC_CONTA ?? log.DESC_BANCO ?? ""} · Ag ${codAg} · Cc ${codConta}-${digito}`,
        motivo: log.MOTIVO ?? log.DESCRICAO ?? "",
      });

      const valor = log.NOVO_SALDO ?? log.SALDO_ANTIGO ?? log.SALDO ?? 0;
      setNovoSaldoInput(
        Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      );
      setMotivo(String(log.MOTIVO ?? log.DESCRICAO ?? ""));
      setEditOpen(true);
    } catch (err) {
      console.error("[Saldos] erro em handleEditLog:", err);
      toast({ title: "Erro", description: "Falha ao preparar edição.", variant: "destructive" });
    }
  }, []);

  const isoDateFromLog = (raw: any) => {
    if (!raw) return null;
    // raw pode ser '2025-10-09T14:32:00' ou '2025-10-09 14:32:00' ou '2025-10-09'
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toISOString().slice(0, 10); // YYYY-MM-DD
    }
    // fallback: extrai com regex
    const m = String(raw).match(/(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
  };

  const handleDeleteLog = useCallback(async (log: any) => {
    try {
      console.log("[Saldos] handleDeleteLog chamado:", log);
      if (!log) return;

      // tenta extrair data do log (DATA_LANCAMENTO, DATA, etc)
      const extractedDate = isoDateFromLog(log.DATA_LANCAMENTO ?? log.DATA ?? log.dataLancamento ?? log.data);
      if (!extractedDate) {
        toast({ title: "Data ausente", description: "Não foi possível identificar a data do lançamento.", variant: "destructive" });
        return;
      }

      // mapeamento defensivo dos campos
      const cod_banco = Number(log.COD_BANCO ?? log.cod_banco ?? log.bank ?? NaN);
      const cod_agencia = Number(log.COD_AGENCIA ?? log.cod_agencia ?? log.agencia ?? NaN);
      const cod_contabancaria = Number(log.COD_CONTABANCARIA ?? log.cod_contabancaria ?? log.conta ?? NaN);
      const cod_tipo = Number(log.COD_TIPO ?? log.COD_TIPOCONTABANCARIA ?? log.cod_tipocontabancaria ?? log.cod_tipo ?? NaN);

      // digito: backend pode esperar null em vez de ""
      let digitoRaw = log.DIGITO ?? log.digito ?? log.dig ?? null;
      if (typeof digitoRaw === "string") digitoRaw = digitoRaw.trim();
      const digito = digitoRaw === "" ? null : (digitoRaw == null ? null : String(digitoRaw));

      const payload = {
        cod_banco,
        cod_agencia,
        cod_contabancaria,
        cod_tipo,
        digito,
        data: extractedDate,
      };



      // validação local antes de chamar API
      if (![payload.cod_banco, payload.cod_agencia, payload.cod_contabancaria, payload.cod_tipo].every(Number.isFinite)) {
        console.error("[Saldos] payload inválido:", payload);
        toast({ title: "Dados inválidos", description: "Alguns campos do lançamento estão inválidos. Verifique no console.", variant: "destructive" });
        return;
      }

      // chamada
      const resp = await deletarContaSaldo(payload, token);
      console.log("[Saldos] resposta deletarContaSaldo:", resp);

      toast({ title: "Ajuste removido", description: "O lançamento do dia foi excluído." });

      // recarrega logs e lista principal
      handleReload();
      onCarregar();
    } catch (e: any) {
      console.error("[Saldos] erro em handleDeleteLog:", e);
      // se a API retornou mensagem específica, mostra ela
      const msg = e?.message ?? String(e);
      toast({ title: "Erro ao remover", description: msg, variant: "destructive" });
    }
  }, [handleReload, dataFim]);




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

  // Gera uma chave única para o Select (recomendado)
  const getGefKey = (item: any) =>
    `${item.COD_GRUPOEMPRESA}-${item.COD_EMPRESA}-${item.COD_FILIAL}`;
  return (
    <div className="space-y-6">

      {/* ===================== Filtros ===================== */}
      <Card className="w-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-4 items-end">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 items-end">
            {/* Empresa/Filial */}
            <div className="lg:col-span-1 space-y-1">
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

            {/* Tipo de Conta */}
            <div className="lg:col-span-1 space-y-1">
              <Label className="text-sm font-medium">Tipo de Conta</Label>
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
                  <DropdownMenuCheckboxItem
                    checked={codTipo.includes("all")}
                    onCheckedChange={() => toggleTipo("all")}
                  >
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
              {errorTipos && <p className="text-xs text-red-500 mt-1">Erro ao carregar tipos</p>}
            </div>

            {/* Data de Referência */}
            <div className="lg:col-span-1 space-y-1">
              <Label htmlFor="date-filter" className="text-sm font-medium">
                Data de Referência
              </Label>
              <Input
                id="date-filter"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Botão Carregar + Status */}
            <div className="flex flex-col justify-end gap-3">
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              onClick={onCarregar}
              className="h-9 px-6 font-medium"
              disabled={loading2}
            >
              {loading2 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Carregar Saldos
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDataFim("");
                setCodTipo(["all"]);
                setGefSelecionado(null);
              }}
              className="h-9 px-5"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          </div>


        </CardContent>
      </Card>

      {/* ===================== Card de Resumo ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Card – Saldo Original */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Original CS</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {totalOriginal != null && !Number.isNaN(totalOriginal)
                ? currencyBRL(totalOriginal)
                : "-"}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Referência{" "}
              {dataFim
                ? new Date(dataFim + "T12:00:00").toLocaleDateString("pt-BR")
                : "—"}
            </p>
          </CardContent>

        </Card>

        {/* Card – Saldo Atualizado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atualizado</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {currencyBRL(totalEfetivo)}
            </div>

          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conciliação Bancária</CardTitle>
            {/* ícone em amarelo: destaque, mas sinta-se livre pra trocar */}
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {currencyBRL(totalNaoBaixado)}
            </div>

            <p className="text-xs text-muted-foreground mt-2">
              Valores pendentes {dataFim ? new Date(dataFim + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
            </p>


          </CardContent>


        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Original CS + Atualizado + Conciliação Bancária</CardTitle>
            {/* ícone em amarelo: destaque, mas sinta-se livre pra trocar */}
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>



          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {currencyBRL(totalProjetado)}
            </div>


          </CardContent>
        </Card>


      </div>



      {/* ===================== Accordion por Banco -> Tipos -> Contas ===================== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
          <CardTitle>Saldos por Banco</CardTitle>



          <Button
            variant="default"
            className="w-[200px] bg-green-600 hover:bg-green-700 text-white font-semibold"
            onClick={() => setLogsOpen(true)}
            title="Ver Alterações de Manuais"
          >
            Ver Alterações de Manuais
          </Button>
        </CardHeader>

        <CardContent>

          {/* Loading global discreto (aparece abaixo da linha) */}
          {loading2 && !error && (
            <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Consultando saldos...
            </div>
          )}

          {!loading2 && !error && grouped.length === 0 && (
            <div className="text-sm text-muted-foreground">
              Nenhum saldo encontrado para a data selecionada.
            </div>
          )}

          {!loading2 && !error && grouped.length > 0 && (
            <Accordion type="multiple" className="w-full">
              {grouped.map((bank) => {
                const ajustadoBanco =
                  bank.tipos.some(t => t.contas.some(c => c.novo_saldo != null));
                const naoBaixadoBanco = bank.totalBancoNaoBaixado;
                return (
                  <AccordionItem key={bank.codBanco} value={`bank-${bank.codBanco}`}>
                    <AccordionTrigger className="w-full">
                      <div className="flex w-full items-center justify-between gap-3 pr-6">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="font-semibold truncate">{bank.descBanco}</span>
                        </div>

                        <div className="flex items-center">

                          {naoBaixadoBanco != null && naoBaixadoBanco !== 0 && (
                            <span
                              className={`ml-2 inline-flex items-center rounded px-2 mr-2 py-1 text-xs font-medium ${naoBaixadoBanco > 0
                                ? "bg-green-100 text-green-900"   // positivo → amarelo (crédito pendente)
                                : "bg-red-100 text-red-900"         // negativo → vermelho (débito pendente)
                                }`}
                              title={`Total não baixado: ${currencyBRL(naoBaixadoBanco)}`}
                            >
                              Conciliação Bancária {currencyBRL(naoBaixadoBanco)}
                            </span>
                          )}
                          {ajustadoBanco && (
                            <span className="ml-2 inline-flex items-center rounded bg-muted px-2 mr-2 py-1 text-xs">
                              ajustado
                            </span>
                          )}
                          <div className={`text-right font-semibold tabular-nums ${moneyColor(bank.totalBanco)}`}>
                            {currencyBRL(bank.totalBanco)}
                          </div>

                        </div>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent>
                      {/* Tipos de conta dentro do banco + lista de contas */}
                      <Table>
                        <TableBody>
                          {bank.tipos.map((tipo) => (
                            <TableRow key={`${bank.codBanco}-${tipo.codTipo}`}>
                              <TableCell className="py-4">
                                <div className="font-medium">
                                  {tipo.descTipo}
                                </div>

                                {/* Contas desse tipo */}
                                <div className="mt-2 border-l pl-3 space-y-1">
                                  {tipo.contas.map((c, idx) => (
                                    <div
                                      key={`${bank.codBanco}-${tipo.codTipo}-${c.agencia}-${c.conta}-${idx}`}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <span className="text-muted-foreground">
                                        Agência {c.agencia} — Conta {c.conta}-{c.digito}
                                      </span>
                                      <div>
                                        {/* NOVO: badge de saldo não baixado (quando > 0) */}
                                        {c.saldo_nao_baixado != 0 && (
                                          <span
                                            className={`ml-2 inline-flex items-center rounded px-2 mr-2 py-1 text-xs font-medium ${naoBaixadoBanco > 0
                                              ? "bg-green-100 text-green-900"   // positivo → amarelo (crédito pendente)
                                              : "bg-red-100 text-red-900"         // negativo → vermelho (débito pendente)
                                              }`}
                                            title={`Saldo não baixado: ${currencyBRL(c.saldo_nao_baixado)}`}
                                          >
                                            Conciliação Bancária {currencyBRL(c.saldo_nao_baixado)}
                                          </span>
                                        )}

                                        {c.novo_saldo != null ? (
                                          <>
                                            <span className="line-through text-muted-foreground mr-2">
                                              {currencyBRL(c.saldoOracle)}
                                            </span>
                                            <span className={`font-semibold ${moneyColor(c.novo_saldo)}`}>
                                              {currencyBRL(c.novo_saldo)}
                                            </span>
                                            <span className="ml-2 inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs">
                                              ajustado
                                            </span>
                                          </>
                                        ) : (
                                          <span className={`font-medium ${moneyColor(c.saldo)}`}>
                                            {currencyBRL(c.saldo)}
                                          </span>
                                        )}



                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 px-2"
                                          title="Editar conta"
                                          onClick={() =>
                                            handleEditClick(
                                              { codBanco: bank.codBanco, descBanco: bank.descBanco },
                                              {
                                                agencia: c.agencia,
                                                conta: c.conta,
                                                digito: c.digito,
                                                saldo: c.saldo,
                                                cod_tipo: tipo.codTipo,
                                                // @ts-expect-error adicionamos o campo extra
                                                jaAjustada: c.novo_saldo != null, // 👈
                                                motivo: c.motivo,
                                              }
                                            )
                                          }


                                        >
                                          <Pencil className="w-6 h-6" />
                                        </Button>
                                        {c.novo_saldo != null && (
                                          <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 px-2 text-red-600 hover:text-red-700"
                                                title="Remover ajuste deste dia"
                                              >
                                                <Trash2 className="w-5 h-5" />
                                              </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                              <AlertDialogHeader>
                                                <AlertDialogTitle>Remover ajuste?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                  Isto excluirá o NOVO_SALDO lançado para esta conta na data de referência.
                                                  Esta ação não pode ser desfeita.
                                                </AlertDialogDescription>
                                              </AlertDialogHeader>
                                              <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction
                                                  onClick={async () => {
                                                    try {
                                                      const dataRef = dataFim || todayISO(); // mesma data usada no insert/update
                                                      await deletarContaSaldo({
                                                        cod_banco: bank.codBanco,
                                                        cod_agencia: c.agencia,
                                                        cod_contabancaria: c.conta,
                                                        cod_tipo: tipo.codTipo,
                                                        digito: c.digito,
                                                        data: dataRef,
                                                      }, token);
                                                      toast({ title: "Ajuste removido", description: "O lançamento do dia foi excluído." });
                                                      // recarrega a lista para refletir a remoção
                                                      onCarregar();
                                                    } catch (e: any) {
                                                      toast({ title: "Erro ao remover", description: e?.message ?? "Falha ao excluir ajuste.", variant: "destructive" });
                                                    }
                                                  }}
                                                  className="bg-red-600 hover:bg-red-700"
                                                >
                                                  Remover
                                                </AlertDialogAction>
                                              </AlertDialogFooter>
                                            </AlertDialogContent>
                                          </AlertDialog>
                                        )}

                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}

            </Accordion>
          )}
        </CardContent>
      </Card>


      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setSelectedConta(null);
        }}
      >
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>Salvar novo saldo:</DialogTitle>
            <DialogDescription>
              {selectedConta?.label ?? "Confirme para enviar os identificadores desta conta para a API."}
            </DialogDescription>
          </DialogHeader>

          <div className="text-sm bg-muted/40 rounded-md p-3 space-y-1">
            <div><b>Banco:</b> {selectedConta?.cod_banco}</div>
            <div><b>Agência:</b> {selectedConta?.cod_agencia}</div>
            <div><b>Conta:</b> {selectedConta?.cod_contabancaria}</div>
            <div><b>Dígito:</b> {selectedConta?.digito}</div>


          </div>

          <div className="space-y-4">
            {/* Saldo atual (disabled) */}
            <div>
              <Label>Saldo atual</Label>
              <Input disabled value={currencyBRL(selectedConta?.saldo ?? 0)} />
            </div>

            {/* Novo saldo (editable) */}
            <div>
              <Label>Novo saldo</Label>
              <Input
                value={novoSaldoInput}
                onChange={(e) => setNovoSaldoInput(e.target.value)}
                placeholder="1.234,56"
              />
              <p className="text-sm text-muted-foreground">Formato: 1.234,56</p>
            </div>

            {/* Motivo (textarea) */}
            <div>
              <Label>Motivo da alteração</Label>
              <Textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Explique o motivo da alteração (ex: ajuste contábil, estorno, correção de saldo...)"
                rows={4}
              />
              <p className="text-sm text-muted-foreground">Informe um motivo claro. Mínimo 5 caracteres.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={onConfirmEdit} disabled={saving}>
              {saving ? "Enviando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Ver Alterações de Saldos</DialogTitle>
            <DialogDescription>
              Histórico de alterações recentes nos saldos bancários.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4">
            {loadingLogs && <p>Carregando dados...</p>}
            {errorLogs && (
              <p className="text-red-500">Erro ao carregar: {String(errorLogs)}</p>
            )}
            {!loadingLogs && !errorLogs && movimentacoesLogs.length === 0 && (
              <p>Nenhuma movimentação encontrada.</p>
            )}

            {!loadingLogs && !errorLogs && movimentacoesLogs.length > 0 && (
              <div className="max-h-[420px] overflow-y-auto border rounded-md bg-muted/40 p-3">
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 bg-muted text-left">
                    <tr>
                      <th className="p-2 border-b">Data</th>
                      <th className="p-2 border-b">Banco</th>
                      <th className="p-2 border-b">Conta</th>
                      <th className="p-2 border-b">Tipo</th>
                      <th className="p-2 border-b text-right">Saldo Antigo</th>
                      <th className="p-2 border-b text-right">Novo Saldo</th>
                      <th className="p-2 border-b">Motivo</th>
                      <th className="p-2 border-b">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimentacoesLogs.map((log: any, index: number) => (
                      <tr key={index} className="hover:bg-muted/60">
                        <td className="p-2 border-b">
                          {log.DATA_LANCAMENTO
                            ? new Date(log.DATA_LANCAMENTO).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="p-2 border-b">{log.COD_BANCO ?? "-"}</td>
                        <td className="p-2 border-b">
                          {log.DESC_CONTA ?? "-"}{" "}
                          <span className="text-xs text-muted-foreground">
                            ({log.COD_AGENCIA ?? ""}/{log.COD_CONTABANCARIA ?? ""})
                          </span>
                        </td>
                        <td className="p-2 border-b">{log.DESC_TIPO ?? "-"}</td>
                        <td className="p-2 border-b text-right">
                          {log.SALDO_ANTIGO?.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }) ?? "-"}
                        </td>
                        <td className="p-2 border-b text-right">
                          {log.NOVO_SALDO?.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }) ?? "-"}
                        </td>
                        <td className="p-2 border-b">{log.MOTIVO ?? "-"}</td>

                        <td className="p-2 border-b">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              title="Editar ajuste"
                              onClick={() => handleEditLog(log)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-red-600 hover:text-red-700"
                              title="Remover ajuste"
                              onClick={() => handleDeleteLog(log)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={handleReload}>
              Atualizar
            </Button>
            <Button onClick={() => setLogsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SaldosBancarios;
