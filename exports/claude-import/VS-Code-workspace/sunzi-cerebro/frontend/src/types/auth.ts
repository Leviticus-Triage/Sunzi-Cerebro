export interface User {
  id: string;
  username: string;
  email?: string;
  roles?: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  message?: string;
}

export interface LogoutResponse {
  message: string;
}

export interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export interface AuthError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, any>;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}