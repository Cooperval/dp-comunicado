import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { createNaoConformidade } from '@/pages/apps/sgdnc/services/sgdncMockData';
import { toast } from 'sonner';
import { EvidenceUpload, Evidence } from '@/pages/apps/sgdnc/components/EvidenceUpload';

const ncSchema = z.object({
  // Step 1: Identificação
  titulo: z.string().min(3, 'Título deve ter no mínimo 3 caracteres'),
  descricao: z.string().min(10, 'Descrição deve ter no mínimo 10 caracteres'),
  tipo: z.enum(['produto', 'processo', 'documental', 'hse'], {
    required_error: 'Selecione o tipo de desvio',
  }),
  dataOcorrencia: z.date({ required_error: 'Data de ocorrência é obrigatória' }),
  local: z.string().min(2, 'Local é obrigatório'),

  // Step 2: Classificação
  severidade: z.enum(['critica', 'alta', 'media', 'baixa'], {
    required_error: 'Selecione a severidade',
  }),
  impactos: z
    .array(z.string())
    .min(1, 'Selecione pelo menos um impacto'),
  causaRaiz: z.string().optional(),
  produtoLote: z.string().optional(),

  // Step 3: Responsabilização
  responsavel: z.string().min(2, 'Responsável é obrigatório'),
  departamento: z.string().min(2, 'Departamento é obrigatório'),
  prazo: z.date({ required_error: 'Prazo é obrigatório' }),
  notificar: z.array(z.string()).optional(),
});

type NCFormData = z.infer<typeof ncSchema>;

const STEPS = [
  { number: 1, title: 'Identificação', description: 'Informações básicas da NC' },
  { number: 2, title: 'Classificação', description: 'Severidade e impactos' },
  { number: 3, title: 'Responsabilização', description: 'Atribuir responsáveis' },
  { number: 4, title: 'Evidências', description: 'Anexar arquivos' },
  { number: 5, title: 'Revisão', description: 'Confirmar informações' },
];

// Mock users for selects
const mockUsuarios = [
  'João Silva',
  'Maria Santos',
  'Pedro Costa',
  'Ana Oliveira',
  'Carlos Souza',
];

const mockDepartamentos = [
  'Qualidade',
  'Produção',
  'Manutenção',
  'Segurança',
  'Logística',
  'Administrativo',
];

export default function RegistrarNC() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [evidences, setEvidences] = useState<Evidence[]>([]);

  const form = useForm<NCFormData>({
    resolver: zodResolver(ncSchema),
    defaultValues: {
      impactos: [],
      notificar: [],
    },
  });

  const onSubmit = async (data: NCFormData) => {
    if (evidences.length === 0) {
      toast.error('Anexe pelo menos uma evidência');
      setStep(4);
      return;
    }

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
        evidencias: evidences.map((e) => ({
          id: e.id,
          nome: e.file.name,
          tipo: e.file.type,
          tamanho: e.file.size,
          url: URL.createObjectURL(e.file),
          uploadPor: 'Usuário Atual',
          uploadEm: new Date().toISOString(),
        })),
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
        notificar: data.notificar || [],
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
    let fieldsToValidate: (keyof NCFormData)[] = [];

    switch (step) {
      case 1:
        fieldsToValidate = ['titulo', 'descricao', 'tipo', 'dataOcorrencia', 'local'];
        break;
      case 2:
        fieldsToValidate = ['severidade', 'impactos'];
        break;
      case 3:
        fieldsToValidate = ['responsavel', 'departamento', 'prazo'];
        // Validar que prazo é futuro
        const prazoValue = form.getValues('prazo');
        if (prazoValue && prazoValue < new Date()) {
          form.setError('prazo', {
            message: 'Prazo deve ser uma data futura',
          });
          return;
        }
        break;
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/apps/sgdnc/nao-conformidades')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Registrar Não Conformidade</h1>
            <p className="text-muted-foreground">
              Preencha as informações sobre a não conformidade identificada
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {STEPS.map((s) => (
              <div key={s.number} className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold',
                    step > s.number
                      ? 'bg-primary text-primary-foreground border-primary'
                      : step === s.number
                      ? 'border-primary text-primary'
                      : 'border-muted-foreground/20 text-muted-foreground'
                  )}
                >
                  {step > s.number ? <CheckCircle2 className="h-4 w-4" /> : s.number}
                </div>
                <div className="hidden md:block">
                  <p
                    className={cn(
                      'text-xs font-medium',
                      step >= s.number ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {s.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Identificação */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Identificação</CardTitle>
                <CardDescription>Informações básicas sobre a não conformidade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da NC *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Defeito no produto X" {...field} />
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
                          placeholder="Descreva em detalhes a não conformidade identificada..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Mínimo 10 caracteres</FormDescription>
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
                          <SelectItem value="hse">HSE (Saúde, Segurança e Meio Ambiente)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                                'w-full pl-3 text-left font-normal',
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
                            className="pointer-events-auto"
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
                        <Input placeholder="Ex: Linha de Produção 2, Setor B" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 2: Classificação */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Classificação</CardTitle>
                <CardDescription>Avalie a severidade e impactos da NC</CardDescription>
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
                          className="grid grid-cols-2 gap-4"
                        >
                          <div>
                            <RadioGroupItem
                              value="critica"
                              id="critica"
                              className="peer sr-only"
                            />
                            <label
                              htmlFor="critica"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-destructive [&:has([data-state=checked])]:border-destructive cursor-pointer"
                            >
                              <Badge variant="destructive" className="mb-2">
                                Crítica
                              </Badge>
                              <span className="text-xs text-center text-muted-foreground">
                                Impacto severo, ação imediata
                              </span>
                            </label>
                          </div>

                          <div>
                            <RadioGroupItem value="alta" id="alta" className="peer sr-only" />
                            <label
                              htmlFor="alta"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <Badge className="mb-2" style={{ backgroundColor: 'hsl(25 95% 53%)' }}>
                                Alta
                              </Badge>
                              <span className="text-xs text-center text-muted-foreground">
                                Requer atenção urgente
                              </span>
                            </label>
                          </div>

                          <div>
                            <RadioGroupItem value="media" id="media" className="peer sr-only" />
                            <label
                              htmlFor="media"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <Badge className="mb-2" style={{ backgroundColor: 'hsl(45 93% 47%)' }}>
                                Média
                              </Badge>
                              <span className="text-xs text-center text-muted-foreground">
                                Atenção moderada
                              </span>
                            </label>
                          </div>

                          <div>
                            <RadioGroupItem value="baixa" id="baixa" className="peer sr-only" />
                            <label
                              htmlFor="baixa"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <Badge className="mb-2" variant="secondary">
                                Baixa
                              </Badge>
                              <span className="text-xs text-center text-muted-foreground">
                                Monitoramento
                              </span>
                            </label>
                          </div>
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
                        <FormDescription>
                          Selecione todas as áreas impactadas
                        </FormDescription>
                      </div>
                      <div className="space-y-2">
                        {[
                          { id: 'qualidade', label: 'Qualidade' },
                          { id: 'producao', label: 'Produção' },
                          { id: 'seguranca', label: 'Segurança' },
                          { id: 'regulatorio', label: 'Regulatório' },
                        ].map((impacto) => (
                          <FormField
                            key={impacto.id}
                            control={form.control}
                            name="impactos"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(impacto.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, impacto.id])
                                        : field.onChange(
                                            field.value?.filter((value) => value !== impacto.id)
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {impacto.label}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="causaRaiz"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Causa Raiz</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva a causa raiz identificada (opcional)..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Campo opcional</FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="produtoLote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produto/Lote Afetado</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Lote 2024-001" {...field} />
                      </FormControl>
                      <FormDescription>Campo opcional</FormDescription>
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
                <CardDescription>Atribua responsáveis e prazos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="responsavel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsável pela Ação Corretiva *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o responsável" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {mockUsuarios.map((usuario) => (
                            <SelectItem key={usuario} value={usuario}>
                              {usuario}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                          {mockDepartamentos.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
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
                                'w-full pl-3 text-left font-normal',
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
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>O prazo deve ser uma data futura</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notificar"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>Notificar</FormLabel>
                        <FormDescription>
                          Selecione os usuários que devem ser notificados
                        </FormDescription>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-md p-3">
                        {mockUsuarios.map((usuario) => (
                          <FormField
                            key={usuario}
                            control={form.control}
                            name="notificar"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(usuario)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...(field.value || []), usuario])
                                        : field.onChange(
                                            field.value?.filter((value) => value !== usuario)
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {usuario}
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 4: Evidências */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Evidências</CardTitle>
                <CardDescription>
                  Anexe fotos, vídeos ou documentos que comprovem a não conformidade (mínimo 1)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EvidenceUpload
                  evidences={evidences}
                  onChange={setEvidences}
                  maxFiles={10}
                  maxSizeMB={20}
                />
                {evidences.length === 0 && (
                  <p className="text-sm text-destructive mt-2">
                    Anexe pelo menos uma evidência antes de prosseguir
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 5: Revisão */}
          {step === 5 && (
            <Card>
              <CardHeader>
                <CardTitle>Revisão</CardTitle>
                <CardDescription>
                  Confira todas as informações antes de registrar a NC
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Identificação */}
                <div>
                  <h3 className="font-semibold mb-3">Identificação</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Título:</span>
                      <span className="font-medium">{form.getValues('titulo')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <Badge variant="outline" className="capitalize">
                        {form.getValues('tipo')}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data:</span>
                      <span>
                        {form.getValues('dataOcorrencia') &&
                          format(form.getValues('dataOcorrencia'), 'dd/MM/yyyy', {
                            locale: ptBR,
                          })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Local:</span>
                      <span>{form.getValues('local')}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Classificação */}
                <div>
                  <h3 className="font-semibold mb-3">Classificação</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Severidade:</span>
                      <Badge variant="destructive" className="capitalize">
                        {form.getValues('severidade')}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Impactos:</span>
                      <div className="flex gap-1 flex-wrap justify-end">
                        {form.getValues('impactos').map((impacto) => (
                          <Badge key={impacto} variant="secondary" className="capitalize text-xs">
                            {impacto}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Responsabilização */}
                <div>
                  <h3 className="font-semibold mb-3">Responsabilização</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Responsável:</span>
                      <span className="font-medium">{form.getValues('responsavel')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Departamento:</span>
                      <span>{form.getValues('departamento')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prazo:</span>
                      <span className="font-medium">
                        {form.getValues('prazo') &&
                          format(form.getValues('prazo'), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Evidências */}
                <div>
                  <h3 className="font-semibold mb-3">Evidências</h3>
                  <p className="text-sm text-muted-foreground">
                    {evidences.length} arquivo(s) anexado(s)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={step === 1 ? () => navigate('/apps/sgdnc/nao-conformidades') : prevStep}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {step === 1 ? 'Cancelar' : 'Anterior'}
            </Button>

            {step < STEPS.length ? (
              <Button type="button" onClick={nextStep}>
                Próximo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Registrar NC
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
