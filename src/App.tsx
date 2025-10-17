import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PortalLayout } from "./components/layout/PortalLayout";
import { AppLayout } from "./components/layout/AppLayout";
import { ControlePontoSidebar } from "./components/layout/ControlePontoSidebar";
import { AvaliacaoSidebar } from "./components/layout/AvaliacaoSidebar";
import Portal from "./pages/Portal";
import Login from "./pages/auth/Login";
import ControlePontoDashboard from "./pages/apps/controle-ponto/Dashboard";
import NovaOcorrencia from "./pages/apps/controle-ponto/NovaOcorrencia";
import Ocorrencias from "./pages/apps/controle-ponto/Ocorrencias";
import Colaboradores from "./pages/apps/controle-ponto/Colaboradores";
import Relatorios from "./pages/apps/controle-ponto/Relatorios";
import Configuracoes from "./pages/apps/controle-ponto/Configuracoes";
import AvaliacaoDashboard from "./pages/apps/avaliacao/Dashboard";
import NovaAvaliacao from "./pages/apps/avaliacao/NovaAvaliacao";
import ListaAvaliacoes from "./pages/apps/avaliacao/ListaAvaliacoes";
import RealizarAvaliacao from "./pages/apps/avaliacao/RealizarAvaliacao";
import DetalhesAvaliacao from "./pages/apps/avaliacao/DetalhesAvaliacao";
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
              path="/apps/avaliacao/nova"
              element={
                <ProtectedRoute>
                  <AppLayout sidebar={<AvaliacaoSidebar />} appName="Avaliação de Aprendizes">
                    <NovaAvaliacao />
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
              path="/apps/avaliacao/avaliar/:id"
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
