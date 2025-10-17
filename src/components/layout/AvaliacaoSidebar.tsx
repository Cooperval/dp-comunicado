import { Home, ClipboardCheck, Plus, List } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function AvaliacaoSidebar() {
  const { user } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const isRH = user?.department === 'RH';

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-4">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="w-full justify-start"
          >
            <NavLink to="/portal">
              <Home className="h-4 w-4" />
              {!isCollapsed && <span className="ml-2">Voltar ao Portal</span>}
            </NavLink>
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Avaliação de Aprendizes</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/apps/avaliacao" end>
                    <ClipboardCheck className="h-4 w-4" />
                    <span>Dashboard</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {isRH && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/apps/avaliacao/nova">
                      <Plus className="h-4 w-4" />
                      <span>Nova Avaliação</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/apps/avaliacao/lista">
                    <List className="h-4 w-4" />
                    <span>{isRH ? 'Todas as Avaliações' : 'Minhas Avaliações'}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!isCollapsed && (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            Sistema de Avaliação
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
