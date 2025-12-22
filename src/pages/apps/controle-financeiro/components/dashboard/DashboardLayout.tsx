import React, { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/pages/apps/controle-financeiro/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { TrialBanner } from "./TrialBanner";
import { TrialExpiredScreen } from "./TrialExpiredScreen";
import { ClassificationStatsModal } from "./ClassificationStatsModal";
import { RouteLoadingOverlay } from "@/components/ui/route-loading-overlay";
import { useRouteLoading } from "@/pages/apps/controle-financeiro/hooks/useRouteLoading";
import {
  TrendingUp,
  BarChart3,
  PieChart,
  Users,
  DollarSign,
  Target,
  Settings,
  LogOut,
  Building,
  Upload,
  FileX,
  ArrowLeftRight,
  Wallet,
  Tags,
  FileText,
  Plus,
  Calendar,
  TreePine,
  Clock,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";

// --- no topo do arquivo, antes de AppSidebar ---
type NavItem = { name: string; icon: React.ComponentType<any>; href: string; current?: boolean };

export const NAV_GERENCIAL: NavItem[] = [
  { name: "Visão Geral", icon: BarChart3, href: "/", current: true },
  { name: "Indicadores", icon: PieChart, href: "/indicators" },
  //{ name: "Saldos Bancários", icon: Wallet, href: "/bank-balances" },
  // { name: 'Cenários', icon: Target, href: '/scenarios' },
  { name: "Análise de Margens", icon: TrendingUp, href: "/margins" },
  { name: "Fluxo por Natureza", icon: FileText, href: "/financial-statement" },
  { name: "Orçamento", icon: DollarSign, href: "/budget" },
  { name: "Fluxo de Caixa", icon: Calendar, href: "/cash-flow" },
  { name: "Consultar OFX", icon: ArrowLeftRight, href: "/transactions" },
  { name: "Consultar XML", icon: FileText, href: "/nfe-list" },
];

export const NAV_OPERACIONAL: NavItem[] = [
  { name: "Carregar OFX", icon: Upload, href: "/upload-ofx" },
  { name: "Carregar XML", icon: FileX, href: "/upload-nfe" },
  { name: "Classificar OFX", icon: Tags, href: "/transaction-classification" },
  // { name: 'Equipe', icon: Users, href: '/team' },
  // { name: 'Orçamento', icon: DollarSign, href: '/budget' },
];

export const NAV_ORGANIZACAO: NavItem[] = [
  { name: "Estrutura", icon: Building, href: "/organization" },
];

export const NAV_REPRESEN: NavItem[] = [{ name: "Planos", icon: DollarSign, href: "/plan" }];

export const NAV_ADMIN: NavItem[] = [
  { name: "Configurações", icon: Settings, href: "/settings" },
  { name: "Gerenciar Hierarquia", icon: TreePine, href: "/hierarchy-management" },
];

// util: encontra o título com base na URL atual
export function getPageTitle(pathname: string): string {
  const match =
    [...NAV_GERENCIAL, ...NAV_OPERACIONAL, ...NAV_ORGANIZACAO, ...NAV_REPRESEN, ...NAV_ADMIN].find(
      (item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)),
    ) || NAV_GERENCIAL.find((i) => i.href === "/");

  return match?.name ?? "Meu Gestor";
}

const AppSidebar = () => {
  const { user, profile, company, group, signOut, subscribed } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { open } = useSidebar();

  const getTrialDaysRemaining = () => {
    if (!group?.trial_ends_at) return null;
    return Math.ceil((new Date(group.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  };

  const trialDays = getTrialDaysRemaining();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      navigate("/auth");
    } catch (error) {
      console.error("Error during logout:", error);
      // Only show error if it's not a session-related error
      if (
        error instanceof Error &&
        !error.message.includes("Auth session missing") &&
        !error.message.includes("session id") &&
        !error.message.includes("doesn't exist")
      ) {
        toast({
          title: "Erro no logout",
          description: "Tente novamente",
          variant: "destructive",
        });
      } else {
        // For session errors, still show success and navigate
        toast({
          title: "Logout realizado",
          description: "Até logo!",
        });
        navigate("/auth");
      }
    }
  };

  const navigation = NAV_GERENCIAL;
  const navigation2 = NAV_OPERACIONAL;

  const isActive = (path: string) => location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  return (
    <Sidebar className="border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-sidebar-primary rounded-xl">
            <TrendingUp className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
          {open && (
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">Meu Gestor</h1>
              <p className="text-xs text-sidebar-foreground/70">Painel de Análise</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel>Gerencial</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.href)}
                    isActive={isActive(item.href)}
                    className="w-full justify-start"
                  >
                    <item.icon className="w-5 h-5" />
                    {open && <span>{item.name}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Operacional</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation2.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.href)}
                    isActive={isActive(item.href)}
                    className="w-full justify-start"
                  >
                    <item.icon className="w-5 h-5" />
                    {open && <span>{item.name}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Minha Organização</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ORGANIZACAO.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    onClick={() => navigate(item.href)}
                    isActive={isActive(item.href)}
                    className="w-full justify-start"
                  >
                    <item.icon className="w-5 h-5" />
                    {open && <span>{item.name}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(profile?.role === "admin" || profile?.role === "representante") && (
          <SidebarGroup>
            <SidebarGroupLabel>Configuração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_REPRESEN.filter((item) => {
                  if (item.href === "/plan") {
                    return profile?.role === "admin" || profile?.role === "representante";
                  }
                  return true;
                }).map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.href)}
                      isActive={isActive(item.href)}
                      className="w-full justify-start"
                    >
                      <item.icon className="w-5 h-5" />
                      {open && <span>{item.name}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {profile?.role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ADMIN.filter((item) => {
                  if (item.href === "/plan") {
                    return profile?.role === "admin";
                  }
                  return true;
                }).map((item) => (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.href)}
                      isActive={isActive(item.href)}
                      className="w-full justify-start"
                    >
                      <item.icon className="w-5 h-5" />
                      {open && <span>{item.name}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="space-y-2">
          {/* {subscribed && open && (
            <Badge
              variant="outline"
              className="justify-center w-full mb-2 gap-2 bg-success/10 border-success text-success"
            >
              <Clock className="h-3 w-3" />
              Plano Pro
            </Badge>
          )}
          {!subscribed && group?.subscription_plan === "trial" && trialDays !== null && trialDays >= 0 && open && (
            <Badge variant="outline" className="justify-center w-full mb-2 gap-2">
              <Clock className="h-3 w-3" />
              Trial: {trialDays} {trialDays === 1 ? "dia" : "dias"}
            </Badge>
          )} */}

          {user && (
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
                <Building className="w-4 h-4 text-sidebar-primary-foreground" />
              </div>
              {open && (
                <div className="flex-1">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {profile?.full_name || user.email}
                  </p>
                </div>
              )}
            </div>
          )}

          <SidebarMenuButton onClick={handleSignOut} className="w-full justify-start">
            <LogOut className="w-4 h-4" />
            {open && <span>Sair</span>}
          </SidebarMenuButton>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

// Rotas que podem ser acessadas mesmo com trial expirado
const UNPROTECTED_ROUTES = ["/plan", "/settings"];

const DashboardLayout = () => {
  const { user, profile, company, group, loading, subscribed } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const { loading: routeLoading } = useRouteLoading();

  const pageTitle = React.useMemo(() => getPageTitle(location.pathname), [location.pathname]);

  const handleUpgradeClick = () => {
    // Verificar se o usuário tem permissão para acessar a página de planos
    if (profile?.role === "representante" || profile?.role === "admin") {
      navigate("/plan");
    } else {
      toast({
        title: "Entre em contato",
        description: "Fale com o representante da sua empresa para fazer upgrade do plano.",
      });
    }
  };

  const isSubscriptionActive = group?.subscription_status === "active";
  const isTrialUser = group?.subscription_plan === "trial" && isSubscriptionActive && !subscribed;

  // Verifica se deve mostrar a tela de trial expirado
  const shouldShowTrialExpired = () => {
    // Se já tem assinatura ativa no Stripe, não bloquear
    if (subscribed) return false;

    // Se assinatura do grupo está ativa, não mostrar
    if (isSubscriptionActive) return false;

    // Se está em uma rota desprotegida, não bloquear
    const isUnprotectedRoute = UNPROTECTED_ROUTES.some((route) => location.pathname.startsWith(route));
    if (isUnprotectedRoute) return false;

    // Caso contrário, mostrar a tela de trial expirado
    return true;
  };

  React.useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Se ainda está carregando os dados do usuário, exibir tela de loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary/20 to-primary/5">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Carregando...</h2>
            <p className="text-muted-foreground">Verificando informações da sua conta</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <AppSidebar />
      <SidebarInset className="bg-gradient-to-br from-background via-secondary/20 to-primary/5">
        <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="-ml-1" />
            <h2 className="text-3xl font-semibold tracking-tight">{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 px-0" onClick={() => setStatsModalOpen(true)}>
              <BarChart3 className="h-4 w-4" />
              <span className="sr-only">Estatísticas de Classificação</span>
            </Button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-8">
          {routeLoading && <RouteLoadingOverlay />}
          {shouldShowTrialExpired() ? (
            <TrialExpiredScreen onContactClick={handleUpgradeClick} userRole={profile?.role} />
          ) : (
            <>
              {isTrialUser && group?.trial_ends_at && (
                <TrialBanner trialEndsAt={group.trial_ends_at} onUpgradeClick={handleUpgradeClick} />
              )}
              <Outlet />
            </>
          )}
        </main>
      </SidebarInset>
      <ClassificationStatsModal open={statsModalOpen} onOpenChange={setStatsModalOpen} />
    </>
  );
};

export default DashboardLayout;
