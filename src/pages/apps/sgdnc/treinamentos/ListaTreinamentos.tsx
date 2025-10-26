import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, Eye, CheckCircle, FileDown } from 'lucide-react';
import { getTreinamentos, type Treinamento } from '@/services/sgdncMockData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/hooks/use-toast';

export default function ListaTreinamentos() {
  const navigate = useNavigate();
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  useEffect(() => {
    const carregarTreinamentos = async () => {
      try {
        const data = await getTreinamentos();
        setTreinamentos(data);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os treinamentos.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    carregarTreinamentos();
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'agendado':
        return 'pending';
      case 'em-andamento':
        return 'pending';
      case 'concluido':
        return 'approved';
      default:
        return 'draft';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'agendado': 'Agendado',
      'em-andamento': 'Em Andamento',
      'concluido': 'Concluído',
    };
    return labels[status] || status;
  };

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'leitura-documento': 'Leitura de Documento',
      'pratico': 'Treinamento Prático',
      'video': 'Vídeo',
      'presencial': 'Presencial',
    };
    return labels[tipo] || tipo;
  };

  const treinamentosFiltrados = treinamentos.filter((t) => {
    const matchStatus = filtroStatus === 'todos' || t.status === filtroStatus;
    const matchTipo = filtroTipo === 'todos' || t.tipo === filtroTipo;
    return matchStatus && matchTipo;
  });

  const handleConfirmarLeitura = (id: string) => {
    toast({
      title: 'Confirmação registrada',
      description: 'Sua leitura foi confirmada com sucesso.',
    });
  };

  const handleGerarRelatorio = (id: string) => {
    toast({
      title: 'Gerando relatório',
      description: 'O relatório será baixado em instantes.',
    });
  };

  const getConfirmacoesPendentes = (t: Treinamento) => {
    return t.participantes.length - t.confirmacoes.length;
  };

  const getInitials = (nome: string) => {
    return nome
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Treinamentos</h1>
          <p className="text-muted-foreground">
            Gerencie treinamentos e confirmações de leitura
          </p>
        </div>
        <Button onClick={() => navigate('/apps/sgdnc/treinamentos/novo')}>
          <Plus className="h-4 w-4" />
          Novo Treinamento
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="agendado">Agendado</SelectItem>
                  <SelectItem value="em-andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  <SelectItem value="leitura-documento">
                    Leitura de Documento
                  </SelectItem>
                  <SelectItem value="pratico">Treinamento Prático</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Participantes</TableHead>
                <TableHead>Confirmações Pendentes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {treinamentosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum treinamento encontrado
                  </TableCell>
                </TableRow>
              ) : (
                treinamentosFiltrados.map((treinamento) => {
                  const pendentes = getConfirmacoesPendentes(treinamento);
                  
                  return (
                    <TableRow key={treinamento.id}>
                      <TableCell className="font-medium">
                        {treinamento.titulo}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTipoLabel(treinamento.tipo)}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(treinamento.data), 'dd/MM/yyyy', {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {treinamento.participantes.slice(0, 3).map((participante, idx) => (
                              <Avatar key={idx} className="h-8 w-8 border-2 border-background">
                                <AvatarFallback className="text-xs">
                                  {getInitials(participante)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          {treinamento.participantes.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{treinamento.participantes.length - 3}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">
                            ({treinamento.participantes.length})
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {pendentes > 0 ? (
                          <Badge variant="outline" className="bg-warning/10 text-warning">
                            {pendentes} pendente{pendentes !== 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-accent/10 text-accent">
                            Completo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge variant={getStatusVariant(treinamento.status)}>
                          {getStatusLabel(treinamento.status)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              navigate(`/apps/sgdnc/treinamentos/${treinamento.id}`)
                            }
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleConfirmarLeitura(treinamento.id)}
                            title="Confirmar Leitura"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleGerarRelatorio(treinamento.id)}
                            title="Gerar Relatório"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Treinamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{treinamentos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agendados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {treinamentos.filter((t) => t.status === 'agendado').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {treinamentos.filter((t) => t.status === 'em-andamento').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {treinamentos.filter((t) => t.status === 'concluido').length}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
