import { Home, LogOut, User } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { applications } from '@/config/applications';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo-4.png';

export function PortalSidebar() {
  const { user, logout, acessos } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  // Filter applications based on user access
  const accessibleApps = applications.filter((app) => {
    if (!app.cod_modulo) return false; // Skip apps without cod_modulo
    const access = acessos.find((acesso) => acesso.COD_MODULO === app.cod_modulo);
    return access && ['A', 'S'].includes(access.TIPO_ACESSO);
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-6 border-b border-border">
          <h2 className="transition-smooth text-xl">
            <img src={logo} alt="Cooperval" className="h-15 object-contain" />
          </h2>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/portal" end>
                    <Home className="h-4 w-4" />
                    <span>Início</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Aplicações</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accessibleApps.map((app) => (
                <SidebarMenuItem key={app.id}>
                  <SidebarMenuButton
                    asChild={app.status === 'active'}
                    disabled={app.status === 'coming-soon'}
                    className={app.status === 'coming-soon' ? 'opacity-50' : ''}
                  >
                    {app.status === 'active' && app.route ? (
                      <NavLink to={app.route}>
                        <app.icon className="h-4 w-4" />
                        <span>{app.name}</span>
                      </NavLink>
                    ) : (
                      <div>
                        <app.icon className="h-4 w-4" />
                        <span>{app.name}</span>
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!isCollapsed && user && (
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {user.name}
                </span>
                
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        )}
        {isCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}