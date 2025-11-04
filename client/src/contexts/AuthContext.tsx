import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, type User } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phoneNumber: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await apiClient.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        apiClient.clearToken();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (phoneNumber: string, password: string) => {
    const { token, user: userData } = await apiClient.login(phoneNumber, password);
    apiClient.setToken(token);
    setUser(userData);
  };

  const logout = () => {
    apiClient.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAuthenticated: !!user
    }}>
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
