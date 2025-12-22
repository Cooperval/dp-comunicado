import { useAuth } from '@/contexts/AuthContext';
import { AppCard } from '@/components/portal/AppCard';
import { applications } from '@/config/applications';

export default function Portal() {
  const { user, acessos } = useAuth();

  //console.log('user', user);
  
  //console.log('acessos', acessos);

  // Filter applications based on user access
  const accessibleApps = applications.filter((app) => {
    if (!app.cod_modulo) return false; // Skip apps without cod_modulo
    const access = acessos.find((acesso) => acesso.COD_MODULO === app.cod_modulo);
    return access && ['A', 'S', 'G', 'U'].includes(access.TIPO_ACESSO);
  });

    //console.log('accessibleApps', accessibleApps);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold text-foreground">
          Olá, {user?.name?.split(' ')[0] || 'Colaborador'}! 👋
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Bem-vindo ao Portal do Colaborador. Escolha uma aplicação abaixo para começar.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accessibleApps.map((app) => (
          <AppCard
            key={app.id}
            name={app.name}
            description={app.description}
            icon={app.icon}
            route={app.route}
            status={app.status}
            color={app.color}
          />
        ))}
      </div>

      <div className="mt-8 p-6 rounded-lg bg-card border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Precisa de ajuda?
        </h2>
        <p className="text-muted-foreground">
          Entre em contato com o suporte através do email{' '}
          <a href="mailto:fasilva@cooperval.coop.br" className="text-primary hover:underline">
            fasilva@cooperval.coop.br
          </a>{' '}
          ou ramal 9899 ou 9299.
        </p>
      </div>
    </div>
  );
}