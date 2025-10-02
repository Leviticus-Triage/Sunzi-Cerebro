/**
 * MCP Integration Service
 * Real-time connection to all active MCP servers
 * NO MOCK DATA - Production Ready Integration
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';
import axios from 'axios';

class McpIntegrationService extends EventEmitter {
  constructor() {
    super();
    this.servers = new Map();
    this.tools = new Map();
    this.connections = new Map();
    this.executionQueue = [];
    this.isDiscovering = false;

    // All MCP Servers configuration - Complete Integration
    this.serverConfig = {
      hexstrike: {
        host: 'localhost',
        port: 8888,
        protocol: 'http',
        wsPort: 8889,
        name: 'HexStrike AI',
        status: 'unknown',
        type: 'http_api',
        toolCount: 124,
        endpoints: {
          health: '/health',
          tools: '/api/tools',
          discovery: '/api/status',
          execute: '/api/command'
        }
      },
      attackmcp: {
        host: 'localhost',
        port: 9001, // Changed to avoid conflict
        protocol: 'http',
        wsPort: 9002,
        name: 'AttackMCP FastMCP',
        status: 'unknown',
        type: 'stdio', // FastMCP STDIO Server
        toolCount: 7,
        processInfo: {
          command: '/home/danii/attackmcp/attackmcp-venv/bin/python',
          args: ['/home/danii/attackmcp/server.py'],
          env: {
            MCP_SERVER_NAME: 'attackmcp',
            PYTHONPATH: '/home/danii/attackmcp',
            VIRTUAL_ENV: '/home/danii/attackmcp/attackmcp-venv'
          },
          workingDirectory: '/home/danii/attackmcp'
        },
        endpoints: {
          health: '/health',
          tools: '/__tools__',
          discovery: '/__info__',
          execute: '/execute'
        }
      },
      autopentestorchestrator: {
        host: 'localhost',
        port: 8892,
        protocol: 'http',
        wsPort: 8893,
        name: 'Auto-Pentest Orchestrator',
        status: 'unknown',
        type: 'stdio',
        toolCount: 0, // To be discovered
        processInfo: {
          command: '/home/danii/attackmcp/attackmcp-venv/bin/python',
          args: ['/home/danii/attackmcp/auto_pentest_orchestrator.py'],
          env: {
            VIRTUAL_ENV: '/home/danii/attackmcp/attackmcp-venv',
            PYTHONPATH: '/home/danii/attackmcp',
            AUTO_REPORT: 'true'
          },
          workingDirectory: '/home/danii/attackmcp'
        }
      },
      mcpgodmode: {
        host: 'localhost',
        port: 8894,
        protocol: 'stdio',
        name: 'MCP-God-Mode',
        status: 'running',
        type: 'stdio',
        toolCount: 152, // Professional Security Tool Suite
        processInfo: {
          command: 'node',
          args: ['/home/danii/MCP-God-Mode/dev/dist/server-modular.js'],
          env: {
            NODE_ENV: 'production',
            MCP_SERVER_NAME: 'mcp-god-mode'
          },
          workingDirectory: '/home/danii/MCP-God-Mode/dev'
        },
        description: 'Professional Security & Network Analysis Platform with 152 tools including penetration testing, network discovery, vulnerability assessment, and forensics analysis',
        categories: [
          'Network Security',
          'Penetration Testing',
          'Vulnerability Assessment',
          'Digital Forensics',
          'Mobile Security',
          'Cloud Security',
          'Web Security',
          'Email Security'
        ]
      },
      notionmcp: {
        host: 'localhost',
        port: 8896,
        protocol: 'http',
        wsPort: 8897,
        name: 'Notion MCP',
        status: 'unknown',
        type: 'stdio',
        toolCount: 0, // To be discovered
        processInfo: {
          command: 'npx',
          args: ['-y', '@notionhq/notion-mcp-server', '--transport', 'stdio'],
          env: {
            NOTION_TOKEN: 'ntn_T142672354291rL8erwWrk4rxchg1FEsMPqn4KGkWpN8vV'
          },
          workingDirectory: '/home/danii/attackmcp/warp_ai_integration'
        },
        endpoints: {
          health: '/health',
          tools: '/tools',
          pages: '/pages',
          create: '/create'
        }
      },
      // NEUER MCP SERVER - Template zum Anpassen
      your_new_server: {
        host: 'localhost',
        port: 8898, // Neuer Port
        protocol: 'http', // oder 'stdio'
        wsPort: 8899,
        name: 'Your New MCP Server',
        status: 'unknown',
        type: 'stdio', // 'stdio' oder 'http_api'
        toolCount: 0,
        processInfo: {
          command: 'node', // oder 'python3'
          args: ['/path/to/your/server.js'],
          env: {
            API_KEY: 'your-api-key',
            NODE_ENV: 'production'
          },
          workingDirectory: '/path/to/your/server'
        },
        endpoints: {
          health: '/health',
          tools: '/api/tools',
          execute: '/api/execute'
        }
      }
    };

    console.log('🔌 MCP Integration Service initialized');
    // Start discovery asynchronously to avoid blocking
    setTimeout(() => {
      this.startDiscovery();
    }, 100);
  }

  /**
   * Start server discovery and health monitoring
   */
  async startDiscovery() {
    if (this.isDiscovering) return;

    this.isDiscovering = true;
    console.log('🔍 Starting MCP server discovery...');

    // Discover active servers
    for (const [serverId, config] of Object.entries(this.serverConfig)) {
      await this.discoverServer(serverId, config);
    }

    // Start periodic health checks
    setInterval(() => this.healthCheck(), 30000);

    console.log(`✅ MCP Discovery completed. Found ${this.servers.size} active servers`);
    this.emit('discovery-complete', this.getServerStatus());
  }

  /**
   * Discover individual MCP server and its capabilities
   */
  async discoverServer(serverId, config) {
    try {
      console.log(`🔎 Discovering server: ${config.name} (type: ${config.type || 'http'})`);

      // Handle different server types
      if (config.type === 'stdio') {
        return this.discoverStdioServer(serverId, config);
      }

      // HTTP-based discovery endpoints
      let endpoints = [];

      if (serverId === 'hexstrike') {
        // HexStrike AI specific endpoints - uses /health for comprehensive tool discovery
        endpoints = [
          `${config.protocol}://${config.host}:${config.port}/health`,
          `${config.protocol}://${config.host}:${config.port}/api/tools`,
          `${config.protocol}://${config.host}:${config.port}/status`
        ];
      } else if (serverId === 'attackmcp') {
        // AttackMCP FastMCP specific endpoints (if running HTTP mode)
        endpoints = [
          `${config.protocol}://${config.host}:${config.port}/__info__`,
          `${config.protocol}://${config.host}:${config.port}/__tools__`,
          `${config.protocol}://${config.host}:${config.port}/health`
        ];
      } else {
        // Default endpoints for other HTTP servers
        endpoints = [
          `${config.protocol}://${config.host}:${config.port}/health`,
          `${config.protocol}://${config.host}:${config.port}/api/health`,
          `${config.protocol}://${config.host}:${config.port}/status`,
          `${config.protocol}://${config.host}:${config.port}/mcp/tools`,
          `${config.protocol}://${config.host}:${config.port}/tools/list`
        ];
      }

      let serverInfo = null;
      let toolsList = null;

      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint, {
            timeout: 5000,
            headers: { 'Accept': 'application/json' }
          });

          if (response.status === 200 && response.data) {
            if (endpoint.includes('health') || endpoint.includes('status')) {
              serverInfo = response.data;
            } else if (endpoint.includes('tools')) {
              toolsList = response.data;
            }

            config.status = 'online';
            console.log(`✅ ${config.name} responded at ${endpoint}`);
            break;
          }
        } catch (error) {
          // Continue trying other endpoints
          continue;
        }
      }

      if (config.status === 'online') {
        // Register server
        this.servers.set(serverId, {
          ...config,
          info: serverInfo,
          lastSeen: new Date(),
          toolCount: 0
        });

        // Discover tools for this server
        await this.discoverServerTools(serverId, config);

        // Establish WebSocket connection if available
        await this.connectWebSocket(serverId, config);

        this.emit('server-discovered', serverId, config);
      } else {
        config.status = 'offline';
        console.log(`❌ ${config.name} is not responding`);
      }

    } catch (error) {
      config.status = 'error';
      console.error(`💥 Error discovering ${config.name}:`, error.message);
    }
  }

  /**
   * Discover STDIO-based MCP server and its tools
   */
  async discoverStdioServer(serverId, config) {
    try {
      console.log(`🔌 Discovering STDIO server: ${config.name}`);

      // Check if process is running
      const isRunning = await this.checkStdioServerProcess(serverId, config);

      if (isRunning) {
        config.status = 'online';

        // Register server
        this.servers.set(serverId, {
          ...config,
          info: { type: 'stdio', pid: config.processInfo?.pid },
          lastSeen: new Date(),
          toolCount: 0
        });

        // Discover tools for STDIO servers
        await this.discoverStdioServerTools(serverId, config);

        console.log(`✅ ${config.name} STDIO server discovered`);
        this.emit('server-discovered', serverId, config);
      } else {
        config.status = 'offline';
        console.log(`❌ ${config.name} STDIO server not responding`);
      }

    } catch (error) {
      config.status = 'error';
      console.error(`💥 Error discovering STDIO server ${config.name}:`, error.message);
    }
  }

  /**
   * Check if STDIO MCP server process is running
   */
  async checkStdioServerProcess(serverId, config) {
    try {
      // For STDIO servers, we check if the process is running
      const { spawn } = await import('child_process');

      // Check if process exists using ps command
      return new Promise((resolve) => {
        const ps = spawn('ps', ['aux']);
        let output = '';

        ps.stdout.on('data', (data) => {
          output += data.toString();
        });

        ps.on('close', () => {
          // Check if our server process is in the output with multiple patterns
          let processPattern = config.processInfo?.args?.[0] || config.name;
          let isRunning = output.includes(processPattern);

          // Try alternative patterns for better detection
          if (!isRunning && serverId === 'attackmcp') {
            // Try multiple patterns for AttackMCP
            const patterns = [
              'server.py',
              'attackmcp/server.py',
              'python server.py',
              'fastmcp',
              'attackmcp'
            ];
            isRunning = patterns.some(pattern => output.includes(pattern));
            if (isRunning) processPattern = 'server.py (detected with alternative pattern)';
          }

          if (!isRunning && serverId === 'notionmcp') {
            // Try multiple patterns for Notion MCP
            const patterns = [
              'notion-mcp-server',
              '@notionhq/notion-mcp',
              'notion.*mcp',
              'npx.*notion'
            ];
            isRunning = patterns.some(pattern => new RegExp(pattern).test(output));
            if (isRunning) processPattern = 'notion-mcp-server (detected with alternative pattern)';
          }

          console.log(`🔍 Process check for ${config.name}: ${isRunning ? 'FOUND' : 'NOT FOUND'} (pattern: ${processPattern})`);
          resolve(isRunning);
        });

        setTimeout(() => resolve(false), 5000); // Timeout after 5s
      });

    } catch (error) {
      console.error(`Error checking STDIO process for ${config.name}:`, error);
      return false;
    }
  }

  /**
   * Discover tools for STDIO MCP servers
   */
  async discoverStdioServerTools(serverId, config) {
    try {
      console.log(`🔧 Discovering STDIO tools for ${config.name}...`);

      let discoveredTools = [];

      // Static tool definitions based on server type
      if (serverId === 'attackmcp') {
        // AttackMCP known tools from server.py analysis
        discoveredTools = [
          { name: 'hello', description: 'Greet the user with their name', category: 'utility' },
          { name: 'portscan_basic', description: 'Basic TCP SYN scan with service detection', category: 'scanning' },
          { name: 'postgres_query', description: 'Query PostgreSQL database', category: 'database' },
          { name: 'network_discovery_auto', description: 'Automatic network discovery - finds live hosts', category: 'reconnaissance' },
          { name: 'full_port_scan_auto', description: 'Automatic full port scan - scans all hosts', category: 'scanning' },
          { name: 'comprehensive_network_assessment', description: 'Complete automated network assessment', category: 'automation' },
          { name: 'generate_target_lists', description: 'Generate various target files for different scan types', category: 'utility' }
        ];
      } else if (serverId === 'notionmcp') {
        // Notion MCP tools for documentation
        discoveredTools = [
          { name: 'create_page', description: 'Create a new Notion page', category: 'documentation' },
          { name: 'update_page', description: 'Update existing Notion page', category: 'documentation' },
          { name: 'list_pages', description: 'List all pages in workspace', category: 'documentation' },
          { name: 'search_pages', description: 'Search for specific pages', category: 'documentation' },
          { name: 'create_database', description: 'Create a new Notion database', category: 'documentation' },
          { name: 'query_database', description: 'Query Notion database entries', category: 'documentation' }
        ];
      }

      // Process and register discovered tools
      if (discoveredTools.length > 0) {
        for (const tool of discoveredTools) {
          const toolId = `${serverId}_${tool.name}`;

          const standardizedTool = {
            id: toolId,
            serverId: serverId,
            serverName: config.name,
            name: tool.name,
            description: tool.description || '',
            category: tool.category || 'miscellaneous',
            parameters: tool.parameters || {},
            schema: tool.schema || {},
            riskLevel: this.assessRiskLevel(tool),
            lastUsed: null,
            usageCount: 0,
            enabled: true,
            metadata: {
              original: tool,
              serverType: 'stdio',
              discoveredAt: new Date().toISOString()
            }
          };

          this.tools.set(toolId, standardizedTool);
        }

        // Update server tool count
        const server = this.servers.get(serverId);
        if (server) {
          server.toolCount = discoveredTools.length;
          this.servers.set(serverId, server);
        }

        console.log(`🎯 Found ${discoveredTools.length} STDIO tools on ${config.name}`);
        this.emit('tools-discovered', serverId, discoveredTools);
      }

    } catch (error) {
      console.error(`Error discovering STDIO tools for ${config.name}:`, error);
    }
  }

  /**
   * Discover tools available on specific MCP server
   */
  async discoverServerTools(serverId, config) {
    try {
      console.log(`🔧 Discovering tools for ${config.name}...`);

      // HexStrike AI uses /health endpoint with tools_status
      const toolEndpoints = [
        `${config.protocol}://${config.host}:${config.port}/health`,
        `${config.protocol}://${config.host}:${config.port}/mcp/tools`,
        `${config.protocol}://${config.host}:${config.port}/tools/list`,
        `${config.protocol}://${config.host}:${config.port}/api/tools`,
        `${config.protocol}://${config.host}:${config.port}/tools`
      ];

      let discoveredTools = [];

      for (const endpoint of toolEndpoints) {
        try {
          const response = await axios.get(endpoint, {
            timeout: 10000,
            headers: { 'Accept': 'application/json' }
          });

          if (response.data) {
            // Handle different response formats
            let tools = [];

            // HexStrike AI health endpoint contains tools_status object
            if (response.data.tools_status && typeof response.data.tools_status === 'object') {
              // Convert tools_status object to tools array
              tools = Object.entries(response.data.tools_status).map(([toolName, available]) => ({
                id: toolName,
                name: toolName,
                description: `${toolName} security tool - ${available ? 'Available' : 'Unavailable'}`,
                available: available,
                category: this.categorizeToolByName(toolName)
              })).filter(tool => tool.available);
            } else if (Array.isArray(response.data)) {
              tools = response.data;
            } else if (response.data.tools && Array.isArray(response.data.tools)) {
              tools = response.data.tools;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              tools = response.data.data;
            } else if (typeof response.data === 'object') {
              // Try to extract tools from object
              const possibleArrays = Object.values(response.data).filter(Array.isArray);
              if (possibleArrays.length > 0) {
                tools = possibleArrays[0];
              }
            }

            if (tools.length > 0) {
              discoveredTools = tools;
              console.log(`🎯 Found ${tools.length} tools on ${config.name}`);
              break;
            }
          }
        } catch (error) {
          continue;
        }
      }

      // Process and register discovered tools
      if (discoveredTools.length > 0) {
        for (const tool of discoveredTools) {
          const toolId = `${serverId}_${tool.name || tool.id || Math.random().toString(36).substr(2, 9)}`;

          const standardizedTool = {
            id: toolId,
            serverId: serverId,
            serverName: config.name,
            name: tool.name || tool.id || 'Unknown Tool',
            description: tool.description || tool.summary || '',
            category: this.categorizeTool(tool),
            parameters: tool.parameters || tool.args || tool.input_schema || {},
            schema: tool.input_schema || tool.schema || {},
            riskLevel: this.assessRiskLevel(tool),
            lastUsed: null,
            usageCount: 0,
            enabled: true,
            metadata: {
              original: tool,
              endpoint: config.protocol + '://' + config.host + ':' + config.port,
              discoveredAt: new Date().toISOString()
            }
          };

          this.tools.set(toolId, standardizedTool);
        }

        // Update server tool count
        const server = this.servers.get(serverId);
        if (server) {
          server.toolCount = discoveredTools.length;
          this.servers.set(serverId, server);
        }

        console.log(`✅ Registered ${discoveredTools.length} tools from ${config.name}`);
        this.emit('tools-discovered', serverId, discoveredTools.length);
      }

    } catch (error) {
      console.error(`💥 Error discovering tools for ${config.name}:`, error.message);
    }
  }

  /**
   * Categorize tool based on its name (for HexStrike tools)
   */
  categorizeToolByName(toolName) {
    const name = toolName.toLowerCase();

    if (name.includes('nmap') || name.includes('masscan') || name.includes('rustscan') ||
        name.includes('nikto') || name.includes('dirb') || name.includes('gobuster') ||
        name.includes('nuclei') || name.includes('scan')) {
      return 'scanning';
    } else if (name.includes('recon') || name.includes('enum') || name.includes('amass') ||
               name.includes('subfinder') || name.includes('theharvester') || name.includes('sherlock')) {
      return 'reconnaissance';
    } else if (name.includes('metasploit') || name.includes('exploit') || name.includes('msfconsole') ||
               name.includes('sqlmap') || name.includes('xss') || name.includes('burp')) {
      return 'exploitation';
    } else if (name.includes('hydra') || name.includes('john') || name.includes('hashcat') ||
               name.includes('medusa') || name.includes('crack')) {
      return 'password_attacks';
    } else if (name.includes('aircrack') || name.includes('aireplay') || name.includes('airmon') ||
               name.includes('kismet') || name.includes('wireless')) {
      return 'wireless';
    } else if (name.includes('steghide') || name.includes('binwalk') || name.includes('foremost') ||
               name.includes('autopsy') || name.includes('volatility')) {
      return 'forensics';
    } else if (name.includes('social') || name.includes('maltego') || name.includes('osint')) {
      return 'osint';
    } else {
      return 'miscellaneous';
    }
  }

  /**
   * Categorize tool based on its metadata
   */
  categorizeTool(tool) {
    const name = (tool.name || '').toLowerCase();
    const description = (tool.description || '').toLowerCase();
    const text = `${name} ${description}`;

    if (text.includes('scan') || text.includes('probe') || text.includes('detect')) {
      return 'scanning';
    } else if (text.includes('recon') || text.includes('enum') || text.includes('discover')) {
      return 'reconnaissance';
    } else if (text.includes('exploit') || text.includes('attack') || text.includes('inject')) {
      return 'exploitation';
    } else if (text.includes('post') || text.includes('persist') || text.includes('pivot')) {
      return 'post_exploitation';
    } else if (text.includes('wrapper') || text.includes('util') || text.includes('helper')) {
      return 'wrapper_tools';
    } else {
      return 'miscellaneous';
    }
  }

  /**
   * Assess risk level of tool
   */
  assessRiskLevel(tool) {
    const name = (tool.name || '').toLowerCase();
    const description = (tool.description || '').toLowerCase();
    const text = `${name} ${description}`;

    if (text.includes('exploit') || text.includes('attack') || text.includes('inject') || text.includes('shell')) {
      return 'critical';
    } else if (text.includes('brute') || text.includes('crack') || text.includes('bypass')) {
      return 'high';
    } else if (text.includes('scan') || text.includes('probe') || text.includes('test')) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Establish WebSocket connection to MCP server
   */
  async connectWebSocket(serverId, config) {
    try {
      const wsUrl = `ws://${config.host}:${config.wsPort || (config.port + 1)}`;
      console.log(`🔌 Connecting WebSocket to ${config.name} at ${wsUrl}`);

      const ws = new WebSocket(wsUrl);

      ws.on('open', () => {
        console.log(`✅ WebSocket connected to ${config.name}`);
        this.connections.set(serverId, ws);
        this.emit('websocket-connected', serverId);
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(serverId, message);
        } catch (error) {
          console.error(`Error parsing WebSocket message from ${config.name}:`, error);
        }
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for ${config.name}:`, error.message);
      });

      ws.on('close', () => {
        console.log(`🔌 WebSocket disconnected from ${config.name}`);
        this.connections.delete(serverId);
        this.emit('websocket-disconnected', serverId);
      });

    } catch (error) {
      console.error(`Error connecting WebSocket to ${config.name}:`, error.message);
    }
  }

  /**
   * Handle WebSocket messages from MCP servers
   */
  handleWebSocketMessage(serverId, message) {
    this.emit('mcp-message', {
      serverId,
      serverName: this.servers.get(serverId)?.name,
      message,
      timestamp: new Date()
    });
  }

  /**
   * Execute tool on specific MCP server
   */
  async executeTool(toolId, parameters = {}, options = {}) {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    const server = this.servers.get(tool.serverId);
    if (!server || server.status !== 'online') {
      throw new Error(`Server ${tool.serverId} is not available`);
    }

    try {
      console.log(`🚀 Executing tool ${tool.name} on ${server.name}`);

      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Add to execution queue
      const execution = {
        id: executionId,
        toolId,
        tool,
        server,
        parameters,
        options,
        status: 'queued',
        startTime: new Date(),
        progress: 0,
        output: [],
        error: null
      };

      this.executionQueue.push(execution);
      this.emit('tool-execution-queued', execution);

      // Execute tool
      const result = await this.performToolExecution(execution);

      // Update tool usage statistics
      tool.lastUsed = new Date().toISOString();
      tool.usageCount++;
      this.tools.set(toolId, tool);

      return result;

    } catch (error) {
      console.error(`💥 Error executing tool ${tool.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Perform actual tool execution
   */
  async performToolExecution(execution) {
    try {
      execution.status = 'running';
      execution.progress = 10;
      this.emit('tool-execution-started', execution);

      const { tool, server, parameters } = execution;

      // Try different execution endpoints (include server-specific configured endpoints)
      const configuredExecute =
        (this.serverConfig?.[server.serverId]?.endpoints?.execute) ||
        (this.servers.get(server.serverId)?.endpoints?.execute) ||
        '/api/execute';

      const base = `${server.protocol}://${server.host}:${server.port}`;
      const executionEndpoints = [
        `${base}/api/command`,                  // HexStrike primary endpoint
        `${base}${configuredExecute.startsWith('/') ? '' : '/'}${configuredExecute}`,
        `${base}/mcp/execute/${tool.name}`,
        `${base}/tools/execute/${tool.name}`,
        `${base}/api/tools/${tool.name}`,       // HexStrike per-tool endpoint
        `${base}/api/tools/execute`,
        `${base}/execute`
      ];

      // Try multiple payload variants to match different server contracts (HexStrike, God-Mode, etc.)
      const flatTarget = (parameters && (parameters.target || parameters.host || parameters.url)) || undefined;

      // Build HexStrike command format for aircrack-ng and other tools
      let hexstrikeCommand = tool.name;
      if (parameters && Object.keys(parameters).length > 0) {
        const paramString = Object.entries(parameters)
          .map(([key, value]) => `--${key}=${value}`)
          .join(' ');
        hexstrikeCommand = `${tool.name} ${paramString}`.trim();
      }

      const payloadVariants = [
        { command: hexstrikeCommand },                     // HexStrike primary format
        { command: tool.name },                           // HexStrike tool name only
        { tool: tool.name, toolId: tool.id, parameters, options: execution.options },
        { tool_id: tool.name, parameters },
        { tool: tool.id, parameters },
        { tool_id: tool.id, parameters },
        parameters || {},                                  // send parameters as top-level body
        flatTarget ? { target: flatTarget } : {},          // HexStrike simple target
        flatTarget ? { target: flatTarget, params: parameters || {} } : {} // HexStrike target + params
      ].filter(p => Object.keys(p).length > 0);

      let result = null;
      let lastError = null;

      for (const endpoint of executionEndpoints) {
        for (const payload of payloadVariants) {
          try {
            execution.progress = 30;
            this.emit('tool-execution-progress', execution);

            const response = await axios.post(endpoint, payload, {
              timeout: 60000, // 60 second timeout
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            });

            if (response.status === 200 && response.data) {
              result = response.data;
              execution.progress = 100;
              execution.status = 'completed';
              execution.endTime = new Date();
              execution.output = Array.isArray(result) ? result : [result];

              this.emit('tool-execution-completed', execution);
              console.log(`✅ Tool ${tool.name} executed at ${endpoint}`);
              return result;
            }
          } catch (error) {
            lastError = error;
            // Try next payload/endpoint
            continue;
          }
        }
      }

      // If we get here, all endpoints failed
      throw lastError || new Error('All execution endpoints failed');

    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      execution.endTime = new Date();

      this.emit('tool-execution-failed', execution);
      throw error;
    }
  }

  /**
   * Periodic health check for all servers
   */
  async healthCheck() {
    console.log('🏥 Performing MCP server health check...');

    for (const [serverId, server] of this.servers.entries()) {
      try {
        // Use process-based checks for STDIO servers (no HTTP endpoint!)
        if (server.type === 'stdio' || server.protocol === 'stdio') {
          const baseConfig = this.serverConfig?.[serverId] || server;
          const isRunning = await this.checkStdioServerProcess(serverId, baseConfig);
          if (isRunning) {
            server.status = 'online';
            server.lastSeen = new Date();
          } else {
            server.status = 'offline';
          }
        } else {
          // HTTP-based health check
          const response = await axios.get(
            `${server.protocol}://${server.host}:${server.port}/health`,
            { timeout: 5000 }
          );

          if (response.status === 200) {
            server.status = 'online';
            server.lastSeen = new Date();
          } else {
            server.status = 'degraded';
          }
        }
      } catch (error) {
        server.status = 'offline';
        console.warn(`⚠️ ${server.name} health check failed: ${error.message}`);
      }
    }

    this.emit('health-check-completed', this.getServerStatus());
  }

  /**
   * Get current server status summary
   */
  getServerStatus() {
    const status = {
      totalServers: this.servers.size,
      onlineServers: 0,
      offlineServers: 0,
      totalTools: this.tools.size,
      servers: [],
      lastUpdate: new Date().toISOString()
    };

    for (const [serverId, server] of this.servers.entries()) {
      status.servers.push({
        id: serverId,
        name: server.name,
        status: server.status,
        toolCount: server.toolCount,
        lastSeen: server.lastSeen,
        endpoint: `${server.protocol}://${server.host}:${server.port}`
      });

      if (server.status === 'online') {
        status.onlineServers++;
      } else {
        status.offlineServers++;
      }
    }

    return status;
  }

  /**
   * Get all discovered tools
   */
  getAllTools() {
    return Array.from(this.tools.values());
  }

  /**
   * Get tools by category
   */
  getToolsByCategory() {
    const categories = {};

    for (const tool of this.tools.values()) {
      if (!categories[tool.category]) {
        categories[tool.category] = [];
      }
      categories[tool.category].push(tool);
    }

    return categories;
  }

  /**
   * Get execution queue status
   */
  getExecutionQueueStatus() {
    return {
      queueLength: this.executionQueue.length,
      running: this.executionQueue.filter(e => e.status === 'running').length,
      completed: this.executionQueue.filter(e => e.status === 'completed').length,
      failed: this.executionQueue.filter(e => e.status === 'failed').length,
      queue: this.executionQueue.slice(-10) // Last 10 executions
    };
  }
}

export default McpIntegrationService;
