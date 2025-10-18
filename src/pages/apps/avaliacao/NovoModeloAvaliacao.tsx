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
import { ArrowLeft, Save, Plus, Trash2, GripVertical } from 'lucide-react';
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

const opcaoSchema = z.object({
  texto: z.string().min(1, 'Texto da opção é obrigatório'),
  valor: z.number().min(1).max(5),
});

const perguntaSchema = z.object({
  tipo: z.enum(['multipla_escolha', 'descritiva']),
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  obrigatoria: z.boolean().default(true),
  opcoes: z.array(opcaoSchema).optional(),
});

const modeloSchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório'),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true),
  perguntas: z.array(perguntaSchema).min(1, 'Adicione pelo menos uma pergunta'),
});

type ModeloFormData = z.infer<typeof modeloSchema>;

export default function NovoModeloAvaliacao() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isEditing = !!id;

  const form = useForm<ModeloFormData>({
    resolver: zodResolver(modeloSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      ativo: true,
      perguntas: [
        {
          tipo: 'multipla_escolha',
          titulo: '',
          descricao: '',
          obrigatoria: true,
          opcoes: [
            { texto: 'Insatisfatório', valor: 1 },
            { texto: 'Regular', valor: 2 },
            { texto: 'Bom', valor: 3 },
            { texto: 'Muito Bom', valor: 4 },
            { texto: 'Excelente', valor: 5 },
          ],
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'perguntas',
  });

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
      opcoes:
        tipo === 'multipla_escolha'
          ? [
              { texto: 'Insatisfatório', valor: 1 },
              { texto: 'Regular', valor: 2 },
              { texto: 'Bom', valor: 3 },
              { texto: 'Muito Bom', valor: 4 },
              { texto: 'Excelente', valor: 5 },
            ]
          : undefined,
    });
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
              <CardTitle>Informações Básicas</CardTitle>
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
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">
                              Opções de resposta (pré-definidas)
                            </Label>
                            <div className="grid grid-cols-5 gap-2">
                              {['Insatisfatório', 'Regular', 'Bom', 'Muito Bom', 'Excelente'].map(
                                (label, i) => (
                                  <div
                                    key={i}
                                    className="text-center p-2 border rounded-md bg-muted/50"
                                  >
                                    <div className="text-xs font-medium">{i + 1}</div>
                                    <div className="text-[10px] text-muted-foreground">{label}</div>
                                  </div>
                                )
                              )}
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
