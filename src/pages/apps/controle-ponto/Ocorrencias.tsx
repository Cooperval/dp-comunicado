// src/pages/Ocorrencias.tsx
import { useEffect, useMemo, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, CheckCircle, FileText, Trash2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useDepartamentosUsuario } from "./hooks/useDepartamentosUsuario";
import { useOcorrencias } from "./hooks/useOcorrencias";
import { useRespostasOcorrencia } from "./hooks/useRespostasOcorrencia";
import { useLogsOcorrencia } from "./hooks/useLogsOcorrencia";
import { useTipoOcorrencias } from "./hooks/useTipoOcorrencias"; // ← seu hook existente
import { StatusBadge } from "@/components/ui/status-badge";


import { formatDistanceToNow, addDays, setHours, setMinutes, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Ocorrencias() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token, user, acessos } = useAuth();

  const { departamentos: departamentosPermitidos } = useDepartamentosUsuario({ user, token });
  const modulo13 = acessos?.find(a => Number(a.COD_MODULO) === 13);
  const tipoAcesso = modulo13?.TIPO_ACESSO?.toUpperCase() || "";
  const isAdminOuGestor = ["A", "G"].includes(tipoAcesso);

  // Hooks personalizados
  const {
    ocorrencias,
    loading,
    fetchOcorrencias,
    selectedOcorrencia,
    setSelectedOcorrencia,
    isModalOpen,
    setIsModalOpen,
  } = useOcorrencias({ token, user, departamentosPermitidos, tipoAcesso });

  const { tipos, loading: loadingTipos } = useTipoOcorrencias({ token });
  const { respostas, respostaSelecionada, setRespostaSelecionada, loading: loadingRespostas } = useRespostasOcorrencia({ token });
  const { logs, loading: loadingLogs } = useLogsOcorrencia({ token, selectedOcorrencia });

  // Filtros
  const [codigoFilter, setCodigoFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("PE");
  const [tipoFilter, setTipoFilter] = useState("all");

  // Datas (mês atual)
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  const [dataInicio, setDataInicio] = useState(primeiroDia.toISOString().split("T")[0]);
  const [dataFim, setDataFim] = useState(ultimoDia.toISOString().split("T")[0]);

  // Busca com filtros
  const buscar = useCallback(() => {
    fetchOcorrencias({
      dataInicio,
      dataFim,
      codigo: codigoFilter.trim() || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      tipo: tipoFilter !== "all" ? Number(tipoFilter) : undefined,
    });
  }, [dataInicio, dataFim, codigoFilter, statusFilter, tipoFilter, fetchOcorrencias]);

  // useEffect(() => {
  //   buscar();
  // }, []); // Carrega ao montar

  // Status visual
  const isAtrasada = useCallback((data: string, status: string) => {
    if (status !== "PE") return false;
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    ontem.setHours(0, 0, 0, 0);
    const dataOc = new Date(data);
    dataOc.setHours(0, 0, 0, 0);
    return dataOc < ontem;
  }, []);

  const getStatusInfo = useCallback((status: string) => {
    const map = {
      PE: { label: "Pendente", class: "bg-yellow-500/20 text-yellow-700 border-yellow-500" },
      AP: { label: "Aprovada", class: "bg-green-500/20 text-green-700 border-green-500" },
      RE: { label: "Rejeitada", class: "bg-red-500/20 text-red-700 border-red-500" },
    };
    return map[status] || { label: "Desconhecido", class: "bg-gray-300 text-gray-700 border-gray-400" };
  }, []);

  const filteredOcorrencias = useMemo(() => {
    return ocorrencias.filter(o =>
      o.colaborador.toLowerCase().includes(codigoFilter.toLowerCase()) ||
      o.codigo.includes(codigoFilter)
    );
  }, [ocorrencias, codigoFilter]);

  // Ações
  const aplicarResposta = async () => {
    if (!selectedOcorrencia?.id || !respostaSelecionada) return;
    const resposta = respostas.find(r => r.id === respostaSelecionada);
    if (!resposta) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/controle-de-ponto/aplicar-resposta-ocorrencia/${selectedOcorrencia.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_resposta: resposta.id,
          desc_resposta_ocorrencia: resposta.desc_resposta_ocorrencia,
          situacao: resposta.situacao,
          user: user.id,
        }),
      });
      if (!res.ok) throw new Error("Falha ao aplicar");
      toast({ title: "Sucesso", description: "Resposta aplicada!" });
      setIsModalOpen(false);
      buscar();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  const excluirOcorrencia = async () => {
    if (!selectedOcorrencia?.id) return;
    if (!confirm("Excluir esta ocorrência? Ação irreversível.")) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/controle-de-ponto/deletar-ocorrencia/${selectedOcorrencia.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Falha ao excluir");
      toast({ title: "Excluído", description: "Ocorrência removida." });
      setIsModalOpen(false);
      buscar();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };





  // === CONFIGURAÇÃO DO CONTADOR ===
  const MODO_TESTE_CONTADOR = false; // ← Mude pra false em produção

  // Prazo final: em produção = dia 01 às 08:30 | no teste = amanhã às 08:30
  const getPrazoFinal = () => {
    if (MODO_TESTE_CONTADOR) {
      // TESTE: amanhã (19/11) às 08:30
      const amanha = addDays(new Date(), 1);
      return setMinutes(setHours(amanha, 8), 30);
    }

    // PRODUÇÃO: dia 01 do próximo mês às 08:30
    const hoje = new Date();
    const proximoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
    return setMinutes(setHours(proximoMes, 8), 30);
  };

  const prazoFinal = getPrazoFinal();
  const agora = new Date();
  const ehUltimoDiaDoMes = new Date().getDate() === new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const deveMostrarContador = MODO_TESTE_CONTADOR || (ehUltimoDiaDoMes && agora < prazoFinal);

  // Contador em tempo real
  const [tempoRestante, setTempoRestante] = useState("");

  useEffect(() => {
    if (!deveMostrarContador) return;

    const atualizar = () => {
      const distancia = formatDistanceToNow(prazoFinal, {
        addSuffix: false,
        locale: ptBR,
      });

      // Formata bonito: "14 horas e 23 minutos" → "14h 23min"
      const formatado = distancia
        .replace("cerca de ", "")
        .replace("menos de um minuto", "menos de 1min")
        .replace("minuto", "min")
        .replace("minutos", "min")
        .replace("hora", "h")
        .replace("horas", "h")
        .replace("dia", "d")
        .replace("dias", "d")
        .replace(" e ", " ");

      setTempoRestante(formatado);
    };

    atualizar();
    const interval = setInterval(atualizar, 1000); // atualiza a cada segundo

    return () => clearInterval(interval);
  }, [deveMostrarContador, prazoFinal]);



  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Ocorrências</h1>
          <p className="text-muted-foreground">Gerencie ocorrências do ponto eletrônico</p>
        </div>
        <Button onClick={() => navigate("/apps/controle-ponto/nova-ocorrencia")}>
          <FileText className="w-4 h-4 mr-2" /> Nova Ocorrência
        </Button>
      </div>

      <div className="grid grid-cols-1">
        {deveMostrarContador && tempoRestante && (
          <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <p className="font-semibold text-amber-900">
                    Prazo para registro do mês anterior termina em:
                  </p>
                  <p className="text-2xl font-bold text-amber-800">
                    {tempoRestante}
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-amber-700">
                <p>até {format(prazoFinal, "'dia' dd/MM 'às' HH:mm", { locale: ptBR })}</p>
                {MODO_TESTE_CONTADOR && (
                  <span className="inline-block mt-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                    MODO TESTE
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>



      {/* Filtros */}
      <Card className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <Input placeholder="Crachá ou nome" value={codigoFilter} onChange={e => setCodigoFilter(e.target.value)} />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos as situações</SelectItem>
              <SelectItem value="PE">Pendente</SelectItem>
              <SelectItem value="AP">Aprovada</SelectItem>
              <SelectItem value="RE">Rejeitada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {tipos.filter(t => t.ativo).map(t => (
                <SelectItem key={t.id} value={String(t.id)}>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" />
                    {t.nome}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
          <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
          <Button onClick={buscar} disabled={loading} className="w-full">
            {loading ? "Buscando..." : <><Search className="w-4 h-4 mr-2" />Buscar</>}
          </Button>
        </div>
      </Card>

      {/* Tabela */}
      {filteredOcorrencias.length > 0 && (
        <>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{filteredOcorrencias.length} ocorrência{filteredOcorrencias.length > 1 ? "s" : ""}</span>
            <div className="flex gap-2">
              {["PE", "AP", "RE"].map(s => {
                const count = filteredOcorrencias.filter(o => o.status === s).length;
                const info = getStatusInfo(s);
                return count > 0 && <Badge key={s} variant="outline" className={info.class}>{count} {info.label}</Badge>;
              })}
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOcorrencias.map(o => {
                  const info = getStatusInfo(o.status);
                  return (
                    <TableRow key={o.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{o.colaborador}</p>
                          <p className="text-sm text-muted-foreground">{o.codigo} • {o.setor}</p>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{o.nome_tipo}</Badge></TableCell>
                      <TableCell>
                        <p className="font-medium">{new Date(o.data + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                        <p className="text-muted-foreground">{o.horario}</p>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{o.nome_motivo}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={info.class}>{info.label}</Badge>
                          {/* {isAtrasada(o.data, o.status) && (
                            <Badge variant="outline" className="bg-red-500/20 text-red-700 border-red-500 text-xs animate-pulse">
                              Atraso
                            </Badge>
                          )} */}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => {
                          setSelectedOcorrencia(o);
                          setIsModalOpen(true);
                        }}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* Modal de Detalhes */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Ocorrência</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="detalhes" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="logs">Histórico ({logs.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="detalhes" className="space-y-6">
              {selectedOcorrencia && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Crachá</Label><Input value={selectedOcorrencia.codigo} readOnly /></div>
                    <div><Label>Colaborador</Label><Input value={selectedOcorrencia.colaborador} readOnly /></div>
                  </div>
                  <div><Label>Setor</Label><Input value={selectedOcorrencia.setor} readOnly /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Tipo</Label><Input value={selectedOcorrencia.nome_tipo} readOnly /></div>
                    <div><Label>Motivo</Label><Input value={selectedOcorrencia.nome_motivo} readOnly /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {/* <div><Label>Data</Label><Input value={selectedOcorrencia.data} readOnly /></div> */}
                    <div><Label>Data</Label><Input value={new Date(selectedOcorrencia.data + "T12:00:00").toLocaleDateString("pt-BR")} readOnly /></div>
                    <div><Label>Horário</Label><Input value={selectedOcorrencia.horario} readOnly /></div>
                  </div>
                  <div>
                    <Label>Situação</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={getStatusInfo(selectedOcorrencia.status).class}>
                        {getStatusInfo(selectedOcorrencia.status).label}
                      </Badge>
                      
                    </div>
                  </div>
                  <div><Label>Registrado por</Label><Input value={selectedOcorrencia.registradoPor} readOnly /></div>
                  {selectedOcorrencia.observacoes && (
                    <div><Label>Observações</Label><Textarea value={selectedOcorrencia.observacoes} readOnly rows={3} /></div>
                  )}

                  {isAdminOuGestor && (
                    <div className="pt-6 border-t">
                      <Label>Resposta à Ocorrência</Label>
                      {loadingRespostas ? <p>Carregando...</p> : (
                        <Select value={respostaSelecionada?.toString()} onValueChange={v => setRespostaSelecionada(v ? Number(v) : undefined)}>
                          <SelectTrigger><SelectValue placeholder="Selecione uma resposta" /></SelectTrigger>
                          <SelectContent>
                            {respostas.map(r => (
                              <SelectItem key={r.id} value={String(r.id)}>{r.desc_resposta_ocorrencia}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="logs">
              {loadingLogs ? <p>Carregando logs...</p> : logs.length === 0 ? <p>Sem histórico</p> : (
                <div className="space-y-3">
                  {logs.map((log, i) => (
                    <Card key={log.ID_SITUACAO} className="p-4 text-sm">
                      <div className="flex justify-between">
                        <div>
                          <StatusBadge variant={log.SITUACAO === "PE" ? "warning" : log.SITUACAO === "AP" ? "success" : "destructive"}>
                            {log.DESC_SITUACAO}
                          </StatusBadge>
                          <span className="ml-2 text-xs text-muted-foreground">{log.DATA_FORMATADA}</span>
                          <p className="mt-1"><strong>Por:</strong> {log.DES_FUNC_ALTEROU}</p>
                        </div>
                        {i === 0 && <Badge variant="outline">Atual</Badge>}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            {isAdminOuGestor && (
              <>
                <Button onClick={aplicarResposta} disabled={!respostaSelecionada} className="bg-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" /> Aplicar
                </Button>
                <Button variant="destructive" onClick={excluirOcorrencia}>
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}