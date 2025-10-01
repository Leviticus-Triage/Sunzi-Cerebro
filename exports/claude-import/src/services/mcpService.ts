/**
 * MCP Service - Backend Integration for MCP Servers and Tools
 * Provides real-time data from the Sunzi Cerebro Backend MCP Infrastructure
 */

import axios from 'axios'

const API_BASE_URL = 'http://localhost:8890'

export interface McpServer {
  id: string
  name: string
  type: 'stdio' | 'http_api'
  toolCount: number
  status: 'active' | 'inactive' | 'error'
  lastCheck: string
  health?: {
    uptime: number
    responseTime: number
    errorRate: number
  }
}

export interface McpTool {
  id: string
  name: string
  serverId: string
  category: string
  description: string
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  parameters?: any[]
  lastUsed?: string
  usageCount?: number
}

export interface McpSummary {
  total: number
  by_server: Record<string, {
    id: string
    type: string
    toolCount: number
    status: string
  }>
  categories: Record<string, number>
}

export interface McpApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp: string
}

export interface SecurityOperation {
  id: string
  type: 'reconnaissance' | 'vulnerability_scan' | 'network_mapping' | 'exploitation'
  target: string
  tools: string[]
  status: 'planning' | 'executing' | 'completed' | 'error'
  progress: number
  results?: any
}

class McpService {
  private activeOperations = new Map<string, SecurityOperation>()

  /**
   * Get all MCP servers with their status and tool counts
   */
  async getServers(): Promise<McpServer[]> {
    try {
      const response = await axios.get<McpApiResponse<{
        servers: McpServer[]
        summary: McpSummary
      }>>(`${API_BASE_URL}/api/mcp/tools`)

      if (response.data.success) {
        return response.data.data.servers
      } else {
        throw new Error(response.data.message || 'Failed to fetch MCP servers')
      }
    } catch (error: any) {
      console.error('MCP Service - getServers error:', error)
      throw new Error(error.response?.data?.message || 'Network error fetching MCP servers')
    }
  }

  /**
   * Get summary statistics for all MCP infrastructure
   */
  async getSummary(): Promise<McpSummary> {
    try {
      const response = await axios.get<McpApiResponse<{
        servers: McpServer[]
        summary: McpSummary
      }>>(`${API_BASE_URL}/api/mcp/tools`)

      if (response.data.success) {
        return response.data.data.summary
      } else {
        throw new Error(response.data.message || 'Failed to fetch MCP summary')
      }
    } catch (error: any) {
      console.error('MCP Service - getSummary error:', error)
      throw new Error(error.response?.data?.message || 'Network error fetching MCP summary')
    }
  }

  /**
   * Execute a tool with given parameters
   */
  async executeTool(serverId: string, toolName: string, parameters: any = {}): Promise<any> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/mcp/execute`, {
        serverId,
        toolName,
        parameters
      })

      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Tool execution failed')
      }
    } catch (error: any) {
      console.error('MCP Service - executeTool error:', error)
      throw new Error(error.response?.data?.message || 'Network error executing tool')
    }
  }

  /**
   * Get real-time health metrics for MCP infrastructure
   */
  async getHealthMetrics(): Promise<{
    servers: Record<string, {
      uptime: number
      responseTime: number
      errorRate: number
      toolsExecuted: number
    }>
    overall: {
      totalServers: number
      activeServers: number
      totalTools: number
      averageResponseTime: number
    }
  }> {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/mcp/health`)

      if (response.data.success) {
        return response.data.data
      } else {
        throw new Error(response.data.message || 'Failed to fetch health metrics')
      }
    } catch (error: any) {
      console.error('MCP Service - getHealthMetrics error:', error)
      // Return fallback data
      const servers = await this.getServers()
      return {
        servers: servers.reduce((acc, server) => ({
          ...acc,
          [server.id]: {
            uptime: 0,
            responseTime: 0,
            errorRate: 0,
            toolsExecuted: 0
          }
        }), {}),
        overall: {
          totalServers: servers.length,
          activeServers: servers.filter(s => s.status === 'active').length,
          totalTools: servers.reduce((sum, s) => sum + s.toolCount, 0),
          averageResponseTime: 0
        }
      }
    }
  }

  /**
   * Create a new security operation with intelligent tool selection
   */
  async createSecurityOperation(
    type: SecurityOperation['type'],
    target: string,
    options: { verbosity?: number; concurrent?: boolean } = {}
  ): Promise<string> {
    const operationId = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Get optimal tools via backend AI
    const tools = await this.selectOptimalTools(target, type)

    const operation: SecurityOperation = {
      id: operationId,
      type,
      target,
      tools,
      status: 'planning',
      progress: 0
    }

    this.activeOperations.set(operationId, operation)

    // Start operation execution
    this.executeOperation(operationId, options)

    return operationId
  }

  /**
   * Get optimal tools for a specific operation using backend AI
   */
  private async selectOptimalTools(target: string, operation: string): Promise<string[]> {
    try {
      // Use backend AI to select optimal tools
      const response = await this.executeTool('hexstrike', 'ai_tool_selection', {
        target,
        operation_type: operation,
        consider_risk: true
      })

      if (response?.recommended_tools) {
        return response.recommended_tools
      }

      // Fallback to default tools
      return this.getDefaultToolsForOperation(operation)
    } catch (error) {
      console.warn('AI tool selection failed, using defaults:', error)
      return this.getDefaultToolsForOperation(operation)
    }
  }

  /**
   * Get default tools for operation types
   */
  private getDefaultToolsForOperation(operation: string): string[] {
    const toolMap: Record<string, string[]> = {
      'reconnaissance': ['nmap_basic_scan', 'dns_enumeration', 'subdomain_discovery'],
      'vulnerability_scan': ['nuclei_basic', 'security_headers_check', 'ssl_analysis'],
      'network_mapping': ['nmap_detailed_scan', 'port_discovery', 'service_detection'],
      'exploitation': ['metasploit_search', 'exploit_suggestion', 'payload_generation']
    }

    return toolMap[operation] || ['nmap_basic_scan']
  }

  /**
   * Execute a security operation
   */
  private async executeOperation(
    operationId: string,
    options: { verbosity?: number; concurrent?: boolean } = {}
  ): Promise<void> {
    const operation = this.activeOperations.get(operationId)
    if (!operation) return

    operation.status = 'executing'
    operation.progress = 10

    try {
      const results: any[] = []
      const totalTools = operation.tools.length

      for (let i = 0; i < operation.tools.length; i++) {
        const tool = operation.tools[i]
        operation.progress = 10 + (i / totalTools) * 80

        try {
          // Execute tool via backend
          const response = await this.executeTool('hexstrike', tool, {
            target: operation.target,
            verbosity: options.verbosity || 1
          })

          results.push({
            tool,
            result: response,
            status: 'success',
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          results.push({
            tool,
            error: error instanceof Error ? error.message : String(error),
            status: 'error',
            timestamp: new Date().toISOString()
          })
        }

        // Update progress
        this.activeOperations.set(operationId, { ...operation })
      }

      operation.status = 'completed'
      operation.progress = 100
      operation.results = results

    } catch (error) {
      operation.status = 'error'
      operation.results = {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }
    }

    this.activeOperations.set(operationId, operation)
  }

  /**
   * Get operation status
   */
  getOperation(operationId: string): SecurityOperation | undefined {
    return this.activeOperations.get(operationId)
  }

  /**
   * Get all active operations
   */
  getAllOperations(): SecurityOperation[] {
    return Array.from(this.activeOperations.values())
  }

  /**
   * Stop a running operation
   */
  stopOperation(operationId: string): boolean {
    const operation = this.activeOperations.get(operationId)
    if (operation && operation.status === 'executing') {
      operation.status = 'error'
      operation.results = {
        error: 'Operation stopped by user',
        timestamp: new Date().toISOString()
      }
      this.activeOperations.set(operationId, operation)
      return true
    }
    return false
  }

  /**
   * Server management methods
   */
  async startServer(serverId: string): Promise<void> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/mcp/servers/${serverId}/start`)
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to start server')
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Network error starting server')
    }
  }

  async stopServer(serverId: string): Promise<void> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/mcp/servers/${serverId}/stop`)
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to stop server')
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Network error stopping server')
    }
  }

  async restartServer(serverId: string): Promise<void> {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/mcp/servers/${serverId}/restart`)
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to restart server')
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Network error restarting server')
    }
  }
}

export const mcpService = new McpService()
export default mcpService