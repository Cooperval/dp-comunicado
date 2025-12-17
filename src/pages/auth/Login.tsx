// src/pages/auth/Login.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calculator } from 'lucide-react';
import loginBg from '@/assets/campo.jpeg';
import logoLight from '@/assets/logomarca-cooperval-01.png';
import logoDark from '@/assets/logomarca-cooperval-02.png';

import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

/**
 * Login page component
 * - Simples, focado em clareza
 * - Evita observers/matchMedia duplicado sem necessidade
 * - Comentários explicativos no ponto certo
 */
export default function Login(): JSX.Element {
  // estado dos inputs
  const [username, setUsername] = useState('');
  const [senha, setSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // hook de autenticação (implementação fica em AuthContext)
  const { login: authLogin, isAuthenticated } = useAuth();


  // navegação react-router
  const navigate = useNavigate();

  // se já está autenticado, redireciona imediatamente para /portal
  useEffect(() => {
    if (isAuthenticated) navigate('/portal', { replace: true });
  }, [isAuthenticated, navigate]);

  // ========== Tema (dark/light)
  // Queremos apenas saber se o documento tem a classe "dark".
  // Uso: definir logo correto. Mantemos um observer simples para reagir
  // quando a classe do root mudar (troca de tema pelo app).
  const [isDark, setIsDark] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    const root = document.documentElement;

    // Observador: observa mudanças na lista de classes do root.
    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains('dark'));
    });

    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    // Cleanup
    return () => observer.disconnect();
  }, []);

  // ========== Handlers
  // handleSubmit: executa login chamando o contexto de auth
  // useCallback só para estabilidade de referência em caso de re-renders
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      // validação simples
      if (!username.trim() || !senha.trim()) {
        toast({ title: "Preencha todos os campos",  variant: "destructive" });
        return;
      }

      setIsLoading(true);
      try {
        // authLogin deve retornar algo como { success: boolean, error?: string }
        const result = await authLogin(username, senha);



        if (result?.success) {
          toast({ title: "Seja bem-vindo", description: "Login realizado com sucesso!" });
          navigate('/portal', { replace: true });
        } else {
          // Mensagem do backend, se existir; fallback genérico
          toast({ title: "Usuário ou senha inválidos",  variant: "destructive" });
        }
      } catch (err) {
        toast({ title: "Erro inesperado",  variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    },
    [username, senha, authLogin, navigate]
  );

  // submit via Enter nas inputs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void handleSubmit();
    }
  };

  // ========== Render
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background image full-bleed */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${loginBg})` }} />
      {/* Overlay de cor para legibilidade */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/90 to-primary/70" />

      <Card className="w-full max-w-md mx-4 relative z-10 shadow-strong">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-3">
            {/* troca de logo conforme tema */}
            <img
              src={isDark ? logoDark : logoLight}
              alt="Logomarca Cooperval"
              className="w-60 h-auto object-contain"
            />
          </div>

          <CardTitle className="text-3xl font-bold text-center">Portal do Colaborador</CardTitle>
          <CardDescription className="text-center">Entre com suas credenciais para acessar o sistema</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Login</Label>
              <Input
                id="username"
                type="text"
                placeholder="Digite seu login"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleKeyDown}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                onKeyDown={handleKeyDown}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/apps/simulador-cenarios/cotacoes')}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Acessar Simulador de Cenários
            </Button>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={() => navigate('/apps/fechamento')}
            >
              <Calculator className="mr-2 h-4 w-4" />
              Acessar Fechamento
            </Button>
          </form>
        </CardContent>
      </Card>

      <footer className="absolute bottom-0 left-0 right-0 p-4 text-center text-white/80 text-sm z-10">
        © 2025 Portal do Colaborador. Todos os direitos reservados.
      </footer>
    </div>
  );
}
