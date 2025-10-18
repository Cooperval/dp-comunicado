import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
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

const atribuicaoSchema = z.object({
  modeloId: z.string().min(1, 'Selecione um modelo'),
  gestorId: z.string().min(1, 'Selecione um gestor'),
  aprendizId: z.string().min(1, 'Selecione um aprendiz'),
  prazo: z.string().min(1, 'Defina um prazo'),
  observacoes: z.string().optional(),
});

type AtribuicaoFormData = z.infer<typeof atribuicaoSchema>;

export default function AtribuirAvaliacao() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [modelos, setModelos] = useState<any[]>([]);
  const [gestores] = useState([
    { id: '1', nome: 'Carlos Silva' },
    { id: '2', nome: 'Ana Costa' },
    { id: '3', nome: 'Pedro Santos' },
  ]);
  const [aprendizes] = useState([
    { id: '1', nome: 'João Oliveira' },
    { id: '2', nome: 'Maria Souza' },
    { id: '3', nome: 'Lucas Ferreira' },
    { id: '4', nome: 'Beatriz Lima' },
  ]);

  const form = useForm<AtribuicaoFormData>({
    resolver: zodResolver(atribuicaoSchema),
    defaultValues: {
      modeloId: '',
      gestorId: '',
      aprendizId: '',
      prazo: '',
      observacoes: '',
    },
  });

  useEffect(() => {
    loadModelos();
  }, []);

  const loadModelos = async () => {
    const data = await mockAPI.getModelosAvaliacao();
    setModelos(data.filter((m: any) => m.ativo));
  };

  const onSubmit = async (data: AtribuicaoFormData) => {
    setLoading(true);
    try {
      await mockAPI.atribuirAvaliacao(data);
      toast({
        title: 'Sucesso',
        description: 'Avaliação atribuída com sucesso',
      });
      navigate('/apps/avaliacao/lista');
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao atribuir avaliação',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const modeloSelecionado = modelos.find((m) => m.id === form.watch('modeloId'));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Atribuir Avaliação</h1>
          <p className="text-muted-foreground mt-1">
            Atribua um modelo de avaliação para um gestor avaliar um aprendiz
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Dados da Atribuição</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="modeloId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Modelo de Avaliação <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o modelo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {modelos.map((modelo) => (
                          <SelectItem key={modelo.id} value={modelo.id}>
                            {modelo.titulo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Escolha o modelo com as perguntas que serão respondidas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {modeloSelecionado && (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <p className="text-sm font-medium mb-2">Detalhes do Modelo:</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {modeloSelecionado.descricao}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {modeloSelecionado.perguntas.length} perguntas •{' '}
                    {modeloSelecionado.perguntas.filter((p: any) => p.tipo === 'multipla_escolha').length}{' '}
                    múltipla escolha •{' '}
                    {modeloSelecionado.perguntas.filter((p: any) => p.tipo === 'descritiva').length}{' '}
                    descritivas
                  </p>
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="gestorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Gestor Responsável <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o gestor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gestores.map((gestor) => (
                            <SelectItem key={gestor.id} value={gestor.id}>
                              {gestor.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Gestor que realizará a avaliação
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="aprendizId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Jovem Aprendiz <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o aprendiz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {aprendizes.map((aprendiz) => (
                            <SelectItem key={aprendiz.id} value={aprendiz.id}>
                              {aprendiz.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Aprendiz que será avaliado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="prazo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Prazo para Conclusão <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Data limite para o gestor completar a avaliação
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="observacoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Adicione observações ou instruções especiais para o gestor (opcional)"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Atribuindo...' : 'Atribuir Avaliação'}
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
