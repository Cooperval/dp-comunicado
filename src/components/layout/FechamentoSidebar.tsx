import { User, Users, Settings, BarChart3, Leaf, LogOut, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/pages/apps/fechamento/types";
import logo from '@/assets/logo-4.png';
import { useAuth } from "@/contexts/AuthContext";
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { NavLink } from 'react-router-dom';



export const FechamentoSidebar = () => {
  const { acessos, user, logout } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";


  const menuItems = [
    { id: 'dashboard', title: 'Dashboard', icon: BarChart3  },
    { id: 'projects', title: 'Projetos', icon: Leaf  },
    { id: 'team', title: 'Equipe', icon: Users },
    { id: 'settings', title: 'Configurações', icon: Settings },
  ];

  // --- lógica de permissões para o MÓDULO 13 ---
  const modulo17 = Array.isArray(acessos)
    ? acessos.find((a: any) => Number(a.COD_MODULO) === 17)
    : null;

  const tipo = modulo17?.TIPO_ACESSO?.toString()?.toUpperCase() || null;

  const hasFullAccess = tipo === "A" || tipo === "G";
  const hasLimitedAccess = tipo === "S" || tipo === "U";

  const limitedIds = ['projects'];



  // Filtra itens a partir da regra acima
  const allowedMenuItems = hasFullAccess
    ? menuItems
    : hasLimitedAccess
      ? menuItems.filter((it) => limitedIds.includes(it.id))
      : [];


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
              {allowedMenuItems.length === 0 ? (
                // Se quiser esconder completamente, só remova este bloco e não renderize nada.
                <SidebarMenuItem>
                  <div className="px-4 py-3 text-sm text-muted-foreground">
                    Acesso restrito.
                  </div>
                </SidebarMenuItem>
              ) : (
                allowedMenuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/apps/fechamento"}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
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
};