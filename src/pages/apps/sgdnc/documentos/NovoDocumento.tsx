import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { Paragrafo, ImagemConteudo, TabelaConteudo } from "@/types/paragrafo";
import { ParagrafoEditor } from "@/components/sgdnc/editor/ParagrafoEditor";
import { SelecionarTipoParagrafo } from "@/components/sgdnc/editor/SelecionarTipoParagrafo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PastaTreeSelect } from "@/components/sgdnc/PastaTreeSelect";
import { TagsInput } from "@/components/sgdnc/TagsInput";
import { Badge } from "@/components/ui/badge";
import { getPastas, createDocumento, mockAprovadores, type Pasta } from "@/services/sgdncMockData";

const tagsSugeridas = [
  "MAPA",
  "ISO 9001",
  "Exportação",
  "Higienização",
  "BPF",
  "APPCC",
  "Rastreabilidade",
  "China",
  "Qualidade",
  "Segurança Alimentar",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "video/mp4": [".mp4"],
};

const documentoSchema = z.object({
  titulo: z
    .string()
    .min(3, "Título deve ter pelo menos 3 caracteres")
    .max(200, "Título deve ter no máximo 200 caracteres"),
  descricao: z.string().max(1000, "Descrição deve ter no máximo 1000 caracteres").optional(),
  pastaId: z.string().min(1, "Selecione uma pasta"),
  tags: z.array(z.string()).max(10, "Máximo de 10 tags"),
  tipo: z.enum(["procedimento", "registro-mapa", "exportacao", "outro"]),
  nivelConformidade: z.enum(["critico", "alto", "medio", "baixo"]),
  dataValidade: z.date().optional(),
  edicaoColaborativa: z.boolean().default(false),
  usuariosAcesso: z.array(z.string()).optional(),
  responsavelAprovacao: z.string().min(1, "Selecione um responsável para aprovação"),
  comentarioSubmissao: z.string().optional(),
});

type DocumentoFormData = z.infer<typeof documentoSchema>;

export default function NovoDocumento() {
  const navigate = useNavigate();
  const [pastas, setPastas] = useState<Pasta[]>([]);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [paragrafos, setParagrafos] = useState<Paragrafo[]>([]);

  const form = useForm<DocumentoFormData>({
    resolver: zodResolver(documentoSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      pastaId: "",
      tags: [],
      tipo: "procedimento" as const,
      nivelConformidade: "medio" as const,
      edicaoColaborativa: false,
      usuariosAcesso: [],
      responsavelAprovacao: "",
      comentarioSubmissao: "",
    },
  });

  useEffect(() => {
    carregarPastas();
  }, []);

  const carregarPastas = async () => {
    try {
      const data = await getPastas();
      setPastas(data);
    } catch (error) {
      toast.error("Erro ao carregar pastas");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.file.size > MAX_FILE_SIZE) {
          toast.error("Arquivo muito grande. Limite: 50MB");
        } else {
          toast.error("Tipo de arquivo não suportado");
        }
        return;
      }
      if (acceptedFiles.length > 0) {
        setArquivo(acceptedFiles[0]);
        toast.success("Arquivo carregado com sucesso");
      }
    },
  });

  const adicionarParagrafo = (tipo: "texto" | "imagem" | "tabela") => {
    let conteudoInicial: string | ImagemConteudo | TabelaConteudo;

    if (tipo === "texto") {
      conteudoInicial = "";
    } else if (tipo === "imagem") {
      conteudoInicial = { url: "" };
    } else {
      conteudoInicial = { colunas: [], linhas: [] };
    }

    const novoParagrafo: Paragrafo = {
      id: `${Date.now()}-${Math.random()}`,
      ordem: paragrafos.length + 1,
      tipo,
      conteudo: conteudoInicial,
    };

    setParagrafos([...paragrafos, novoParagrafo]);
    toast.success(`Parágrafo de ${tipo} adicionado`);
  };

  const atualizarParagrafo = (id: string, novoConteudo: Paragrafo["conteudo"]) => {
    setParagrafos(paragrafos.map((p) => (p.id === id ? { ...p, conteudo: novoConteudo } : p)));
  };

  const removerParagrafo = (id: string) => {
    setParagrafos(paragrafos.filter((p) => p.id !== id).map((p, idx) => ({ ...p, ordem: idx + 1 })));
    toast.success("Parágrafo removido");
  };

  const moverParagrafo = (id: string, direcao: "cima" | "baixo") => {
    const index = paragrafos.findIndex((p) => p.id === id);
    if (index === -1) return;

    const novaPosicao = direcao === "cima" ? index - 1 : index + 1;
    if (novaPosicao < 0 || novaPosicao >= paragrafos.length) return;

    const novosParagrafos = [...paragrafos];
    [novosParagrafos[index], novosParagrafos[novaPosicao]] = [novosParagrafos[novaPosicao], novosParagrafos[index]];

    setParagrafos(novosParagrafos.map((p, idx) => ({ ...p, ordem: idx + 1 })));
  };

  const onSubmit = async (data: DocumentoFormData) => {
    if (!arquivo) {
      toast.error("Selecione um arquivo");
      return;
    }

    setLoading(true);
    try {
      await createDocumento({
        statusAprovacao: "pendente" as const,
        aprovadores: mockAprovadores,
        responsavelAprovacao: data.responsavelAprovacao,
        historico: [
          {
            id: Date.now().toString(),
            usuario: "Usuário Atual",
            cargo: "analista",
            acao: "submetido" as const,
            comentario: data.comentarioSubmissao || "Documento submetido para aprovação",
            data: new Date().toISOString(),
          },
        ],
        dataSubmissao: new Date().toISOString(),
        titulo: data.titulo,
        descricao: data.descricao || "",
        pastaId: data.pastaId,
        tags: data.tags,
        versaoAtual: 1,
        versoes: [
          {
            numero: 1,
            comentario: "Versão inicial",
            arquivo: arquivo.name,
            criadoPor: "Usuário Atual",
            criadoEm: new Date().toISOString(),
            snapshot: {
              paragrafos: paragrafos.map((p) => ({
                ...p,
                conteudo:
                  p.tipo === "imagem" && (p.conteudo as ImagemConteudo).arquivo
                    ? { ...(p.conteudo as ImagemConteudo), arquivo: undefined }
                    : p.conteudo,
              })),
              metadados: {
                titulo: data.titulo,
                descricao: data.descricao || "",
                tags: data.tags,
              },
            },
          },
        ],
        tipo: data.tipo,
        nivelConformidade: data.nivelConformidade,
        dataValidade: data.dataValidade?.toISOString(),
        edicaoColaborativa: data.edicaoColaborativa,
        permissoes: {
          usuarios: data.usuariosAcesso || [],
          departamentos: [],
        },
        anexos: [
          {
            id: Date.now().toString(),
            nome: arquivo.name,
            tipo: arquivo.type,
            tamanho: arquivo.size,
            url: URL.createObjectURL(arquivo),
            uploadPor: "Usuário Atual",
            uploadEm: new Date().toISOString(),
          },
        ],
        paragrafos: paragrafos.map((p) => ({
          ...p,
          conteudo:
            p.tipo === "imagem" && (p.conteudo as ImagemConteudo).arquivo
              ? { ...(p.conteudo as ImagemConteudo), arquivo: undefined }
              : p.conteudo,
        })),
        criadoPor: "Usuário Atual",
      });

      toast.success("Documento criado com sucesso!");
      navigate("/apps/sgdnc/documentos");
    } catch (error) {
      toast.error("Erro ao criar documento");
    } finally {
      setLoading(false);
    }
  };

  const edicaoColaborativa = form.watch("edicaoColaborativa");

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Novo Documento</h1>
        <p className="text-muted-foreground">Adicione um novo documento ao sistema de gestão</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados principais do documento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Procedimento Operacional Padrão" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o conteúdo do documento..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>{field.value?.length || 0} / 1000 caracteres</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pastaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pasta *</FormLabel>
                    <FormControl>
                      <PastaTreeSelect pastas={pastas} value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <div className="mb-2">
                      <p className="text-sm text-muted-foreground mb-2">Tags sugeridas (clique para adicionar):</p>
                      <div className="flex flex-wrap gap-2">
                        {tagsSugeridas.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => {
                              if (!field.value.includes(tag) && field.value.length < 10) {
                                field.onChange([...field.value, tag]);
                              }
                            }}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <FormControl>
                      <TagsInput
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Digite uma tag e pressione Enter"
                        maxTags={10}
                      />
                    </FormControl>
                    <FormDescription>Use tags para facilitar a busca (máximo 10)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Conteúdo do Documento */}
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo do Documento</CardTitle>
              <CardDescription>
                Estruture o conteúdo em parágrafos dinâmicos com texto, imagens e tabelas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {paragrafos.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">Nenhum parágrafo adicionado ainda</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Comece adicionando parágrafos de texto, imagens ou tabelas
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paragrafos.map((paragrafo, index) => (
                    <ParagrafoEditor
                      key={paragrafo.id}
                      paragrafo={paragrafo}
                      onUpdate={(conteudo) => atualizarParagrafo(paragrafo.id, conteudo)}
                      onDelete={() => removerParagrafo(paragrafo.id)}
                      onMoveUp={() => moverParagrafo(paragrafo.id, "cima")}
                      onMoveDown={() => moverParagrafo(paragrafo.id, "baixo")}
                      isFirst={index === 0}
                      isLast={index === paragrafos.length - 1}
                    />
                  ))}
                </div>
              )}

              <SelecionarTipoParagrafo onSelect={adicionarParagrafo} />

              {paragrafos.length > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  {paragrafos.length} parágrafo{paragrafos.length !== 1 ? "s" : ""} adicionado
                  {paragrafos.length !== 1 ? "s" : ""}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Upload de Arquivo */}
          <Card>
            <CardHeader>
              <CardTitle>Upload de Arquivo *</CardTitle>
              <CardDescription>Formatos aceitos: PDF, DOCX, XLSX, PNG, JPG, MP4 (máx. 50MB)</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                )}
              >
                <input {...getInputProps()} />
                {arquivo ? (
                  <div className="flex items-center justify-center gap-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{arquivo.name}</p>
                      <p className="text-sm text-muted-foreground">{(arquivo.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setArquivo(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-medium">Arraste um arquivo aqui ou clique para selecionar</p>
                      <p className="text-sm text-muted-foreground mt-1">Limite de 50MB</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Metadados Regulatórios */}
          <Card>
            <CardHeader>
              <CardTitle>Metadados Regulatórios</CardTitle>
              <CardDescription>Informações de conformidade e rastreabilidade</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="procedimento">Procedimento Operacional</SelectItem>
                        <SelectItem value="registro-mapa">Registro MAPA</SelectItem>
                        <SelectItem value="exportacao">Relatório de Exportação</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nivelConformidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de Conformidade *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="critico">Crítico</SelectItem>
                        <SelectItem value="alto">Alto</SelectItem>
                        <SelectItem value="medio">Médio</SelectItem>
                        <SelectItem value="baixo">Baixo</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dataValidade"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Validade</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ptBR })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Deixe em branco se não houver validade</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Permissões */}
          {/*<Card>
            <CardHeader>
              <CardTitle>Permissões</CardTitle>
              <CardDescription>Controle de acesso ao documento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="edicaoColaborativa"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Habilitar edição colaborativa</FormLabel>
                      <FormDescription>
                        Outros usuários poderão editar este documento simultaneamente
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {edicaoColaborativa && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Outros usuários podem estar editando este documento. Mudanças são
                    sincronizadas em tempo real.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>*/}

          {/* Aprovação */}
          <Card>
            <CardHeader>
              <CardTitle>Aprovação *</CardTitle>
              <CardDescription>Selecione o responsável que irá revisar e aprovar este documento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="responsavelAprovacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável pela Aprovação *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mockAprovadores.map((aprovador) => (
                          <SelectItem key={aprovador.id} value={aprovador.id}>
                            {aprovador.nome} ({aprovador.cargo})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>O responsável receberá notificação para revisar o documento</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comentarioSubmissao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentário (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adicione observações relevantes para o aprovador..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Informações adicionais que podem ajudar na análise do documento</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/apps/sgdnc/documentos")}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Criando..." : "Criar Documento"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
