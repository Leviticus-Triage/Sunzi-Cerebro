import { 
  LoginCredentials, 
  LoginResponse, 
  LogoutResponse, 
  User,
  AuthError,
  ApiErrorResponse 
} from '../types/auth';
import { api } from '../utils/api';

class AuthService {
  private static instance: AuthService;
  private readonly baseUrl = '/api/auth';

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  public async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      return await api.post<LoginResponse>(`${this.baseUrl}/login`, credentials);
    } catch (error: any) {
      this.handleAuthError(error);
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      await api.post<LogoutResponse>(`${this.baseUrl}/logout`);
    } catch (error) {
      console.error('Logout error:', error);
      // Lokaler Logout sollte trotzdem durchgeführt werden
    }
  }

  public async checkAuth(): Promise<User> {
    try {
      return await api.get<User>(`${this.baseUrl}/me`);
    } catch (error) {
      this.handleAuthError(error);
      throw error;
    }
  }

  private handleAuthError(error: any): never {
    const apiError = error.response?.data as ApiErrorResponse;
    const authError = new Error(
      apiError?.message || 'Ein Authentifizierungsfehler ist aufgetreten'
    ) as AuthError;
    
    authError.code = apiError?.code;
    authError.statusCode = error.response?.status;
    authError.details = apiError?.details;
    
    throw authError;
  }
}

export const authService = AuthService.getInstance();