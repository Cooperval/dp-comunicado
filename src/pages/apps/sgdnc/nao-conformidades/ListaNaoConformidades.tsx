import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, Plus, Eye, Edit } from 'lucide-react';
import { getNaoConformidades, type NaoConformidade } from '@/services/sgdncMockData';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ListaNaoConformidades() {
  const navigate = useNavigate();
  const [ncs, setNcs] = useState<NaoConformidade[]>([]);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [severidadeFiltro, setSeveridadeFiltro] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, [statusFiltro, severidadeFiltro]);

  const carregarDados = async () => {
    setLoading(true);
    const data = await getNaoConformidades({
      status: statusFiltro || undefined,
      severidade: severidadeFiltro || undefined,
    });
    setNcs(data);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const cores: Record<string, string> = {
      aberta: 'hsl(0 84% 60%)',
      'em-analise': 'hsl(45 93% 47%)',
      resolvida: 'hsl(142 76% 36%)',
      fechada: 'hsl(215 16% 47%)',
    };
    return cores[status] || 'hsl(215 16% 47%)';
  };

  const getSeveridadeColor = (severidade: string) => {
    const cores: Record<string, string> = {
      critica: 'hsl(0 84% 60%)',
      alta: 'hsl(25 95% 53%)',
      media: 'hsl(45 93% 47%)',
      baixa: 'hsl(142 76% 36%)',
    };
    return cores[severidade] || 'hsl(215 16% 47%)';
  };

  const getDiasRestantes = (prazo: string) => {
    const dias = differenceInDays(new Date(prazo), new Date());
    if (dias < 0) return <span className="text-destructive">Vencido</span>;
    if (dias === 0) return <span className="text-warning">Hoje</span>;
    if (dias <= 2) return <span className="text-warning">{dias} dias</span>;
    return <span>{dias} dias</span>;
  };

  const ncsAbertas = ncs.filter((nc) => nc.status === 'aberta').length;
  const ncsEmAnalise = ncs.filter((nc) => nc.status === 'em-analise').length;
  const ncsResolvidas = ncs.filter(
    (nc) =>
      nc.status === 'resolvida' &&
      new Date(nc.resolvidoEm || '').getMonth() === new Date().getMonth()
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Não Conformidades</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e acompanhe não conformidades
          </p>
        </div>
        <Button onClick={() => navigate('/apps/sgdnc/nao-conformidades/nova')} variant="destructive">
          <Plus className="h-4 w-4 mr-2" />
          Registrar NC
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">NCs Abertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{ncsAbertas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'hsl(45 93% 47%)' }}>
              {ncsEmAnalise}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolvidas Este Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: 'hsl(142 76% 36%)' }}>
              {ncsResolvidas}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ncs.length > 0 ? Math.round((ncsResolvidas / ncs.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os status</SelectItem>
                <SelectItem value="aberta">Aberta</SelectItem>
                <SelectItem value="em-analise">Em Análise</SelectItem>
                <SelectItem value="resolvida">Resolvida</SelectItem>
                <SelectItem value="fechada">Fechada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severidadeFiltro} onValueChange={setSeveridadeFiltro}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Todas as severidades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todas as severidades</SelectItem>
                <SelectItem value="critica">Crítica</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Carregando NCs...</p>
        </div>
      ) : ncs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma NC encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {statusFiltro || severidadeFiltro
                ? 'Tente ajustar os filtros'
                : 'Nenhuma não conformidade registrada'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left p-4 font-medium">ID</th>
                    <th className="text-left p-4 font-medium">Título</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Severidade</th>
                    <th className="text-left p-4 font-medium">Responsável</th>
                    <th className="text-left p-4 font-medium">Data</th>
                    <th className="text-left p-4 font-medium">Prazo</th>
                    <th className="text-right p-4 font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {ncs.map((nc) => (
                    <tr key={nc.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        <span className="font-mono text-sm">{nc.codigo}</span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{nc.titulo}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {nc.tipo}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          style={{
                            backgroundColor: `${getStatusColor(nc.status)}20`,
                            color: getStatusColor(nc.status),
                            borderColor: getStatusColor(nc.status),
                          }}
                        >
                          {nc.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          style={{
                            backgroundColor: `${getSeveridadeColor(nc.severidade)}20`,
                            color: getSeveridadeColor(nc.severidade),
                            borderColor: getSeveridadeColor(nc.severidade),
                          }}
                        >
                          {nc.severidade}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm">{nc.responsavel}</td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {format(new Date(nc.dataOcorrencia), 'dd/MM/yy', { locale: ptBR })}
                      </td>
                      <td className="p-4 text-sm">{getDiasRestantes(nc.prazo)}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              navigate(`/apps/sgdnc/nao-conformidades/${nc.id}`)
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              navigate(`/apps/sgdnc/nao-conformidades/${nc.id}/editar`)
                            }
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
