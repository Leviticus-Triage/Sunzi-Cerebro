/**
 * PM2 Ecosystem Configuration for Sunzi Cerebro Enterprise
 * Production-ready process management with clustering and monitoring
 */

module.exports = {
  apps: [
    {
      // Main application process
      name: 'sunzi-cerebro-main',
      script: './backend/server.js',
      cwd: '/app',
      instances: process.env.PM2_INSTANCES || 2,
      exec_mode: 'cluster',

      // Environment configuration
      env: {
        NODE_ENV: 'production',
        PORT: 8890,
        DB_HOST: process.env.DB_HOST || 'postgres',
        DB_PORT: process.env.DB_PORT || 5432,
        DB_NAME: process.env.DB_NAME || 'sunzi_cerebro',
        DB_USER: process.env.DB_USER || 'sunzi_cerebro',
        DB_PASSWORD: process.env.DB_PASSWORD || 'cerebro_production_2025',
        REDIS_HOST: process.env.REDIS_HOST || 'redis',
        REDIS_PORT: process.env.REDIS_PORT || 6379,
        JWT_SECRET: process.env.JWT_SECRET || 'sunzi-cerebro-enterprise-jwt-secret-2025',
        SESSION_SECRET: process.env.SESSION_SECRET || 'sunzi-cerebro-session-secret-2025'
      },

      // Process management
      min_uptime: '10s',
      max_restarts: 5,
      restart_delay: 4000,
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Performance tuning
      node_args: '--max-old-space-size=2048',
      max_memory_restart: '1G',

      // Logging configuration
      log_file: '/app/logs/pm2-combined.log',
      out_file: '/app/logs/pm2-out.log',
      error_file: '/app/logs/pm2-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      log_type: 'json',

      // Health monitoring
      health_check_grace_period: 30000,
      health_check_fatal_exceptions: true,

      // Auto-restart on file changes (disabled in production)
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'data', 'exports', 'backups'],

      // Source map support for debugging
      source_map_support: true,

      // Process title for monitoring
      instance_var: 'INSTANCE_ID',

      // Graceful shutdown
      kill_retry_time: 100,

      // Resource limits
      memory_limit: '1024M',

      // Process monitoring
      pmx: true,
      automation: false,

      // Custom startup script
      post_start: '/app/docker/post-start.sh',

      // Custom shutdown script
      pre_stop: '/app/docker/pre-stop.sh'
    },

    {
      // Background worker for heavy tasks
      name: 'sunzi-cerebro-worker',
      script: './backend/workers/task-worker.js',
      cwd: '/app',
      instances: 1,
      exec_mode: 'fork',

      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'task-processor',
        DB_HOST: process.env.DB_HOST || 'postgres',
        DB_PORT: process.env.DB_PORT || 5432,
        DB_NAME: process.env.DB_NAME || 'sunzi_cerebro',
        DB_USER: process.env.DB_USER || 'sunzi_cerebro',
        DB_PASSWORD: process.env.DB_PASSWORD || 'cerebro_production_2025',
        REDIS_HOST: process.env.REDIS_HOST || 'redis',
        REDIS_PORT: process.env.REDIS_PORT || 6379
      },

      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 5000,

      log_file: '/app/logs/worker-combined.log',
      out_file: '/app/logs/worker-out.log',
      error_file: '/app/logs/worker-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      watch: false,
      max_memory_restart: '512M',

      // Worker-specific configuration
      cron_restart: '0 4 * * *',  // Daily restart at 4 AM
      autorestart: true
    },

    {
      // Monitoring and metrics collection
      name: 'sunzi-cerebro-monitor',
      script: './backend/services/monitor-service.js',
      cwd: '/app',
      instances: 1,
      exec_mode: 'fork',

      env: {
        NODE_ENV: 'production',
        MONITOR_INTERVAL: 30000,
        METRICS_PORT: 9100,
        DB_HOST: process.env.DB_HOST || 'postgres',
        REDIS_HOST: process.env.REDIS_HOST || 'redis'
      },

      min_uptime: '10s',
      max_restarts: 15,
      restart_delay: 10000,

      log_file: '/app/logs/monitor-combined.log',
      out_file: '/app/logs/monitor-out.log',
      error_file: '/app/logs/monitor-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      watch: false,
      max_memory_restart: '256M',
      autorestart: true,

      // Monitor process should be more resilient
      exp_backoff_restart_delay: 100
    }
  ],

  // Deployment configuration
  deploy: {
    production: {
      user: 'sunzi',
      host: ['sunzi-cerebro-prod-01', 'sunzi-cerebro-prod-02'],
      ref: 'origin/main',
      repo: 'git@github.com:sunzi-cerebro/enterprise.git',
      path: '/var/www/sunzi-cerebro',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --production && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/www/sunzi-cerebro/logs /var/www/sunzi-cerebro/data'
    },

    staging: {
      user: 'sunzi',
      host: 'sunzi-cerebro-staging',
      ref: 'origin/develop',
      repo: 'git@github.com:sunzi-cerebro/enterprise.git',
      path: '/var/www/sunzi-cerebro-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  },

  // Global PM2 configuration
  global: {
    // PM2 monitoring
    monitoring: {
      http: true,
      https: false,
      port: 9615
    },

    // Log rotation
    log_rotation: {
      max_size: '10M',
      retain: 10,
      compress: true,
      dateFormat: 'YYYY-MM-DD_HH-mm-ss'
    },

    // Error handling
    error_handling: {
      fatal_exceptions: true,
      unhandled_rejections: true
    },

    // Performance monitoring
    performance: {
      network: true,
      ports: true
    }
  }
};