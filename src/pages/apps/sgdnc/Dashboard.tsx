import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, AlertTriangle, GraduationCap, TrendingUp, Plus, BarChart3 } from 'lucide-react';
import { getKPIs, getDadosGrafico } from '@/pages/apps/sgdnc/services/sgdncMockData';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<any>(null);
  const [dadosNCs, setDadosNCs] = useState<any[]>([]);
  const [dadosDocs, setDadosDocs] = useState<any[]>([]);

  useEffect(() => {
    const carregarDados = async () => {
      const kpisData = await getKPIs();
      const ncsData = await getDadosGrafico('ncs-mes');
      const docsData = await getDadosGrafico('documentos-categoria');
      
      setKpis(kpisData);
      setDadosNCs(ncsData);
      setDadosDocs(docsData);
    };

    carregarDados();
  }, []);

  const kpiCards = [
    {
      title: 'Total de Documentos',
      value: kpis?.totalDocumentos || 0,
      icon: FileText,
      color: 'hsl(210 90% 45%)',
      trend: '+12%',
    },
    {
      title: 'NCs Abertas',
      value: kpis?.ncsAbertas || 0,
      icon: AlertTriangle,
      color: 'hsl(0 84% 60%)',
      badge: kpis?.ncsAbertas > 5 ? 'Atenção' : undefined,
    },
    {
      title: 'Treinamentos Pendentes',
      value: kpis?.treinamentosPendentes || 0,
      icon: GraduationCap,
      color: 'hsl(45 93% 47%)',
    },
    {
      title: 'Taxa de Retrabalho',
      value: `${kpis?.taxaRetrabalho || 0}%`,
      icon: TrendingUp,
      color: 'hsl(142 76% 36%)',
      trend: '-3%',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard SGDNC</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de Documentos e Não Conformidades
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/apps/sgdnc/documentos/novo')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Documento
          </Button>
          <Button onClick={() => navigate('/apps/sgdnc/nao-conformidades/nova')} variant="destructive">
            <Plus className="h-4 w-4 mr-2" />
            Registrar NC
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-5"
              style={{ background: `linear-gradient(135deg, ${kpi.color}, transparent)` }}
            />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              {kpi.trend && (
                <p className="text-xs text-muted-foreground mt-1">
                  {kpi.trend} em relação ao mês passado
                </p>
              )}
              {kpi.badge && (
                <span className="inline-block mt-2 px-2 py-1 text-xs bg-destructive/10 text-destructive rounded">
                  {kpi.badge}
                </span>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de NCs por Mês */}
        <Card>
          <CardHeader>
            <CardTitle>Não Conformidades por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dadosNCs}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="abertas" stroke="hsl(0 84% 60%)" name="Abertas" strokeWidth={2} />
                <Line type="monotone" dataKey="resolvidas" stroke="hsl(142 76% 36%)" name="Resolvidas" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Documentos por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosDocs}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="categoria" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(210 90% 45%)" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acesso Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
              onClick={() => navigate('/apps/sgdnc/documentos')}
            >
              <FileText className="h-6 w-6 mb-2" />
              <span className="font-semibold">Gerenciar Documentos</span>
              <span className="text-xs text-muted-foreground mt-1">
                Criar, editar e organizar documentos
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
              onClick={() => navigate('/apps/sgdnc/nao-conformidades')}
            >
              <AlertTriangle className="h-6 w-6 mb-2" />
              <span className="font-semibold">Visualizar NCs</span>
              <span className="text-xs text-muted-foreground mt-1">
                Acompanhar não conformidades abertas
              </span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex flex-col items-start"
              onClick={() => navigate('/apps/sgdnc/relatorios')}
            >
              <BarChart3 className="h-6 w-6 mb-2" />
              <span className="font-semibold">Gerar Relatórios</span>
              <span className="text-xs text-muted-foreground mt-1">
                Exportar relatórios para auditoria
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
