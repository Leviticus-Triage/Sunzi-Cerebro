/**
 * Production Authentication Service
 * Integrates with SQLite Production Backend
 * Part of Sunzi Cerebro Enterprise Security Platform
 */

// Types for Authentication
export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  organization_id?: string;
  organization_name?: string;
  firstName?: string;
  lastName?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    preferences?: Record<string, any>;
  };
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  organization_name: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
    tokenType: string;
    expiresIn: string;
  };
  error?: string;
  errors?: string[];
}

export interface TokenValidationResponse {
  success: boolean;
  valid: boolean;
  message: string;
  data?: {
    user: User;
  };
}

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8890';
const TOKEN_KEY = 'sunzi_cerebro_token';
const USER_KEY = 'sunzi_cerebro_user';

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Initialize with stored data
    this.token = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem(USER_KEY);
      }
    }
  }

  /**
   * User Registration with Production Backend
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Store token and user data
        this.token = result.data.token;
        this.user = result.data.user;

        localStorage.setItem(TOKEN_KEY, this.token);
        localStorage.setItem(USER_KEY, JSON.stringify(this.user));
      }

      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Network error during registration',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * User Login with Production Backend
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Store token and user data
        this.token = result.data.token;
        this.user = result.data.user;

        localStorage.setItem(TOKEN_KEY, this.token);
        localStorage.setItem(USER_KEY, JSON.stringify(this.user));

        // Update user's last login
        if (this.user) {
          this.user.lastLogin = new Date().toISOString();
          localStorage.setItem(USER_KEY, JSON.stringify(this.user));
        }
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error during login',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate current token with backend
   */
  async validateToken(): Promise<TokenValidationResponse> {
    if (!this.token) {
      return {
        success: false,
        valid: false,
        message: 'No token available'
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success && result.valid && result.data) {
        // Update user data from validation response
        this.user = result.data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(this.user));
      } else if (!result.valid) {
        // Token is invalid, clear stored data
        this.clearAuth();
      }

      return result;
    } catch (error) {
      console.error('Token validation error:', error);
      return {
        success: false,
        valid: false,
        message: 'Network error during token validation',
      };
    }
  }

  /**
   * Logout user and clear session
   */
  async logout(): Promise<void> {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<AuthResponse> {
    if (!this.token) {
      return {
        success: false,
        message: 'No token available for refresh'
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: this.token }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Update token
        this.token = result.data.token;
        localStorage.setItem(TOKEN_KEY, this.token);
      } else {
        // Refresh failed, clear auth
        this.clearAuth();
      }

      return result;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearAuth();
      return {
        success: false,
        message: 'Network error during token refresh',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current user profile
   */
  async getUserProfile(): Promise<{ success: boolean; data?: { user: User }; message?: string }> {
    if (!this.token) {
      return {
        success: false,
        message: 'Not authenticated'
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        this.user = result.data.user;
        localStorage.setItem(USER_KEY, JSON.stringify(this.user));
      }

      return result;
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        message: 'Network error retrieving user profile'
      };
    }
  }

  /**
   * Clear authentication data
   */
  private clearAuth(): void {
    this.token = null;
    this.user = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!(this.token && this.user);
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.user;
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get authorization header
   */
  getAuthHeader(): Record<string, string> {
    if (this.token) {
      return {
        'Authorization': `Bearer ${this.token}`
      };
    }
    return {};
  }

  /**
   * Check if user has specific role
   */
  hasRole(role: string): boolean {
    return this.user?.role === role;
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    return this.user?.permissions?.includes(permission) || this.user?.permissions?.includes('all') || false;
  }

  /**
   * Check if user is admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin') || this.hasRole('super_admin');
  }

  /**
   * Get authentication status
   */
  async getAuthStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Get auth status error:', error);
      return {
        success: false,
        message: 'Network error retrieving auth status'
      };
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService;

// Export for convenience
export { authService };