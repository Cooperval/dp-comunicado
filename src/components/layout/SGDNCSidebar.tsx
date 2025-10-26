import {
  LayoutDashboard,
  FolderOpen,
  AlertTriangle,
  GraduationCap,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
import { Button } from '@/components/ui/button';

export function SGDNCSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/apps/sgdnc' },
    { icon: FolderOpen, label: 'Documentos', path: '/apps/sgdnc/documentos' },
    { icon: AlertTriangle, label: 'Não Conformidades', path: '/apps/sgdnc/nao-conformidades' },
    { icon: GraduationCap, label: 'Treinamentos', path: '/apps/sgdnc/treinamentos' },
    { icon: BarChart3, label: 'Relatórios', path: '/apps/sgdnc/relatorios' },
    { icon: Settings, label: 'Configurações', path: '/apps/sgdnc/configuracoes' },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border p-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-sm font-semibold text-foreground">SGDNC</h2>
              <p className="text-xs text-muted-foreground">Documentos & Conformidade</p>
            </div>
          </div>
        )}
        {isCollapsed && <FolderOpen className="h-6 w-6 text-primary mx-auto" />}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton onClick={() => navigate(item.path)} tooltip={item.label}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.department}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        ) : (
          <Button variant="ghost" size="icon" onClick={handleLogout} className="mx-auto">
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
