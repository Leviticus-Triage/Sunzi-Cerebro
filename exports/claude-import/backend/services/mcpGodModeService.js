/**
 * MCP-God-Mode Integration Service
 * Handles communication with the MCP-God-Mode server
 * 152 Professional Security Tools Integration
 */

import { EventEmitter } from 'events';
import { spawn } from 'child_process';
import path from 'path';

export class McpGodModeService extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.process = null;
    this.tools = new Map();
    this.toolCategories = [
      'Network Security',
      'Penetration Testing',
      'Vulnerability Assessment',
      'Digital Forensics',
      'Mobile Security',
      'Cloud Security',
      'Web Security',
      'Email Security',
      'File System Tools',
      'Process Tools',
      'Media Tools'
    ];

    // Configuration
    this.config = {
      name: 'MCP-God-Mode',
      description: 'Professional Security & Network Analysis Platform',
      totalTools: 152,
      serverPath: '/home/danii/MCP-God-Mode/dev/dist/server-modular.js',
      workingDirectory: '/home/danii/MCP-God-Mode/dev'
    };

    console.log('🔧 MCP-God-Mode Service initialized');
  }

  /**
   * Start the MCP-God-Mode server process
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  MCP-God-Mode already running');
      return { success: true, message: 'Already running' };
    }

    try {
      console.log('🚀 Starting MCP-God-Mode server...');

      // Spawn the Node.js process
      this.process = spawn('node', [this.config.serverPath], {
        cwd: this.config.workingDirectory,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          MCP_SERVER_NAME: 'mcp-god-mode'
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Handle process events
      this.process.on('spawn', () => {
        this.isRunning = true;
        console.log('✅ MCP-God-Mode server started successfully');
        this.emit('started', { tools: this.config.totalTools });
      });

      this.process.on('error', (error) => {
        console.error('❌ MCP-God-Mode startup error:', error);
        this.isRunning = false;
        this.emit('error', error);
      });

      this.process.on('exit', (code) => {
        console.log(`🔄 MCP-God-Mode process exited with code: ${code}`);
        this.isRunning = false;
        this.emit('stopped', { code });
      });

      // Capture stdout for tool discovery
      this.process.stdout.on('data', (data) => {
        const output = data.toString();
        this.parseToolOutput(output);
        this.emit('output', { type: 'stdout', data: output });
      });

      this.process.stderr.on('data', (data) => {
        const output = data.toString();
        console.log('MCP-God-Mode:', output);
        this.emit('output', { type: 'stderr', data: output });
      });

      return {
        success: true,
        message: 'MCP-God-Mode started',
        pid: this.process.pid,
        tools: this.config.totalTools
      };

    } catch (error) {
      console.error('❌ Failed to start MCP-God-Mode:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Stop the MCP-God-Mode server
   */
  async stop() {
    if (!this.isRunning || !this.process) {
      return { success: true, message: 'Not running' };
    }

    try {
      console.log('🛑 Stopping MCP-God-Mode server...');
      this.process.kill('SIGTERM');

      // Force kill after 5 seconds
      setTimeout(() => {
        if (this.isRunning && this.process) {
          this.process.kill('SIGKILL');
        }
      }, 5000);

      return { success: true, message: 'Stop signal sent' };
    } catch (error) {
      console.error('❌ Error stopping MCP-God-Mode:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get server status and metrics
   */
  getStatus() {
    return {
      name: this.config.name,
      description: this.config.description,
      isRunning: this.isRunning,
      pid: this.process?.pid || null,
      toolCount: this.config.totalTools,
      categories: this.toolCategories,
      uptime: this.isRunning ? process.uptime() : 0,
      features: [
        'Port Scanning & Network Discovery',
        'Vulnerability Assessment',
        'Penetration Testing Toolkit',
        'Digital Forensics Analysis',
        'Mobile Device Security',
        'Cloud Security Assessment',
        'Web Application Testing',
        'Email Security Analysis',
        'Malware Analysis',
        'Social Engineering Toolkit',
        'Wireless Security Testing',
        'Bluetooth Security Analysis'
      ]
    };
  }

  /**
   * Parse tool output to extract available tools
   */
  parseToolOutput(output) {
    // Extract tool count from output
    const toolCountMatch = output.match(/Total Tools Available:\s*(\d+)/);
    if (toolCountMatch) {
      const discoveredTools = parseInt(toolCountMatch[1]);
      if (discoveredTools !== this.config.totalTools) {
        console.log(`📊 Tool count updated: ${discoveredTools} tools discovered`);
        this.config.totalTools = discoveredTools;
        this.emit('toolsDiscovered', { count: discoveredTools });
      }
    }

    // Extract specific tool categories
    const categoryMatches = [
      'File System Tools',
      'Process Tools',
      'Network Tools',
      'Security Tools',
      'Email Tools',
      'Media Tools',
      'Web Tools',
      'Mobile Tools',
      'Cloud Tools',
      'Forensics Tools'
    ];

    categoryMatches.forEach(category => {
      if (output.includes(category)) {
        this.tools.set(category, { available: true, timestamp: new Date() });
      }
    });
  }

  /**
   * Execute a tool command (placeholder for MCP protocol integration)
   */
  async executeTool(toolName, parameters = {}) {
    if (!this.isRunning) {
      return {
        success: false,
        error: 'MCP-God-Mode server not running'
      };
    }

    // This would integrate with the actual MCP protocol
    // For now, return a placeholder response
    return {
      success: true,
      tool: toolName,
      parameters,
      result: `Tool ${toolName} executed with MCP-God-Mode`,
      timestamp: new Date().toISOString(),
      server: 'mcp-god-mode'
    };
  }

  /**
   * Get available tool categories
   */
  getToolCategories() {
    return this.toolCategories.map(category => ({
      name: category,
      available: this.tools.has(category),
      timestamp: this.tools.get(category)?.timestamp || null
    }));
  }
}

export default McpGodModeService;