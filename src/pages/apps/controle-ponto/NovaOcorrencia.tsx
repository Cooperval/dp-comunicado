import { useState, useCallback, useMemo, useEffect } from "react";
import { format, isToday, setHours, setMinutes, differenceInDays, differenceInHours, differenceInMinutes, addDays, formatDistanceToNow, subDays, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Save, Loader2, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";



// Hooks customizados (recomendo criar em /hooks)
import { useDepartamentosUsuario } from "./hooks/useDepartamentosUsuario";
import { useTipoOcorrencias } from "./hooks/useTipoOcorrencias";
import { useMotivoOcorrencias } from "./hooks/useMotivoOcorrencias";

// Tipos
type Colaborador = { codigo: string; nome: string };

export default function NovaOcorrencia() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token, user } = useAuth();
  const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, "");

  // Estados principais
  const [colaboradoresSelecionados, setColaboradoresSelecionados] = useState<Colaborador[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulário
  const [formData, setFormData] = useState({
    codigo: "",
    tipo: "",
    motivo: "",
    data: undefined as Date | undefined,
    horario: "",
    observacoes: "",
  });

  // Hooks personalizados
  const { departamentos, isLoading: loadingDeptos } = useDepartamentosUsuario({ user, token });
  const { tipos, loading: loadingTipos } = useTipoOcorrencias({ token });
  const { motivos, loading: loadingMotivos } = useMotivoOcorrencias({ token });

  // Busca colaborador com validação de departamento
  const buscarEAdicionarColaborador = useCallback(
    async (cracha: string) => {
      if (!cracha.trim() || colaboradoresSelecionados.some(c => c.codigo === cracha)) {
        toast({
          title: "Inválido",
          description: cracha.trim() ? "Colaborador já adicionado." : "Crachá vazio.",
          variant: "destructive",
        });
        return;
      }

      const deptosPermitidos = departamentos.map(d => d.COD_DEPARTAMENTO);

      try {
        const res = await fetch(`${urlApi}/controle-de-ponto/consulta-dados-usuario-dpto`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ cracha, depto: deptosPermitidos }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || err.message || "Colaborador não permitido ou não encontrado");
        }

        const data = await res.json();
        const usuario = Array.isArray(data) ? data[0] : data;

        setColaboradoresSelecionados(prev => [...prev, { codigo: cracha, nome: usuario.nome }]);
        toast({ title: "Adicionado", description: `${cracha} - ${usuario.nome}` });
        setFormData(prev => ({ ...prev, codigo: "" }));
      } catch (err: any) {
        toast({ title: "Erro", description: err.message, variant: "destructive" });
      }
    },
    [colaboradoresSelecionados, departamentos, token, toast, urlApi]
  );

  // Motivos filtrados pelo tipo selecionado
  const motivosDisponiveis = useMemo(() => {
    if (!formData.tipo) return [];
    const tipoId = Number(formData.tipo);
    return motivos
      .filter(m => m.tipoId === tipoId && m.ativo)
      .map(m => ({ value: String(m.id), label: m.nome }));
  }, [formData.tipo, motivos]);

  // Enviar ocorrência
  const handleConfirmSave = async () => {
    setIsSubmitting(true);
    let success = 0;
    const errors: string[] = [];

    try {
      for (const col of colaboradoresSelecionados) {
        const payload = {
          cod_funcionario: col.codigo,
          tipo_ocorrencia: Number(formData.tipo),
          motivo: Number(formData.motivo),
          data_ocorrencia: format(formData.data!, "yyyy-MM-dd"),
          horario: formData.horario,
          observacoes: formData.observacoes,
          cod_funcionario_registrou: user?.id,
        };

        const res = await fetch(`${urlApi}/controle-de-ponto/nova-ocorrencia`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        res.ok ? success++ : errors.push(`${col.codigo}: ${await res.text().catch(() => "Erro")}`);
      }

      if (success === colaboradoresSelecionados.length) {
        toast({ title: "Sucesso!", description: `${success} ocorrência(s) registrada(s).` });
        setTimeout(() => navigate("/apps/controle-ponto"), 1500);
      } else {
        toast({
          title: `${success}/${colaboradoresSelecionados.length} salvas`,
          description: errors[0] || "Alguns registros falharam",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (colaboradoresSelecionados.length === 0) return toast({ title: "Selecione ao menos 1 colaborador", variant: "destructive" });
    if (colaboradoresSelecionados.length > 10) return toast({ title: "Máximo 10 colaboradores", variant: "destructive" });
    if (!formData.tipo || !formData.motivo || !formData.data || !formData.horario)
      return toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });

    setShowConfirm(true);
  };






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





  const verificarDataAgora = () => {
    const dataSelecionada = formData.data; // sempre atual!

    if (!dataSelecionada) {
      //console.log("Nenhuma data foi selecionada ainda.");
      return;
    }

    const agora = new Date();
    const formato = (d: Date) => format(d, "PPPp", { locale: ptBR });

    console.clear();
    // console.log("Data escolhida no calendário:", formato(dataSelecionada));
    // console.log("Horário atual do sistema:   ", formato(agora));
  };

  useEffect(() => {
    if (!formData.data) {
      console.log("Nenhuma data foi selecionada ainda.");
      return;
    }

    const agora = new Date();

    const formato = (date: Date) =>
      format(date, "dd 'de' MMMM 'de' yyyy', às 'HH:mm:ss", { locale: ptBR });

    console.clear(); // opcional: limpa o console a cada mudança
    // console.log("Data SELECIONADA:", formato(formData.data));
    // console.log("Horário ATUAL:   ", formato(agora));

    const mesmoDia = isToday(formData.data);
    const diffDias = differenceInDays(formData.data, agora);

    //console.log("É hoje?", mesmoDia);
    //console.log(`Diferença em dias: ${diffDias >= 0 ? '+' : ''}${diffDias}`);

    if (Math.abs(diffDias) === 0) {
      const diffHoras = differenceInHours(formData.data, agora);
      const diffMin = Math.abs(differenceInMinutes(formData.data, agora) % 60);
      //console.log(`Diferença de horário: ${diffHoras}h ${diffMin}min`);
    }

  }, [formData.data]);






  // // dentro do componente:
  // const [bloqueadoPorPrazo, setBloqueadoPorPrazo] = useState(false);
  // const [mostrarAviso, setMostrarAviso] = useState(false);

  // // "hoje" usado na mensagem (normalizado)
  // const hoje = new Date();
  // hoje.setHours(0, 0, 0, 0);

  // // função que avalia o bloqueio com base numa data (usa a data passada, evita condição de corrida)
  // const avaliarBloqueioPorData = useCallback((dataEscolhida?: Date) => {
  //   if (!dataEscolhida) {
  //     setBloqueadoPorPrazo(false);
  //     setMostrarAviso(false);
  //     return;
  //   }

  //   // normaliza
  //   const dataSel = new Date(dataEscolhida);
  //   dataSel.setHours(0, 0, 0, 0);

  //   const ontem = subDays(hoje, 1);

  //   // se selecionou exatamente o dia anterior
  //   if (isSameDay(dataSel, ontem)) {
  //     const agora = new Date();
  //     // horário limite = hoje 08:30
  //     const limite = setMinutes(setHours(new Date(), 8), 30);

  //     if (agora > limite) {
  //       setBloqueadoPorPrazo(true);
  //       setMostrarAviso(true);
  //       return;
  //     }
  //   }

  //   // caso contrário libera
  //   setBloqueadoPorPrazo(false);
  //   setMostrarAviso(false);
  // }, [hoje]);





  // // handler que atualiza o form e já avalia usando a data selecionada
  // const handleCalendarSelect = useCallback((date: Date | undefined) => {
  //   if (!date) return;
  //   // atualiza o formData como você já fazia
  //   setFormData(prev => ({ ...prev, data: date }));

  //   // avalia imediatamente com a data selecionada (evita race condition)
  //   avaliarBloqueioPorData(date);

  //   // mantém seu debug
  //   verificarDataAgora();
  // }, [setFormData, avaliarBloqueioPorData]);

  // useEffect(() => {
  //   avaliarBloqueioPorData(formData.data);
  // }, [formData.data, avaliarBloqueioPorData]);


  // estados
  const [bloqueadoPorPrazo, setBloqueadoPorPrazo] = useState(false);
  const [mostrarAviso, setMostrarAviso] = useState(false);

  // função que avalia o bloqueio com base numa data (calcula "hoje" dinamicamente)
  const avaliarBloqueioPorData = useCallback((dataEscolhida?: Date) => {
    if (!dataEscolhida) {
      setBloqueadoPorPrazo(false);
      setMostrarAviso(false);
      return;
    }

    // normaliza data selecionada (00:00)
    const dataSel = new Date(dataEscolhida);
    dataSel.setHours(0, 0, 0, 0);

    // "hoje" dinâmico (quando a avaliação rodar)
    const hojeAgora = new Date();
    const hoje = new Date(hojeAgora.getFullYear(), hojeAgora.getMonth(), hojeAgora.getDate()); // 00:00:00 do hoje atual

    // ontem (se hoje for 1º, ontem será último dia do mês anterior)
    const ontem = subDays(hoje, 1);

    // horário limite = hoje 08:30
    const limite = setMinutes(setHours(new Date(hojeAgora), 8), 30); // usa hojeAgora para preservar timezone/hora real

    const hojeEhPrimeiroDia = hoje.getDate() === 1;
    const selecionouUltimoDoMesAnterior = isSameDay(dataSel, ontem);
    const agora = new Date();

    if (hojeEhPrimeiroDia && selecionouUltimoDoMesAnterior && agora > limite) {
      setBloqueadoPorPrazo(true);
      setMostrarAviso(true);
      return;
    }

    // caso contrário, libera
    setBloqueadoPorPrazo(false);
    setMostrarAviso(false);
  }, []); // sem dependências (usa datas dinâmicas dentro da função)

  // handler do calendário: atualiza o form e avalia imediatamente
  const handleCalendarSelect = useCallback((date: Date | undefined) => {
    if (!date) return;
    setFormData(prev => ({ ...prev, data: date }));
    avaliarBloqueioPorData(date);
    verificarDataAgora(); // seu debug
  }, [setFormData, avaliarBloqueioPorData]);

  // reavalie sempre que formData.data mudar (cobre atualizações vindas de outros lugares)
  useEffect(() => {
    avaliarBloqueioPorData(formData.data);
  }, [formData.data, avaliarBloqueioPorData]);

  // reavalia automaticamente a cada minuto quando o usuário selecionou "ontem"
  // para cobrir o caso: abriu antes das 08:30, passou das 08:30 e o bloqueio deve ativar
  useEffect(() => {
    if (!formData.data) return;

    // só precisamos desse interval se a data selecionada for ontem (possível candidato ao bloqueio)
    const dataSel = new Date(formData.data);
    dataSel.setHours(0, 0, 0, 0);
    const hoje = new Date();
    const ontem = subDays(new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()), 1);

    if (!isSameDay(dataSel, ontem)) return;

    // cria interval que reavalia a cada 60s
    const id = setInterval(() => {
      avaliarBloqueioPorData(formData.data);
    }, 60_000);

    // reavalia imediatamente também (caso o tempo já tenha passado enquanto o efeito configurava)
    avaliarBloqueioPorData(formData.data);

    return () => clearInterval(id);
  }, [formData.data, avaliarBloqueioPorData]);



  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      <header>
        <h1 className="text-3xl font-bold">Nova Ocorrência</h1>
        <p className="text-muted-foreground">Registre ocorrências no ponto eletrônico</p>

      </header>
      <header>

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
      </header>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Colaboradores */}
          <div className="space-y-3">
            <Label>Colaboradores ({colaboradoresSelecionados.length}/10)</Label>

            <div className="border rounded-lg p-3 min-h-32 max-h-60 overflow-y-auto">
              {colaboradoresSelecionados.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum colaborador adicionado</p>
              ) : (
                <div className="space-y-2">
                  {colaboradoresSelecionados.map(col => (
                    <div key={col.codigo} className="flex justify-between items-center bg-muted/50 px-3 py-2 rounded">
                      <span className="font-medium">{col.codigo} - {col.nome}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setColaboradoresSelecionados(prev => prev.filter(c => c.codigo !== col.codigo))}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Crachá + Enter"
                value={formData.codigo}
                onChange={e => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && buscarEAdicionarColaborador(formData.codigo.trim())}
              />
              <Button
                type="button"
                onClick={() => buscarEAdicionarColaborador(formData.codigo.trim())}
                disabled={!formData.codigo.trim() || loadingDeptos}
              >
                {loadingDeptos ? <Loader2 className="w-4 h-4 animate-spin" /> : "Adicionar"}
              </Button>
            </div>
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo de Ocorrência *</Label>
            {loadingTipos ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <Select value={formData.tipo} onValueChange={v => setFormData(prev => ({ ...prev, tipo: v, motivo: "" }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tipos.filter(t => t.ativo).map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Data e Horário */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.data && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data
                      ? format(formData.data, "PPP", { locale: ptBR })
                      : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.data}
                    onSelect={handleCalendarSelect}

                    disabled={(date) => {
                      const today = new Date();
                      const twoDaysAgo = subDays(today, 2);
                      // Desabilita: antes de 2 dias atrás OU no futuro
                      return date < twoDaysAgo;
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Horário *</Label>
              <Input type="time" value={formData.horario} onChange={e => setFormData(prev => ({ ...prev, horario: e.target.value }))} />
            </div>
          </div>


          {/* {mostrarAviso && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-red-900">Registro bloqueado</p>
                <p className="text-red-800 mt-1">
                  O prazo para registrar ocorrências do mês anterior terminou às{" "}
                  <strong>08:30 do dia {format(hoje, "dd/MM/yyyy")}</strong>.
                  <br />

                </p>
              </div>
            </div>
          )} */}

          {mostrarAviso && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-red-900">Registro bloqueado</p>
                <p className="text-red-800 mt-1">
                  O prazo para registrar ocorrências do mês anterior terminou às{" "}
                  <strong>08:30 do dia {format(new Date(), "dd/MM/yyyy")}</strong>.
                  <br />
                  <strong className="text-red-900">
                    Altere a data para hoje ({format(new Date(), "dd/MM/yyyy")}) para continuar.
                  </strong>
                </p>
              </div>
            </div>
          )}




          {/* Motivo */}
          <div className="space-y-2">
            <Label>Motivo *</Label>
            {loadingMotivos ? (
              <p className="text-sm text-muted-foreground">Carregando motivos...</p>
            ) : !formData.tipo ? (
              <p className="text-sm text-muted-foreground">Selecione primeiro o tipo</p>
            ) : motivosDisponiveis.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum motivo disponível</p>
            ) : (
              <Select value={formData.motivo} onValueChange={v => setFormData(prev => ({ ...prev, motivo: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  {motivosDisponiveis.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              placeholder="Detalhes adicionais..."
              rows={4}
              value={formData.observacoes}
              onChange={e => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                loadingDeptos ||
                bloqueadoPorPrazo ||                 // ← aqui bloqueia quando a regra falha
                colaboradoresSelecionados.length === 0 ||
                !formData.tipo ||
                !formData.motivo ||
                !formData.data ||
                !formData.horario
              }
            >
              <Save className="w-4 h-4 mr-2" />
              Registrar
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/apps/controle-ponto")}>
              Cancelar
            </Button>
          </div>
        </form>
      </Card>

      {/* Confirmação */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Confirmar Ocorrência</h2>
            <div className="space-y-3 text-sm">
              <p><strong>Colaboradores:</strong> {colaboradoresSelecionados.map(c => `${c.codigo} - ${c.nome}`).join("; ")}</p>
              <p><strong>Tipo:</strong> {tipos.find(t => t.id === Number(formData.tipo))?.nome}</p>
              <p><strong>Motivo:</strong> {motivos.find(m => m.id === Number(formData.motivo))?.nome}</p>
              <p><strong>Data:</strong> {formData.data && format(formData.data, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
              <p><strong>Horário:</strong> {formData.horario}</p>
              {formData.observacoes && <p><strong>Obs:</strong> {formData.observacoes}</p>}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancelar</Button>
              <Button onClick={handleConfirmSave} disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Confirmar"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}