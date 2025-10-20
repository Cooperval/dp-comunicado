import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Settings } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { mockAPI } from '@/services/mockData';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const opcaoSchema = z.object({
  texto: z.string().min(1, 'Texto da opção é obrigatório'),
  valor: z.number().min(1),
});

const padraoRespostaSchema = z.object({
  id: z.string(),
  nome: z.string().min(1, 'Nome do padrão é obrigatório'),
  opcoes: z.array(opcaoSchema).min(2, 'Adicione pelo menos 2 opções'),
});

const perguntaSchema = z.object({
  tipo: z.enum(['multipla_escolha', 'descritiva']),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  obrigatoria: z.boolean().default(true),
  padraoRespostaId: z.string().optional(),
  opcoes: z.array(opcaoSchema).optional(),
});

const modeloSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
  perguntas: z.array(perguntaSchema).min(1, 'Adicione pelo menos uma pergunta'),
  padroesResposta: z.array(padraoRespostaSchema).optional(),
});

type ModeloFormData = z.infer<typeof modeloSchema>;
type PadraoResposta = z.infer<typeof padraoRespostaSchema>;

// Padrões pré-definidos
const PADROES_PREDEFINIDOS: PadraoResposta[] = [
  {
    id: 'escala-1-5',
    nome: 'Escala 1-5 (Insatisfatório a Excelente)',
    opcoes: [
      { texto: 'Insatisfatório', valor: 1 },
      { texto: 'Regular', valor: 2 },
      { texto: 'Bom', valor: 3 },
      { texto: 'Muito Bom', valor: 4 },
      { texto: 'Excelente', valor: 5 },
    ],
  },
  {
    id: 'sim-nao',
    nome: 'Sim/Não',
    opcoes: [
      { texto: 'Não', valor: 0 },
      { texto: 'Sim', valor: 1 },
    ],
  },
  {
    id: 'concordancia',
    nome: 'Concordância',
    opcoes: [
      { texto: 'Discordo Totalmente', valor: 1 },
      { texto: 'Discordo', valor: 2 },
      { texto: 'Neutro', valor: 3 },
      { texto: 'Concordo', valor: 4 },
      { texto: 'Concordo Totalmente', valor: 5 },
    ],
  },
  {
    id: 'frequencia',
    nome: 'Frequência',
    opcoes: [
      { texto: 'Nunca', valor: 1 },
      { texto: 'Raramente', valor: 2 },
      { texto: 'Às vezes', valor: 3 },
      { texto: 'Frequentemente', valor: 4 },
      { texto: 'Sempre', valor: 5 },
    ],
  },
];

export default function NovoModeloAvaliacao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novoPadrao, setNovoPadrao] = useState({ nome: '', opcoes: [{ texto: '', valor: 1 }] });
  const isEditing = !!id;

  const form = useForm<ModeloFormData>({
    resolver: zodResolver(modeloSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      ativo: true,
      padroesResposta: [],
      perguntas: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'perguntas',
  });

  const padroesPersonalizados = form.watch('padroesResposta') || [];
  const todosPadroes = [...PADROES_PREDEFINIDOS, ...padroesPersonalizados];

  useEffect(() => {
    if (isEditing) {
      loadModelo();
    }
  }, [id]);

  const loadModelo = async () => {
    const data = await mockAPI.getModeloAvaliacaoById(id!);
    // Remove IDs das perguntas antes de resetar o form
    const formData = {
      ...data,
      perguntas: data.perguntas.map(({ id, ...rest }: any) => rest),
    };
    form.reset(formData);
  };

  const onSubmit = async (data: ModeloFormData) => {
    setLoading(true);
    try {
      if (isEditing) {
        await mockAPI.updateModeloAvaliacao(id!, data);
        toast({
          title: 'Sucesso',
          description: 'Modelo atualizado com sucesso',
        });
      } else {
        await mockAPI.createModeloAvaliacao(data);
        toast({
          title: 'Sucesso',
          description: 'Modelo criado com sucesso',
        });
      }
      navigate('/apps/avaliacao/modelos');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar modelo',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addPergunta = (tipo: 'multipla_escolha' | 'descritiva') => {
    append({
      tipo,
      titulo: '',
      descricao: '',
      obrigatoria: true,
      padraoRespostaId: tipo === 'multipla_escolha' ? 'escala-1-5' : undefined,
      opcoes: tipo === 'multipla_escolha' ? PADROES_PREDEFINIDOS[0].opcoes : undefined,
    });
  };

  const addNovoPadrao = () => {
    const opcoesValidas = novoPadrao.opcoes.filter((op) => op.texto.trim() !== '');
    if (!novoPadrao.nome.trim() || opcoesValidas.length < 2) {
      toast({
        title: 'Erro',
        description: 'Adicione um nome e pelo menos 2 opções',
        variant: 'destructive',
      });
      return;
    }

    const novoId = `custom-${Date.now()}`;
    const padroesAtuais = form.getValues('padroesResposta') || [];
    form.setValue('padroesResposta', [
      ...padroesAtuais,
      { id: novoId, nome: novoPadrao.nome, opcoes: opcoesValidas },
    ]);

    setNovoPadrao({ nome: '', opcoes: [{ texto: '', valor: 1 }] });
    setDialogOpen(false);
    toast({
      title: 'Sucesso',
      description: 'Padrão de resposta criado',
    });
  };

  const removePadraoPersonalizado = (padraoId: string) => {
    const padroesAtuais = form.getValues('padroesResposta') || [];
    form.setValue(
      'padroesResposta',
      padroesAtuais.filter((p) => p.id !== padraoId)
    );
  };

  const handlePadraoChange = (index: number, padraoId: string) => {
    const padrao = todosPadroes.find((p) => p.id === padraoId);
    if (padrao) {
      form.setValue(`perguntas.${index}.padraoRespostaId`, padraoId);
      form.setValue(`perguntas.${index}.opcoes`, padrao.opcoes);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isEditing ? 'Editar Modelo' : 'Novo Modelo'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isEditing
              ? 'Atualize as informações do modelo de avaliação'
              : 'Crie um novo modelo de avaliação personalizado'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Informações Básicas</CardTitle>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Gerenciar Padrões de Resposta
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Padrões de Resposta</DialogTitle>
                      <DialogDescription>
                        Gerencie os padrões de resposta para perguntas de múltipla escolha
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-3">Padrões Pré-definidos</h4>
                        <div className="space-y-2">
                          {PADROES_PREDEFINIDOS.map((padrao) => (
                            <div key={padrao.id} className="p-3 border rounded-lg">
                              <div className="font-medium text-sm mb-2">{padrao.nome}</div>
                              <div className="flex flex-wrap gap-2">
                                {padrao.opcoes.map((opcao, i) => (
                                  <span key={i} className="text-xs px-2 py-1 bg-muted rounded">
                                    {opcao.valor}: {opcao.texto}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-3">Padrões Personalizados</h4>
                        {padroesPersonalizados.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Nenhum padrão personalizado criado
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {padroesPersonalizados.map((padrao) => (
                              <div key={padrao.id} className="p-3 border rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="font-medium text-sm">{padrao.nome}</div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removePadraoPersonalizado(padrao.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {padrao.opcoes.map((opcao, i) => (
                                    <span key={i} className="text-xs px-2 py-1 bg-muted rounded">
                                      {opcao.valor}: {opcao.texto}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-3">Criar Novo Padrão</h4>
                        <div className="space-y-3">
                          <div>
                            <Label>Nome do Padrão</Label>
                            <Input
                              placeholder="Ex: Avaliação de Qualidade"
                              value={novoPadrao.nome}
                              onChange={(e) =>
                                setNovoPadrao({ ...novoPadrao, nome: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <Label>Opções</Label>
                            <div className="space-y-2">
                              {novoPadrao.opcoes.map((opcao, index) => (
                                <div key={index} className="flex gap-2">
                                  <Input
                                    type="number"
                                    placeholder="Valor"
                                    className="w-20"
                                    value={opcao.valor}
                                    onChange={(e) => {
                                      const novasOpcoes = [...novoPadrao.opcoes];
                                      novasOpcoes[index].valor = parseInt(e.target.value) || 0;
                                      setNovoPadrao({ ...novoPadrao, opcoes: novasOpcoes });
                                    }}
                                  />
                                  <Input
                                    placeholder="Texto da opção"
                                    value={opcao.texto}
                                    onChange={(e) => {
                                      const novasOpcoes = [...novoPadrao.opcoes];
                                      novasOpcoes[index].texto = e.target.value;
                                      setNovoPadrao({ ...novoPadrao, opcoes: novasOpcoes });
                                    }}
                                  />
                                  {novoPadrao.opcoes.length > 2 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const novasOpcoes = novoPadrao.opcoes.filter(
                                          (_, i) => i !== index
                                        );
                                        setNovoPadrao({ ...novoPadrao, opcoes: novasOpcoes });
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setNovoPadrao({
                                    ...novoPadrao,
                                    opcoes: [
                                      ...novoPadrao.opcoes,
                                      { texto: '', valor: novoPadrao.opcoes.length + 1 },
                                    ],
                                  })
                                }
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar Opção
                              </Button>
                            </div>
                          </div>
                          <Button type="button" onClick={addNovoPadrao}>
                            Criar Padrão
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Título <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Avaliação de Desempenho Trimestral" {...field} />
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
                        placeholder="Descreva o objetivo desta avaliação..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Modelo Ativo</FormLabel>
                      <FormDescription>
                        Modelos ativos podem ser usados para criar novas avaliações
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Perguntas</CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addPergunta('multipla_escolha')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Múltipla Escolha
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addPergunta('descritiva')}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Descritiva
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {fields.map((field, index) => (
                <Card key={field.id} className="border-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-move" />
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Pergunta {index + 1}</span>
                            <span className="text-xs text-muted-foreground">
                              ({field.tipo === 'multipla_escolha' ? 'Múltipla Escolha' : 'Descritiva'})
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        <FormField
                          control={form.control}
                          name={`perguntas.${index}.titulo`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Título da Pergunta <span className="text-destructive">*</span>
                              </FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Como você avalia a pontualidade?" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`perguntas.${index}.descricao`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Descrição (opcional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Adicione contexto ou instruções..."
                                  rows={2}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`perguntas.${index}.obrigatoria`}
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                              <FormLabel className="!mt-0">Pergunta obrigatória</FormLabel>
                            </FormItem>
                          )}
                        />

                        {form.watch(`perguntas.${index}.tipo`) === 'multipla_escolha' && (
                          <div className="space-y-3">
                            <FormField
                              control={form.control}
                              name={`perguntas.${index}.padraoRespostaId`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Padrão de Resposta</FormLabel>
                                  <Select
                                    value={field.value}
                                    onValueChange={(value) => handlePadraoChange(index, value)}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Selecione um padrão" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                        Pré-definidos
                                      </div>
                                      {PADROES_PREDEFINIDOS.map((padrao) => (
                                        <SelectItem key={padrao.id} value={padrao.id}>
                                          {padrao.nome}
                                        </SelectItem>
                                      ))}
                                      {padroesPersonalizados.length > 0 && (
                                        <>
                                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-1">
                                            Personalizados
                                          </div>
                                          {padroesPersonalizados.map((padrao) => (
                                            <SelectItem key={padrao.id} value={padrao.id}>
                                              {padrao.nome}
                                            </SelectItem>
                                          ))}
                                        </>
                                      )}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div>
                              <Label className="text-sm text-muted-foreground">
                                Opções de resposta
                              </Label>
                              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mt-2">
                                {(form.watch(`perguntas.${index}.opcoes`) || []).map((opcao, i) => (
                                  <div
                                    key={i}
                                    className="text-center p-2 border rounded-md bg-muted/50"
                                  >
                                    <div className="text-xs font-medium">{opcao.valor}</div>
                                    <div className="text-[10px] text-muted-foreground break-words">
                                      {opcao.texto}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}

              {fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma pergunta adicionada.</p>
                  <p className="text-sm">Clique nos botões acima para adicionar perguntas.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : isEditing ? 'Atualizar Modelo' : 'Criar Modelo'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
