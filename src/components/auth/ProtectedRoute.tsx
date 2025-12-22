// ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: string | number; // cod_modulo esperado (opcional)
  allowedAccessTypes?: string[]; // opcional override
}

export function ProtectedRoute({
  children,
  requiredModule,
  allowedAccessTypes = ['A', 'S', 'G', 'U'],
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, acessos } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Se nenhum módulo requerido, só autenticação é suficiente
  if (!requiredModule) {
    return <>{children}</>;
  }

  // `acessos` deve ser um array com objetos { COD_MODULO, TIPO_ACESSO }
  const moduleToCheck = typeof requiredModule === 'number' ? requiredModule.toString() : requiredModule;
  const access = (acessos || []).find((a: any) => String(a.COD_MODULO) === moduleToCheck);

  if (!access || !allowedAccessTypes.includes(access.TIPO_ACESSO)) {
    // usuário não tem permissão para esse módulo -> volta pro portal
    return <Navigate to="/portal" replace />;
  }

  return <>{children}</>;
}
