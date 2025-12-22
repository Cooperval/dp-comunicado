import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, FileDown, X, Plus, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';
import { getNaoConformidadeById, addAcaoCorretiva, type NaoConformidade, type AcaoCorretiva, type LogAlteracao } from '@/pages/apps/sgdnc/services/sgdncMockData';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function DetalhesNC() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nc, setNc] = useState<NaoConformidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [novoComentario, setNovoComentario] = useState('');
  const [dialogAcaoAberto, setDialogAcaoAberto] = useState(false);
  const [novaAcao, setNovaAcao] = useState({
    descricao: '',
    responsavel: '',
    prazo: '',
  });

  useEffect(() => {
    const carregarNC = async () => {
      if (!id) return;
      try {
        const data = await getNaoConformidadeById(id);
        setNc(data);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados da NC.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    carregarNC();
  }, [id]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'aberta':
        return 'rejected';
      case 'em-analise':
        return 'pending';
      case 'resolvida':
        return 'approved';
      case 'fechada':
        return 'draft';
      default:
        return 'draft';
    }
  };

  const getSeveridadeVariant = (severidade: string) => {
    switch (severidade) {
      case 'critica':
        return 'urgent';
      case 'alta':
        return 'rejected';
      case 'media':
        return 'pending';
      case 'baixa':
        return 'draft';
      default:
        return 'draft';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'aberta': 'Aberta',
      'em-analise': 'Em Análise',
      'resolvida': 'Resolvida',
      'fechada': 'Fechada',
    };
    return labels[status] || status;
  };

  const getSeveridadeLabel = (severidade: string) => {
    const labels: Record<string, string> = {
      'critica': 'Crítica',
      'alta': 'Alta',
      'media': 'Média',
      'baixa': 'Baixa',
    };
    return labels[severidade] || severidade;
  };

  const handleAdicionarAcao = async () => {
    if (!id || !novaAcao.descricao || !novaAcao.responsavel || !novaAcao.prazo) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const acao: AcaoCorretiva = {
        id: `AC-${Date.now()}`,
        descricao: novaAcao.descricao,
        responsavel: novaAcao.responsavel,
        status: 'planejada',
        dataPrevista: novaAcao.prazo,
      };

      await addAcaoCorretiva(id, acao);
      
      // Recarregar NC
      const data = await getNaoConformidadeById(id);
      setNc(data);

      setDialogAcaoAberto(false);
      setNovaAcao({ descricao: '', responsavel: '', prazo: '' });
      
      toast({
        title: 'Sucesso',
        description: 'Ação corretiva adicionada.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar a ação corretiva.',
        variant: 'destructive',
      });
    }
  };

  const handleAdicionarComentario = () => {
    if (!novoComentario.trim()) return;

    toast({
      title: 'Comentário adicionado',
      description: 'Seu comentário foi registrado no histórico.',
    });
    setNovoComentario('');
  };

  const handleFecharNC = () => {
    toast({
      title: 'NC Fechada',
      description: 'A não conformidade foi fechada com sucesso.',
    });
  };

  const handleGerarRelatorio = () => {
    toast({
      title: 'Gerando relatório',
      description: 'O relatório será baixado em instantes.',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!nc) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">NC não encontrada</h2>
          <Button onClick={() => navigate('/apps/sgdnc/nao-conformidades')}>
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/apps/sgdnc/nao-conformidades')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{nc.id}</h1>
              <StatusBadge variant={getStatusVariant(nc.status)}>
                {getStatusLabel(nc.status)}
              </StatusBadge>
              <StatusBadge variant={getSeveridadeVariant(nc.severidade)}>
                {getSeveridadeLabel(nc.severidade)}
              </StatusBadge>
            </div>
            <p className="text-lg text-muted-foreground">{nc.titulo}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/apps/sgdnc/nao-conformidades/${id}/editar`)}
          >
            <Edit className="h-4 w-4" />
            Editar
          </Button>
          <Button variant="outline" onClick={handleGerarRelatorio}>
            <FileDown className="h-4 w-4" />
            Gerar Relatório
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <X className="h-4 w-4" />
                Fechar NC
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Fechar Não Conformidade</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja fechar esta NC? Esta ação não poderá ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleFecharNC}>
                  Confirmar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="acoes">Ações Corretivas</TabsTrigger>
          <TabsTrigger value="evidencias">Evidências</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* Tab 1: Informações */}
        <TabsContent value="info" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Não Conformidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Tipo de Desvio</Label>
                  <p className="font-medium">{nc.tipo}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Departamento</Label>
                  <p className="font-medium">{nc.departamento}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Data de Ocorrência</Label>
                  <p className="font-medium">
                    {format(new Date(nc.dataOcorrencia), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Local</Label>
                  <p className="font-medium">{nc.local}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Responsável</Label>
                  <p className="font-medium">{nc.responsavel}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Prazo</Label>
                  <p className="font-medium">
                    {format(new Date(nc.prazo), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-muted-foreground">Descrição</Label>
                <p className="mt-1">{nc.descricao}</p>
              </div>

              {nc.causaRaiz && (
                <div>
                  <Label className="text-muted-foreground">Causa Raiz</Label>
                  <p className="mt-1">{nc.causaRaiz}</p>
                </div>
              )}

              {nc.produtoLote && (
                <div>
                  <Label className="text-muted-foreground">Produto/Lote Afetado</Label>
                  <p className="mt-1">{nc.produtoLote}</p>
                </div>
              )}

              {nc.impactos && nc.impactos.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Impactos</Label>
                  <div className="flex gap-2 mt-1">
                    {nc.impactos.map((impacto) => (
                      <Badge key={impacto} variant="outline">
                        {impacto}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline de Status */}
          <Card>
            <CardHeader>
              <CardTitle>Timeline de Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-2 top-0 h-full w-0.5 bg-border" />
                <div className="space-y-6">
                  {['aberta', 'em-analise', 'resolvida', 'fechada'].map((status, index) => {
                    const isCompleted = ['aberta', 'em-analise', 'resolvida', 'fechada'].indexOf(nc.status) >= index;
                    const isCurrent = nc.status === status;
                    
                    return (
                      <div key={status} className="flex items-start gap-4 relative">
                        <div
                          className={`relative z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                            isCompleted
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground bg-background'
                          }`}
                        >
                          {isCompleted && (
                            <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium ${isCurrent ? 'text-primary' : ''}`}>
                            {getStatusLabel(status)}
                          </p>
                          {isCurrent && (
                            <p className="text-sm text-muted-foreground">Status atual</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Ações Corretivas */}
        <TabsContent value="acoes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Ações Corretivas</h3>
            <Dialog open={dialogAcaoAberto} onOpenChange={setDialogAcaoAberto}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
                  Adicionar Ação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Ação Corretiva</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova ação corretiva para esta NC.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição*</Label>
                    <Textarea
                      id="descricao"
                      placeholder="Descreva a ação corretiva..."
                      value={novaAcao.descricao}
                      onChange={(e) =>
                        setNovaAcao({ ...novaAcao, descricao: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsavel">Responsável*</Label>
                    <Select
                      value={novaAcao.responsavel}
                      onValueChange={(value) =>
                        setNovaAcao({ ...novaAcao, responsavel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o responsável" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="João Silva">João Silva</SelectItem>
                        <SelectItem value="Maria Santos">Maria Santos</SelectItem>
                        <SelectItem value="Carlos Oliveira">Carlos Oliveira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prazo">Data Prevista*</Label>
                    <Input
                      id="prazo"
                      type="date"
                      value={novaAcao.prazo}
                      onChange={(e) =>
                        setNovaAcao({ ...novaAcao, prazo: e.target.value })
                      }
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogAcaoAberto(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleAdicionarAcao}>Adicionar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {nc.acoesCorretivas && nc.acoesCorretivas.length > 0 ? (
              nc.acoesCorretivas.map((acao) => (
                <Card key={acao.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <p className="font-medium mb-2">{acao.descricao}</p>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Responsável: {acao.responsavel}</span>
                          <span>
                            Data prevista:{' '}
                            {format(new Date(acao.dataPrevista), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })}
                          </span>
                          {acao.dataRealizada && (
                            <span>
                              Data realizada:{' '}
                              {format(new Date(acao.dataRealizada), 'dd/MM/yyyy', {
                                locale: ptBR,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusBadge
                        variant={
                          acao.status === 'concluida'
                            ? 'approved'
                            : acao.status === 'em-andamento'
                            ? 'pending'
                            : 'draft'
                        }
                      >
                        {acao.status === 'concluida'
                          ? 'Concluída'
                          : acao.status === 'em-andamento'
                          ? 'Em Andamento'
                          : 'Pendente'}
                      </StatusBadge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Nenhuma ação corretiva registrada ainda.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Evidências */}
        <TabsContent value="evidencias" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Evidências</h3>
            <Button>
              <Plus className="h-4 w-4" />
              Adicionar Evidência
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {nc.evidencias && nc.evidencias.length > 0 ? (
              nc.evidencias.map((evidencia) => (
                <Card key={evidencia.id} className="overflow-hidden">
                  <div className="aspect-square bg-muted flex items-center justify-center">
                    {evidencia.tipo === 'imagem' ? (
                      <img
                        src={evidencia.url}
                        alt={evidencia.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileDown className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium truncate">{evidencia.nome}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(evidencia.tamanho / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <div className="flex gap-1 mt-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center text-muted-foreground">
                  Nenhuma evidência anexada ainda.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Tab 4: Histórico */}
        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Log de Alterações</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {nc.historico && nc.historico.length > 0 ? (
                    nc.historico.map((log) => (
                      <div key={log.id} className="flex gap-3 pb-4 border-b last:border-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{log.usuario}</p>
                          <p className="text-sm text-muted-foreground">{log.descricao}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(log.data), "dd/MM/yyyy 'às' HH:mm", {
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      Nenhum registro no histórico.
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adicionar Comentário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Digite seu comentário..."
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                rows={4}
              />
              <Button onClick={handleAdicionarComentario}>Adicionar Comentário</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
