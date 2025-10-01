/**
 * 🛡️ ENTERPRISE SECURITY SERVICE
 * Production-Grade Security Layer for Sunzi Cerebro Platform
 * Real JWT, RBAC, Audit Logging, Session Management
 */

import axios from 'axios'
import { EventEmitter } from 'events'

// Security Configuration
const SECURITY_CONFIG = {
  API_BASE_URL: 'http://localhost:8890/api',
  JWT_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
  MAX_LOGIN_ATTEMPTS: 5,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  AUDIT_ENDPOINT: '/audit/log',
  CSP_POLICIES: {
    'default-src': ["'self'"],
    'connect-src': ["'self'", 'http://localhost:*', 'ws://localhost:*'],
    'script-src': ["'self'", "'unsafe-inline'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:']
  }
}

// Security Types
export interface SecurityContext {
  user: {
    id: string
    username: string
    role: string
    permissions: string[]
    lastLogin: string
    sessionId: string
  }
  tokens: {
    accessToken: string
    refreshToken: string
    expiresAt: number
  }
  session: {
    id: string
    created: string
    lastActivity: string
    ipAddress: string
    userAgent: string
  }
  audit: {
    logLevel: 'info' | 'warn' | 'error' | 'critical'
    events: SecurityEvent[]
  }
}

export interface SecurityEvent {
  id: string
  type: 'login' | 'logout' | 'permission_check' | 'tool_execution' | 'data_access' | 'error'
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: string
  userId: string
  sessionId: string
  details: {
    action: string
    resource?: string
    outcome: 'success' | 'failure' | 'denied'
    metadata: Record<string, any>
  }
  ipAddress: string
  userAgent: string
}

export interface SecurityPolicy {
  id: string
  name: string
  type: 'rbac' | 'rate_limit' | 'content_filter' | 'session_management'
  enabled: boolean
  rules: {
    conditions: Record<string, any>
    actions: string[]
    priority: number
  }[]
  metadata: {
    created: string
    lastModified: string
    version: string
  }
}

class EnterpriseSecurity extends EventEmitter {
  private context: SecurityContext | null = null
  private refreshTimer: NodeJS.Timeout | null = null
  private sessionTimer: NodeJS.Timeout | null = null
  private auditQueue: SecurityEvent[] = []
  private loginAttempts: Map<string, number> = new Map()

  constructor() {
    super()
    this.initializeSecurity()
  }

  /**
   * Initialize security framework
   */
  private initializeSecurity() {
    this.setupCSP()
    this.setupAxiosInterceptors()
    this.loadStoredSession()
    this.startAuditProcessor()
  }

  /**
   * Setup Content Security Policy
   */
  private setupCSP() {
    if (typeof document !== 'undefined') {
      const cspContent = Object.entries(SECURITY_CONFIG.CSP_POLICIES)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ')

      const metaCSP = document.createElement('meta')
      metaCSP.httpEquiv = 'Content-Security-Policy'
      metaCSP.content = cspContent
      document.head.appendChild(metaCSP)

      console.log('🛡️ Content Security Policy enabled')
    }
  }

  /**
   * Setup Axios interceptors for security
   */
  private setupAxiosInterceptors() {
    // Request interceptor - add auth token
    axios.interceptors.request.use(
      (config) => {
        if (this.context?.tokens.accessToken) {
          config.headers.Authorization = `Bearer ${this.context.tokens.accessToken}`
        }

        // Add correlation ID for audit trail
        config.headers['X-Correlation-ID'] = this.generateCorrelationId()
        config.headers['X-Session-ID'] = this.context?.session.id || 'anonymous'

        // Add CSRF protection
        const csrfToken = this.getCSRFToken()
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken
        }

        return config
      },
      (error) => {
        this.logSecurityEvent('error', 'API request failed', {
          error: error.message,
          outcome: 'failure'
        })
        return Promise.reject(error)
      }
    )

    // Response interceptor - handle token refresh
    axios.interceptors.response.use(
      (response) => {
        // Update last activity
        this.updateLastActivity()
        return response
      },
      async (error) => {
        if (error.response?.status === 401 && this.context) {
          // Try to refresh token
          try {
            await this.refreshTokens()
            // Retry original request
            return axios.request(error.config)
          } catch (refreshError) {
            this.logout()
            this.emit('session_expired')
          }
        }

        this.logSecurityEvent('error', 'API request failed', {
          status: error.response?.status,
          error: error.message,
          outcome: 'failure'
        })

        return Promise.reject(error)
      }
    )
  }

  /**
   * Authenticate user with enterprise security
   */
  async authenticate(username: string, password: string, options?: {
    rememberMe?: boolean
    twoFactor?: string
  }): Promise<SecurityContext> {
    const clientInfo = this.getClientInfo()

    // Check rate limiting
    const attempts = this.loginAttempts.get(clientInfo.ipAddress) || 0
    if (attempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      throw new Error('Too many login attempts. Please try again later.')
    }

    try {
      console.log('🔐 Authenticating user:', username)

      const response = await axios.post(`${SECURITY_CONFIG.API_BASE_URL}/auth/login`, {
        username,
        password,
        clientInfo,
        twoFactor: options?.twoFactor
      })

      if (response.data.success) {
        const { user, tokens, session } = response.data.data

        this.context = {
          user,
          tokens,
          session,
          audit: {
            logLevel: 'info',
            events: []
          }
        }

        // Store session securely
        this.storeSession(options?.rememberMe)

        // Setup token refresh
        this.setupTokenRefresh()

        // Setup session timeout
        this.setupSessionTimeout()

        // Log successful authentication
        this.logSecurityEvent('login', 'User authenticated successfully', {
          userId: user.id,
          outcome: 'success'
        })

        // Clear login attempts
        this.loginAttempts.delete(clientInfo.ipAddress)

        this.emit('authenticated', this.context)
        return this.context

      } else {
        throw new Error(response.data.message || 'Authentication failed')
      }

    } catch (error: any) {
      // Increment login attempts
      this.loginAttempts.set(clientInfo.ipAddress, attempts + 1)

      this.logSecurityEvent('login', 'Authentication failed', {
        username,
        error: error.message,
        outcome: 'failure'
      })

      console.error('❌ Authentication failed:', error.message)
      throw error
    }
  }

  /**
   * Check if user has permission for action
   */
  hasPermission(permission: string, resource?: string): boolean {
    if (!this.context?.user) {
      return false
    }

    const hasPermission = this.context.user.permissions.includes(permission) ||
                         this.context.user.permissions.includes('*') ||
                         (this.context.user.role === 'admin')

    this.logSecurityEvent('permission_check', `Permission check: ${permission}`, {
      permission,
      resource,
      outcome: hasPermission ? 'success' : 'denied'
    })

    return hasPermission
  }

  /**
   * Execute action with security validation
   */
  async executeSecureAction<T>(
    action: () => Promise<T>,
    requiredPermission: string,
    resource?: string
  ): Promise<T> {
    if (!this.hasPermission(requiredPermission, resource)) {
      const error = new Error(`Access denied. Required permission: ${requiredPermission}`)
      this.logSecurityEvent('permission_check', 'Access denied', {
        permission: requiredPermission,
        resource,
        outcome: 'denied'
      })
      throw error
    }

    try {
      const result = await action()

      this.logSecurityEvent('data_access', 'Secure action executed', {
        permission: requiredPermission,
        resource,
        outcome: 'success'
      })

      return result
    } catch (error: any) {
      this.logSecurityEvent('error', 'Secure action failed', {
        permission: requiredPermission,
        resource,
        error: error.message,
        outcome: 'failure'
      })
      throw error
    }
  }

  /**
   * Refresh authentication tokens
   */
  private async refreshTokens(): Promise<void> {
    if (!this.context?.tokens.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await axios.post(`${SECURITY_CONFIG.API_BASE_URL}/auth/refresh`, {
        refreshToken: this.context.tokens.refreshToken
      })

      if (response.data.success) {
        this.context.tokens = response.data.data.tokens
        this.storeSession()
        this.setupTokenRefresh()

        console.log('🔄 Tokens refreshed successfully')
      } else {
        throw new Error('Token refresh failed')
      }

    } catch (error) {
      console.error('❌ Token refresh failed:', error)
      throw error
    }
  }

  /**
   * Setup automatic token refresh
   */
  private setupTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    if (this.context?.tokens.expiresAt) {
      const timeUntilRefresh = this.context.tokens.expiresAt - Date.now() - SECURITY_CONFIG.JWT_REFRESH_THRESHOLD

      if (timeUntilRefresh > 0) {
        this.refreshTimer = setTimeout(() => {
          this.refreshTokens().catch(() => {
            this.logout()
          })
        }, timeUntilRefresh)
      }
    }
  }

  /**
   * Setup session timeout
   */
  private setupSessionTimeout() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer)
    }

    this.sessionTimer = setTimeout(() => {
      this.logout()
      this.emit('session_timeout')
    }, SECURITY_CONFIG.SESSION_TIMEOUT)
  }

  /**
   * Update last activity timestamp
   */
  private updateLastActivity() {
    if (this.context) {
      this.context.session.lastActivity = new Date().toISOString()
      this.setupSessionTimeout() // Reset timeout
    }
  }

  /**
   * Store session securely
   */
  private storeSession(persistent?: boolean) {
    if (!this.context) return

    const sessionData = {
      user: this.context.user,
      tokens: this.context.tokens,
      session: this.context.session
    }

    const storage = persistent ? localStorage : sessionStorage
    storage.setItem('sunzi_security_context', JSON.stringify(sessionData))
  }

  /**
   * Load stored session
   */
  private loadStoredSession() {
    const sessionData = localStorage.getItem('sunzi_security_context') ||
                       sessionStorage.getItem('sunzi_security_context')

    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData)

        // Validate session
        if (parsed.tokens.expiresAt > Date.now()) {
          this.context = {
            ...parsed,
            audit: {
              logLevel: 'info',
              events: []
            }
          }

          this.setupTokenRefresh()
          this.setupSessionTimeout()

          console.log('🔄 Session restored from storage')
          this.emit('session_restored', this.context)
        } else {
          this.clearStoredSession()
        }
      } catch (error) {
        console.error('❌ Failed to restore session:', error)
        this.clearStoredSession()
      }
    }
  }

  /**
   * Clear stored session
   */
  private clearStoredSession() {
    localStorage.removeItem('sunzi_security_context')
    sessionStorage.removeItem('sunzi_security_context')
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      if (this.context?.tokens.accessToken) {
        await axios.post(`${SECURITY_CONFIG.API_BASE_URL}/auth/logout`)
      }
    } catch (error) {
      console.warn('⚠️ Logout API call failed:', error)
    }

    // Clear timers
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer)
      this.sessionTimer = null
    }

    // Log logout event
    if (this.context) {
      this.logSecurityEvent('logout', 'User logged out', {
        outcome: 'success'
      })
    }

    // Clear context and storage
    this.context = null
    this.clearStoredSession()

    this.emit('logged_out')
    console.log('👋 User logged out successfully')
  }

  /**
   * Log security event
   */
  private logSecurityEvent(
    type: SecurityEvent['type'],
    action: string,
    details: Partial<SecurityEvent['details']>
  ) {
    const clientInfo = this.getClientInfo()

    const event: SecurityEvent = {
      id: this.generateCorrelationId(),
      type,
      severity: details.outcome === 'failure' ? 'high' : 'low',
      timestamp: new Date().toISOString(),
      userId: this.context?.user.id || 'anonymous',
      sessionId: this.context?.session.id || 'none',
      details: {
        action,
        outcome: 'success',
        metadata: {},
        ...details
      },
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent
    }

    // Add to context if available
    if (this.context) {
      this.context.audit.events.push(event)
    }

    // Queue for server logging
    this.auditQueue.push(event)

    // Emit for real-time monitoring
    this.emit('security_event', event)

    console.log(`🔒 Security Event: ${type} - ${action}`)
  }

  /**
   * Start audit processor
   */
  private startAuditProcessor() {
    setInterval(() => {
      if (this.auditQueue.length > 0) {
        this.flushAuditLogs()
      }
    }, 5000) // Flush every 5 seconds
  }

  /**
   * Flush audit logs to server
   */
  private async flushAuditLogs() {
    if (this.auditQueue.length === 0) return

    const events = [...this.auditQueue]
    this.auditQueue = []

    try {
      await axios.post(`${SECURITY_CONFIG.API_BASE_URL}${SECURITY_CONFIG.AUDIT_ENDPOINT}`, {
        events
      })
      console.log(`📝 Flushed ${events.length} audit events`)
    } catch (error) {
      console.error('❌ Failed to flush audit logs:', error)
      // Re-queue events
      this.auditQueue.unshift(...events)
    }
  }

  /**
   * Get client information
   */
  private getClientInfo() {
    return {
      ipAddress: '127.0.0.1', // In real app, get from server
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get CSRF token
   */
  private getCSRFToken(): string | null {
    // In real app, get from meta tag or API
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || null
  }

  /**
   * Get current security context
   */
  getContext(): SecurityContext | null {
    return this.context
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.context !== null && this.context.tokens.expiresAt > Date.now()
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.context?.user || null
  }

  /**
   * Get audit events
   */
  getAuditEvents(filter?: {
    type?: SecurityEvent['type']
    severity?: SecurityEvent['severity']
    limit?: number
  }): SecurityEvent[] {
    let events = this.context?.audit.events || []

    if (filter?.type) {
      events = events.filter(e => e.type === filter.type)
    }
    if (filter?.severity) {
      events = events.filter(e => e.severity === filter.severity)
    }
    if (filter?.limit) {
      events = events.slice(-filter.limit)
    }

    return events
  }
}

// Export singleton instance
export const enterpriseSecurity = new EnterpriseSecurity()
export default enterpriseSecurity