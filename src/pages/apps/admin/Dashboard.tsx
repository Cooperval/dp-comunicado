import { useNavigate } from 'react-router-dom';
import { Users, Shield, Layers } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Aplicações Disponíveis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications
            .filter(app => !app.adminOnly)
            .map((app) => {
              const Icon = app.icon;
              return (
                <Card
                  key={app.id}
                  className={`relative overflow-hidden transition-all duration-300 ${
                    app.status === 'active'
                      ? 'cursor-pointer hover:scale-105 hover:shadow-md'
                      : 'opacity-60'
                  }`}
                  onClick={() => app.status === 'active' && app.route && navigate(app.route)}
                >
                  <div
                    className="absolute inset-0 opacity-5"
                    style={{ background: `linear-gradient(135deg, ${app.color}, transparent)` }}
                  />
                  
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-lg"
                        style={{ backgroundColor: app.color, opacity: 0.9 }}
                      >
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      {app.status === 'coming-soon' && (
                        <Badge variant="secondary" className="text-xs">
                          Em breve
                        </Badge>
                      )}
                      {app.status === 'active' && (
                        <Badge variant="default" className="text-xs">
                          Ativo
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-4">{app.name}</CardTitle>
                    <CardDescription>{app.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="relative">
                    {app.status === 'active' && (
                      <p className="text-sm text-primary font-medium">
                        Acessar aplicação →
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
}
