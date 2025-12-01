// src/pages/sgdnc/EditarDocumento.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

import { ParagrafoEditor } from '@/components/sgdnc/editor/ParagrafoEditor';
import { SelecionarTipoParagrafo } from '@/components/sgdnc/editor/SelecionarTipoParagrafo';
import { usePastas } from '@/hooks/sgdnc/usePastas';

import { useDocumentos } from '@/hooks/sgdnc/useDocumentos';
import { useAuth } from '@/contexts/AuthContext';
import { Paragrafo } from '@/types/paragrafo';
import { mockAprovadores } from '@/services/sgdncMockData';

const documentoSchema = z.object({
  titulo: z.string().min(3).max(200),
  descricao: z.string().max(1000).optional(),
  pastaId: z.string().min(1),
  tipo: z.enum(['procedimento', 'registro-mapa', 'exportacao', 'outro']),
  nivelConformidade: z.enum(['critico', 'alto', 'medio', 'baixo']),
  dataValidade: z.date().optional().nullable(),
  responsavelAprovacao: z.string().min(1),
  comentarioSubmissao: z.string().optional(),
});

type FormData = z.infer<typeof documentoSchema>;

export default function EditarDocumento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { pastas, fetchPastas } = usePastas();
  const { documento, loading, error, fetchDocumento } = useDocumentos();

  const [paragrafos, setParagrafos] = useState<Paragrafo[]>([]);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(documentoSchema),
  });

  // Carrega documento
  useEffect(() => {
    if (id) fetchDocumento(id);
    fetchPastas();
  }, [id, fetchDocumento, fetchPastas]);

  // Preenche formulário
  useEffect(() => {
    if (documento) {
      form.reset({
        titulo: documento.titulo,
        descricao: documento.descricao || '',
        pastaId: String(documento.pasta_id || ''),
        tipo: documento.tipo,
        nivelConformidade: documento.nivel_conformidade,
        dataValidade: documento.data_validade ? new Date(documento.data_validade) : null,
        responsavelAprovacao: String(documento.responsavel_aprovacao),
        comentarioSubmissao: documento.comentario_submissao || '',
      });

      // Carrega parágrafos do conteudo
      if (documento.conteudo?.paragraphs) {
        setParagrafos(
          documento.conteudo.paragraphs.map((p, i) => ({
            id: p.id || `p-${i}`,
            ordem: i + 1,
            tipo: p.type,
            conteudo: p.content,
          }))
        );
      }
    }
  }, [documento, form]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        pasta_id: data.pastaId === '' ? null : Number(data.pastaId),
        data_validade: data.dataValidade?.toISOString() || null,
        conteudo: {
          paragraphs: paragrafos.map(p => ({
            id: p.id,
            type: p.tipo,
            content: p.conteudo,
          })),
        },
      };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/sgdnc/documentos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Erro ao salvar');

      toast.success('Documento atualizado com sucesso!');
      navigate('/apps/sgdnc/documentos');
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar');
    } finally {
      setSaving(false);
    }
  };

  const adicionarParagrafo = (tipo: 'texto' | 'imagem' | 'tabela') => {
    const novo: Paragrafo = {
      id: `${Date.now()}-${Math.random()}`,
      ordem: paragrafos.length + 1,
      tipo,
      conteudo: tipo === 'texto' ? '' : tipo === 'imagem' ? { url: '' } : { colunas: [], linhas: [] },
    };
    setParagrafos([...paragrafos, novo]);
  };

  const atualizarParagrafo = (id: string, conteudo: any) => {
    setParagrafos(p => p.map(p => p.id === id ? { ...p, conteudo } : p));
  };

  const removerParagrafo = (id: string) => {
    setParagrafos(p => p.filter(p => p.id !== id).map((p, i) => ({ ...p, ordem: i + 1 })));
  };

  const moverParagrafo = (id: string, dir: 'cima' | 'baixo') => {
    const idx = paragrafos.findIndex(p => p.id === id);
    if (idx === -1) return;
    const novoIdx = dir === 'cima' ? idx - 1 : idx + 1;
    if (novoIdx < 0 || novoIdx >= paragrafos.length) return;

    const novos = [...paragrafos];
    [novos[idx], novos[novoIdx]] = [novos[novoIdx], novos[idx]];
    setParagrafos(novos.map((p, i) => ({ ...p, ordem: i + 1 })));
  };

  if (loading) return <div className="p-8 text-center">Carregando...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!documento) return null;

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Editar Documento</h1>
        <p className="text-muted-foreground">Atualize as informações do documento</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* === INFORMAÇÕES BÁSICAS === */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="titulo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="descricao" render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl><Textarea className="min-h-[100px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="pastaId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Pasta</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="">Raiz</SelectItem>
                      {pastas.map(p => (
                        <SelectItem key={p.id_pasta} value={String(p.id_pasta)}>
                          {p.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* === CONTEÚDO === */}
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paragrafos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum parágrafo</p>
              ) : (
                paragrafos.map((p, i) => (
                  <ParagrafoEditor
                    key={p.id}
                    paragrafo={p}
                    onUpdate={c => atualizarParagrafo(p.id, c)}
                    onDelete={() => removerParagrafo(p.id)}
                    onMoveUp={() => moverParagrafo(p.id, 'cima')}
                    onMoveDown={() => moverParagrafo(p.id, 'baixo')}
                    isFirst={i === 0}
                    isLast={i === paragrafos.length - 1}
                  />
                ))
              )}
              <SelecionarTipoParagrafo onSelect={adicionarParagrafo} />
            </CardContent>
          </Card>

          {/* === METADADOS === */}
          <Card>
            <CardHeader><CardTitle>Metadados</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="tipo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="procedimento">Procedimento</SelectItem>
                      <SelectItem value="registro-mapa">Registro MAPA</SelectItem>
                      <SelectItem value="exportacao">Exportação</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="nivelConformidade" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nível</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="critico">Crítico</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="baixo">Baixo</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="dataValidade" render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Validade</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant="outline" className={cn('w-full', !field.value && 'text-muted-foreground')}>
                          {field.value ? format(field.value, 'PPP', { locale: ptBR }) : 'Selecione'}
                          <CalendarIcon className="ml-auto h-4 w-4" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                  </Popover>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* === APROVAÇÃO === */}
          <Card>
            <CardHeader><CardTitle>Aprovação</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <FormField control={form.control} name="responsavelAprovacao" render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      {mockAprovadores.map(a => (
                        <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
              <FormField control={form.control} name="comentarioSubmissao" render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentário</FormLabel>
                  <FormControl><Textarea {...field} /></FormControl>
                </FormItem>
              )} />
            </CardContent>
          </Card>

          {/* === AÇÕES === */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}