import logo from '@/assets/logo-4.png';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarFooter,
} from '@/components/ui/sidebar';

import {
  Factory,
  DollarSign,
  Calculator,
  FileText,
  LineChart,
  ArrowLeft,
  LogOut,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GiCorn } from "react-icons/gi";
import { PiShieldCheckBold } from "react-icons/pi";
import { PiMathOperationsBold } from "react-icons/pi";
import { GiSugarCane } from "react-icons/gi";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from '@/components/ui/button';

const menuItems = [
  {
    title: 'Cotações de Mercado',
    url: '/apps/simulador-cenarios/cotacoes',
    icon: LineChart,
  },
  // {
  //   title: 'Premissas da Operação',
  //   url: '/operation-premises',
  //   icon: Settings,
  // },
  {
    title: 'Premissas da Cana',
    url: '/apps/simulador-cenarios/sugarcane-premises',
    icon: GiSugarCane,
  },
  {
    title: 'Premissas da Milho',
    url: '/apps/simulador-cenarios/corn-premises',
    icon: GiCorn,
  },
  {
    title: 'Outras Produções',
    url: '/apps/simulador-cenarios/other-productions',
    icon: Factory,
  },
  // {
  //   title: 'Comercialização',
  //   url: '/commercialization',
  //   icon: ShoppingCart,
  // },
  {
    title: 'Preços de Venda',
    url: '/apps/simulador-cenarios/sales-prices',
    icon: DollarSign,
  },
  {
    title: 'Custos de Produção',
    url: '/apps/simulador-cenarios/production-costs',
    icon: Calculator,
  },
  {
    title: 'CPV',
    url: '/apps/simulador-cenarios/cpv',
    icon: Calculator,
  },
  {
    title: 'Resultado Operacional',
    url: '/apps/simulador-cenarios/resultado-operacional',
    icon: FileText,
  },
  {
    title: 'DSP por Produto',
    url: '/apps/simulador-cenarios/dsp-por-produto',
    icon: FileText,
  },
  // {
  //   title: 'Resumo Executivo',
  //   url: '/resumo-executivo',
  //   icon: ListFilter,
  // },
  {
    title: 'Consolidado',
    url: '/apps/simulador-cenarios/consolidado',
    icon: PiShieldCheckBold,
  },
];

export function SimuladorCenariosSidebar() {

  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path;



  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Sidebar className="border-r border-border bg-card shadow-card w-64 min-w-64">
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
          <SidebarGroupLabel>Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isCurrentlyActive = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md transition-smooth w-full",
                          isCurrentlyActive
                            ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                            : "hover:bg-muted/50 text-foreground hover:text-primary"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5 flex-shrink-0", // Ícone maior
                            isCurrentlyActive ? "text-primary-foreground" : "text-muted-foreground"
                          )}
                        />
                        <span className="font-medium text-base">{item.title}</span> {/* Texto maior */}
                      </NavLink>
                    </SidebarMenuButton>

                  </SidebarMenuItem>
                );
              })}
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