import { useNavigate } from 'react-router-dom';
import { Users, Shield, Layers } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { mockAPI } from '@/services/mockData';
import { applications } from '@/config/applications';

export default function Dashboard() {
  const navigate = useNavigate();
  const [totalUsers, setTotalUsers] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      const users = await mockAPI.getUsuarios();
      setTotalUsers(users.length);
      setActiveUsers(users.filter((u: any) => u.active).length);
    };
    loadStats();
  }, []);

  const activeApps = applications.filter(app => app.status === 'active').length;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Painel Administrativo</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Gerencie usuários e configurações do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Com acesso liberado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Apps Disponíveis</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeApps}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Aplicações ativas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>
            Adicione, edite ou remova usuários e gerencie suas permissões de acesso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate('/apps/admin/usuarios')} size="lg">
            <Users className="mr-2 h-4 w-4" />
            Gerenciar Usuários
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
