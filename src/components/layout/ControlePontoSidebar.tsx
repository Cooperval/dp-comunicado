import { 
  LayoutDashboard, 
  Plus, 
  List, 
  Users, 
  FileText, 
  Settings,
  ArrowLeft,
  Clock
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
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

const menuItems = [
  {
    title: 'Dashboard',
    url: '/apps/controle-ponto',
    icon: LayoutDashboard,
  },
  {
    title: 'Nova Ocorrência',
    url: '/apps/controle-ponto/ocorrencia',
    icon: Plus,
  },
  {
    title: 'Ocorrências',
    url: '/apps/controle-ponto/ocorrencias',
    icon: List,
  },
  {
    title: 'Colaboradores',
    url: '/apps/controle-ponto/colaboradores',
    icon: Users,
  },
  {
    title: 'Relatórios',
    url: '/apps/controle-ponto/relatorios',
    icon: FileText,
  },
  {
    title: 'Configurações',
    url: '/apps/controle-ponto/configuracoes',
    icon: Settings,
  },
];

export function ControlePontoSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Clock className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground">
                Controle de Ponto
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/portal">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Voltar ao Portal</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === '/apps/controle-ponto'}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground">
            Sistema de Gestão de Ocorrências
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
