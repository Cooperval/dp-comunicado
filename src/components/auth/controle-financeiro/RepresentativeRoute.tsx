import React from 'react';
import { useAuth } from './AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

interface RepresentativeRouteProps {
  children: React.ReactNode;
}

export const RepresentativeRoute: React.FC<RepresentativeRouteProps> = ({ children }) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (profile?.role !== 'representante' && profile?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-8">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Acesso Restrito</CardTitle>
            <CardDescription className="text-base mt-2">
              Esta página está disponível apenas para representantes e administradores da empresa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-center text-muted-foreground">
              Entre em contato com o representante da sua empresa para mais informações sobre planos e assinaturas.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
