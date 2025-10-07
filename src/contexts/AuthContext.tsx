import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'gestor' | 'rh' | 'dp';
  department: string;
  avatar?: string;
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
  'gestor@empresa.com': {
    password: 'senha123',
    user: {
      id: '1',
      name: 'João Silva',
      email: 'gestor@empresa.com',
      role: 'gestor',
      department: 'Vendas',
    },
  },
  'rh@empresa.com': {
    password: 'senha123',
    user: {
      id: '2',
      name: 'Maria Santos',
      email: 'rh@empresa.com',
      role: 'rh',
      department: 'Recursos Humanos',
    },
  },
  'dp@empresa.com': {
    password: 'senha123',
    user: {
      id: '3',
      name: 'Carlos Oliveira',
      email: 'dp@empresa.com',
      role: 'dp',
      department: 'Departamento Pessoal',
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
