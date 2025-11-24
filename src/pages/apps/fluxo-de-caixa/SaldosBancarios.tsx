import { useState, useCallback, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Pencil, Trash2 } from "lucide-react";
import { useMovimentacao } from "@/hooks/fluxo-de-caixa/use-saldo";
import { useTipoContas } from "@/hooks/fluxo-de-caixa/use-contabacaria";
import { useMovimentacaoLogs } from "@/hooks/fluxo-de-caixa/use-logs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import * as XLSX from "xlsx";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { enviarContaParaEdicao, atualizarContaSaldo, deletarContaSaldo } from "@/lib/fluxo-de-caixa/api";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

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
};

/** Tipo mínimo para o hook de tipos de conta (ajuste se tiver interface oficial) */
type TipoConta = {
  COD_TIPOCONTABANCARIA: number;
  DESCRICAO: string;
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
  // -----------------------------
  // ESTADO LOCAL
  // -----------------------------
  const [dataFim, setDataFim] = useState<string>("");            // data referência (YYYY-MM-DD)
  const [codTipo, setCodTipo] = useState<string>("all");         // filtro por tipo de conta
  const [novoSaldo, setNovoSaldo] = useState<string>("");

  // -----------------------------
  // HOOKS DE DADOS
  // -----------------------------
  const { movimentacoes2, loading2, error, fetchData } = useMovimentacao();           // saldos
  const { tipos, loadingTipos, errorTipos, fetchDataTipos } = useTipoContas();        // tipos de conta
  const { movimentacoesLogs, loadingLogs, errorLogs, fetchDataLogs } = useMovimentacaoLogs();



  // Carrega os tipos de conta ao montar a página
  useEffect(() => { fetchDataTipos(); }, [fetchDataTipos]);

  // -----------------------------
  // AÇÕES DE TELA
  // -----------------------------

  /** Dispara a busca de saldos com os filtros atuais */
  const onCarregar = useCallback(() => {
    const ref = dataFim || todayISO();                         // se vazio, usa hoje
    const tipo = codTipo === "all" ? undefined : Number(codTipo);
    fetchData({ dataFim: ref, codTipo: tipo });
  }, [dataFim, codTipo, fetchData]);


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

  // validação simples: parseBRL (você já usa) -> retorna number | null
  const parseBRLOrNull = (s: string) => parseBRL(s); // sua função parseBRL



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
        await atualizarContaSaldo({ ...basePayload, data: dataRef });
      } else {
        await enviarContaParaEdicao({ ...basePayload, data: dataRef });
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
  }, [selectedConta, novoSaldoInput, motivo, dataFim, onCarregar]);


  // -----------------------------
  // DERIVADOS / AGRUPAMENTOS
  // -----------------------------

  /**
   * Agrupa o array do Oracle por:
   * Banco -> Tipo de Conta -> Contas
   * Também calcula totais por banco e por tipo.
   */
  const grouped = useMemo(() => {
    const rowsAll = (movimentacoes2 as MovOracle[]) || [];

    // Aplica filtro por tipo (se selecionado)
    const rows = rowsAll.filter(r =>
      codTipo === "all" ? true : r.COD_TIPO === Number(codTipo)
    );

    // Mapa principal por banco
    const byBank = new Map<
      number,
      {
        codBanco: number;
        descBanco: string;
        totalBanco: number;
        tipos: Map<
          number,
          {
            codTipo: number;
            descTipo: string;
            totalTipo: number;
            contas: Array<{
              agencia: number;
              conta: number;
              digito: string;
              saldo: number;
              saldoOracle: number;
              novo_saldo: number | null;
            }>;
          }
        >;
      }
    >();

    // Agregação
    for (const r of rows) {
      const saldoEfetivo = Number(r.NOVO_SALDO ?? r.SALDO) || 0; // 👈

      if (!byBank.has(r.COD_BANCO)) {
        byBank.set(r.COD_BANCO, {
          codBanco: r.COD_BANCO,
          descBanco: r.DESC_BANCO,
          totalBanco: 0,
          tipos: new Map(),
        });
      }
      const bank = byBank.get(r.COD_BANCO)!;
      bank.totalBanco += saldoEfetivo; // 👈 soma com o efetivo

      if (!bank.tipos.has(r.COD_TIPO)) {
        bank.tipos.set(r.COD_TIPO, {
          codTipo: r.COD_TIPO,
          descTipo: r.DESC_TIPOCONTA,
          totalTipo: 0,
          contas: [],
        });
      }

      const tipo = bank.tipos.get(r.COD_TIPO)!;
      tipo.totalTipo += saldoEfetivo; // 👈 idem

      tipo.contas.push({
        agencia: r.COD_AGENCIA,
        conta: r.COD_CONTABANCARIA,
        digito: r.DIGITO,
        // mantenha ambos os valores:
        saldoOracle: Number(r.SALDO) || 0,                          // “original”
        novo_saldo: r.NOVO_SALDO == null ? null : Number(r.NOVO_SALDO), // “novo”, se houver
        saldo: saldoEfetivo,
        motivo: r.MOTIVO ?? null, // <<< aqui                                        // “efetivo” (o que aparece no total)
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
  }, [movimentacoes2, codTipo]);

  /** Soma final para o card de resumo */
  const totalOracle = useMemo(
    () => grouped.reduce((sum, b) => sum + b.totalBanco, 0),
    [grouped]
  );




  const exportToExcel = useCallback(() => {
    if (!grouped.length) return;

    const wb = XLSX.utils.book_new();

    // --- Aba 1: Por conta (linha-a-linha) com colunas de ajuste ---
    const sheet1 = grouped.flatMap((bank) =>
      bank.tipos.flatMap((tipo) =>
        tipo.contas.map((c) => ({
          Banco: bank.descBanco,
          "Cód. Banco": bank.codBanco,
          Agência: c.agencia,
          Conta: `${c.conta}-${c.digito}`,
          "Tipo de Conta": tipo.descTipo,
          "Cód. Tipo": tipo.codTipo,
          // saldo vindo do Oracle (valor original)
          "Saldo Oracle": Number(c.saldoOracle ?? c.saldo ?? 0),
          // saldo que você estava usando atualmente (caso tenha diferença de campo)
          "Saldo Atual": Number(c.saldo ?? c.saldoOracle ?? 0),
          // novo saldo lançado manualmente (quando existir)
          "Novo Saldo": c.novo_saldo != null ? Number(c.novo_saldo) : "",
          // indicador claro se houve ajuste
          Ajustado: c.novo_saldo != null ? "Sim" : "Não",
          // motivo do ajuste (se houver)
          Motivo: c.motivo ?? "",
        }))
      )
    );

    // Forçar ordem das colunas no sheet (opcional, garante layout previsível)
    const headers = [
      "Banco",
      "Cód. Banco",
      "Agência",
      "Conta",
      "Tipo de Conta",
      "Cód. Tipo",
      "Saldo Oracle",
      "Saldo Atual",
      "Novo Saldo",
      "Ajustado",
      "Motivo",
    ];

    const ws1 = XLSX.utils.json_to_sheet(sheet1, { header: headers, skipHeader: false });
    ws1["!cols"] = fitToColumn(sheet1);
    XLSX.utils.book_append_sheet(wb, ws1, "Por conta");

    // --- Aba 2: Totais por Tipo dentro do Banco ---
    const sheet2 = grouped.flatMap((bank) =>
      bank.tipos.map((tipo) => ({
        Banco: bank.descBanco,
        "Cód. Banco": bank.codBanco,
        "Tipo de Conta": tipo.descTipo,
        "Cód. Tipo": tipo.codTipo,
        "Saldo do Tipo":
          Number(tipo.totalTipo ?? tipo.contas.reduce((s, c) => s + (Number(c.novo_saldo ?? c.saldo ?? 0) || 0), 0)),
      }))
    );
    const ws2 = XLSX.utils.json_to_sheet(sheet2);
    ws2["!cols"] = fitToColumn(sheet2);
    XLSX.utils.book_append_sheet(wb, ws2, "Por tipo");

    // --- Aba 3: Totais por Banco ---
    const sheet3 = grouped.map((bank) => ({
      Banco: bank.descBanco,
      "Cód. Banco": bank.codBanco,
      // preferir o totalBanco já ajustado se existir
      "Saldo do Banco": Number(bank.totalBanco || bank.tipos.reduce((s, t) => s + (Number(t.totalTipo ?? 0) || 0), 0)),
    }));
    const ws3 = XLSX.utils.json_to_sheet(sheet3);
    ws3["!cols"] = fitToColumn(sheet3);
    XLSX.utils.book_append_sheet(wb, ws3, "Por banco");

    // Nome do arquivo inclui a data de referência (ou hoje)
    const ref = dataFim || todayISO();
    XLSX.writeFile(wb, `saldos_${ref}.xlsx`);
  }, [grouped, dataFim]);



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
      const resp = await deletarContaSaldo(payload);
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
  }, [handleReload, onCarregar, dataFim]);



  // -----------------------------
  // RENDER
  // -----------------------------
  return (
    <div className="space-y-6">

      {/* ===================== Filtros ===================== */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3">
            {/* Data de referência */}
            <div className="space-y-2">
              <Label htmlFor="date-filter">Data de Referência</Label>
              <Input
                id="date-filter"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="h-9 w-[180px] rounded-md border px-2 text-sm"
              />
            </div>

            {/* Tipo de conta */}
            <div className="space-y-2">
              <Label htmlFor="tipo-conta">Tipo de Conta</Label>
              <Select
                value={codTipo}
                onValueChange={setCodTipo}
                disabled={loadingTipos || !!errorTipos}
              >
                <SelectTrigger id="tipo-conta" className="h-9 w-[240px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {(tipos as TipoConta[] ?? [])
                    .sort((a, b) => a.DESCRICAO.localeCompare(b.DESCRICAO))
                    .map((t) => (
                      <SelectItem
                        key={t.COD_TIPOCONTABANCARIA}
                        value={String(t.COD_TIPOCONTABANCARIA)}
                      >
                        {t.DESCRICAO}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errorTipos && (
                <p className="text-xs text-red-500">Erro ao carregar tipos.</p>
              )}
            </div>

            {/* Botão Carregar */}
            <Button onClick={onCarregar} variant="outline">
              Carregar
            </Button>

            {/* Feedback de loading/erro da consulta de saldos */}
            {loading2 && (
              <div className="text-sm text-muted-foreground basis-full">
                Carregando saldos...
              </div>
            )}
            {error && (
              <div className="text-sm text-red-500 basis-full">
                Erro: {String(error)}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ===================== Card de Resumo ===================== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            {currencyBRL(totalOracle)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Referência {dataFim ? new Date(dataFim + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Esse é o saldo da CS, não considera o as alterações realizadas nessa tela.
          </p>
        </CardContent>
      </Card>

      {/* ===================== Accordion por Banco -> Tipos -> Contas ===================== */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2">
          <CardTitle>Saldos por Banco</CardTitle>

          <Button
            variant="outline"
            className="w-[160px]"
            onClick={exportToExcel}
            disabled={grouped.length === 0}
            title={grouped.length === 0 ? "Nenhum dado para exportar" : "Exportar Excel"}
          >
            Exportar Excel
          </Button>

          <Button
            variant="default"
            className="w-[180px] bg-green-600 hover:bg-green-700 text-white font-semibold"
            onClick={() => setLogsOpen(true)}
            title="Ver Alterações de Saldos"
          >
            Ver Alterações de Saldos
          </Button>

        </CardHeader>

        <CardContent>
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

                return (
                  <AccordionItem key={bank.codBanco} value={`bank-${bank.codBanco}`}>
                    <AccordionTrigger className="w-full">
                      <div className="flex w-full items-center justify-between gap-3 pr-6">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="font-semibold truncate">{bank.descBanco}</span>
                        </div>

                        <div className="flex items-center">
                          <div className={`text-right font-semibold tabular-nums ${moneyColor(bank.totalBanco)}`}>
                            {currencyBRL(bank.totalBanco)}
                          </div>
                          {ajustadoBanco && (
                            <span className="ml-2 inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs">
                              ajustado
                            </span>
                          )}
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
                                  {tipo.descTipo} ({tipo.codTipo})
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
                                                      });
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


    </div >
  );
};

export default SaldosBancarios;
