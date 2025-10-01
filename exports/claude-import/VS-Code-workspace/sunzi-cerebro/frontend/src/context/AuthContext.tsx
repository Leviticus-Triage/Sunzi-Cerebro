// AuthContext: Verwaltet den Auth-Status im Frontend.
//
// Hinweis: Die Auth-Architektur verwendet httpOnly- und Secure-Cookies für Access- und Refresh-Tokens.
// Detaillierte Informationen und API-Beispiele: ../../DOCS/auth.md
// Frontend: bitte sicherstellen, dass der HTTP-Client mit `withCredentials: true` konfiguriert ist.
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AuthContextType, AuthState, AuthError } from '../types/auth';
import { authService } from '../services/authService';

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  const checkAuth = useCallback(async () => {
    try {
      const user = await authService.checkAuth();
      setAuthState({
        isAuthenticated: true,
        user,
        loading: false
      });
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    }
  }, []);

  // Überprüfe initialen Auth-Status
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const response = await authService.login({ username, password });
      setAuthState({
        isAuthenticated: true,
        user: response.user,
        loading: false
      });
    } catch (error) {
      const authError = error as AuthError;
      console.error('Login error:', authError);
      throw authError;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false
      });
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};