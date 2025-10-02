#!/usr/bin/env node

/**
 * Sunzi Cerebro Backend API Server
 * Comprehensive backend for security framework integration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Route imports
import authRoutes from './routes/auth.js';
import authProductionRoutes, { setDatabaseService as setAuthDatabaseService } from './routes/authProduction.js';
import llmRoutes from './routes/llm.js';
import warpRoutes from './routes/warp.js';
import mcpRoutes from './routes/mcp.js';
import mcpRealRoutes from './routes/mcpReal.js';
import mcpRealProductionRoutes from './routes/mcpRealProduction.js';
import systemRoutes from './routes/system.js';
import filesRoutes from './routes/files.js';
import mcpDatabaseRoutes, { setMcpDatabaseServer } from './routes/mcpDatabase.js';
import strategicRoutes from './routes/strategic.js';
import threatsRoutes from './routes/threats.js';
import scansRoutes from './routes/scans.js';
import vulnerabilitiesRoutes from './routes/vulnerabilities.js';

// Middleware imports
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';
import { auth } from './middleware/auth.js';
import { setDatabaseService as setAuthMiddlewareDatabaseService } from './middleware/authProduction.js';

// WebSocket handlers
import { setupWarpWebSocket } from './websockets/warpSocket.js';
import { setupMcpWebSocket } from './websockets/mcpSocket.js';
import { setupMcpWebSocket as setupMcpRealWebSocket } from './routes/mcpReal.js';

// Production Services
import { DatabaseServiceProduction } from './services/databaseService.js';
import { McpDatabaseServer } from './services/mcpDatabaseServer.js';

// ES6 module dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

class SunziCerebroBackend {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = process.env.PORT || 8890;
    this.host = process.env.HOST || 'localhost';

    // Initialize production database service
    this.initializeDatabase();

    // Initialize MCP Database Server
    this.mcpDatabaseServer = new McpDatabaseServer();

    // Initialize components
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupErrorHandling();

    // Graceful shutdown
    this.setupGracefulShutdown();
  }

  async initializeDatabase() {
    try {
      console.log('🗄️ Initializing Production Database Service...');
      this.databaseService = new DatabaseServiceProduction();

      // Share database service with authentication routes and middleware
      setAuthDatabaseService(this.databaseService);
      setAuthMiddlewareDatabaseService(this.databaseService);

      this.databaseService.on('database_ready', async (data) => {
        console.log('✅ Production Database Service ready:', data.status);

        // Initialize MCP Database Server after database is ready
        try {
          await this.mcpDatabaseServer.initialize(this.databaseService);

          // Share MCP Database Server with routes
          setMcpDatabaseServer(this.mcpDatabaseServer);

          console.log('✅ MCP Database Server initialized successfully');
        } catch (error) {
          console.error('❌ MCP Database Server initialization failed:', error.message);
        }
      });

      this.databaseService.on('database_error', (data) => {
        console.error('❌ Database Service error:', data.error);
      });

    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", "http://localhost:*", "ws://localhost:*"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5173',
        'http://127.0.0.1:5173'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Custom logging middleware
    this.app.use(logger);
  }

  setupRoutes() {
    // Health check endpoint with database integration
    this.app.get('/health', async (req, res) => {
      try {
        let databaseStatus = 'initializing';
        let databaseMetrics = null;

        if (this.databaseService) {
          const dbHealth = await this.databaseService.getHealthMetrics();
          databaseStatus = dbHealth.status;
          databaseMetrics = dbHealth.metrics;
        }

        res.json({
          status: 'OK',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          version: '3.2.0-production',
          services: {
            api: 'running',
            websocket: 'running',
            database: databaseStatus,
            mcp_production: 'active',
            auth_production: 'active'
          },
          database: databaseMetrics
        });
      } catch (error) {
        res.status(500).json({
          status: 'ERROR',
          timestamp: new Date().toISOString(),
          error: error.message,
          services: {
            api: 'running',
            websocket: 'running',
            database: 'error'
          }
        });
      }
    });

    // API documentation endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'Sunzi Cerebro Backend API',
        version: '1.0.0',
        description: 'Backend API for Sunzi Cerebro Security Framework',
        endpoints: {
          '/health': 'GET - Health check',
          '/api/auth/*': 'Authentication and user management',
          '/api/llm/*': 'LLM configuration and management',
          '/api/warp/*': 'Warp Terminal integration',
          '/api/mcp/*': 'MCP server management',
          '/api/strategic/*': 'Strategic Framework API (Sun Tzu modules)',
          '/api/threats/*': 'Threat Intelligence and Landscape Analysis',
          '/api/scans/*': 'Security scan management and history',
          '/api/vulnerabilities/*': 'Vulnerability tracking and management',
          '/api/system/*': 'System information and monitoring',
          '/api/files/*': 'File system operations'
        },
        websockets: {
          '/ws/warp': 'Warp Terminal real-time connection',
          '/ws/mcp': 'MCP server status updates'
        }
      });
    });

    // API routes
    this.app.use('/api/auth', authProductionRoutes); // PRODUCTION Authentication (primary route)
    this.app.use('/api/auth-legacy', authRoutes); // Legacy auth for development/fallback
    this.app.use('/api/llm', llmRoutes);
    this.app.use('/api/warp', warpRoutes);
    this.app.use('/api/mcp', mcpRealProductionRoutes); // PRODUCTION MCP Integration (primary route)
    this.app.use('/api/mcp-real', mcpRealRoutes); // Legacy MCP routes for fallback
    this.app.use('/api/mcp-legacy', mcpRoutes); // Mock routes for development only
    this.app.use('/api/mcp/database', mcpDatabaseRoutes); // MCP Database Server API
    this.app.use('/api/strategic', strategicRoutes); // Strategic Framework API
    this.app.use('/api/threats', threatsRoutes); // Threat Intelligence API
    this.app.use('/api/scans', scansRoutes); // Scans Management API
    this.app.use('/api/vulnerabilities', vulnerabilitiesRoutes); // Vulnerabilities API
    this.app.use('/api/system', systemRoutes);
    this.app.use('/api/files', filesRoutes);

    // 404 handler for unknown routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
      });
    });
  }

  setupWebSocket() {
    // Create WebSocket server
    this.wss = new WebSocketServer({
      server: this.server,
      path: '/ws'
    });

    // Setup WebSocket handlers
    this.wss.on('connection', (ws, request) => {
      const url = new URL(request.url, `http://${request.headers.host}`);
      const pathname = url.pathname;

      console.log(`🔌 WebSocket connection established: ${pathname}`);

      // Route WebSocket connections
      if (pathname.includes('/warp')) {
        setupWarpWebSocket(ws, request);
      } else if (pathname.includes('/mcp-real')) {
        setupMcpRealWebSocket(this.wss);
      } else if (pathname.includes('/mcp')) {
        setupMcpWebSocket(ws, request);
      } else {
        // Generic WebSocket handler
        ws.send(JSON.stringify({
          type: 'connection',
          message: 'WebSocket connected successfully',
          timestamp: new Date().toISOString()
        }));

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            console.log('📥 WebSocket message:', message);
            
            // Echo back for now
            ws.send(JSON.stringify({
              type: 'echo',
              data: message,
              timestamp: new Date().toISOString()
            }));
          } catch (error) {
            console.error('❌ WebSocket message error:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Invalid JSON message',
              timestamp: new Date().toISOString()
            }));
          }
        });

        ws.on('close', () => {
          console.log('🔌 WebSocket disconnected');
        });

        ws.on('error', (error) => {
          console.error('❌ WebSocket error:', error);
        });
      }
    });

    console.log('🔌 WebSocket server initialized');
  }

  setupErrorHandling() {
    // Error handling middleware (must be last)
    this.app.use(errorHandler);

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });
  }

  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      console.log(`\n🛑 ${signal} received, shutting down gracefully...`);

      this.server.close(async () => {
        console.log('🔄 HTTP server closed');

        // Close WebSocket server
        this.wss.close(async () => {
          console.log('🔄 WebSocket server closed');

          // Close database connection
          if (this.databaseService) {
            try {
              await this.databaseService.shutdown();
              console.log('🔄 Database service closed');
            } catch (error) {
              console.error('❌ Database shutdown error:', error.message);
            }
          }

          console.log('✅ Server shutdown complete');
          process.exit(0);
        });
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.log('🔴 Forcing shutdown...');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  async start() {
    try {
      await new Promise((resolve, reject) => {
        this.server.listen(this.port, this.host, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      console.log(`🚀 Sunzi Cerebro Backend Server started successfully!`);
      console.log(`📍 Server running at: http://${this.host}:${this.port}`);
      console.log(`🔌 WebSocket available at: ws://${this.host}:${this.port}/ws`);
      console.log(`🏥 Health check: http://${this.host}:${this.port}/health`);
      console.log(`📚 API docs: http://${this.host}:${this.port}/api`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
const backend = new SunziCerebroBackend();
backend.start().catch((error) => {
  console.error('❌ Server startup failed:', error);
  process.exit(1);
});

export default SunziCerebroBackend;