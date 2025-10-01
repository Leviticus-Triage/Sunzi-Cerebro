/**
 * Production Authentication Middleware
 * JWT + Session-based authentication with PostgreSQL integration
 * Enhanced by Moses Team - Enterprise Security Architecture
 * Version: v3.2.0 Production
 */

import jwt from 'jsonwebtoken';
import { DatabaseServiceProduction } from '../services/databaseService.js';

let databaseService = null;

// Export a function to set the database service from server.js
export const setDatabaseService = (service) => {
  databaseService = service;
};

const getDatabaseService = () => {
  return databaseService;
};

/**
 * JWT Secret Key
 */
const JWT_SECRET = process.env.JWT_SECRET || 'sunzi-cerebro-enterprise-secret-key-2025';

/**
 * Generate JWT token
 */
export const generateToken = (user, session) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
    organizationId: user.organization_id,
    sessionId: session.id,
    sessionToken: session.session_token
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'sunzi-cerebro',
    audience: 'sunzi-cerebro-clients'
  });
};

/**
 * Verify JWT token and session
 */
export const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    const db = getDatabaseService();

    // Verify session is still valid
    const session = await db.models.Session.findOne({
      where: {
        id: decoded.sessionId,
        session_token: decoded.sessionToken,
        is_active: true
      },
      include: [{
        model: db.models.User,
        where: { status: 'active' },
        include: [{ model: db.models.Organization }]
      }]
    });

    if (!session || new Date() > session.expires_at) {
      throw new Error('Session expired or invalid');
    }

    return {
      user: session.User,
      session: session,
      claims: decoded
    };
  } catch (error) {
    throw new Error(`Token verification failed: ${error.message}`);
  }
};

/**
 * Authentication middleware
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7);

    // Check for mock token in development
    if (process.env.NODE_ENV === 'development' && token === 'mock-jwt-token-test') {
      // Mock user for development
      req.user = {
        id: 'mock-user-id',
        username: 'sunzi.cerebro',
        email: 'admin@sunzi-cerebro.dev',
        role: 'super_admin',
        permissions: ['*'],
        organization_id: 'default-org-id'
      };
      req.session = {
        id: 'mock-session-id',
        session_token: 'mock-session-token'
      };
      return next();
    }

    const authData = await verifyToken(token);

    req.user = authData.user;
    req.session = authData.session;
    req.claims = authData.claims;

    // Log authentication for audit
    const db = getDatabaseService();
    await db.logAudit({
      user_id: req.user.id,
      organization_id: req.user.organization_id,
      action: 'api_access',
      resource_type: 'API',
      resource_id: req.path,
      details: {
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent')
      },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      severity: 'info'
    });

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Invalid authentication',
      message: error.message,
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (allowedRoles = [], requiredPermissions = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Super admin has all permissions
    if (req.user.role === 'super_admin') {
      return next();
    }

    // Check role authorization
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient role permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    // Check specific permissions
    if (requiredPermissions.length > 0) {
      const userPermissions = req.user.permissions || [];
      const hasAllPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission) || userPermissions.includes('*')
      );

      if (!hasAllPermissions) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          required: requiredPermissions,
          current: userPermissions
        });
      }
    }

    next();
  };
};

/**
 * Organization isolation middleware
 */
export const requireOrganization = (req, res, next) => {
  if (!req.user || !req.user.organization_id) {
    return res.status(403).json({
      success: false,
      error: 'Organization context required'
    });
  }

  // Add organization filter to database queries
  req.organizationFilter = { organization_id: req.user.organization_id };

  next();
};

/**
 * Rate limiting per organization
 */
export const organizationRateLimit = (requestsPerHour = 1000) => {
  const orgRequestCounts = new Map();

  return async (req, res, next) => {
    if (!req.user || !req.user.organization_id) {
      return next();
    }

    const orgId = req.user.organization_id;
    const now = Date.now();
    const hourWindow = 60 * 60 * 1000; // 1 hour

    if (!orgRequestCounts.has(orgId)) {
      orgRequestCounts.set(orgId, {
        count: 0,
        resetTime: now + hourWindow
      });
    }

    const orgData = orgRequestCounts.get(orgId);

    if (now > orgData.resetTime) {
      orgData.count = 0;
      orgData.resetTime = now + hourWindow;
    }

    orgData.count++;

    if (orgData.count > requestsPerHour) {
      return res.status(429).json({
        success: false,
        error: 'Organization rate limit exceeded',
        limit: requestsPerHour,
        resetTime: orgData.resetTime
      });
    }

    next();
  };
};

export default {
  authenticate,
  authorize,
  requireOrganization,
  organizationRateLimit,
  generateToken,
  verifyToken
};