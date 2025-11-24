import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDropzone } from 'react-dropzone';
import { Paragrafo, ImagemConteudo, TabelaConteudo } from '@/types/paragrafo';
import { ParagrafoEditor } from '@/components/sgdnc/editor/ParagrafoEditor';
import { SelecionarTipoParagrafo } from '@/components/sgdnc/editor/SelecionarTipoParagrafo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import { createDocumento, mockAprovadores, type Pasta } from '@/services/sgdncMockData';
import { useAuth } from "@/contexts/AuthContext";
import { usePastas } from '@/hooks/sgdnc/usePastas';



const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'video/mp4': ['.mp4'],
};

const documentoSchema = z.object({
  titulo: z.string()
    .min(3, 'Título deve ter pelo menos 3 caracteres')
    .max(200, 'Título deve ter no máximo 200 caracteres'),
  descricao: z.string()
    .max(1000, 'Descrição deve ter no máximo 1000 caracteres')
    .optional(),
  codigo: z.string().min(1, 'Código é obrigatório'),
  pastaId: z.string().min(1, 'Selecione uma pasta'),
  tags: z.array(z.string()).max(10, 'Máximo de 10 tags'),
  tipo: z.enum(['procedimento', 'registro-mapa', 'exportacao', 'outro']),
  nivelConformidade: z.enum(['critico', 'alto', 'medio', 'baixo']),
  dataValidade: z.date().optional(),
  edicaoColaborativa: z.boolean().default(false),
  usuariosAcesso: z.array(z.string()).optional(),
  responsavelAprovacao: z.string().min(1, 'Selecione um responsável para aprovação'),
  comentarioSubmissao: z.string().optional(),
});

// types/pasta.ts
export interface Pasta {
  ID_PASTA: string | number;
  NOME: string;
  PASTA_PARENT_ID: string | number | null;
  COR?: string;
  CREATED_AT?: string;
  UPDATED_AT?: string;
}

type DocumentoFormData = z.infer<typeof documentoSchema>;

export default function NovoDocumento() {
  const navigate = useNavigate();
  const { token } = useAuth();

  const { pastas, loading: loadingPastas, fetchPastas } = usePastas();


  const [arquivo, setArquivo] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [paragrafos, setParagrafos] = useState<Paragrafo[]>([]);

  const form = useForm<DocumentoFormData>({
    resolver: zodResolver(documentoSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      codigo: '',
      pastaId: '',
      tags: [],
      tipo: 'procedimento' as const,
      nivelConformidade: 'medio' as const,
      edicaoColaborativa: false,
      usuariosAcesso: [],
      responsavelAprovacao: '',
      comentarioSubmissao: '',
    },
  });

  useEffect(() => {
    fetchPastas(); // ← Chama o hook
  }, [fetchPastas]); // ← Dependência correta



  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.file.size > MAX_FILE_SIZE) {
          toast.error('Arquivo muito grande. Limite: 50MB');
        } else {
          toast.error('Tipo de arquivo não suportado');
        }
        return;
      }
      if (acceptedFiles.length > 0) {
        setArquivo(acceptedFiles[0]);
        toast.success('Arquivo carregado com sucesso');
      }
    },
  });

  const adicionarParagrafo = (tipo: 'texto' | 'imagem' | 'tabela') => {
    let conteudoInicial: string | ImagemConteudo | TabelaConteudo;

    if (tipo === 'texto') {
      conteudoInicial = '';
    } else if (tipo === 'imagem') {
      conteudoInicial = { url: '' };
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

  const atualizarParagrafo = (id: string, novoConteudo: Paragrafo['conteudo']) => {
    setParagrafos(paragrafos.map((p) => (p.id === id ? { ...p, conteudo: novoConteudo } : p)));
  };

  const removerParagrafo = (id: string) => {
    setParagrafos(
      paragrafos
        .filter((p) => p.id !== id)
        .map((p, idx) => ({ ...p, ordem: idx + 1 }))
    );
    toast.success('Parágrafo removido');
  };

  const moverParagrafo = (id: string, direcao: 'cima' | 'baixo') => {
    const index = paragrafos.findIndex((p) => p.id === id);
    if (index === -1) return;

    const novaPosicao = direcao === 'cima' ? index - 1 : index + 1;
    if (novaPosicao < 0 || novaPosicao >= paragrafos.length) return;

    const novosParagrafos = [...paragrafos];
    [novosParagrafos[index], novosParagrafos[novaPosicao]] = [
      novosParagrafos[novaPosicao],
      novosParagrafos[index],
    ];

    setParagrafos(novosParagrafos.map((p, idx) => ({ ...p, ordem: idx + 1 })));
  };


  const onSubmit = async (data: DocumentoFormData) => {
    setLoading(true);

    // Monta o payload JSON (sem arquivo)
    const payload = {
      titulo: data.titulo,
      descricao: data.descricao || '',
      codigo: data.codigo,
      pasta_id: data.pastaId === '' ? null : Number(data.pastaId),
      tipo: data.tipo,
      nivel_conformidade: data.nivelConformidade,
      data_validade: data.dataValidade?.toISOString() || null,
      responsavel_aprovacao: data.responsavelAprovacao,
      comentario_submissao: data.comentarioSubmissao || '',
      conteudo: {
        paragraphs: paragrafos.map(p => ({
          id: p.id,
          type: p.tipo,
          content: p.conteudo
        }))
      }
    };



    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/sgdnc/novo-documento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao salvar');

      toast.success('Documento criado com sucesso!');
      navigate('/apps/sgdnc/documentos');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao criar documento');
    } finally {
      setLoading(false);
    }
  };

  // Calcula o caminho completo: "Raiz > Qualidade > BPF"
  const buildPastaPath = (pastaId: string | number, pastas: Pasta[]): string => {
    const path: string[] = [];
    let current = pastas.find(p => p.ID_PASTA === pastaId);

    while (current) {
      path.unshift(current.NOME);
      if (!current.PASTA_PARENT_ID) break;
      current = pastas.find(p => p.ID_PASTA === current.PASTA_PARENT_ID);
    }

    return path.length > 0 ? path.join(' > ') : 'Raiz';
  };

  // Calcula profundidade (Raiz = 1)
  const getProfundidade = (pastaId: string | number | null, pastas: Pasta[]): number => {
    if (!pastaId) return 1;

    let profundidade = 1;
    let currentId: string | number | null = pastaId;

    while (currentId) {
      const pasta = pastas.find(p => p.ID_PASTA === currentId);
      if (!pasta || !pasta.PASTA_PARENT_ID) break;
      profundidade++;
      currentId = pasta.PASTA_PARENT_ID;
    }

    return profundidade;
  };




  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Novo Documento</h1>
        <p className="text-muted-foreground">
          Adicione um novo documento ao sistema de gestão
        </p>
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
                    <FormDescription>
                      {field.value?.length || 0} / 1000 caracteres
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: POP-SGQ-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <CardDescription>
                Esse código é uma chave unica por documento, que não se repete
              </CardDescription>

              <FormField
                control={form.control}
                name="pastaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pasta Pai *</FormLabel>
                    <Select
                      value={field.value || 'root'}
                      onValueChange={(value) => field.onChange(value === 'root' ? '' : value)}
                      disabled={loadingPastas}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma pasta pai" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* Opção Raiz */}
                        <SelectItem value="root">
                          <div className="flex flex-col">
                            <span className="font-medium">Selecione uma pasta</span>
                          </div>
                        </SelectItem>

                        {/* Pastas filhas */}
                        {pastas
                          .filter((pasta) => {
                            // Evita auto-referência

                            // Calcula profundidade se essa pasta for pai
                            const novaProfundidade = getProfundidade(pasta.ID_PASTA, pastas) + 1;

                            // Bloqueia se ultrapassar 4 níveis
                            return novaProfundidade <= 4;
                          })
                          .map((pasta) => {
                            const caminho = buildPastaPath(pasta.ID_PASTA, pastas);
                            const nivelAtual = getProfundidade(pasta.ID_PASTA, pastas);
                            const seriaNivel = nivelAtual + 1;

                            return (
                              <SelectItem
                                key={pasta.ID_PASTA}
                                value={String(pasta.ID_PASTA)}
                                className={seriaNivel >= 4 ? 'text-muted-foreground' : ''}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{pasta.NOME}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {caminho}
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
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
                  <p className="text-sm text-muted-foreground mb-4">
                    Nenhum parágrafo adicionado ainda
                  </p>
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
                      onMoveUp={() => moverParagrafo(paragrafo.id, 'cima')}
                      onMoveDown={() => moverParagrafo(paragrafo.id, 'baixo')}
                      isFirst={index === 0}
                      isLast={index === paragrafos.length - 1}
                    />
                  ))}
                </div>
              )}

              <SelecionarTipoParagrafo onSelect={adicionarParagrafo} />

              {paragrafos.length > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  {paragrafos.length} parágrafo{paragrafos.length !== 1 ? 's' : ''} adicionado{paragrafos.length !== 1 ? 's' : ''}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Upload de Arquivo 
          <Card>
            <CardHeader>
              <CardTitle>Upload de Arquivo *</CardTitle>
              <CardDescription>
                Formatos aceitos: PDF, DOCX, XLSX, PNG, JPG, MP4 (máx. 50MB)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <input {...getInputProps()} />
                {arquivo ? (
                  <div className="flex items-center justify-center gap-4">
                    <FileText className="h-8 w-8 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">{arquivo.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                      </p>
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
                      <p className="font-medium">
                        Arraste um arquivo aqui ou clique para selecionar
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Limite de 50MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>*/}

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
                        <SelectItem value="procedimento">
                          Procedimento Operacional
                        </SelectItem>
                        <SelectItem value="registro-mapa">Registro MAPA</SelectItem>
                        <SelectItem value="exportacao">
                          Relatório de Exportação
                        </SelectItem>
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
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              format(field.value, 'PPP', { locale: ptBR })
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
                    <FormDescription>
                      Deixe em branco se não houver validade
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>



          {/* Aprovação */}
          <Card>
            <CardHeader>
              <CardTitle>Aprovação *</CardTitle>
              <CardDescription>
                Selecione o responsável que irá revisar e aprovar este documento
              </CardDescription>
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
                            {aprovador.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      O responsável receberá notificação para revisar o documento
                    </FormDescription>
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
                    <FormDescription>
                      Informações adicionais que podem ajudar na análise do documento
                    </FormDescription>
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
              onClick={() => navigate('/apps/sgdnc/documentos')}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Criando...' : 'Criar Documento'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
