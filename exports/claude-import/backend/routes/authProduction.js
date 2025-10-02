/**
 * Production Authentication Routes
 * Enterprise-grade authentication with PostgreSQL persistence
 * Enhanced by Moses Team - Ultrathinking Backend Architecture
 * Version: v3.2.0 Production Enterprise
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/errorHandler.js';
import { DatabaseServiceProduction } from '../services/databaseService.js';
import { generateToken, authenticate, authorize } from '../middleware/authProduction.js';
import validator from 'validator';

const router = express.Router();

// Import the shared database instance from server.js
let databaseService = null;

const getDatabaseService = () => {
  return databaseService;
};

// Export a function to set the database service from server.js
export const setDatabaseService = (service) => {
  databaseService = service;
};

/**
 * POST /api/auth/register
 * Register new user with organization
 */
router.post('/register', asyncHandler(async (req, res) => {
  const { username, email, password, organizationName, role } = req.body;

  // Input validation
  const errors = [];
  if (!username || username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }
  if (!email || !validator.isEmail(email)) {
    errors.push('Valid email is required');
  }
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!organizationName || organizationName.length < 2) {
    errors.push('Organization name is required');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
      message: 'Validation failed'
    });
  }

  const db = getDatabaseService();

  try {
    // Ensure database is initialized
    if (!db || !db.models || !db.models.Organization) {
      throw new Error('Database service not properly initialized');
    }

    // Create organization first using Sequelize model directly
    const organization = await db.models.Organization.create({
      name: organizationName,
      slug: organizationName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      tier: 'free',
      settings: {
        created_via: 'registration',
        initial_setup: true
      }
    });

    // Hash password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user using Sequelize model directly
    const user = await db.models.User.create({
      username,
      email: email.toLowerCase(),
      password_hash,
      role: role || 'admin', // First user in org becomes admin
      organization_id: organization.id
    });

    // Create session using Sequelize model directly
    const JWT_SECRET = process.env.JWT_SECRET || 'sunzi-cerebro-enterprise-secret-key-2025';
    const session_token = jwt.sign({ userId: user.id, organizationId: organization.id }, JWT_SECRET);

    const session = await db.models.Session.create({
      session_token,
      user_id: user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Generate JWT token for response
    const token = session_token;

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          organization: {
            id: organization.id,
            name: organization.name,
            tier: organization.tier
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Registration failed:', error.message);

    // Handle specific database errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors[0]?.path;
      return res.status(409).json({
        success: false,
        error: `${field} already exists`,
        code: 'DUPLICATE_ENTRY'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'Internal server error'
    });
  }
}));

/**
 * POST /api/auth/login
 * Authenticate user and create session
 */
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      error: 'Username and password are required'
    });
  }

  const db = getDatabaseService();

  try {
    const authResult = await db.authenticateUser(
      username,
      password,
      req.ip,
      req.get('User-Agent')
    );

    if (!authResult) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    const { user, session } = authResult;

    // Generate JWT
    const token = generateToken(user, session);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          last_login: user.last_login,
          organization: user.Organization
        },
        session: {
          id: session.id,
          expires_at: session.expires_at
        }
      }
    });

  } catch (error) {
    console.error('❌ Login failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'Internal server error'
    });
  }
}));

/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  const db = getDatabaseService();

  try {
    if (req.session && req.session.id) {
      // Invalidate session
      await db.models.Session.update(
        { is_active: false },
        { where: { id: req.session.id } }
      );

      await db.logAudit({
        user_id: req.user.id,
        organization_id: req.user.organization_id,
        action: 'logout',
        details: { session_id: req.session.id },
        ip_address: req.ip,
        user_agent: req.get('User-Agent'),
        severity: 'info'
      });
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('❌ Logout failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
}));

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  const db = getDatabaseService();

  try {
    const user = await db.models.User.findOne({
      where: { id: req.user.id },
      include: [{
        model: db.models.Organization,
        attributes: ['id', 'name', 'tier', 'limits']
      }],
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          profile: user.profile,
          last_login: user.last_login,
          status: user.status,
          created_at: user.created_at,
          organization: user.Organization
        }
      }
    });

  } catch (error) {
    console.error('❌ Get user profile failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
}));

/**
 * PUT /api/auth/profile
 * Update user profile
 */
router.put('/profile', authenticate, asyncHandler(async (req, res) => {
  const { email, profile } = req.body;
  const db = getDatabaseService();

  try {
    const updateData = {};

    if (email && validator.isEmail(email)) {
      updateData.email = email.toLowerCase();
    }

    if (profile && typeof profile === 'object') {
      updateData.profile = profile;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid update data provided'
      });
    }

    const [updatedCount] = await db.models.User.update(updateData, {
      where: { id: req.user.id }
    });

    if (updatedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get updated user
    const updatedUser = await db.models.User.findOne({
      where: { id: req.user.id },
      include: [{ model: db.models.Organization }],
      attributes: { exclude: ['password_hash'] }
    });

    await db.logAudit({
      user_id: req.user.id,
      organization_id: req.user.organization_id,
      action: 'profile_updated',
      resource_type: 'User',
      resource_id: req.user.id,
      details: { updated_fields: Object.keys(updateData) },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      severity: 'info'
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });

  } catch (error) {
    console.error('❌ Profile update failed:', error.message);

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        error: 'Email already exists',
        code: 'DUPLICATE_EMAIL'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Profile update failed'
    });
  }
}));

/**
 * GET /api/auth/sessions
 * Get user's active sessions
 */
router.get('/sessions', authenticate, authorize(['admin', 'super_admin']), asyncHandler(async (req, res) => {
  const db = getDatabaseService();

  try {
    const sessions = await db.models.Session.findAll({
      where: {
        user_id: req.user.id,
        is_active: true
      },
      order: [['created_at', 'DESC']],
      attributes: ['id', 'ip_address', 'user_agent', 'created_at', 'expires_at']
    });

    res.json({
      success: true,
      data: {
        sessions,
        count: sessions.length
      }
    });

  } catch (error) {
    console.error('❌ Get sessions failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get sessions'
    });
  }
}));

/**
 * DELETE /api/auth/sessions/:sessionId
 * Revoke specific session
 */
router.delete('/sessions/:sessionId', authenticate, authorize(['admin', 'super_admin']), asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const db = getDatabaseService();

  try {
    const updatedCount = await db.models.Session.update(
      { is_active: false },
      {
        where: {
          id: sessionId,
          user_id: req.user.id
        }
      }
    );

    if (updatedCount[0] === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    await db.logAudit({
      user_id: req.user.id,
      organization_id: req.user.organization_id,
      action: 'session_revoked',
      resource_type: 'Session',
      resource_id: sessionId,
      details: { revoked_by: 'user' },
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      severity: 'info'
    });

    res.json({
      success: true,
      message: 'Session revoked successfully'
    });

  } catch (error) {
    console.error('❌ Session revoke failed:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke session'
    });
  }
}));

/**
 * GET /api/auth/validate
 * Validate current token and session
 */
router.get('/validate', authenticate, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    data: {
      user_id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      organization_id: req.user.organization_id,
      session_id: req.session?.id,
      expires_at: req.session?.expires_at
    }
  });
}));

export default router;