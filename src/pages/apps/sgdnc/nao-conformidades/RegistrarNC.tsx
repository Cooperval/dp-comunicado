import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { createNaoConformidade } from '@/services/sgdncMockData';
import { toast } from 'sonner';

const ncSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  descricao: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  tipo: z.enum(['produto', 'processo', 'documental', 'hse']),
  dataOcorrencia: z.date(),
  local: z.string().min(2, 'Local é obrigatório'),
  severidade: z.enum(['critica', 'alta', 'media', 'baixa']),
  impactos: z.array(z.string()).min(1, 'Selecione pelo menos um impacto'),
  causaRaiz: z.string().optional(),
  produtoLote: z.string().optional(),
  responsavel: z.string().min(2, 'Responsável é obrigatório'),
  departamento: z.string().min(2, 'Departamento é obrigatório'),
  prazo: z.date(),
});

type NCFormData = z.infer<typeof ncSchema>;

export default function RegistrarNC() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<NCFormData>({
    resolver: zodResolver(ncSchema),
    defaultValues: {
      impactos: [],
    },
  });

  const onSubmit = async (data: NCFormData) => {
    setSubmitting(true);
    try {
      await createNaoConformidade({
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo,
        dataOcorrencia: data.dataOcorrencia.toISOString(),
        local: data.local,
        severidade: data.severidade,
        impactos: data.impactos as ('qualidade' | 'producao' | 'seguranca' | 'regulatorio')[],
        causaRaiz: data.causaRaiz,
        produtoLote: data.produtoLote,
        responsavel: data.responsavel,
        departamento: data.departamento,
        prazo: data.prazo.toISOString(),
        status: 'aberta',
        evidencias: [],
        acoesCorretivas: [],
        historico: [
          {
            id: Date.now().toString(),
            tipo: 'criacao',
            descricao: 'NC registrada',
            usuario: 'Usuário Atual',
            data: new Date().toISOString(),
          },
        ],
        notificar: [],
        criadoPor: 'Usuário Atual',
      });

      toast.success('Não conformidade registrada com sucesso!');
      navigate('/apps/sgdnc/nao-conformidades');
    } catch (error) {
      toast.error('Erro ao registrar NC');
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    
    if (step === 1) {
      fieldsToValidate = ['titulo', 'descricao', 'tipo', 'dataOcorrencia', 'local'];
    } else if (step === 2) {
      fieldsToValidate = ['severidade', 'impactos'];
    } else if (step === 3) {
      fieldsToValidate = ['responsavel', 'departamento', 'prazo'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Registrar Não Conformidade</h1>
        <p className="text-muted-foreground mt-1">
          Preencha os dados da não conformidade
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex-1">
            <div
              className={cn(
                'h-2 rounded-full transition-colors',
                s <= step ? 'bg-primary' : 'bg-muted'
              )}
            />
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Identificação */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Identificação</CardTitle>
                <CardDescription>Informações básicas da não conformidade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Desvio de temperatura..." {...field} />
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
                      <FormLabel>Descrição Detalhada *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o que aconteceu..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Desvio *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="produto">Produto</SelectItem>
                          <SelectItem value="processo">Processo</SelectItem>
                          <SelectItem value="documental">Documental</SelectItem>
                          <SelectItem value="hse">HSE (Segurança)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dataOcorrencia"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data de Ocorrência *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP', { locale: ptBR })
                                ) : (
                                  <span>Selecione a data</span>
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
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="local"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Local *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Câmara Fria 01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Classificação */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Classificação</CardTitle>
                <CardDescription>Classifique a severidade e impacto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="severidade"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Severidade *</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="critica" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              <span className="font-semibold text-destructive">Crítica</span> - Risco imediato
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="alta" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              <span className="font-semibold" style={{ color: 'hsl(25 95% 53%)' }}>Alta</span> - Requer ação urgente
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="media" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              <span className="font-semibold" style={{ color: 'hsl(45 93% 47%)' }}>Média</span> - Ação necessária
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="baixa" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              <span className="font-semibold" style={{ color: 'hsl(142 76% 36%)' }}>Baixa</span> - Monitorar
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="impactos"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Impactos *</FormLabel>
                      </div>
                      {['qualidade', 'producao', 'seguranca', 'regulatorio'].map((item) => (
                        <FormField
                          key={item}
                          control={form.control}
                          name="impactos"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={(checked) => {
                                    const value = field.value || [];
                                    return checked
                                      ? field.onChange([...value, item])
                                      : field.onChange(
                                          value.filter((val) => val !== item)
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer capitalize">
                                {item}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="causaRaiz"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Causa Raiz (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Identifique a causa raiz..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="produtoLote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produto/Lote Afetado (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Lote 2024-10-A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Responsabilização */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Responsabilização</CardTitle>
                <CardDescription>Defina responsáveis e prazos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="responsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável pela Ação Corretiva *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do responsável" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o departamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Qualidade">Qualidade</SelectItem>
                          <SelectItem value="Produção">Produção</SelectItem>
                          <SelectItem value="Manutenção">Manutenção</SelectItem>
                          <SelectItem value="Logística">Logística</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prazo"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Prazo para Resolução *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP', { locale: ptBR })
                              ) : (
                                <span>Selecione o prazo</span>
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
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Revisão */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Revisão</CardTitle>
                <CardDescription>Confirme os dados antes de registrar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Título</p>
                    <p className="font-medium">{form.watch('titulo')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tipo</p>
                    <p className="font-medium capitalize">{form.watch('tipo')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Severidade</p>
                    <p className="font-medium capitalize">{form.watch('severidade')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Responsável</p>
                    <p className="font-medium">{form.watch('responsavel')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => (step === 1 ? navigate(-1) : setStep(step - 1))}
            >
              {step === 1 ? 'Cancelar' : 'Voltar'}
            </Button>
            {step < 4 ? (
              <Button type="button" onClick={nextStep}>
                Próximo
              </Button>
            ) : (
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Registrando...' : 'Registrar NC'}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
