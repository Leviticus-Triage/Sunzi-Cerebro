/**
 * Production MCP Integration Service
 * Real-time connection to all MCP servers with robust error handling
 * ZERO MOCK DATA - Enterprise Production Implementation
 *
 * Enhanced by Moses Team - Ultrathinking Approach
 * Version: v1.0.0 Production
 */

import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES modules compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class McpIntegrationServiceProduction extends EventEmitter {
  constructor() {
    super();
    this.servers = new Map();
    this.tools = new Map();
    this.processes = new Map();
    this.healthCheckIntervals = new Map();
    this.connectionRetries = new Map();
    this.isDiscovering = false;

    // Production MCP Servers - Complete Architecture
    this.serverConfig = {
      hexstrike: {
        id: 'hexstrike-ai',
        name: 'HexStrike AI',
        type: 'http_api',
        host: 'localhost',
        port: 8888,
        protocol: 'http',
        status: 'unknown',
        toolCount: 0,
        endpoints: {
          health: '/health',
          command: '/api/command'
        },
        timeout: 5000
      },
      attackmcp: {
        id: 'attackmcp-fastmcp',
        name: 'AttackMCP FastMCP',
        type: 'stdio',
        status: 'unknown',
        toolCount: 0,
        processInfo: {
          command: 'python',
          args: ['server.py'],
          workingDirectory: '/home/danii/attackmcp',
          env: {
            VIRTUAL_ENV: '/home/danii/attackmcp/attackmcp-venv',
            PATH: '/home/danii/attackmcp/attackmcp-venv/bin:' + process.env.PATH,
            PYTHONPATH: '/home/danii/attackmcp'
          }
        },
        processPattern: '/home/danii/attackmcp/server.py',
        timeout: 10000
      },
      mcpgodmode: {
        id: 'mcp-god-mode',
        name: 'MCP-God-Mode',
        type: 'stdio',
        status: 'unknown',
        toolCount: 152,
        processInfo: {
          command: 'node',
          args: ['dist/server-modular.js'],
          workingDirectory: '/home/danii/MCP-God-Mode/dev',
          env: {
            NODE_ENV: 'production',
            MCP_SERVER_NAME: 'mcp-god-mode'
          }
        },
        processPattern: '/home/danii/MCP-God-Mode/dev/dist/server-modular.js',
        timeout: 8000
      },
      notionmcp: {
        id: 'notion-mcp',
        name: 'Notion MCP',
        type: 'stdio',
        status: 'unknown',
        toolCount: 2,
        processInfo: {
          command: 'npx',
          args: ['-y', '@notionhq/client', 'mcp-server-notion'],
          workingDirectory: '/home/danii/attackmcp/warp_ai_integration',
          env: {
            NODE_ENV: 'production',
            NOTION_TOKEN: process.env.NOTION_TOKEN || 'ntn_T142672354291rL8erwWrk4rxchg1FEsMPqn4KGkWpN8vV'
          }
        },
        processPattern: '@notionhq.*mcp',
        timeout: 5000
      }
    };

    console.log('🔌 MCP Integration Service Production initialized');
    this.setupHealthMonitoring();
  }

  /**
   * Setup continuous health monitoring for all servers
   */
  setupHealthMonitoring() {
    // Health check every 30 seconds
    const healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000);

    this.healthCheckIntervals.set('global', healthCheckInterval);

    // Initial discovery
    setTimeout(() => {
      this.discoverServers();
    }, 2000);
  }

  /**
   * Discover all active MCP servers
   */
  async discoverServers() {
    if (this.isDiscovering) {
      console.log('🔍 MCP discovery already in progress');
      return;
    }

    this.isDiscovering = true;
    console.log('🔍 Starting MCP server discovery...');

    const discoveryPromises = Object.entries(this.serverConfig).map(([key, config]) =>
      this.discoverServer(key, config)
    );

    try {
      const results = await Promise.allSettled(discoveryPromises);

      const activeServers = results.filter(r => r.status === 'fulfilled').length;
      console.log(`✅ MCP Discovery completed. Found ${activeServers} active servers`);

      this.emit('discovery_completed', {
        total: Object.keys(this.serverConfig).length,
        active: activeServers,
        servers: Array.from(this.servers.values())
      });

    } catch (error) {
      console.error('❌ MCP Discovery failed:', error.message);
    } finally {
      this.isDiscovering = false;
    }
  }

  /**
   * Discover individual server
   */
  async discoverServer(serverId, config) {
    console.log(`🔎 Discovering server: ${config.name} (type: ${config.type})`);

    try {
      if (config.type === 'http_api') {
        await this.discoverHttpServer(serverId, config);
      } else if (config.type === 'stdio') {
        await this.discoverStdioServer(serverId, config);
      }

      // Update server status
      this.servers.set(serverId, {
        ...config,
        status: 'active',
        lastCheck: new Date(),
        discoveredAt: new Date()
      });

      console.log(`✅ ${config.name} discovered successfully`);
      this.emit('server_discovered', { serverId, config });

    } catch (error) {
      console.error(`❌ ${config.name} discovery failed:`, error.message);

      this.servers.set(serverId, {
        ...config,
        status: 'inactive',
        lastCheck: new Date(),
        error: error.message
      });

      this.emit('server_error', { serverId, error: error.message });
    }
  }

  /**
   * Discover HTTP API server
   */
  async discoverHttpServer(serverId, config) {
    const healthUrl = `${config.protocol}://${config.host}:${config.port}${config.endpoints.health}`;

    console.log(`🔧 Testing HTTP health endpoint: ${healthUrl}`);

    const response = await axios.get(healthUrl, {
      timeout: config.timeout,
      validateStatus: (status) => status < 500
    });

    if (response.status === 200 && response.data) {
      const healthData = response.data;

      // Extract tool count from health data
      let toolCount = 0;
      if (healthData.total_tools_available) {
        toolCount = healthData.total_tools_available;
      } else if (healthData.tools_status) {
        toolCount = Object.keys(healthData.tools_status).length;
      }

      config.toolCount = toolCount;
      config.healthData = healthData;

      console.log(`🎯 Found ${toolCount} tools on ${config.name}`);
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Discover STDIO server via process detection
   */
  async discoverStdioServer(serverId, config) {
    console.log(`🔌 Discovering STDIO server: ${config.name}`);

    // Check if process is already running
    let isRunning = await this.checkProcessRunning(config.processPattern);

    if (isRunning) {
      console.log(`🔍 Process check for ${config.name}: FOUND (pattern: ${config.processPattern})`);

      // Validate process health
      await this.validateStdioProcess(serverId, config);

      console.log(`✅ ${config.name} STDIO server discovered`);
    } else {
      console.log(`🔍 Process check for ${config.name}: NOT FOUND (pattern: ${config.processPattern})`);

      // Attempt to start the server automatically
      console.log(`🚀 Attempting to start ${config.name}...`);
      const startSuccess = await this.startStdioServer(serverId, config);

      if (startSuccess) {
        console.log(`✅ ${config.name} successfully started`);
        // Wait for server to initialize
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify it's running now
        isRunning = await this.checkProcessRunning(config.processPattern);
        if (!isRunning) {
          throw new Error(`Failed to start STDIO server: ${config.name}`);
        }
      } else {
        throw new Error(`STDIO process not running and auto-start failed: ${config.processPattern}`);
      }
    }
  }

  /**
   * Check if a process is running by pattern
   */
  async checkProcessRunning(pattern) {
    return new Promise((resolve) => {
      const ps = spawn('pgrep', ['-f', pattern]);

      let found = false;
      ps.stdout.on('data', (data) => {
        if (data.toString().trim()) {
          found = true;
        }
      });

      ps.on('close', (code) => {
        resolve(found);
      });

      ps.on('error', () => {
        resolve(false);
      });

      // Timeout after 3 seconds
      setTimeout(() => {
        ps.kill();
        resolve(false);
      }, 3000);
    });
  }

  /**
   * Validate STDIO process health
   */
  async validateStdioProcess(serverId, config) {
    // For STDIO servers, we validate by checking if process is responsive
    // and optionally checking working directory exists

    if (config.processInfo && config.processInfo.workingDirectory) {
      const dirExists = fs.existsSync(config.processInfo.workingDirectory);
      if (!dirExists) {
        throw new Error(`Working directory not found: ${config.processInfo.workingDirectory}`);
      }
    }

    // Additional STDIO health checks can be implemented here
    // For now, process detection is sufficient
    return true;
  }

  /**
   * Perform health checks on all active servers
   */
  async performHealthChecks() {
    console.log('🏥 Performing MCP server health check...');

    const healthPromises = Array.from(this.servers.entries()).map(([serverId, config]) =>
      this.performServerHealthCheck(serverId, config)
    );

    const results = await Promise.allSettled(healthPromises);

    const healthyServers = results.filter(r => r.status === 'fulfilled').length;
    console.log(`🏥 Health check completed: ${healthyServers}/${results.length} servers healthy`);
  }

  /**
   * Perform health check on individual server
   */
  async performServerHealthCheck(serverId, config) {
    try {
      if (config.type === 'http_api') {
        await this.discoverHttpServer(serverId, config);
      } else if (config.type === 'stdio') {
        const isRunning = await this.checkProcessRunning(config.processPattern);
        if (!isRunning) {
          throw new Error('STDIO process not running');
        }
      }

      // Update last successful check
      config.status = 'active';
      config.lastCheck = new Date();
      this.servers.set(serverId, config);

    } catch (error) {
      console.warn(`⚠️ ${config.name} health check failed:`, error.message);

      config.status = 'inactive';
      config.lastCheck = new Date();
      config.error = error.message;
      this.servers.set(serverId, config);

      this.emit('server_health_failed', { serverId, error: error.message });
    }
  }

  /**
   * Get all active servers
   */
  getActiveServers() {
    const activeServers = Array.from(this.servers.entries())
      .filter(([_, config]) => config.status === 'active')
      .map(([serverId, config]) => ({
        id: serverId,
        name: config.name,
        type: config.type,
        toolCount: config.toolCount,
        status: config.status,
        lastCheck: config.lastCheck
      }));

    return activeServers;
  }

  /**
   * Get server status summary
   */
  getServerStatus() {
    const servers = Array.from(this.servers.values());
    const totalTools = servers.reduce((sum, server) => sum + (server.toolCount || 0), 0);

    return {
      total_servers: servers.length,
      active_servers: servers.filter(s => s.status === 'active').length,
      inactive_servers: servers.filter(s => s.status === 'inactive').length,
      total_tools: totalTools,
      servers: servers.map(server => ({
        id: server.id,
        name: server.name,
        type: server.type,
        status: server.status,
        toolCount: server.toolCount,
        lastCheck: server.lastCheck
      })),
      last_discovery: this.isDiscovering ? 'in_progress' : 'completed'
    };
  }

  /**
   * Execute command on specific server
   */
  async executeCommand(serverId, command, parameters = {}) {
    const server = this.servers.get(serverId);

    if (!server) {
      throw new Error(`Server not found: ${serverId}`);
    }

    if (server.status !== 'active') {
      throw new Error(`Server not active: ${serverId}`);
    }

    if (server.type === 'http_api') {
      return this.executeHttpCommand(server, command, parameters);
    } else if (server.type === 'stdio') {
      return this.executeStdioCommand(server, command, parameters);
    }

    throw new Error(`Unsupported server type: ${server.type}`);
  }

  /**
   * Execute HTTP API command
   */
  async executeHttpCommand(server, command, parameters) {
    const commandUrl = `${server.protocol}://${server.host}:${server.port}${server.endpoints.command}`;

    const payload = {
      command: command,
      parameters: parameters,
      timestamp: new Date().toISOString()
    };

    const response = await axios.post(commandUrl, payload, {
      timeout: server.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      server: server.name,
      command: command,
      result: response.data,
      executedAt: new Date()
    };
  }

  /**
   * Execute STDIO command (placeholder for future implementation)
   */
  async executeStdioCommand(server, command, parameters) {
    // STDIO command execution requires MCP protocol implementation
    // This is a placeholder for the full MCP STDIO integration

    throw new Error('STDIO command execution not yet implemented in this version');
  }

  /**
   * Start STDIO server process
   */
  async startStdioServer(serverId, config) {
    try {
      if (!config.processInfo) {
        console.error(`❌ No process info for ${config.name}`);
        return false;
      }

      // Validate working directory exists
      if (config.processInfo.workingDirectory && !fs.existsSync(config.processInfo.workingDirectory)) {
        console.error(`❌ Working directory does not exist: ${config.processInfo.workingDirectory}`);
        return false;
      }

      console.log(`🚀 Starting ${config.name} with command: ${config.processInfo.command} ${config.processInfo.args.join(' ')}`);

      // Spawn the server process
      const serverProcess = spawn(
        config.processInfo.command,
        config.processInfo.args,
        {
          cwd: config.processInfo.workingDirectory,
          env: { ...process.env, ...config.processInfo.env },
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe']
        }
      );

      // Store process reference
      this.processes.set(serverId, serverProcess);

      // Log output
      const logDir = path.join(__dirname, '../../logs/mcp');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      const logFile = path.join(logDir, `${serverId}.log`);
      const logStream = fs.createWriteStream(logFile, { flags: 'a' });

      serverProcess.stdout.on('data', (data) => {
        const message = `[${new Date().toISOString()}] STDOUT: ${data.toString()}`;
        console.log(`📝 ${config.name}: ${message}`);
        logStream.write(message + '\n');
      });

      serverProcess.stderr.on('data', (data) => {
        const message = `[${new Date().toISOString()}] STDERR: ${data.toString()}`;
        console.error(`⚠️ ${config.name}: ${message}`);
        logStream.write(message + '\n');
      });

      serverProcess.on('error', (error) => {
        console.error(`❌ ${config.name} process error:`, error);
        logStream.write(`[${new Date().toISOString()}] ERROR: ${error.message}\n`);
        this.processes.delete(serverId);
      });

      serverProcess.on('exit', (code, signal) => {
        console.log(`🔴 ${config.name} exited with code ${code}, signal ${signal}`);
        logStream.write(`[${new Date().toISOString()}] EXIT: code=${code}, signal=${signal}\n`);
        logStream.end();
        this.processes.delete(serverId);

        // Mark server as inactive
        const server = this.servers.get(serverId);
        if (server) {
          server.status = 'inactive';
          server.error = `Process exited with code ${code}`;
          this.servers.set(serverId, server);
        }
      });

      // Unref to allow parent process to exit
      serverProcess.unref();

      console.log(`✅ ${config.name} process spawned with PID: ${serverProcess.pid}`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to start ${config.name}:`, error);
      return false;
    }
  }

  /**
   * Restart STDIO server
   */
  async restartStdioServer(serverId) {
    const config = this.serverConfig[serverId];
    if (!config) {
      throw new Error(`Server config not found: ${serverId}`);
    }

    console.log(`🔄 Restarting ${config.name}...`);

    // Stop existing process if any
    const existingProcess = this.processes.get(serverId);
    if (existingProcess && !existingProcess.killed) {
      existingProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Start the server
    return await this.startStdioServer(serverId, config);
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown() {
    console.log('🛑 Shutting down MCP Integration Service...');

    // Clear all health check intervals
    for (const interval of this.healthCheckIntervals.values()) {
      clearInterval(interval);
    }

    // Terminate any spawned processes gracefully
    for (const [serverId, process] of this.processes.entries()) {
      if (process && !process.killed) {
        console.log(`🛑 Stopping ${serverId}...`);
        process.kill('SIGTERM');
      }
    }

    // Wait for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Force kill any remaining processes
    for (const [serverId, process] of this.processes.entries()) {
      if (process && !process.killed) {
        console.log(`💥 Force killing ${serverId}...`);
        process.kill('SIGKILL');
      }
    }

    this.servers.clear();
    this.tools.clear();
    this.processes.clear();
    this.healthCheckIntervals.clear();

    console.log('✅ MCP Integration Service shutdown completed');
  }
}

export default McpIntegrationServiceProduction;