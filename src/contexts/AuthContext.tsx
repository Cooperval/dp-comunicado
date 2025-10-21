import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  matricula: string;
  name: string;
  email: string;
  role: 'gestor' | 'rh' | 'dp' | 'admin';
  department: string;
  avatar?: string;
  allowedApps: string[];
  active: boolean;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for frontend simulation
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'admin@empresa.com': {
    password: 'admin123',
    user: {
      id: '0',
      matricula: '0001',
      name: 'Admin Sistema',
      email: 'admin@empresa.com',
      role: 'admin',
      department: 'Tecnologia da Informação',
      allowedApps: ['controle-ponto', 'avaliacao', 'admin'],
      active: true,
      createdAt: new Date().toISOString(),
    },
  },
  'gestor@empresa.com': {
    password: 'senha123',
    user: {
      id: '1',
      matricula: '1001',
      name: 'João Silva',
      email: 'gestor@empresa.com',
      role: 'gestor',
      department: 'Vendas',
      allowedApps: ['controle-ponto', 'avaliacao'],
      active: true,
      createdAt: new Date().toISOString(),
    },
  },
  'rh@empresa.com': {
    password: 'senha123',
    user: {
      id: '2',
      matricula: '2001',
      name: 'Maria Santos',
      email: 'rh@empresa.com',
      role: 'rh',
      department: 'Recursos Humanos',
      allowedApps: ['controle-ponto', 'avaliacao'],
      active: true,
      createdAt: new Date().toISOString(),
    },
  },
  'dp@empresa.com': {
    password: 'senha123',
    user: {
      id: '3',
      matricula: '3001',
      name: 'Carlos Oliveira',
      email: 'dp@empresa.com',
      role: 'dp',
      department: 'Departamento Pessoal',
      allowedApps: ['controle-ponto'],
      active: true,
      createdAt: new Date().toISOString(),
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('auth_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockUser = MOCK_USERS[email.toLowerCase()];

    if (!mockUser || mockUser.password !== password) {
      return { success: false, error: 'Email ou senha inválidos' };
    }

    setUser(mockUser.user);
    localStorage.setItem('auth_user', JSON.stringify(mockUser.user));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
