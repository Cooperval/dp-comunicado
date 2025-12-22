import { Toaster } from "@/components/ui/toaster";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SimulatorProvider } from "./pages/apps/simulador-cenarios/contexts/SimulatorContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PortalLayout } from "./components/layout/PortalLayout";
import { AppLayout } from "./components/layout/AppLayout";
import Portal from "./pages/Portal";
import Login from "./pages/auth/Login";
import { ControlePontoSidebar } from "./components/layout/ControlePontoSidebar";
import DashboardCP from "./pages/apps/controle-ponto/Dashboard";
import NovaOcorrenciaCP from "./pages/apps/controle-ponto/NovaOcorrencia";
import OcorrenciasCP from "./pages/apps/controle-ponto/Ocorrencias";
import ConfiguracoesCP from "./pages/apps/controle-ponto/Configuracoes";

import { FluxoCaixaSidebar } from "./components/layout/FluxoCaixaSidebar";
import DashboardFC from "./pages/apps/fluxo-de-caixa/Dashboard";
import SaldosBancariosFC from "./pages/apps/fluxo-de-caixa/SaldosBancarios";
import MovimentacoesFC from "./pages/apps/fluxo-de-caixa/Movimentacoes";
import PendenciasFC from "./pages/apps/fluxo-de-caixa/Pendencias";
import FluxoCaixaFC from "./pages/apps/fluxo-de-caixa/AnaliseMatriz";
import LancamentoFuturoFC from "./pages/apps/fluxo-de-caixa/LancamentosFuturo";
import ConfiguracaoFC from "./pages/apps/fluxo-de-caixa/Configuracoes";
import ProjecaoFolhaFC from "./pages/apps/fluxo-de-caixa/ProjecaoFolha";

import { AvaliacaoSidebar } from "./components/layout/AvaliacaoSidebar";
import AvaliacaoDashboard from "./pages/apps/avaliacao/Dashboard";
import GerenciarAvaliacoes from "./pages/apps/avaliacao/GerenciarAvaliacoes";
import NovoModeloAvaliacao from "./pages/apps/avaliacao/NovoModeloAvaliacao";
import VisualizarModelo from "./pages/apps/avaliacao/VisualizarModelo";
import AtribuirAvaliacao from "./pages/apps/avaliacao/AtribuirAvaliacao";
import ListaAvaliacoes from "./pages/apps/avaliacao/ListaAvaliacoes";
import RealizarAvaliacao from "./pages/apps/avaliacao/RealizarAvaliacao";
import DetalhesAvaliacao from "./pages/apps/avaliacao/DetalhesAvaliacao";

import { SimuladorCenariosSidebar } from "./components/layout/SimuladorCenariosSidebar";
import MarketQuotations from "./pages/apps/simulador-cenarios/MarketQuotations";
import Productions from "./pages/apps/simulador-cenarios/Productions";
import CornProduction from "./pages/apps/simulador-cenarios/CornProduction";
import OtherProductions from "./pages/apps/simulador-cenarios/OtherProductions";
import Commercialization from "./pages/apps/simulador-cenarios/Commercialization";
import SalesPrices from "./pages/apps/simulador-cenarios/SalesPrices";
import ProductionCosts from "./pages/apps/simulador-cenarios/ProductionCosts";
import CPV from "./pages/apps/simulador-cenarios/CPV";
import DRE from "./pages/apps/simulador-cenarios/DRE";
import DREByProduct from "./pages/apps/simulador-cenarios/DREByProduct";
import ExecutiveSummary from "./pages/apps/simulador-cenarios/ExecutiveSummary";
import Consolidated from "./pages/apps/simulador-cenarios/Consolidated";
import NotFound from "./pages/NotFound";

import { SGDNCSidebar } from "./components/layout/SGDNCSidebar";
import SGDNCDashboard from "./pages/apps/sgdnc/Dashboard";
import ListaDocumentos from "./pages/apps/sgdnc/documentos/ListaDocumentos";
import NovoDocumento from "./pages/apps/sgdnc/documentos/NovoDocumento";
import EditarDocumento from "./pages/apps/sgdnc/documentos/EditarDocumento";
import VisualizarDocumento from "./pages/apps/sgdnc/documentos/VisualizarDocumento";
import VisualizarVersao from "./pages/apps/sgdnc/documentos/VisualizarVersao";
import AprovacoesDocumentos from "./pages/apps/sgdnc/documentos/AprovacoesDocumentos";
import DetalhesAprovacao from "./pages/apps/sgdnc/documentos/DetalhesAprovacao";
import ListaNaoConformidades from "./pages/apps/sgdnc/nao-conformidades/ListaNaoConformidades";
import RegistrarNC from "./pages/apps/sgdnc/nao-conformidades/RegistrarNC";
import DetalhesNC from "./pages/apps/sgdnc/nao-conformidades/DetalhesNC";
import ListaTreinamentos from "./pages/apps/sgdnc/treinamentos/ListaTreinamentos";
import ConfirmacaoLeitura from "./pages/apps/sgdnc/treinamentos/ConfirmacaoLeitura";
import RelatoriosAuditoria from "./pages/apps/sgdnc/relatorios/RelatoriosAuditoria";

import { AuthProviderMeuControle } from "./pages/apps/controle-financeiro/auth/AuthProvider";
import ProtectedRouteMeuControle from "./pages/apps/controle-financeiro/auth/ProtectedRouteMeuControle";
import { SidebarProvider as SidebarProviderCF } from "@/components/ui/sidebar";
import DashboardLayoutCF from "./pages/apps/controle-financeiro/dashboard/DashboardLayout";
import DashboardCF from "./pages/apps/controle-financeiro/Dashboard";
import MarginAnalysis from "./pages/apps/controle-financeiro/MarginAnalysis";
import Budget from "./pages/apps/controle-financeiro/Budget";
import Indicators from "./pages/apps/controle-financeiro/Indicators";
import Team from "./pages/apps/controle-financeiro/Team";
import Scenarios from "./pages/apps/controle-financeiro/Scenarios";

import AuthFC from "./pages/apps/controle-financeiro/Auth";
import SetPasswordFC from "./pages/apps/controle-financeiro/SetPassword";
import UploadOFX from "./pages/apps/controle-financeiro/UploadOFX";
import UploadNFe from "./pages/apps/controle-financeiro/UploadNFe";
import NFeList from "./pages/apps/controle-financeiro/NFeList";
import Transactions from "./pages/apps/controle-financeiro/Transactions";
import TransactionClassification from "./pages/apps/controle-financeiro/TransactionClassification";
import BankBalances from "./pages/apps/controle-financeiro/BankBalances";
import FinancialStatement from "./pages/apps/controle-financeiro/FinancialStatement";
import CashFlow from "./pages/apps/controle-financeiro/CashFlow";
import HierarchyManagement from "./pages/apps/controle-financeiro/HierarchyManagement";
import Organization from "./pages/apps/controle-financeiro/Organization";

import { FechamentoSidebar } from "./components/layout/FechamentoSidebar";
import Fechamento from "./pages/apps/fechamento/Fechamento";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Redirect root to portal if authenticated */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/portal" replace />
                </ProtectedRoute>
              }
            />

            {/* Portal routes */}
            <Route
              path="/portal"
              element={
                <ProtectedRoute>
                  <PortalLayout>
                    <Portal />
                  </PortalLayout>
                </ProtectedRoute>
              }
            />

            {/* Fluxo de Caixa app routes */}
            <Route
              path="/apps/fluxo-de-caixa"
              element={
                <ProtectedRoute requiredModule={12}>
                  <AppLayout sidebar={<FluxoCaixaSidebar />} appName="Fluxo de Caixa">
                    <DashboardFC />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/fluxo-de-caixa/saldos"
              element={
                <ProtectedRoute requiredModule={12}>
                  <AppLayout sidebar={<FluxoCaixaSidebar />} appName="Fluxo de Caixa">
                    <SaldosBancariosFC />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/fluxo-de-caixa/movimentacoes"
              element={
                <ProtectedRoute requiredModule={12}>
                  <AppLayout sidebar={<FluxoCaixaSidebar />} appName="Fluxo de Caixa">
                    <MovimentacoesFC />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/fluxo-de-caixa/pendencias"
              element={
                <ProtectedRoute requiredModule={12}>
                  <AppLayout sidebar={<FluxoCaixaSidebar />} appName="Fluxo de Caixa">
                    <PendenciasFC />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/fluxo-de-caixa/fluxo-de-caixa"
              element={
                <ProtectedRoute requiredModule={12}>
                  <AppLayout sidebar={<FluxoCaixaSidebar />} appName="Fluxo de Caixa">
                    <FluxoCaixaFC />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/fluxo-de-caixa/lancamento-futuro"
              element={
                <ProtectedRoute requiredModule={12}>
                  <AppLayout sidebar={<FluxoCaixaSidebar />} appName="Fluxo de Caixa">
                    <LancamentoFuturoFC />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/fluxo-de-caixa/projecao-dp"
              element={
                <ProtectedRoute requiredModule={12}>
                  <AppLayout sidebar={<FluxoCaixaSidebar />} appName="Fluxo de Caixa">
                    <ProjecaoFolhaFC />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/apps/fluxo-de-caixa/configuracoes"
              element={
                <ProtectedRoute requiredModule={12}>
                  <AppLayout sidebar={<FluxoCaixaSidebar />} appName="Fluxo de Caixa">
                    <ConfiguracaoFC />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Controle de Ponto app routes */}
            <Route
              path="/apps/controle-ponto"
              element={
                <ProtectedRoute requiredModule={13}>
                  <AppLayout sidebar={<ControlePontoSidebar />} appName="Controle de Ponto">
                    <DashboardCP />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/controle-ponto/nova-ocorrencia"
              element={
                <ProtectedRoute requiredModule={13}>
                  <AppLayout sidebar={<ControlePontoSidebar />} appName="Controle de Ponto">
                    <NovaOcorrenciaCP />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/controle-ponto/ocorrencias"
              element={
                <ProtectedRoute requiredModule={13}>
                  <AppLayout sidebar={<ControlePontoSidebar />} appName="Controle de Ponto">
                    <OcorrenciasCP />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/controle-ponto/configuracoes"
              element={
                <ProtectedRoute requiredModule={13}>
                  <AppLayout sidebar={<ControlePontoSidebar />} appName="Controle de Ponto">
                    <ConfiguracoesCP />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Avaliação app routes */}
            <Route
              path="/apps/avaliacao"
              element={
                <ProtectedRoute requiredModule={14}>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <AvaliacaoDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/avaliacao/modelos"
              element={
                <ProtectedRoute requiredModule={14}>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <GerenciarAvaliacoes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/avaliacao/modelos/novo"
              element={
                <ProtectedRoute requiredModule={14}>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <NovoModeloAvaliacao />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/avaliacao/modelos/editar/:id"
              element={
                <ProtectedRoute requiredModule={14}>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <NovoModeloAvaliacao />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/avaliacao/modelos/visualizar/:id"
              element={
                <ProtectedRoute requiredModule={14}>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <VisualizarModelo />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/avaliacao/atribuir"
              element={
                <ProtectedRoute requiredModule={14}>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <AtribuirAvaliacao />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/avaliacao/lista"
              element={
                <ProtectedRoute requiredModule={14}>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <ListaAvaliacoes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/avaliacao/realizar/:id"
              element={
                <ProtectedRoute requiredModule={14}>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <RealizarAvaliacao />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/avaliacao/detalhes/:id"
              element={
                <ProtectedRoute requiredModule={14}>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <DetalhesAvaliacao />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Simulador de Cenários app routes */}
            {/* <Route
              path="/apps/simulador-cenarios"
              element={
                <ProtectedRoute>
                  <SimulatorProvider>
                    <AppLayout sidebar={<SimuladorCenariosSidebar />} appName="Simulador de Cenários">
                      <Index />
                    </AppLayout>
                  </SimulatorProvider>
                </ProtectedRoute>
              }
            /> */}
            <Route
              path="/apps/simulador-cenarios/cotacoes"
              element={
                <ProtectedRoute requiredModule={10}>
                  <SimulatorProvider>
                    <AppLayout sidebar={<SimuladorCenariosSidebar />} appName="Simulador de Cenários">
                      <MarketQuotations />
                    </AppLayout>
                  </SimulatorProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/simulador-cenarios/sugarcane-premises"
              element={
                <ProtectedRoute requiredModule={10}>
                  <SimulatorProvider>
                    <AppLayout sidebar={<SimuladorCenariosSidebar />} appName="Simulador de Cenários">
                      <Productions />
                    </AppLayout>
                  </SimulatorProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/simulador-cenarios/corn-premises"
              element={
                <ProtectedRoute requiredModule={10}>
                  <SimulatorProvider>
                    <AppLayout sidebar={<SimuladorCenariosSidebar />} appName="Simulador de Cenários">
                      <CornProduction />
                    </AppLayout>
                  </SimulatorProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/simulador-cenarios/other-productions"
              element={
                <ProtectedRoute requiredModule={10}>
                  <SimulatorProvider>
                    <AppLayout sidebar={<SimuladorCenariosSidebar />} appName="Simulador de Cenários">
                      <OtherProductions />
                    </AppLayout>
                  </SimulatorProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/simulador-cenarios/commercialization"
              element={
                <ProtectedRoute requiredModule={10}>
                  <SimulatorProvider>
                    <AppLayout sidebar={<SimuladorCenariosSidebar />} appName="Simulador de Cenários">
                      <Commercialization />
                    </AppLayout>
                  </SimulatorProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/simulador-cenarios/sales-prices"
              element={
                <ProtectedRoute requiredModule={10}>
                  <SimulatorProvider>
                    <AppLayout sidebar={<SimuladorCenariosSidebar />} appName="Simulador de Cenários">
                      <SalesPrices />
                    </AppLayout>
                  </SimulatorProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/simulador-cenarios/production-costs"
              element={
                <ProtectedRoute requiredModule={10}>
                  <SimulatorProvider>
                    <AppLayout sidebar={<SimuladorCenariosSidebar />} appName="Simulador de Cenários">
                      <ProductionCosts />
                    </AppLayout>
                  </SimulatorProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/simulador-cenarios/cpv"
              element={
                <ProtectedRoute requiredModule={10}>
                  <SimulatorProvider>
                    <AppLayout sidebar={<SimuladorCenariosSidebar />} appName="Simulador de Cenários">
                      <CPV />
                    </AppLayout>
                  </SimulatorProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/simulador-cenarios/resultado-operacional"
              element={
                <ProtectedRoute requiredModule={10}>
                  <SimulatorProvider>
                    <AppLayout sidebar={<SimuladorCenariosSidebar />} appName="Simulador de Cenários">
                      <DRE />
                    </AppLayout>
                  </SimulatorProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/simulador-cenarios/dsp-por-produto"
              element={
                <ProtectedRoute requiredModule={10}>
                  <SimulatorProvider>
                    <AppLayout sidebar={<SimuladorCenariosSidebar />} appName="Simulador de Cenários">
                      <DREByProduct />
                    </AppLayout>
                  </SimulatorProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/simulador-cenarios/resumo-executivo"
              element={
                <ProtectedRoute requiredModule={10}>
                  <SimulatorProvider>
                    <AppLayout sidebar={<SimuladorCenariosSidebar />} appName="Simulador de Cenários">
                      <ExecutiveSummary />
                    </AppLayout>
                  </SimulatorProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/simulador-cenarios/consolidado"
              element={
                <ProtectedRoute requiredModule={10}>
                  <SimulatorProvider>
                    <AppLayout sidebar={<SimuladorCenariosSidebar />} appName="Simulador de Cenários">
                      <Consolidated />
                    </AppLayout>
                  </SimulatorProvider>
                </ProtectedRoute>
              }
            />

            {/* SGDNC app routes */}
            <Route
              path="/apps/sgdnc"
              element={
                <ProtectedRoute requiredModule={15}>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="Gestão de Documentos e Não Conformidade">
                    <SGDNCDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/documentos"
              element={
                <ProtectedRoute requiredModule={15}>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="Gestão de Documentos e Não Conformidade">
                    <ListaDocumentos />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/documentos/novo"
              element={
                <ProtectedRoute requiredModule={15}>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="Gestão de Documentos e Não Conformidade">
                    <NovoDocumento />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/documentos/:id"
              element={
                <ProtectedRoute requiredModule={15}>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="Gestão de Documentos e Não Conformidade">
                    <VisualizarDocumento />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/documentos/:id/editar"
              element={
                <ProtectedRoute requiredModule={15}>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="Gestão de Documentos e Não Conformidade">
                    <EditarDocumento />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/documentos/:id/versoes/:versaoNumero"
              element={
                <ProtectedRoute requiredModule={15}>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="Gestão de Documentos e Não Conformidade">
                    <VisualizarVersao />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/documentos/aprovacoes"
              element={
                <ProtectedRoute requiredModule={15}>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="Gestão de Documentos e Não Conformidade">
                    <AprovacoesDocumentos />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/documentos/aprovacoes/:id"
              element={
                <ProtectedRoute requiredModule={15}>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="Gestão de Documentos e Não Conformidade">
                    <DetalhesAprovacao />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/nao-conformidades"
              element={
                <ProtectedRoute requiredModule={15}>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="Gestão de Documentos e Não Conformidade">
                    <ListaNaoConformidades />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/nao-conformidades/nova"
              element={
                <ProtectedRoute requiredModule={15}>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="Gestão de Documentos e Não Conformidade">
                    <RegistrarNC />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/nao-conformidades/:id"
              element={
                <ProtectedRoute requiredModule={15}>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="Gestão de Documentos e Não Conformidade">
                    <DetalhesNC />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/treinamentos"
              element={
                <ProtectedRoute requiredModule={15}>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="Gestão de Documentos e Não Conformidade">
                    <ListaTreinamentos />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/treinamentos/:id/confirmar"
              element={
                <ProtectedRoute requiredModule={15}>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="Gestão de Documentos e Não Conformidade">
                    <ConfirmacaoLeitura />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/relatorios"
              element={
                <ProtectedRoute requiredModule={15}>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="Gestão de Documentos e Não Conformidade">
                    <RelatoriosAuditoria />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/apps/fechamento"
              element={

                  <AppLayout sidebar={<FechamentoSidebar />} appName="Fechamento">
                    <Fechamento />

                </ProtectedRoute>
              }
            />

            <Route
              path="/apps/controle-financeiro"
              element={
                <AuthProviderMeuControle>
                  <SidebarProviderCF>
                    <Outlet />
                  </SidebarProviderCF>
                </AuthProviderMeuControle>
              }
            >
              <Route index element={<Navigate to="auth" replace />} />
              <Route path="auth" element={<AuthFC />} />
              <Route path="set-password" element={<SetPasswordFC />} />

              {/* === ROTA PRINCIPAL DO APP === */}
              <Route
                path="*"
                element={
                  <ProtectedRouteMeuControle>
                    <DashboardLayoutCF />
                  </ProtectedRouteMeuControle>
                }
              >
                {/* Sub-rotas do dashboard */}
                <Route path="dashboard" index element={<DashboardCF />} />
                <Route path="budget" element={<Budget />} />
                <Route path="indicators" element={<Indicators />} />
                <Route path="bank-balances" element={<BankBalances />} />
                <Route path="upload-ofx" element={<UploadOFX />} />
                <Route path="transaction-classification" element={<TransactionClassification />} />
                <Route path="margins" element={<MarginAnalysis />} />
                <Route path="indicators" element={<Indicators />} />
                <Route path="team" element={<Team />} />
                <Route path="scenarios" element={<Scenarios />} />
                <Route path="upload-nfe" element={<UploadNFe />} />
                <Route path="nfe-list" element={<NFeList />} />
                <Route path="organization" element={<Organization />} />
                <Route path="transactions" element={<Transactions />} />
                <Route path="financial-statement" element={<FinancialStatement />} />
                <Route path="cash-flow" element={<CashFlow />} />
                <Route path="hierarchy-management" element={<HierarchyManagement />} />

                <Route path="*" element={<Navigate to="dashboard" replace />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ToastContainer position="bottom-right" />
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
