/**
 * Authentication Routes
 * Handles user authentication, registration, and session management
 */

import express from 'express';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// JWT Secret (in production, use proper environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'sunzi-cerebro-dev-secret-key';

// Mock user for development - in production, use proper user database
const MOCK_USER = {
  id: '1',
  username: 'sunzi.cerebro',
  email: 'admin@sunzi-cerebro.local',
  password: 'admin123', // In production: hash with bcrypt
  roles: ['admin'],
  permissions: ['all'],
  created: new Date().toISOString(),
  lastLogin: null
};

// Temporary token storage (in production: use Redis or database)
const activeTokens = new Set();

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    roles: user.roles,
    permissions: user.permissions,
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '24h',
    issuer: 'sunzi-cerebro',
    audience: 'sunzi-cerebro-frontend'
  });
};

// Login endpoint
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;

  // Validate input
  if (!username && !email) {
    return res.status(400).json({
      success: false,
      message: 'Username or email is required',
      timestamp: new Date().toISOString()
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Password is required',
      timestamp: new Date().toISOString()
    });
  }

  // Mock authentication (in production: verify against database)
  const isValidUser = (username === MOCK_USER.username || email === MOCK_USER.email) && 
                      password === MOCK_USER.password;

  if (!isValidUser) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
      timestamp: new Date().toISOString()
    });
  }

  // Generate token
  const token = generateToken(MOCK_USER);
  activeTokens.add(token);

  // Update last login
  MOCK_USER.lastLogin = new Date().toISOString();

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: MOCK_USER.id,
        username: MOCK_USER.username,
        email: MOCK_USER.email,
        roles: MOCK_USER.roles,
        permissions: MOCK_USER.permissions,
        lastLogin: MOCK_USER.lastLogin
      },
      token,
      tokenType: 'Bearer',
      expiresIn: '24h'
    },
    timestamp: new Date().toISOString()
  });
}));

// Register endpoint (mock for development)
router.post('/register', asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  // Basic validation
  if (!username || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username, email, and password are required',
      timestamp: new Date().toISOString()
    });
  }

  // In development, just return success
  res.status(201).json({
    success: true,
    message: 'Registration successful - using development mode',
    data: {
      user: {
        id: Date.now().toString(),
        username,
        email,
        roles: ['user'],
        permissions: ['read'],
        created: new Date().toISOString()
      }
    },
    timestamp: new Date().toISOString()
  });
}));

// Validate token endpoint
router.get('/validate', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'No valid token provided',
      valid: false,
      timestamp: new Date().toISOString()
    });
  }

  const token = authHeader.substring(7);

  try {
    // Handle mock tokens for development
    if (token.startsWith('mock-jwt-token-')) {
      return res.json({
        success: true,
        message: 'Mock token validated',
        valid: true,
        data: {
          user: {
            id: 'mock-user-1',
            username: 'sunzi.cerebro',
            email: 'admin@sunzi-cerebro.local',
            role: 'admin',
            firstName: 'Sun',
            lastName: 'Tzu'
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if token is in active tokens
    if (!activeTokens.has(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token has been revoked',
        valid: false,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      valid: true,
      data: {
        user: {
          id: decoded.id,
          username: decoded.username,
          email: decoded.email,
          roles: decoded.roles,
          permissions: decoded.permissions
        },
        tokenInfo: {
          issuedAt: new Date(decoded.iat * 1000).toISOString(),
          issuer: decoded.iss,
          audience: decoded.aud
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Token validation error:', error);
    
    res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token',
      valid: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}));

// Get current user info
router.get('/user', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      timestamp: new Date().toISOString()
    });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    res.json({
      success: true,
      data: {
        user: {
          id: decoded.id,
          username: decoded.username,
          email: decoded.email,
          roles: decoded.roles,
          permissions: decoded.permissions,
          lastLogin: MOCK_USER.lastLogin
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString()
    });
  }
}));

// Refresh token endpoint
router.post('/refresh', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Token is required',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Verify old token (even if expired)
    const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
    
    // Remove old token
    activeTokens.delete(token);
    
    // Generate new token
    const newToken = generateToken({
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      roles: decoded.roles,
      permissions: decoded.permissions
    });
    
    activeTokens.add(newToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        tokenType: 'Bearer',
        expiresIn: '24h'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token for refresh',
      timestamp: new Date().toISOString()
    });
  }
}));

// Logout endpoint
router.post('/logout', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    activeTokens.delete(token);
  }

  res.json({
    success: true,
    message: 'Logout successful',
    timestamp: new Date().toISOString()
  });
}));

// Get authentication status
router.get('/status', asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  
  res.json({
    success: true,
    data: {
      authenticated: authHeader && authHeader.startsWith('Bearer '),
      authMethod: 'JWT',
      sessionActive: activeTokens.size > 0,
      activeTokens: activeTokens.size,
      development: process.env.NODE_ENV !== 'production'
    },
    timestamp: new Date().toISOString()
  });
}));

export default router;