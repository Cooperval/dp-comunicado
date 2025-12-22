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
  const location = useLocation(); // ← MOVER PARA O TOPO!

  // mapa centralizado de labels
  const routeLabels: Record<string, string> = {
    // === Simulador de Cenários ===
    'simulador-cenarios/cotacoes': 'Cotações de Mercado',
    'simulador-cenarios/sugarcane-premises': 'Premissas da Cana',
    'simulador-cenarios/corn-premises': 'Premissas da Milho',
    'simulador-cenarios/other-productions': 'Outras Produções',
    'simulador-cenarios/commercialization': 'Comercialização',
    'simulador-cenarios/sales-prices': 'Preços de Venda',
    'simulador-cenarios/production-costs': 'Custos de Produção',
    'simulador-cenarios/cpv': 'CPV',
    'simulador-cenarios/resultado-operacional': 'Resultado Operacional',
    'simulador-cenarios/dsp-por-produto': 'DSP por Produto',
    'simulador-cenarios/resumo-executivo': 'Resumo Executivo',
    'simulador-cenarios/consolidado': 'Consolidado',

    // === Fluxo de Caixa ===
    'fluxo-de-caixa': 'Fluxo de Caixa',
    'fluxo-de-caixa/saldos': 'Saldos Bancários',
    'fluxo-de-caixa/movimentacoes': 'Movimentações',
    'fluxo-de-caixa/pendencias': 'Pendências',
    'fluxo-de-caixa/lancamento-futuro': 'Lançamentos Futuros',
    'fluxo-de-caixa/projecao-dp': 'Projeção DP',
    'fluxo-de-caixa/relatorios': 'Relatórios',
    'fluxo-de-caixa/fluxo-de-caixa': 'Fluxo de Caixa', // nova rota!
    'fluxo-de-caixa/configuracoes': 'Configurações',

    // === Controle de Ponto ===
    'controle-ponto': 'Controle de Ponto',
    'controle-ponto/ocorrencia': 'Nova Ocorrência',
    'controle-ponto/ocorrencias': 'Ocorrências',
    'controle-ponto/colaboradores': 'Colaboradores',
    'controle-ponto/relatorios': 'Relatórios',
    'controle-ponto/configuracoes': 'Configurações',

    // === Avaliação ===
    'avaliacao': 'Dashboard',
    'avaliacao/modelos': 'Modelos',
    'avaliacao/modelos/novo': 'Novo Modelo',
    'avaliacao/modelos/editar': 'Editar Modelo',           // :id será removido
    'avaliacao/modelos/visualizar': 'Visualizar Modelo',   // :id será removido
    'avaliacao/atribuir': 'Atribuir Avaliação',
    'avaliacao/lista': 'Lista',
    'avaliacao/realizar': 'Realizar Avaliação',            // :id removido
    'avaliacao/detalhes': 'Detalhes da Avaliação',         // :id removido

    // === SGDNC (já estava correto antes) ===
    'sgdnc': 'Gestão de Documentos e Não Conformidades',
    'sgdnc/documentos': 'Documentos',
    'sgdnc/documentos/novo': 'Novo Documento',
    'sgdnc/documentos/editar': 'Editar Documento',
    'sgdnc/documentos/visualizar': 'Visualizar Documento',
    'sgdnc/documentos/versoes': 'Visualizar Versão',
    'sgdnc/documentos/aprovacoes': 'Aprovação de Documentos',
    'sgdnc/documentos/aprovacoes/detalhes': 'Detalhes da Aprovação',
    'sgdnc/nao-conformidades': 'Não Conformidades',
    'sgdnc/nao-conformidades/nova': 'Nova Não Conformidade',
    'sgdnc/nao-conformidades/detalhes': 'Detalhes da Não Conformidade',
    'sgdnc/treinamentos': 'Treinamentos',
    'sgdnc/treinamentos/confirmar': 'Confirmação de Leitura',
    'sgdnc/relatorios': 'Relatórios',

    // === Fallback ===
    'dashboard': 'Dashboard',
  };

  // Função: retorna label da página atual
  const getCurrentPageLabel = (pathname: string): string => {
    let cleanPath = pathname.replace(/^\/apps\/?/, '');
    cleanPath = cleanPath.replace(/\/\d+/g, '');
    cleanPath = cleanPath.replace(/\/versoes\/[^/]+/, '/versoes');
    cleanPath = cleanPath.replace(/\/$/, '');

    if (routeLabels[cleanPath]) return routeLabels[cleanPath];

    const segments = cleanPath.split('/');
    for (let i = segments.length; i > 0; i--) {
      const key = segments.slice(0, i).join('/');
      if (routeLabels[key]) return routeLabels[key];
    }

    return routeLabels['dashboard'] || 'Dashboard';
  };

  // Função: pega a base do app (ex: sgdnc)
  const getAppBaseKey = (pathname: string): string | null => {
    const match = pathname.match(/^\/apps\/([^/]+)/);
    return match ? match[1] : null;
  };

  // === Cálculos (depois de useLocation) ===
  const appBaseKey = getAppBaseKey(location.pathname);
  const appBaseLabel = appBaseKey ? routeLabels[appBaseKey] || appName : appName;
  const currentLabel = getCurrentPageLabel(location.pathname);

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
                    <BreadcrumbLink href={`/apps/${appBaseKey}`}>
                      {appBaseLabel}
                    </BreadcrumbLink>
                  </BreadcrumbItem>

                  <BreadcrumbSeparator />

                  <BreadcrumbItem>
                    <BreadcrumbPage>{currentLabel}</BreadcrumbPage>
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