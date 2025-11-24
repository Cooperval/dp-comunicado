// src/components/auth/controle-financeiro/ProtectedRouteMeuControle.tsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthMeuControle } from "./AuthProvider";

interface Props {
  children: React.ReactNode;
}

const ProtectedRouteMeuControle: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const { loading, session, user } = useAuthMeuControle();

  // enquanto a autenticação da app ainda está sendo determinada, não redirecione
  if (loading) {
    // opcional: retornar um loader leve; aqui retornamos null para evitar flashes
    return null;
  }

  const isAuthenticated = Boolean(session || user);

  // se já estivermos na rota de login da própria aplicação, não tente forçar redirecionamento circular
  const isOnAuthRoute = location.pathname.startsWith("/apps/controle-financeiro/auth");

  if (!isAuthenticated && !isOnAuthRoute) {
    // redireciona explicitamente para a rota de login da aplicação
    return <Navigate to="/apps/controle-financeiro/auth" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRouteMeuControle;
