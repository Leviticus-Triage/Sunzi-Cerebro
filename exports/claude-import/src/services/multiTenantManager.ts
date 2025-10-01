/**
 * 🏢 MULTI-TENANT MANAGEMENT SERVICE
 * Enterprise-Grade Organizational Architecture
 * Tenant Isolation, Resource Management, Policy Enforcement
 */

import { EventEmitter } from 'events'
import enterpriseSecurity from './enterpriseSecurity'

// Multi-Tenant Configuration
const TENANT_CONFIG = {
  MAX_TENANTS: 100,
  DEFAULT_RESOURCE_LIMITS: {
    toolExecutions: 1000,
    dataRetention: 90, // days
    concurrentUsers: 50,
    apiRequests: 10000, // per hour
    storageQuota: 1024 * 1024 * 1024 // 1GB
  },
  SUBSCRIPTION_TIERS: {
    starter: {
      toolExecutions: 500,
      concurrentUsers: 10,
      dataRetention: 30,
      apiRequests: 2500,
      features: ['basic_tools', 'standard_reporting']
    },
    professional: {
      toolExecutions: 2500,
      concurrentUsers: 25,
      dataRetention: 90,
      apiRequests: 7500,
      features: ['advanced_tools', 'ai_recommendations', 'analytics_dashboard']
    },
    enterprise: {
      toolExecutions: 10000,
      concurrentUsers: 100,
      dataRetention: 365,
      apiRequests: 25000,
      features: ['all_tools', 'custom_workflows', 'compliance_reporting', 'api_access']
    }
  }
}

// Multi-Tenant Types
export interface Tenant {
  id: string
  name: string
  domain: string
  subscription: {
    tier: 'starter' | 'professional' | 'enterprise'
    status: 'active' | 'suspended' | 'trial' | 'expired'
    validUntil: string
    billingContact: string
  }
  configuration: {
    branding: {
      logo?: string
      primaryColor: string
      secondaryColor: string
      companyName: string
    }
    security: {
      enforced2FA: boolean
      passwordPolicy: {
        minLength: number
        requireSpecialChars: boolean
        requireNumbers: boolean
        expirationDays: number
      }
      ipWhitelist: string[]
      allowedDomains: string[]
    }
    features: {
      enabledModules: string[]
      customTools: boolean
      apiAccess: boolean
      complianceReporting: boolean
    }
  }
  resourceUsage: {
    toolExecutions: {
      current: number
      limit: number
      resetDate: string
    }
    storage: {
      used: number
      limit: number
    }
    activeUsers: number
    maxUsers: number
  }
  metadata: {
    created: string
    lastActive: string
    owner: string
    adminUsers: string[]
  }
}

export interface Organization {
  id: string
  tenantId: string
  name: string
  type: 'department' | 'team' | 'project' | 'subsidiary'
  parent?: string
  settings: {
    toolAccess: string[]
    dataSharing: 'none' | 'read' | 'write'
    reportingLevel: 'basic' | 'detailed' | 'executive'
  }
  members: Array<{
    userId: string
    role: 'member' | 'admin' | 'owner'
    permissions: string[]
    joinedAt: string
  }>
  created: string
  lastModified: string
}

export interface TenantUser {
  id: string
  tenantId: string
  organizationIds: string[]
  profile: {
    username: string
    email: string
    firstName: string
    lastName: string
    avatar?: string
    timezone: string
    language: string
  }
  roles: Array<{
    organizationId: string
    role: 'viewer' | 'analyst' | 'pentester' | 'admin' | 'owner'
    permissions: string[]
    grantedBy: string
    grantedAt: string
  }>
  preferences: {
    dashboardLayout: string
    notifications: {
      email: boolean
      browser: boolean
      mobile: boolean
    }
    reportingFrequency: 'real-time' | 'daily' | 'weekly'
  }
  lastLogin: string
  status: 'active' | 'inactive' | 'suspended'
}

export interface ResourceQuota {
  tenantId: string
  resource: 'tool_executions' | 'storage' | 'api_requests' | 'concurrent_users'
  current: number
  limit: number
  period: 'hour' | 'day' | 'month'
  resetAt: string
  warningThreshold: number
  enforced: boolean
}

export interface TenantAuditLog {
  id: string
  tenantId: string
  organizationId?: string
  userId: string
  action: string
  resource: string
  details: Record<string, any>
  timestamp: string
  ipAddress: string
  userAgent: string
  outcome: 'success' | 'failure' | 'partial'
}

class MultiTenantManager extends EventEmitter {
  private tenants: Map<string, Tenant> = new Map()
  private organizations: Map<string, Organization> = new Map()
  private users: Map<string, TenantUser> = new Map()
  private resourceQuotas: Map<string, ResourceQuota[]> = new Map()
  private auditLogs: TenantAuditLog[] = []
  private currentTenant: string | null = null

  constructor() {
    super()
    this.initializeMultiTenant()
  }

  /**
   * Initialize multi-tenant system
   */
  private initializeMultiTenant() {
    console.log('🏢 Initializing Multi-Tenant Management System...')
    this.loadTenantData()
    this.setupResourceMonitoring()
    this.initializeDefaultTenant()
  }

  /**
   * Create new tenant
   */
  async createTenant(tenantData: {
    name: string
    domain: string
    tier: 'starter' | 'professional' | 'enterprise'
    owner: {
      username: string
      email: string
      firstName: string
      lastName: string
    }
    branding?: {
      logo?: string
      primaryColor?: string
      companyName?: string
    }
  }): Promise<Tenant> {
    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Validate domain uniqueness
    const existingTenant = Array.from(this.tenants.values())
      .find(t => t.domain === tenantData.domain)
    if (existingTenant) {
      throw new Error(`Domain ${tenantData.domain} is already registered`)
    }

    // Get subscription configuration
    const subscriptionConfig = TENANT_CONFIG.SUBSCRIPTION_TIERS[tenantData.tier]

    const tenant: Tenant = {
      id: tenantId,
      name: tenantData.name,
      domain: tenantData.domain,
      subscription: {
        tier: tenantData.tier,
        status: 'trial',
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days trial
        billingContact: tenantData.owner.email
      },
      configuration: {
        branding: {
          logo: tenantData.branding?.logo,
          primaryColor: tenantData.branding?.primaryColor || '#00327c',
          secondaryColor: '#f8faff',
          companyName: tenantData.branding?.companyName || tenantData.name
        },
        security: {
          enforced2FA: tenantData.tier === 'enterprise',
          passwordPolicy: {
            minLength: 12,
            requireSpecialChars: true,
            requireNumbers: true,
            expirationDays: tenantData.tier === 'enterprise' ? 90 : 180
          },
          ipWhitelist: [],
          allowedDomains: [tenantData.domain]
        },
        features: {
          enabledModules: subscriptionConfig.features,
          customTools: tenantData.tier === 'enterprise',
          apiAccess: tenantData.tier !== 'starter',
          complianceReporting: tenantData.tier === 'enterprise'
        }
      },
      resourceUsage: {
        toolExecutions: {
          current: 0,
          limit: subscriptionConfig.toolExecutions,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        storage: {
          used: 0,
          limit: TENANT_CONFIG.DEFAULT_RESOURCE_LIMITS.storageQuota
        },
        activeUsers: 0,
        maxUsers: subscriptionConfig.concurrentUsers
      },
      metadata: {
        created: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        owner: tenantData.owner.email,
        adminUsers: [tenantData.owner.email]
      }
    }

    // Create tenant owner user
    await this.createTenantUser(tenantId, {
      username: tenantData.owner.username,
      email: tenantData.owner.email,
      firstName: tenantData.owner.firstName,
      lastName: tenantData.owner.lastName,
      role: 'owner',
      organizationId: 'default'
    })

    // Create default organization
    await this.createOrganization(tenantId, {
      name: 'Default Organization',
      type: 'department'
    })

    this.tenants.set(tenantId, tenant)
    this.setupTenantResourceQuotas(tenantId, tenant.subscription.tier)

    this.logAuditEvent({
      tenantId,
      userId: 'system',
      action: 'tenant_created',
      resource: 'tenant',
      details: { tenantName: tenant.name, tier: tenant.subscription.tier },
      outcome: 'success'
    })

    this.emit('tenant_created', tenant)
    console.log(`🏢 Created new tenant: ${tenant.name} (${tenant.id})`)

    return tenant
  }

  /**
   * Create organization within tenant
   */
  async createOrganization(tenantId: string, orgData: {
    name: string
    type: 'department' | 'team' | 'project' | 'subsidiary'
    parent?: string
  }): Promise<Organization> {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    const orgId = `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const organization: Organization = {
      id: orgId,
      tenantId,
      name: orgData.name,
      type: orgData.type,
      parent: orgData.parent,
      settings: {
        toolAccess: tenant.configuration.features.enabledModules,
        dataSharing: 'read',
        reportingLevel: 'detailed'
      },
      members: [],
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    }

    this.organizations.set(orgId, organization)

    this.logAuditEvent({
      tenantId,
      organizationId: orgId,
      userId: 'system',
      action: 'organization_created',
      resource: 'organization',
      details: { orgName: organization.name, type: organization.type },
      outcome: 'success'
    })

    this.emit('organization_created', organization)
    return organization
  }

  /**
   * Create tenant user
   */
  async createTenantUser(tenantId: string, userData: {
    username: string
    email: string
    firstName: string
    lastName: string
    role: 'viewer' | 'analyst' | 'pentester' | 'admin' | 'owner'
    organizationId: string
  }): Promise<TenantUser> {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    // Check user limit
    const tenantUsers = Array.from(this.users.values()).filter(u => u.tenantId === tenantId)
    if (tenantUsers.length >= tenant.resourceUsage.maxUsers) {
      throw new Error(`User limit reached for tenant ${tenantId}`)
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const user: TenantUser = {
      id: userId,
      tenantId,
      organizationIds: [userData.organizationId],
      profile: {
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        timezone: 'UTC',
        language: 'en'
      },
      roles: [{
        organizationId: userData.organizationId,
        role: userData.role,
        permissions: this.getRolePermissions(userData.role),
        grantedBy: 'system',
        grantedAt: new Date().toISOString()
      }],
      preferences: {
        dashboardLayout: 'default',
        notifications: {
          email: true,
          browser: true,
          mobile: false
        },
        reportingFrequency: 'daily'
      },
      lastLogin: new Date().toISOString(),
      status: 'active'
    }

    this.users.set(userId, user)

    // Add user to organization
    const organization = this.organizations.get(userData.organizationId)
    if (organization) {
      organization.members.push({
        userId,
        role: userData.role === 'owner' ? 'owner' : 'member',
        permissions: this.getRolePermissions(userData.role),
        joinedAt: new Date().toISOString()
      })
    }

    this.logAuditEvent({
      tenantId,
      organizationId: userData.organizationId,
      userId: 'system',
      action: 'user_created',
      resource: 'user',
      details: { username: userData.username, role: userData.role },
      outcome: 'success'
    })

    this.emit('user_created', user)
    return user
  }

  /**
   * Switch tenant context
   */
  switchTenant(tenantId: string): boolean {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      console.error(`❌ Tenant ${tenantId} not found`)
      return false
    }

    if (tenant.subscription.status !== 'active' && tenant.subscription.status !== 'trial') {
      console.error(`❌ Tenant ${tenantId} is ${tenant.subscription.status}`)
      return false
    }

    this.currentTenant = tenantId
    this.emit('tenant_switched', tenant)
    console.log(`🔄 Switched to tenant: ${tenant.name}`)
    return true
  }

  /**
   * Check resource quota
   */
  checkResourceQuota(tenantId: string, resource: 'tool_executions' | 'storage' | 'api_requests'): {
    allowed: boolean
    current: number
    limit: number
    remaining: number
  } {
    const quotas = this.resourceQuotas.get(tenantId) || []
    const quota = quotas.find(q => q.resource === resource)

    if (!quota) {
      return { allowed: true, current: 0, limit: Infinity, remaining: Infinity }
    }

    const remaining = quota.limit - quota.current
    const allowed = !quota.enforced || remaining > 0

    return {
      allowed,
      current: quota.current,
      limit: quota.limit,
      remaining: Math.max(0, remaining)
    }
  }

  /**
   * Consume resource quota
   */
  consumeResourceQuota(tenantId: string, resource: 'tool_executions' | 'storage' | 'api_requests', amount: number = 1): boolean {
    const quotas = this.resourceQuotas.get(tenantId) || []
    const quotaIndex = quotas.findIndex(q => q.resource === resource)

    if (quotaIndex === -1) {
      return true // No quota configured
    }

    const quota = quotas[quotaIndex]

    if (quota.enforced && quota.current + amount > quota.limit) {
      this.emit('quota_exceeded', { tenantId, resource, current: quota.current, limit: quota.limit })
      return false
    }

    quota.current += amount

    // Check warning threshold
    const usagePercentage = (quota.current / quota.limit) * 100
    if (usagePercentage >= quota.warningThreshold) {
      this.emit('quota_warning', { tenantId, resource, usagePercentage, quota })
    }

    return true
  }

  /**
   * Get tenant configuration
   */
  getTenantConfiguration(tenantId?: string): Tenant | null {
    const targetTenantId = tenantId || this.currentTenant
    if (!targetTenantId) return null

    return this.tenants.get(targetTenantId) || null
  }

  /**
   * Get tenant users
   */
  getTenantUsers(tenantId: string): TenantUser[] {
    return Array.from(this.users.values()).filter(user => user.tenantId === tenantId)
  }

  /**
   * Get tenant organizations
   */
  getTenantOrganizations(tenantId: string): Organization[] {
    return Array.from(this.organizations.values()).filter(org => org.tenantId === tenantId)
  }

  /**
   * Update tenant subscription
   */
  async updateTenantSubscription(tenantId: string, updates: {
    tier?: 'starter' | 'professional' | 'enterprise'
    status?: 'active' | 'suspended' | 'trial' | 'expired'
    validUntil?: string
  }): Promise<void> {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    if (updates.tier) {
      tenant.subscription.tier = updates.tier
      tenant.configuration.features.enabledModules = TENANT_CONFIG.SUBSCRIPTION_TIERS[updates.tier].features
      this.setupTenantResourceQuotas(tenantId, updates.tier)
    }

    if (updates.status) {
      tenant.subscription.status = updates.status
    }

    if (updates.validUntil) {
      tenant.subscription.validUntil = updates.validUntil
    }

    this.logAuditEvent({
      tenantId,
      userId: 'system',
      action: 'subscription_updated',
      resource: 'tenant',
      details: updates,
      outcome: 'success'
    })

    this.emit('subscription_updated', tenant)
  }

  /**
   * Setup tenant resource quotas
   */
  private setupTenantResourceQuotas(tenantId: string, tier: 'starter' | 'professional' | 'enterprise') {
    const config = TENANT_CONFIG.SUBSCRIPTION_TIERS[tier]
    const quotas: ResourceQuota[] = [
      {
        tenantId,
        resource: 'tool_executions',
        current: 0,
        limit: config.toolExecutions,
        period: 'month',
        resetAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        warningThreshold: 80,
        enforced: true
      },
      {
        tenantId,
        resource: 'api_requests',
        current: 0,
        limit: config.apiRequests,
        period: 'hour',
        resetAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        warningThreshold: 90,
        enforced: true
      },
      {
        tenantId,
        resource: 'concurrent_users',
        current: 0,
        limit: config.concurrentUsers,
        period: 'hour',
        resetAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        warningThreshold: 85,
        enforced: true
      }
    ]

    this.resourceQuotas.set(tenantId, quotas)
  }

  /**
   * Get role permissions
   */
  private getRolePermissions(role: string): string[] {
    const permissions: Record<string, string[]> = {
      viewer: ['read:dashboard', 'read:reports'],
      analyst: ['read:dashboard', 'read:reports', 'read:analytics', 'execute:basic_tools'],
      pentester: ['read:dashboard', 'read:reports', 'read:analytics', 'execute:all_tools', 'create:workflows'],
      admin: ['read:*', 'write:*', 'execute:*', 'manage:users', 'manage:organizations'],
      owner: ['*']
    }

    return permissions[role] || permissions.viewer
  }

  /**
   * Setup resource monitoring
   */
  private setupResourceMonitoring() {
    setInterval(() => {
      this.resetExpiredQuotas()
      this.monitorResourceUsage()
    }, 60000) // Every minute
  }

  /**
   * Reset expired quotas
   */
  private resetExpiredQuotas() {
    const now = new Date()

    for (const [tenantId, quotas] of this.resourceQuotas.entries()) {
      quotas.forEach(quota => {
        if (new Date(quota.resetAt) <= now) {
          quota.current = 0

          // Set next reset time
          const resetInterval = quota.period === 'hour' ? 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000
          quota.resetAt = new Date(now.getTime() + resetInterval).toISOString()

          this.emit('quota_reset', { tenantId, resource: quota.resource })
        }
      })
    }
  }

  /**
   * Monitor resource usage
   */
  private monitorResourceUsage() {
    for (const [tenantId, tenant] of this.tenants.entries()) {
      // Update active users count
      const activeUsers = Array.from(this.users.values())
        .filter(user => user.tenantId === tenantId && user.status === 'active')
        .length

      tenant.resourceUsage.activeUsers = activeUsers

      // Check for subscription expiration
      if (new Date(tenant.subscription.validUntil) <= new Date()) {
        tenant.subscription.status = 'expired'
        this.emit('subscription_expired', tenant)
      }
    }
  }

  /**
   * Load tenant data
   */
  private loadTenantData() {
    // Initialize with sample data for development
    console.log('📊 Loading tenant configuration data...')
  }

  /**
   * Initialize default tenant
   */
  private initializeDefaultTenant() {
    // Create a default tenant for single-tenant mode
    const defaultTenant: Tenant = {
      id: 'default',
      name: 'Sunzi Cerebro Default',
      domain: 'localhost',
      subscription: {
        tier: 'enterprise',
        status: 'active',
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        billingContact: 'admin@localhost'
      },
      configuration: {
        branding: {
          primaryColor: '#00327c',
          secondaryColor: '#f8faff',
          companyName: 'Sunzi Cerebro Security'
        },
        security: {
          enforced2FA: false,
          passwordPolicy: {
            minLength: 8,
            requireSpecialChars: false,
            requireNumbers: false,
            expirationDays: 365
          },
          ipWhitelist: [],
          allowedDomains: ['localhost']
        },
        features: {
          enabledModules: TENANT_CONFIG.SUBSCRIPTION_TIERS.enterprise.features,
          customTools: true,
          apiAccess: true,
          complianceReporting: true
        }
      },
      resourceUsage: {
        toolExecutions: {
          current: 0,
          limit: 10000,
          resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        storage: {
          used: 0,
          limit: TENANT_CONFIG.DEFAULT_RESOURCE_LIMITS.storageQuota
        },
        activeUsers: 1,
        maxUsers: 100
      },
      metadata: {
        created: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        owner: 'admin@localhost',
        adminUsers: ['admin@localhost']
      }
    }

    this.tenants.set('default', defaultTenant)
    this.setupTenantResourceQuotas('default', 'enterprise')
    this.currentTenant = 'default'

    console.log('🏢 Default tenant initialized')
  }

  /**
   * Log audit event
   */
  private logAuditEvent(event: {
    tenantId: string
    organizationId?: string
    userId: string
    action: string
    resource: string
    details: Record<string, any>
    outcome: 'success' | 'failure' | 'partial'
  }) {
    const auditLog: TenantAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tenantId: event.tenantId,
      organizationId: event.organizationId,
      userId: event.userId,
      action: event.action,
      resource: event.resource,
      details: event.details,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1', // Would be actual IP in production
      userAgent: 'Sunzi-Cerebro-System',
      outcome: event.outcome
    }

    this.auditLogs.push(auditLog)

    // Keep only last 10000 audit logs
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000)
    }

    this.emit('audit_logged', auditLog)
  }

  /**
   * Get current tenant ID
   */
  getCurrentTenantId(): string | null {
    return this.currentTenant
  }

  /**
   * Export tenant data
   */
  exportTenantData(tenantId: string): {
    tenant: Tenant
    organizations: Organization[]
    users: TenantUser[]
    auditLogs: TenantAuditLog[]
  } {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`)
    }

    return {
      tenant,
      organizations: this.getTenantOrganizations(tenantId),
      users: this.getTenantUsers(tenantId),
      auditLogs: this.auditLogs.filter(log => log.tenantId === tenantId)
    }
  }

  /**
   * Get tenant statistics
   */
  getTenantStatistics(): {
    totalTenants: number
    activeTenants: number
    totalUsers: number
    resourceUsage: Record<string, any>
  } {
    const totalTenants = this.tenants.size
    const activeTenants = Array.from(this.tenants.values())
      .filter(t => t.subscription.status === 'active' || t.subscription.status === 'trial').length

    const totalUsers = this.users.size

    const resourceUsage = {
      toolExecutions: Array.from(this.tenants.values())
        .reduce((sum, t) => sum + t.resourceUsage.toolExecutions.current, 0),
      storageUsed: Array.from(this.tenants.values())
        .reduce((sum, t) => sum + t.resourceUsage.storage.used, 0)
    }

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      resourceUsage
    }
  }
}

// Export singleton instance
export const multiTenantManager = new MultiTenantManager()
export default multiTenantManager