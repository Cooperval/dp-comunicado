import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminRoute } from "./components/auth/AdminRoute";
import { PortalLayout } from "./components/layout/PortalLayout";
import { AppLayout } from "./components/layout/AppLayout";
import { ControlePontoSidebar } from "./components/layout/ControlePontoSidebar";
import { AvaliacaoSidebar } from "./components/layout/AvaliacaoSidebar";
import { AdminSidebar } from "./components/layout/AdminSidebar";
import { SGDNCSidebar } from "./components/layout/SGDNCSidebar";
import Portal from "./pages/Portal";
import Login from "./pages/auth/Login";
import SGDNCDashboard from "./pages/apps/sgdnc/Dashboard";
import ListaDocumentos from "./pages/apps/sgdnc/documentos/ListaDocumentos";
import NovoDocumento from "./pages/apps/sgdnc/documentos/NovoDocumento";
import EditarDocumento from "./pages/apps/sgdnc/documentos/EditarDocumento";
import VisualizarDocumento from "./pages/apps/sgdnc/documentos/VisualizarDocumento";
import ListaNaoConformidades from "./pages/apps/sgdnc/nao-conformidades/ListaNaoConformidades";
import RegistrarNC from "./pages/apps/sgdnc/nao-conformidades/RegistrarNC";
import DetalhesNC from "./pages/apps/sgdnc/nao-conformidades/DetalhesNC";
import ListaTreinamentos from "./pages/apps/sgdnc/treinamentos/ListaTreinamentos";
import ConfirmacaoLeitura from "./pages/apps/sgdnc/treinamentos/ConfirmacaoLeitura";
import RelatoriosAuditoria from "./pages/apps/sgdnc/relatorios/RelatoriosAuditoria";
import ControlePontoDashboard from "./pages/apps/controle-ponto/Dashboard";
import NovaOcorrencia from "./pages/apps/controle-ponto/NovaOcorrencia";
import Ocorrencias from "./pages/apps/controle-ponto/Ocorrencias";
import Colaboradores from "./pages/apps/controle-ponto/Colaboradores";
import Relatorios from "./pages/apps/controle-ponto/Relatorios";
import Configuracoes from "./pages/apps/controle-ponto/Configuracoes";
import AvaliacaoDashboard from "./pages/apps/avaliacao/Dashboard";
import GerenciarAvaliacoes from "./pages/apps/avaliacao/GerenciarAvaliacoes";
import NovoModeloAvaliacao from "./pages/apps/avaliacao/NovoModeloAvaliacao";
import VisualizarModelo from "./pages/apps/avaliacao/VisualizarModelo";
import AtribuirAvaliacao from "./pages/apps/avaliacao/AtribuirAvaliacao";
import ListaAvaliacoes from "./pages/apps/avaliacao/ListaAvaliacoes";
import RealizarAvaliacao from "./pages/apps/avaliacao/RealizarAvaliacao";
import DetalhesAvaliacao from "./pages/apps/avaliacao/DetalhesAvaliacao";
import AdminDashboard from "./pages/apps/admin/Dashboard";
import GerenciarUsuarios from "./pages/apps/admin/GerenciarUsuarios";
import NotFound from "./pages/NotFound";

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
            
            {/* Controle de Ponto app routes */}
            <Route
              path="/apps/controle-ponto"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<ControlePontoSidebar />} appName="Controle de Ponto">
                    <ControlePontoDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/controle-ponto/ocorrencia"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<ControlePontoSidebar />} appName="Controle de Ponto">
                    <NovaOcorrencia />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/controle-ponto/ocorrencias"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<ControlePontoSidebar />} appName="Controle de Ponto">
                    <Ocorrencias />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/controle-ponto/colaboradores"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<ControlePontoSidebar />} appName="Controle de Ponto">
                    <Colaboradores />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/controle-ponto/relatorios"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<ControlePontoSidebar />} appName="Controle de Ponto">
                    <Relatorios />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/controle-ponto/configuracoes"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<ControlePontoSidebar />} appName="Controle de Ponto">
                    <Configuracoes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Avaliação app routes */}
            <Route
              path="/apps/avaliacao"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <AvaliacaoDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/avaliacao/modelos"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <GerenciarAvaliacoes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/avaliacao/modelos/novo"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <NovoModeloAvaliacao />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/avaliacao/modelos/editar/:id"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <NovoModeloAvaliacao />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/avaliacao/modelos/visualizar/:id"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <VisualizarModelo />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/avaliacao/atribuir"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <AtribuirAvaliacao />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/avaliacao/lista"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <ListaAvaliacoes />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/avaliacao/realizar/:id"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <RealizarAvaliacao />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/avaliacao/detalhes/:id"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <DetalhesAvaliacao />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* Admin app routes */}
            <Route
              path="/apps/admin"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AppLayout sidebar={<AdminSidebar />} appName="Administração">
                      <AdminDashboard />
                    </AppLayout>
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/admin/usuarios"
              element={
                <ProtectedRoute>
                  <AdminRoute>
                    <AppLayout sidebar={<AdminSidebar />} appName="Administração">
                      <GerenciarUsuarios />
                    </AppLayout>
                  </AdminRoute>
                </ProtectedRoute>
              }
            />
            
            {/* SGDNC app routes */}
            <Route
              path="/apps/sgdnc"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="SGDNC">
                    <SGDNCDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/documentos"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="SGDNC">
                    <ListaDocumentos />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/documentos/novo"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="SGDNC">
                    <NovoDocumento />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/documentos/:id"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="SGDNC">
                    <VisualizarDocumento />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/documentos/:id/editar"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="SGDNC">
                    <EditarDocumento />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/nao-conformidades"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="SGDNC">
                    <ListaNaoConformidades />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/nao-conformidades/nova"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="SGDNC">
                    <RegistrarNC />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/nao-conformidades/:id"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="SGDNC">
                    <DetalhesNC />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/treinamentos"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="SGDNC">
                    <ListaTreinamentos />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/treinamentos/:id/confirmar"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="SGDNC">
                    <ConfirmacaoLeitura />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/apps/sgdnc/relatorios"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<SGDNCSidebar />} appName="SGDNC">
                    <RelatoriosAuditoria />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
