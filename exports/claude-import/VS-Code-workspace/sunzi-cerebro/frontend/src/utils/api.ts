import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { AuthError, ApiErrorResponse } from '../types/auth';

interface ApiRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

class ApiClient {
  private static instance: ApiClient;
  private api: AxiosInstance;

  private constructor() {
    this.api = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Wichtig für Cookie-Handling
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors(): void {
    // Request Interceptor
    this.api.interceptors.request.use(
      (config: ApiRequestConfig) => {
        // Keine Token-Header mehr nötig, da wir Cookies verwenden
        return config;
      },
      (error: AxiosError) => Promise.reject(error)
    );

    // Response Interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as ApiRequestConfig;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.api.post('/auth/refresh');
            return this.api(originalRequest);
          } catch (refreshError) {
            // Bei Refresh-Fehler zum Login weiterleiten
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Error-Handling (typisiert)
        const data = error.response?.data as ApiErrorResponse | undefined;

        const authError = new Error(data?.message ?? 'Ein Fehler ist aufgetreten') as AuthError;
        authError.code = data?.code;
        authError.statusCode = error.response?.status;
        authError.details = data?.details;

        return Promise.reject(authError);
      }
    );
  }

  // Public API methods
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.get<T>(url, config);
    return response.data;
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.post<T>(url, data, config);
    return response.data;
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.put<T>(url, data, config);
    return response.data;
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.api.delete<T>(url, config);
    return response.data;
  }
}

export const api = ApiClient.getInstance();