import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Clock, CheckCircle2, XCircle, Plus, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { mockAPI } from '@/services/mockData';

export default function AvaliacaoDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRH = user?.department === 'RH';
  const [stats, setStats] = useState({
    total: 0,
    pendentes: 0,
    concluidas: 0,
    atrasadas: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      const data = await mockAPI.getAvaliacoesStats();
      setStats({ ...data, atrasadas: 0 });
      setLoading(false);
    };
    loadStats();
  }, [user?.id, isRH]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Avaliações</h1>
            <p className="text-muted-foreground mt-1">
              Carregando dados...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {isRH ? 'Gestão de Avaliações' : 'Minhas Avaliações'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isRH
              ? 'Gerencie as avaliações de jovens aprendizes'
              : 'Avalie seus jovens aprendizes'}
          </p>
        </div>
        {isRH && (
          <Button onClick={() => navigate('/apps/avaliacao/nova')}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Avaliação
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRH ? 'Total de Avaliações' : 'Avaliações Atribuídas'}
            </CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isRH ? 'Cadastradas no sistema' : 'Para você realizar'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendentes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando conclusão
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.concluidas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avaliações finalizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.atrasadas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Prazo vencido
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate('/apps/avaliacao/lista')}
          >
            <List className="h-4 w-4 mr-2" />
            Ver {isRH ? 'Todas as' : 'Minhas'} Avaliações
          </Button>
          {!isRH && stats.pendentes > 0 && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Você possui <strong>{stats.pendentes}</strong> avaliação(ões) pendente(s).
                Acesse a lista para realizar as avaliações.
              </p>
            </div>
          )}
          {isRH && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {stats.atrasadas > 0 ? (
                  <>
                    <strong className="text-red-500">{stats.atrasadas}</strong> avaliação(ões)
                    estão atrasadas. Entre em contato com os gestores responsáveis.
                  </>
                ) : (
                  'Todas as avaliações estão em dia. Continue monitorando o progresso.'
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
