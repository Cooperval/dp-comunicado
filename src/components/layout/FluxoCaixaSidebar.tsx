import {

  CreditCard,
  TrendingUp,

  Grid3X3,
  ArrowDownUp,
  LayoutList,
  ListChecks,
  Plus,
  List,
  Settings,
  ArrowLeft,
  Home, LogOut, User
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
import logo from '@/assets/logo-4.png';
import { Button } from '@/components/ui/button';
import { useAuth } from "@/contexts/AuthContext";

const items = [
  //{ title: 'Dashboard', url: '/apps/fluxo-de-caixa/', icon: Home },
  { title: 'Saldos Bancários', url: '/apps/fluxo-de-caixa/saldos', icon: CreditCard },
  { title: 'Movimentações', url: '/apps/fluxo-de-caixa/movimentacoes', icon: ArrowDownUp },
  { title: 'Pendências', url: '/apps/fluxo-de-caixa/pendencias', icon: LayoutList },
  { title: 'Lançamentos Futuros', url: '/apps/fluxo-de-caixa/lancamento-futuro', icon: TrendingUp },
  { title: 'Projeção DP', url: '/apps/fluxo-de-caixa/projecao-dp', icon: ListChecks },
  { title: 'Fluxo de caixa', url: '/apps/fluxo-de-caixa/fluxo-de-caixa', icon: Grid3X3 },
  { title: 'Configurações', url: '/apps/fluxo-de-caixa/configuracoes', icon: Settings },
];

export function FluxoCaixaSidebar() {
  const { user, logout } = useAuth();
  const { state } = useSidebar();
  const navigate = useNavigate();
  const isCollapsed = state === 'collapsed';
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'bg-accent  font-medium' : 'hover:bg-accent/50';


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
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end className={getNavCls}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
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
