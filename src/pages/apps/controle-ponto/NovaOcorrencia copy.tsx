
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import { subDays } from "date-fns";



export default function NovaOcorrencia() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token, user } = useAuth();


  const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');



  const [formData, setFormData] = useState({
    colaborador: "",
    codigo: "",
    tipo: "",
    data: undefined as Date | undefined,
    horario: "",
    motivo: "",
    observacoes: "",
  });
  const [isLoadingUser, setIsLoadingUser] = useState(false);



  const [departamentosVinculadosPorUsuario, setDepartamentosVinculadosPorUsuario] = useState<any[]>([]);





  const carregarMeusDepartamentos = async () => {
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado.",
        variant: "destructive",
      });
      return;
    }

    const codFuncionario = Number(user.id);
    setIsLoadingUser(true);

    try {
      const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      if (!urlApi) throw new Error("VITE_API_URL não configurada");

      // === PASSO 1: Tenta pegar departamentos via grupos (mais comum em sistemas de permissão) ===
      const responseGrupos = await fetch(
        `${urlApi}/controle-de-ponto/lista-departamentos/${codFuncionario}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let departamentos: any[] = [];

      if (responseGrupos.ok) {
        departamentos = await responseGrupos.json();

        if (Array.isArray(departamentos) && departamentos.length > 0) {
          console.log("Departamentos carregados via grupos:", departamentos);
          setDepartamentosVinculadosPorUsuario(departamentos);
          setIsLoadingUser(false);
          return; // Sai aqui se achou via grupos
        }
      }

      // === PASSO 2: Se não achou via grupos → fallback: pega o departamento funcional direto do RH ===
      console.log("Nenhum departamento via grupo. Usando fallback com crachá...");

      const responseFallback = await fetch(
        `${urlApi}/controle-de-ponto/consulta-dados-usuario-dpto`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cracha: codFuncionario.toString(), // ou user.id direto como string
          }),
        }
      );

      if (!responseFallback.ok) {
        const err = await responseFallback.json().catch(() => ({}));
        throw new Error(err.message || "Erro ao buscar departamento funcional");
      }

      const dadosUsuario = await responseFallback.json();
      const usuario = Array.isArray(dadosUsuario) ? dadosUsuario[0] : dadosUsuario;

      if (!usuario?.cod_departamento) {
        throw new Error("Usuário não possui departamento cadastrado no RH");
      }


      const departamentoFallback = {
        COD_DEPARTAMENTO: usuario.cod_departamento,
        DESC_DEPARTAMENTO: usuario.desc_departamento || "Departamento sem descrição",

      };

      

      setDepartamentosVinculadosPorUsuario([departamentoFallback]);

      toast({
        title: "Departamento carregado",
        description: `Usando departamento funcional: ${usuario.desc_departamento}`,
        variant: "default",
      });

    } catch (error: any) {
      console.error("Erro crítico ao carregar departamentos:", error);
      setDepartamentosVinculadosPorUsuario([]); // Garante que fique vazio
      toast({
        title: "Acesso restrito",
        description: error.message || "Não foi possível carregar seus departamentos.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUser(false);
    }
  };


  // Estados para Tipos
  const [tipos, setTipos] = useState<Array<{
    id: number;
    nome: string;
    descricao: string | null;
    cor: string;
    ativo: boolean;
    situacao: string;
  }>>([]);

  const [loadingTipos, setLoadingTipos] = useState(false);
  const [errorTipos, setErrorTipos] = useState<string | null>(null);

  //Lista os tipos 
  const fetchTipoOcorrencias = async () => {
    setLoadingTipos(true);
    setErrorTipos(null);

    try {
      //const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      if (!urlApi) throw new Error("VITE_API_URL não configurada");
      if (!token) throw new Error("Token de autenticação não encontrado.");

      const response = await fetch(`${urlApi}/controle-de-ponto/lista-tipo-ocorrencias`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ao carregar tipos: ${response.status}`);
      }

      const data = await response.json();

      // Mapeia exatamente para o formato da tabela
      const mappedTipos = data.map((tipo: any) => ({
        id: tipo.ID_TIPO,
        nome: tipo.NOME_OCORRENCIA,
        descricao: tipo.DESC_OCORRENCIA || null,
        cor: tipo.COR || '#3b82f6', // cor padrão
        ativo: tipo.SITUACAO === 'A', // true se ativo
        situacao: tipo.SITUACAO,
      }));

      setTipos(mappedTipos);

    } catch (err: any) {
      console.error("Erro ao carregar tipos:", err);
      setErrorTipos(err.message);
      toast({
        title: "Erro ao carregar tipos",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoadingTipos(false);
    }
  };






  const [motivos, setMotivos] = useState<Array<{
    id: number;
    tipoId: number;
    tipoNome: string;
    nome: string;
    descricao: string | null;
    ativo: boolean;
    nome_ocorrencia: string;
    situacao: string;
  }>>([]);

  const [loadingMotivos, setLoadingMotivos] = useState(false);
  const [errosMotivos, setErrosMotivos] = useState<string | null>(null);
  const [dialogMotivo, setDialogMotivo] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data?: { id: number };
  }>({ open: false, mode: 'create' });
  const [formMotivo, setFormMotivo] = useState({
    tipoId: '',
    nome: '',
    descricao: '',
    situacao: 'A',
  });


  //Lista Motivos

  const fetchMotivosOcorrencias = async () => {
    setLoadingMotivos(true);
    setErrosMotivos(null); // limpa erros anteriores
    try {
      const urlApi = (import.meta as any)?.env?.VITE_API_URL?.replace(/\/+$/, "");
      if (!urlApi) throw new Error("VITE_API_URL não configurada");

      const response = await fetch(`${urlApi}/controle-de-ponto/lista-motivo-ocorrencias`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        // mensagem detalhada para exibir na UI
        const msg = `Erro ao carregar motivos: ${response.status} ${text}`.trim();
        setErrosMotivos(msg);
        // opcional: toast também
        toast({ title: "Erro", description: msg, variant: "destructive" });
        return;
      }

      const data = await response.json();

      const mapped = data.map((m: any) => ({
        id: m.ID_MOTIVO,
        tipoId: Number(m.ID_TIPO), // número
        tipoNome: m.NOME_TIPO || "Tipo não encontrado",
        nome: m.NOME_MOTIVO_OCORRENCIA,
        descricao: m.DESC_MOTIVO_OCORRENCIA || null,
        ativo: m.SITUACAO === 'A',
        situacao: m.SITUACAO,
        nome_ocorrencia: m.NOME_OCORRENCIA,
      }));

      setMotivos(mapped);
      fetchTipoOcorrencias();
    } catch (err: any) {
      const msg = err?.message ? String(err.message) : "Erro desconhecido ao carregar motivos";
      setErrosMotivos(msg);
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setLoadingMotivos(false);
    }
  };



  useEffect(() => {
    fetchTipoOcorrencias();
    fetchMotivosOcorrencias();
    carregarMeusDepartamentos()
  }, []);


  const motivosDisponiveis = useMemo(() => {
    // Se ainda não escolheu um tipo → nada para mostrar
    if (!formData.tipo) return [];

    const tipoIdSelecionado = Number(formData.tipo); // "12" → 12

    return motivos
      .filter((m) => m.tipoId === tipoIdSelecionado && m.ativo) // <-- filtro correto
      .map((m) => ({
        code: String(m.id),   // o que vai no value do Select
        name: m.nome,         // o que o usuário vê
      }));
  }, [formData.tipo, motivos]);

  const [showConfirm, setShowConfirm] = useState(false);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (colaboradoresSelecionados.length === 0) {
      toast({ title: "Selecione pelo menos um colaborador", variant: "destructive" });
      return;
    }

    if (colaboradoresSelecionados.length > 10) {
      toast({ title: "Limite de 10 colaboradores por comunicado", variant: "destructive" });
      return;
    }

    if (!formData.tipo || !formData.motivo || !formData.data || !formData.horario) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setIsLoadingUser(true);
    let successCount = 0;
    let errorMessages: string[] = [];

    try {
      for (const col of colaboradoresSelecionados) {
        const payload = {
          cod_funcionario: col.codigo,
          tipo_ocorrencia: Number(formData.tipo),
          motivo: Number(formData.motivo),
          data_ocorrencia: format(formData.data!, "yyyy-MM-dd"),
          horario: formData.horario,
          observacoes: formData.observacoes,
          cod_funcionario_registrou: user.id,
        };

        try {
          const response = await fetch(`${urlApi}/controle-de-ponto/nova-ocorrencia`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            successCount++;
          } else {
            const err = await response.text();
            errorMessages.push(`${col.codigo}: ${err}`);
          }
        } catch (err: any) {
          errorMessages.push(`${col.codigo}: ${err.message}`);
        }
      }

      // Feedback final
      if (successCount === colaboradoresSelecionados.length) {
        toast({
          title: `Sucesso! ${successCount} ocorrências registradas`,
          description: "Todos os registros foram salvos.",
        });
        setTimeout(() => navigate("/apps/controle-ponto"), 1500);
      } else {
        toast({
          title: `${successCount}/${colaboradoresSelecionados.length} salvas`,
          description: errorMessages.length > 0 ? errorMessages[0] : "Alguns registros falharam",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({ title: "Erro inesperado", description: "Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoadingUser(false);
      setShowConfirm(false);
    }
  };



  const [colaboradoresSelecionados, setColaboradoresSelecionados] = useState<Array<{
    codigo: string;
    nome: string;
  }>>([]);


  const buscarEAdicionarColaborador = async (cracha: string) => {
    // Evitar duplicatas
    if (colaboradoresSelecionados.some(c => c.codigo === cracha)) {
      toast({
        title: "Já adicionado",
        description: `O colaborador com crachá ${cracha} já está na lista.`,
        variant: "destructive",
      });
      setFormData(prev => ({ ...prev, codigo: "" }));
      return;
    }

    setIsLoadingUser(true);
    try {
      const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');

      // === EXTRAI TODOS OS COD_DEPARTAMENTO ===
      const codigosDepartamentos = departamentosVinculadosPorUsuario.map(
        (item: any) => item.COD_DEPARTAMENTO
      );

      // === ENVIA CRACHÁ + ARRAY DE DEPARTAMENTOS ===
      const response = await fetch(`${urlApi}/controle-de-ponto/consulta-dados-usuario-dpto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cracha,
          depto: codigosDepartamentos,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || "Colaborador não encontrado");
      }

      const data = await response.json();


      if (!data || (Array.isArray(data) && data.length === 0) || (!Array.isArray(data) && !data.nome)) {
        throw new Error("Nenhum dado retornado do colaborador");
      }

      // Forma mais segura: aceita tanto objeto único quanto array
      const usuario = Array.isArray(data) ? data[0] : data;

      // Agora acessa com minúsculas (exatamente como veio do backend)
      const nome = usuario.nome || usuario.NOME || "Nome não informado";

      setColaboradoresSelecionados(prev => [...prev, { codigo: cracha, nome }]);
      toast({
        title: "Adicionado",
        description: `${cracha} - ${nome}`,
      });

      // Limpa o campo
      setFormData(prev => ({ ...prev, codigo: "", colaborador: "" }));

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha na consulta",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUser(false);
    }
  };




  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Nova Ocorrência</h1>
          <p className="text-muted-foreground mt-1">
            Registre uma nova ocorrência do ponto eletrônico
          </p>
        </div>
      </div>

      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Colaboradores Selecionados * ({colaboradoresSelecionados.length}/10)</Label>

            {/* Lista de selecionados */}
            {colaboradoresSelecionados.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                {colaboradoresSelecionados.map((col) => (
                  <div
                    key={col.codigo}
                    className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-md text-sm"
                  >
                    <div>
                      <span className="font-medium">{col.codigo}</span> - {col.nome}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => {
                        setColaboradoresSelecionados(prev =>
                          prev.filter(c => c.codigo !== col.codigo)
                        );
                      }}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum colaborador selecionado</p>
            )}

            {/* Campo de busca para adicionar */}
            <div className="flex gap-2">
              <Input
                placeholder="Digite o crachá e pressione Enter"
                value={formData.codigo}
                onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value }))}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && formData.codigo.trim()) {
                    await buscarEAdicionarColaborador(formData.codigo.trim());
                  }
                }}
                disabled={isLoadingUser}
              />
              <Button
                type="button"
                onClick={() => formData.codigo.trim() && buscarEAdicionarColaborador(formData.codigo.trim())}
                disabled={isLoadingUser || !formData.codigo.trim()}
              >
                {isLoadingUser ? "Buscando..." : "Adicionar"}
              </Button>
            </div>
          </div>



          <div className="space-y-2">
            <Label htmlFor="tipo-ocorrencia">Tipo de Ocorrência *</Label>

            {loadingTipos ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <div className="w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                Carregando tipos...
              </div>
            ) : tipos.filter(t => t.ativo).length === 0 ? (
              <div className="text-sm text-muted-foreground py-2">
                Nenhum tipo ativo. Clique em "Buscar" na aba Tipos.
              </div>
            ) : (
              <Select
                value={formData.tipo}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, tipo: value, motivo: "" }));
                }}
              >
                <SelectTrigger id="tipo-ocorrencia">
                  <SelectValue placeholder="Selecione o tipo de ocorrência" />
                </SelectTrigger>
                <SelectContent>
                  {tipos
                    .filter((t) => t.ativo)
                    .map((tipo) => (
                      <SelectItem key={tipo.id} value={String(tipo.id)}>
                        {tipo.nome}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data da Ocorrência *</Label>
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
                    onSelect={(date) => setFormData((prev) => ({ ...prev, data: date }))}
                    disabled={(date) => {
                      const today = new Date();
                      const twoDaysAgo = subDays(today, 3);
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
              <Label htmlFor="horario">Horário *</Label>
              <Input
                id="horario"
                type="time"
                value={formData.horario}
                onChange={(e) => setFormData((prev) => ({ ...prev, horario: e.target.value }))}
                required
              />
            </div>
          </div>


          <div className="space-y-2">
            <Label>Motivo da Ocorrência *</Label>

            {/* Loading */}
            {loadingMotivos ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <div className="w-4 h-4 border-2 border-t-transparent border-primary rounded-full animate-spin" />
                Carregando motivos...
              </div>
            ) : /* Tipo não selecionado */
              !formData.tipo ? (
                <div className="text-sm text-muted-foreground py-2">
                  Primeiro selecione o tipo de ocorrência
                </div>
              ) : /* Nenhum motivo ativo para o tipo escolhido */
                motivosDisponiveis.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">
                    Nenhum motivo ativo para este tipo
                  </div>
                ) : (
                  /* Select normal */
                  <Select
                    value={formData.motivo}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, motivo: value }))
                    }
                    disabled={!formData.tipo}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o motivo" />
                    </SelectTrigger>

                    <SelectContent>
                      {motivosDisponiveis.map((motivo) => (
                        <SelectItem key={motivo.code} value={motivo.code}>
                          {/* Opcional: mostra a cor do tipo ao lado do motivo */}
                          <div className="flex items-center gap-2">
                            <div
                            />
                            {motivo.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações Adicionais</Label>
            <Textarea
              id="observacoes"
              placeholder="Digite observações relevantes (opcional)"
              value={formData.observacoes}
              onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
              rows={4}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              className="bg-gradient-primary hover:bg-primary-hover"
              disabled={isLoadingUser}
            >
              <Save className="w-4 h-4 mr-2" />
              Registrar Ocorrência
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/apps/controle-ponto")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Card>
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Confirme a Ocorrência</h2>

              <div className="space-y-3 text-sm">
                <div>
                  <Label className="font-medium">Colaboradores:</Label>
                  <p className="text-muted-foreground">
                    {colaboradoresSelecionados.map(c => `${c.codigo} - ${c.nome}`).join("; ")}
                  </p>
                </div>

                <div>
                  <Label className="font-medium">Colaborador:</Label>
                  <p className="text-muted-foreground">{formData.colaborador || "-"}</p>
                </div>

                <div>
                  <Label className="font-medium">Tipo de Ocorrência:</Label>
                  <p className="text-muted-foreground">
                    {tipos.find(t => t.id === Number(formData.tipo))?.nome || "-"}
                  </p>
                </div>

                <div>
                  <Label className="font-medium">Motivo:</Label>
                  <p className="text-muted-foreground">
                    {motivos.find(m => m.id === Number(formData.motivo))?.nome || "-"}
                  </p>
                </div>

                <div>
                  <Label className="font-medium">Data:</Label>
                  <p className="text-muted-foreground">
                    {formData.data ? format(formData.data, "PPP", { locale: ptBR }) : "-"}
                  </p>
                </div>

                <div>
                  <Label className="font-medium">Horário:</Label>
                  <p className="text-muted-foreground">{formData.horario || "-"}</p>
                </div>

                <div>
                  <Label className="font-medium">Observações:</Label>
                  <p className="text-muted-foreground">{formData.observacoes || "-"}</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowConfirm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmSave} disabled={isLoadingUser}>
                  {isLoadingUser ? "Salvando..." : "Salvar Ocorrência"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

    </div>


  );
}
