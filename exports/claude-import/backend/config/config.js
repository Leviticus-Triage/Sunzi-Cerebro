/**
 * Main Configuration File
 * Central configuration management for Sunzi Cerebro Backend
 */

require('dotenv').config();

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 8000,
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development',
    cors: {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [
        'http://localhost:5173', // Vite dev server
        'http://localhost:3000', // React dev server
        'http://localhost:8000', // Backend server
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
    }
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'cerebrum-dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: 'sunzi-cerebro',
    audience: 'cerebro-users'
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    file: {
      enabled: process.env.LOG_FILE_ENABLED === 'true',
      path: process.env.LOG_FILE_PATH || './logs/app.log',
      maxSize: process.env.LOG_FILE_MAX_SIZE || '10m',
      maxFiles: parseInt(process.env.LOG_FILE_MAX_FILES) || 5
    }
  },

  // Ollama Configuration
  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    timeout: parseInt(process.env.OLLAMA_TIMEOUT) || 30000,
    defaultModel: process.env.OLLAMA_DEFAULT_MODEL || 'llama3.2',
    pullTimeout: parseInt(process.env.OLLAMA_PULL_TIMEOUT) || 300000, // 5 minutes
    retries: parseInt(process.env.OLLAMA_RETRIES) || 3
  },

  // Warp Terminal Configuration
  warp: {
    socketPath: process.env.WARP_SOCKET_PATH || '/tmp/warp-terminal.sock',
    sessionTimeout: parseInt(process.env.WARP_SESSION_TIMEOUT) || 3600000, // 1 hour
    exportPath: process.env.WARP_EXPORT_PATH || './exports',
    maxSessions: parseInt(process.env.WARP_MAX_SESSIONS) || 10,
    commandTimeout: parseInt(process.env.WARP_COMMAND_TIMEOUT) || 30000
  },

  // MCP Server Configuration
  mcp: {
    serversConfigPath: process.env.MCP_SERVERS_CONFIG || '/home/danii/.config/warp-terminal/mcp_servers.json',
    defaultTimeout: parseInt(process.env.MCP_DEFAULT_TIMEOUT) || 30000,
    maxRetries: parseInt(process.env.MCP_MAX_RETRIES) || 3,
    healthCheckInterval: parseInt(process.env.MCP_HEALTH_CHECK_INTERVAL) || 60000, // 1 minute
    servers: {
      hexstrike: {
        port: 8890,
        host: 'localhost',
        protocol: 'http'
      },
      attackmcp: {
        command: 'python',
        args: ['-m', 'attackmcp'],
        cwd: '/path/to/attackmcp'
      }
    }
  },

  // File System Configuration
  fileSystem: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedExtensions: process.env.ALLOWED_EXTENSIONS ? 
      process.env.ALLOWED_EXTENSIONS.split(',') : 
      ['.txt', '.json', '.js', '.ts', '.py', '.md', '.yml', '.yaml', '.log'],
    exportPath: process.env.EXPORT_PATH || './exports',
    backupPath: process.env.BACKUP_PATH || './backups',
    watchPaths: process.env.WATCH_PATHS ? 
      process.env.WATCH_PATHS.split(',') : 
      ['/home/danii/.config/warp-terminal'],
    maxWatchers: parseInt(process.env.MAX_WATCHERS) || 100
  },

  // WebSocket Configuration
  websocket: {
    pingInterval: parseInt(process.env.WS_PING_INTERVAL) || 30000, // 30 seconds
    pongTimeout: parseInt(process.env.WS_PONG_TIMEOUT) || 5000, // 5 seconds
    maxConnections: parseInt(process.env.WS_MAX_CONNECTIONS) || 100,
    heartbeatInterval: parseInt(process.env.WS_HEARTBEAT_INTERVAL) || 25000 // 25 seconds
  },

  // Security Configuration
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    },
    sessionSecret: process.env.SESSION_SECRET || 'cerebrum-session-secret-change-in-production',
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
  },

  // Documentation Export Configuration
  documentation: {
    enabled: true,
    exportInterval: parseInt(process.env.DOC_EXPORT_INTERVAL) || 300000, // 5 minutes
    warpExportPath: process.env.WARP_EXPORT_PATH || './exports/warp-Terminal-export',
    agentExportPath: process.env.AGENT_EXPORT_PATH || './exports/warp-Agent-export',
    includeTimestamp: true,
    includeMetadata: true,
    format: 'markdown' // or 'json', 'txt'
  },

  // System Monitoring
  monitoring: {
    enabled: true,
    interval: parseInt(process.env.MONITORING_INTERVAL) || 30000, // 30 seconds
    alerts: {
      cpu: parseInt(process.env.ALERT_CPU_THRESHOLD) || 80, // %
      memory: parseInt(process.env.ALERT_MEMORY_THRESHOLD) || 85, // %
      disk: parseInt(process.env.ALERT_DISK_THRESHOLD) || 90 // %
    },
    retention: {
      metrics: parseInt(process.env.METRICS_RETENTION_DAYS) || 7, // days
      logs: parseInt(process.env.LOGS_RETENTION_DAYS) || 30 // days
    }
  }
};

// Environment-specific overrides
if (config.server.env === 'production') {
  config.logging.level = 'warn';
  config.rateLimit.max = 50; // Stricter rate limiting in production
  config.ollama.retries = 5; // More retries in production
  config.security.helmet.contentSecurityPolicy.directives.upgradeInsecureRequests = [];
}

if (config.server.env === 'test') {
  config.logging.level = 'error';
  config.rateLimit.max = 1000; // Relaxed for testing
  config.jwt.expiresIn = '1m'; // Short-lived tokens for testing
}

module.exports = config;