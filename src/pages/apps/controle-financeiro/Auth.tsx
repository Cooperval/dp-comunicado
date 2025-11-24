import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/controle-financeiro/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import authBackground from '@/assets/auth-background-17.jpg';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  // React.useEffect(() => {
  //   if (user) {
  //     navigate('/apps/controle-financeiro/dashboard');
  //   }
  // }, [user, navigate]);

  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(signInData.email, signInData.password);

      if (error) {
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao Controle Financeiro",
        });
        navigate('/apps/controle-financeiro/dashboard', { replace: true });
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signUp(signUpData.email, signUpData.password, signUpData.fullName);

      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu email para confirmar a conta",
        });
      }
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-success/10 flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: `url(${authBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better readability */}
      <div className="absolute inset-0 bg-background/10 backdrop-blur-md"></div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 place-items-center min-h-screen">

          <div className="hidden lg:block space-y-8">

          </div>

          {/* Left side - Branding and info */}
          <div className="hidden lg:block space-y-8">

            <div className="flex items-center gap-6">
              {/* Ícone */}
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-700 rounded-3xl shadow-2xl">
                <TrendingUp className="w-10 h-10 text-primary-foreground" />
              </div>

              {/* Título e subtítulo */}
              <div className="space-y-2">
                <h1 className="text-5xl xl:text-6xl font-bold text-white leading-tight">
                  Controle Financeiro
                </h1>
              </div>
            </div>

            <div className="space-y-6">

              <div className="space-y-4">

                <p className="text-xl text-white max-w-lg">
                  Análise financeira inteligente para transformar dados em decisões estratégicas para seu negócio.
                </p>
              </div>
            </div>



            {/* <div className="grid grid-cols-1 gap-6 max-w-lg">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Dashboard Intuitivo</h3>
                  <p className="text-sm text-white">Visualize métricas em tempo real</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-lg bg-success/5 border border-success/10">
                <div className="flex-shrink-0 w-10 h-10 bg-success/20 rounded-lg flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Análises Avançadas</h3>
                  <p className="text-sm text-white">Relatórios detalhados e insights</p>
                </div>
              </div>
            </div> */}
          </div>

          {/* Right side - Login form */}
          <div className="w-full max-w-xl mx-auto">
            {/* Mobile logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-financial">
                <TrendingUp className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Controle Financeiro</h1>
              <p className="text-muted-foreground mt-2">Análise financeira inteligente</p>
            </div>

            <Card className="shadow-2xl bg-background/95 backdrop-blur-sm border-0 overflow-hidden flex flex-col justify-center items-center min-h-[500px]">
              <Tabs defaultValue="signin" className="w-full">

                <TabsContent value="signin">
                  <form onSubmit={handleSignIn}>
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="flex items-center justify-center gap-2 text-xl">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Fazer Login
                      </CardTitle>
                      <CardDescription>
                        Entre com sua conta para acessar o dashboard
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={signInData.email}
                          onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                          required
                          className="h-11 bg-background/50 border-border/50 focus:bg-background transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="text-sm font-medium">Senha</Label>
                        <Input
                          id="signin-password"
                          type="password"
                          placeholder="Sua senha"
                          value={signInData.password}
                          onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                          required
                          className="h-11 bg-background/50 border-border/50 focus:bg-background transition-colors"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button
                        type="submit"
                        className="w-full h-11 bg-green-700 hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? "Entrando..." : "Entrar"}
                      </Button>
                    </CardFooter>
                  </form>
                </TabsContent>

                {/* <TabsContent value="signup">
                  <form onSubmit={handleSignUp}>
                    <CardHeader className="text-center pb-4">
                      <CardTitle className="flex items-center justify-center gap-2 text-xl">
                        <PieChart className="w-5 h-5 text-primary" />
                        Criar Conta
                      </CardTitle>
                      <CardDescription>
                        Crie sua conta e comece a analisar suas finanças
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-sm font-medium">Nome Completo</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Seu nome completo"
                          value={signUpData.fullName}
                          onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                          required
                          className="h-11 bg-background/50 border-border/50 focus:bg-background transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={signUpData.email}
                          onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                          required
                          className="h-11 bg-background/50 border-border/50 focus:bg-background transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm font-medium">Senha</Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Escolha uma senha forte"
                          value={signUpData.password}
                          onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                          required
                          className="h-11 bg-background/50 border-border/50 focus:bg-background transition-colors"
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-success hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? "Criando conta..." : "Criar Conta"}
                      </Button>
                    </CardFooter>
                  </form>
                </TabsContent> */}
              </Tabs>
            </Card>

            <p className="text-center text-sm text-white mt-6 lg:mt-8">
              Ao criar uma conta, você concorda com nossos termos de serviço
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;