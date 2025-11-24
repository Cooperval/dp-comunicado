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
} from '@/components/ui/sidebar';
import {
  Settings,
  BarChart3,
  Wheat,
  Flower2,
  Factory,
  ShoppingCart,
  DollarSign,
  Calculator,
  FileText,
  TrendingUp,
  LineChart,
  SquareMinus,
  ListFilter,
  Blocks,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GiCorn } from "react-icons/gi";
import { PiShieldCheckBold } from "react-icons/pi";
import { PiMathOperationsBold } from "react-icons/pi";
import { GiSugarCane } from "react-icons/gi";

const menuItems = [
  {
    title: 'Cotações de Mercado',
    url: '/',
    icon: LineChart,
  },
  // {
  //   title: 'Premissas da Operação',
  //   url: '/operation-premises',
  //   icon: Settings,
  // },
  {
    title: 'Premissas da Cana',
    url: '/sugarcane-premises',
    icon: GiSugarCane,
  },
  {
    title: 'Premissas da Milho',
    url: '/corn-premises',
    icon: GiCorn,
  },
  {
    title: 'Outras Produções',
    url: '/other-productions',
    icon: Factory,
  },
  // {
  //   title: 'Comercialização',
  //   url: '/commercialization',
  //   icon: ShoppingCart,
  // },
  {
    title: 'Preços de Venda',
    url: '/sales-prices',
    icon: DollarSign,
  },
  {
    title: 'Custos de Produção',
    url: '/production-costs',
    icon: Calculator,
  },
  {
    title: 'CPV',
    url: '/cpv',
    icon: Calculator,
  },
  {
    title: 'Resultado Operacional',
    url: '/resultado-operacional',
    icon: FileText,
  },
  {
    title: 'DSP por Produto',
    url: '/dsp-por-produto',
    icon: FileText,
  },
  // {
  //   title: 'Resumo Executivo',
  //   url: '/resumo-executivo',
  //   icon: ListFilter,
  // },
  {
    title: 'Consolidado',
    url: '/consolidado',
    icon: PiShieldCheckBold,
  },
];

export function AppSidebar() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path;
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
    </Sidebar>
  );
}