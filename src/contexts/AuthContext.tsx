// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  // múltiplos roles (cada app pode atribuir 0..N roles ao usuário)
  roles?: string[];
  // opcional: departamento do usuário
  department?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  acessos: any[]; // tipar conforme a estrutura real dos acessos
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    login: string,
    password: string
  ) => Promise<
    | { success: true; user: User; token: string | null; id?: string; loginRaw?: string; email?: string }
    | { success: false; error: string }
  >;
  logout: () => void;
  refreshAcessos: () => Promise<void>;
}

const STORAGE_USER_KEY = 'auth_user';
const STORAGE_TOKEN_KEY = 'auth_token';
const STORAGE_ACESSOS_KEY = 'auth_acessos';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [acessos, setAcessos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  //console.log('AuthProvider render, user:', user, 'token:', token, 'acessos:', acessos);

  // validateToken (única versão, limpa)
  const validateToken = useCallback(async (tokenToValidate?: string | null) => {
    if (!tokenToValidate) return false;

    const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
    if (!urlApi) return false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const resp = await fetch(`${urlApi}/logon/token`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${tokenToValidate}` },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return resp.ok;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.warn("Timeout ao validar token");
      }
      return false;
    }
  }, []);

  // Single restore effect: lê localStorage, valida token e só então seta estado.
  // Garantimos setIsLoading(true) até terminar, e fazemos cleanup seguro.
  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      if (typeof window === 'undefined') {
        if (mounted) setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const sUser = localStorage.getItem(STORAGE_USER_KEY);
        const sToken = localStorage.getItem(STORAGE_TOKEN_KEY);
        const sAcessos = localStorage.getItem(STORAGE_ACESSOS_KEY);

        // se não tem token, restaura apenas o que faz sentido (ou limpa)
        if (!sToken) {
          if (mounted) {
            if (sUser) setUser(JSON.parse(sUser));
            if (sAcessos) setAcessos(JSON.parse(sAcessos));
            setIsLoading(false);
          }
          return;
        }

        // valida token antes de povoar estado sensível
        const valid = await validateToken(sToken);

        if (!valid) {
          console.warn('[AuthContext] Token inválido/expirado. Limpando sessão.');
          // garante limpeza localmente
          localStorage.removeItem(STORAGE_TOKEN_KEY);
          localStorage.removeItem(STORAGE_USER_KEY);
          localStorage.removeItem(STORAGE_ACESSOS_KEY);
          if (mounted) {
            setUser(null);
            setToken(null);
            setAcessos([]);
            setIsLoading(false);
          }
          return;
        }

        // token válido → restaura estado
        if (mounted) {
          if (sUser) setUser(JSON.parse(sUser));
          setToken(sToken);
          if (sAcessos) setAcessos(JSON.parse(sAcessos));
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[AuthContext] Erro ao restaurar sessão:', err);
        // em caso de erro, limpa para evitar inconsistência
        try {
          localStorage.removeItem(STORAGE_TOKEN_KEY);
        } catch { }
        if (mounted) {
          setUser(null);
          setToken(null);
          setAcessos([]);
          setIsLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, [validateToken]);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setAcessos([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_ACESSOS_KEY);
    }
  }, []);


  useEffect(() => {
    if (!token) return;

    // Verifica o token a cada 5 minutos enquanto estiver logado
    const interval = setInterval(async () => {
      const stillValid = await validateToken(token);
      if (!stillValid) {
        console.warn("[AuthContext] Token expirou durante a sessão. Deslogando...");
        logout(); // ← força logout automático
        // Toast será mostrado via redirect para login
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [token, validateToken, logout]);


  const safe = <T, K extends keyof T>(obj: T | undefined, key: K, fallback: T[K] | undefined) =>
    (obj && obj[key]) ?? fallback;

  // função que busca acessos no backend — usa token atual e user.id
  const fetchAcessos = useCallback(async (userId?: string, tokenToUse?: string) => {
    console.group(`[AuthContext] fetchAcessos(${userId})`);
    if (!userId || !tokenToUse) {
      console.warn('Sem userId/token — limpando acessos.');
      setAcessos([]);
      localStorage.removeItem(STORAGE_ACESSOS_KEY);
      console.groupEnd();
      return;
    }

    try {
      const urlApi = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');
      // console.log('URL API:', urlApi);

      if (!urlApi) {
        console.warn('⚠️ VITE_API_URL não configurada — não buscar acessos.');
        console.groupEnd();
        return;
      }

      // console.log('📡 Buscando acessos...', { id: userId });

      const res = await fetch(`${urlApi}/portal/acessos-portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenToUse}`,
        },
        body: JSON.stringify({ id: userId }),
      });

      // console.log('Resposta HTTP:', res.status);

      if (!res.ok) {
        console.warn('Falha ao buscar acessos:', res.status);
        setAcessos([]);
        console.groupEnd();
        return;
      }

      const data = await res.json();
      // console.log('📦 Dados de acessos recebidos:', data);

      const acessosData = Array.isArray(data) ? data : data?.acessos ?? [];
      setAcessos(acessosData);

      localStorage.setItem(STORAGE_ACESSOS_KEY, JSON.stringify(acessosData));
      // console.log('✅ Acessos salvos no estado/localStorage');
    } catch (err) {
      console.error('❌ Erro ao buscar acessos:', err);
      setAcessos([]);
    } finally {
      console.groupEnd();
    }
  }, []);

  // exposto para ser usado externamente
  const refreshAcessos = useCallback(async () => {
    // console.log('[AuthContext] refreshAcessos()');
    const currentId = user?.id;
    const currentToken = token;
    await fetchAcessos(currentId, currentToken ?? '');
  }, [user, token, fetchAcessos]);

  const login = useCallback(
    async (
      loginParam: string,
      password: string
    ): Promise<
      | { success: true; user: User; token: string | null; id?: string; loginRaw?: string; email?: string }
      | { success: false; error: string }
    > => {
      console.group('[AuthContext] login');
      const urlApi = import.meta.env.VITE_API_URL;

      if (!urlApi) {
        console.error('❌ VITE_API_URL não configurada');
        console.groupEnd();
        return { success: false, error: 'API URL não configurada' };
      }

      const baseUrl = String(urlApi).replace(/\/+$/, '');
      const fullUrl = `${baseUrl}/logon`;
      // console.log('📡 Enviando login para:', fullUrl);

      try {
        const resp = await fetch(fullUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login: loginParam.toLowerCase(), senha: password }),
        });

        // console.log('Resposta HTTP login:', resp.status);
        const data = await resp.json().catch(() => ({}));
        // console.log('📦 Dados recebidos no login:', data);

        if (!resp.ok) {
          const msg = (data && (data.error || data.mensagem || data.message)) || 'Credenciais inválidas';
          return { success: false, error: msg };
        }

        const receivedToken: string | undefined = safe(data as any, 'token' as any, undefined as any) as any;
        const idRaw = String(safe(data as any, 'id_usuario' as any, safe(data as any, 'id' as any, '')) || '');
        const loginRaw = String(safe(data as any, 'login' as any, safe(data as any, 'LOGON' as any, loginParam)) || '');
        const emailRaw = String(safe(data as any, 'email' as any, '') || '');
        const nomeRaw = String(safe(data as any, 'nome' as any, '') || '');
        const rolesRaw: string[] | undefined = (data && data.roles) ? data.roles : undefined; // backend pode já enviar roles

        const userFromApi: User = {
          id: idRaw || loginRaw,
          name: nomeRaw || loginRaw,
          email: emailRaw || '',
          roles: Array.isArray(rolesRaw) ? rolesRaw : undefined,
        };

        if (!receivedToken && (!userFromApi.id || userFromApi.id === '')) {
          return { success: false, error: 'Resposta do servidor inválida' };
        }

        // console.log('✅ Usuário autenticado:', userFromApi);

        // salva estado
        setUser(userFromApi);
        setToken(receivedToken ?? null);

        // persiste
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(userFromApi));
            if (receivedToken) localStorage.setItem(STORAGE_TOKEN_KEY, receivedToken);
            else localStorage.removeItem(STORAGE_TOKEN_KEY);
          } catch (e) {
            console.warn('Falha ao salvar sessão no localStorage', e);
          }
        }

        // BUSCA ACESSOS imediatamente após login (usando token e id retornados)
        // note: não aguardamos fatalmente; aguardamos para garantir acessos prontos
        await fetchAcessos(userFromApi.id, receivedToken ?? '');

        // retorna para o chamador
        return {
          success: true,
          user: userFromApi,
          token: receivedToken ?? null,
          id: idRaw || undefined,
          loginRaw: loginRaw || undefined,
          email: emailRaw || undefined,
        };
      } catch (err) {
        console.error('Erro na chamada da API de login:', err);
        return { success: false, error: 'Erro de conexão com o servidor' };
      }
    },
    [fetchAcessos]
  );



  const value = useMemo(
    () => ({
      user,
      token,
      acessos,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshAcessos,
    }),
    [user, token, acessos, isLoading, login, logout, refreshAcessos]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
