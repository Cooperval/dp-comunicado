import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from './ThemeToggle';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  appName?: string;
}

export function AppLayout({ children, sidebar, appName = 'Aplicação' }: AppLayoutProps) {
  const location = useLocation();

  // Generate breadcrumb based on current path
  const generateBreadcrumb = () => {
    const paths = location.pathname.split('/').filter(Boolean);
    const pageName = paths[paths.length - 1];
    
    const pageNames: Record<string, string> = {
      'controle-ponto': 'Dashboard',
      'ocorrencia': 'Nova Ocorrência',
      'ocorrencias': 'Ocorrências',
      'colaboradores': 'Colaboradores',
      'relatorios': 'Relatórios',
      'configuracoes': 'Configurações',
    };

    return pageNames[pageName] || 'Dashboard';
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {sidebar}
        <main className="flex-1 flex flex-col">
          <header className="flex justify-between items-center p-4 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/portal">Portal</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/apps/controle-ponto">
                      {appName}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{generateBreadcrumb()}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <ThemeToggle />
          </header>
          <div className="flex-1 p-4 sm:p-6 bg-gradient-subtle">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
