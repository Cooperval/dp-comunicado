import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertTriangle, Plus, Eye, Edit, Paperclip, CalendarIcon, X } from 'lucide-react';
import { getNaoConformidades, type NaoConformidade } from '@/pages/apps/sgdnc/services/sgdncMockData';
import { format, differenceInDays, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ListaNaoConformidades() {
  const navigate = useNavigate();
  const [ncs, setNcs] = useState<NaoConformidade[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [severidadeFiltro, setSeveridadeFiltro] = useState('todas');
  const [departamentoFiltro, setDepartamentoFiltro] = useState('todos');
  const [dataInicio, setDataInicio] = useState<Date | undefined>();
  const [dataFim, setDataFim] = useState<Date | undefined>();

  useEffect(() => {
    carregarDados();
  }, [statusFiltro, severidadeFiltro, departamentoFiltro, dataInicio, dataFim]);

  const carregarDados = async () => {
    setLoading(true);
    let data = await getNaoConformidades({
      status: statusFiltro !== 'todos' ? statusFiltro : undefined,
      severidade: severidadeFiltro !== 'todas' ? severidadeFiltro : undefined,
    });

    // Filtro adicional por departamento
    if (departamentoFiltro && departamentoFiltro !== 'todos') {
      data = data.filter((nc) => nc.departamento === departamentoFiltro);
    }

    // Filtro por período
    if (dataInicio && dataFim) {
      data = data.filter((nc) =>
        isWithinInterval(new Date(nc.dataOcorrencia), {
          start: dataInicio,
          end: dataFim,
        })
      );
    }

    setNcs(data);
    setLoading(false);
  };

  const limparFiltros = () => {
    setStatusFiltro('todos');
    setSeveridadeFiltro('todas');
    setDepartamentoFiltro('todos');
    setDataInicio(undefined);
    setDataFim(undefined);
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
    if (dias < 0)
      return (
        <span className="text-destructive font-semibold">
          Vencido há {Math.abs(dias)} dias
        </span>
      );
    if (dias === 0) return <span className="text-warning font-semibold">Vence Hoje!</span>;
    if (dias <= 2)
      return (
        <span className="text-warning font-semibold">
          {dias} {dias === 1 ? 'dia' : 'dias'}
        </span>
      );
    if (dias <= 7) return <span className="font-medium">{dias} dias</span>;
    return <span className="text-muted-foreground">{dias} dias</span>;
  };

  const handleAnexarEvidencia = (ncId: string) => {
    toast.info('Funcionalidade de anexar evidência em desenvolvimento');
  };

  // KPIs
  const ncsAbertas = ncs.filter((nc) => nc.status === 'aberta').length;
  const ncsEmAnalise = ncs.filter((nc) => nc.status === 'em-analise').length;
  const ncsResolvidasMes = ncs.filter(
    (nc) =>
      nc.status === 'resolvida' &&
      nc.resolvidoEm &&
      new Date(nc.resolvidoEm).getMonth() === new Date().getMonth() &&
      new Date(nc.resolvidoEm).getFullYear() === new Date().getFullYear()
  ).length;
  const ncsTotal = ncs.length;
  const taxaResolucao = ncsTotal > 0 ? Math.round((ncsResolvidasMes / ncsTotal) * 100) : 0;

  const departamentos = Array.from(new Set(ncs.map((nc) => nc.departamento)));

  const filtrosAtivos =
    [
      statusFiltro !== 'todos' ? statusFiltro : null,
      severidadeFiltro !== 'todas' ? severidadeFiltro : null,
      departamentoFiltro !== 'todos' ? departamentoFiltro : null,
      dataInicio,
      dataFim,
    ].filter(Boolean).length;

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
            <div className="text-3xl font-bold text-destructive">{ncsAbertas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Em Análise</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: 'hsl(45 93% 47%)' }}>
              {ncsEmAnalise}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resolvidas Este Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold" style={{ color: 'hsl(142 76% 36%)' }}>
              {ncsResolvidasMes}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{taxaResolucao}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Filtros</h3>
              {filtrosAtivos > 0 && (
                <Button variant="ghost" size="sm" onClick={limparFiltros}>
                  <X className="h-3 w-3 mr-1" />
                  Limpar ({filtrosAtivos})
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status */}
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="aberta">Aberta</SelectItem>
                  <SelectItem value="em-analise">Em Análise</SelectItem>
                  <SelectItem value="resolvida">Resolvida</SelectItem>
                  <SelectItem value="fechada">Fechada</SelectItem>
                </SelectContent>
              </Select>

              {/* Severidade */}
              <Select value={severidadeFiltro} onValueChange={setSeveridadeFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Severidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as severidades</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>

              {/* Departamento */}
              <Select value={departamentoFiltro} onValueChange={setDepartamentoFiltro}>
                <SelectTrigger>
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os departamentos</SelectItem>
                  {departamentos.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Período */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio && dataFim ? (
                      <>
                        {format(dataInicio, 'dd/MM', { locale: ptBR })} -{' '}
                        {format(dataFim, 'dd/MM', { locale: ptBR })}
                      </>
                    ) : (
                      <span>Período</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 space-y-2">
                    <div>
                      <label className="text-xs font-medium">Data Início</label>
                      <Calendar
                        mode="single"
                        selected={dataInicio}
                        onSelect={setDataInicio}
                        className="pointer-events-auto"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Data Fim</label>
                      <Calendar
                        mode="single"
                        selected={dataFim}
                        onSelect={setDataFim}
                        disabled={(date) => (dataInicio ? date < dataInicio : false)}
                        className="pointer-events-auto"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
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
              {filtrosAtivos > 0
                ? 'Tente ajustar os filtros'
                : 'Nenhuma não conformidade registrada'}
            </p>
            {filtrosAtivos > 0 && (
              <Button variant="outline" onClick={limparFiltros}>
                Limpar Filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium text-xs uppercase">ID</th>
                    <th className="text-left p-4 font-medium text-xs uppercase">Título</th>
                    <th className="text-left p-4 font-medium text-xs uppercase">Status</th>
                    <th className="text-left p-4 font-medium text-xs uppercase">Severidade</th>
                    <th className="text-left p-4 font-medium text-xs uppercase">Responsável</th>
                    <th className="text-left p-4 font-medium text-xs uppercase">Data Abertura</th>
                    <th className="text-left p-4 font-medium text-xs uppercase">Prazo</th>
                    <th className="text-right p-4 font-medium text-xs uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {ncs.map((nc) => (
                    <tr key={nc.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-4">
                        <span className="font-mono text-sm font-medium">{nc.codigo}</span>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{nc.titulo}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {nc.tipo}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          className="capitalize"
                          style={{
                            backgroundColor: `${getStatusColor(nc.status)}20`,
                            color: getStatusColor(nc.status),
                            borderColor: getStatusColor(nc.status),
                          }}
                        >
                          {nc.status.replace('-', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge
                          className="capitalize"
                          style={{
                            backgroundColor: `${getSeveridadeColor(nc.severidade)}20`,
                            color: getSeveridadeColor(nc.severidade),
                            borderColor: getSeveridadeColor(nc.severidade),
                          }}
                        >
                          {nc.severidade}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="text-sm font-medium">{nc.responsavel}</p>
                          <p className="text-xs text-muted-foreground">{nc.departamento}</p>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {format(new Date(nc.dataOcorrencia), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="p-4 text-sm">{getDiasRestantes(nc.prazo)}</td>
                      <td className="p-4">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              navigate(`/apps/sgdnc/nao-conformidades/${nc.id}`)
                            }
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              navigate(`/apps/sgdnc/nao-conformidades/${nc.id}/editar`)
                            }
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleAnexarEvidencia(nc.id)}
                            title="Anexar Evidência"
                          >
                            <Paperclip className="h-4 w-4" />
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
