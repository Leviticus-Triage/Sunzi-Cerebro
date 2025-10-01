/**
 * Real MCP API Service
 * Professional Frontend Integration with Backend MCP Services
 * NO MOCK DATA - Production Ready API Client
 */

import axios from 'axios';

// API Configuration
const API_BASE_URL = 'http://localhost:8890/api/mcp';
const WS_BASE_URL = 'ws://localhost:8890/ws/mcp';

// Types for TypeScript
export interface McpServer {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'degraded';
  toolCount: number;
  lastSeen: string;
  endpoint: string;
}

export interface McpTool {
  id: string;
  serverId: string;
  serverName: string;
  name: string;
  description: string;
  category: string;
  parameters: Record<string, any>;
  schema: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUsed: string | null;
  usageCount: number;
  enabled: boolean;
  metadata: {
    original: any;
    endpoint: string;
    discoveredAt: string;
  };
}

export interface ToolCategory {
  id: string;
  name: string;
  count: number;
  tools?: Array<{
    id: string;
    name: string;
    server: string;
    risk_level: string;
  }>;
}

export interface ExecutionResult {
  success: boolean;
  message: string;
  data: {
    tool_id: string;
    tool_name: string;
    server: string;
    execution_time: string;
    result: any;
    parameters_used: Record<string, any>;
  };
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    tools: T[];
    pagination: {
      current_page: number;
      per_page: number;
      total_items: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
    categories: ToolCategory[];
    filters_applied: Record<string, any>;
  };
  timestamp: string;
}

class McpApiService {
  private wsConnection: WebSocket | null = null;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupAxiosInterceptors();
  }

  /**
   * Setup axios interceptors for consistent error handling
   */
  private setupAxiosInterceptors() {
    axios.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('sunzi_auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('MCP API Error:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all MCP servers status
   */
  async getServers(): Promise<McpServer[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/servers`);
      return response.data.data.servers;
    } catch (error) {
      console.error('Error fetching MCP servers:', error);
      throw new Error('Failed to fetch MCP servers');
    }
  }

  /**
   * Get all tools with filtering and pagination
   */
  async getTools(filters: {
    category?: string;
    server?: string;
    risk_level?: string;
    enabled?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  } = {}): Promise<PaginatedResponse<McpTool>> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await axios.get(`${API_BASE_URL}/tools?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching MCP tools:', error);
      throw new Error('Failed to fetch MCP tools');
    }
  }

  /**
   * Get detailed information about a specific tool
   */
  async getTool(toolId: string): Promise<McpTool> {
    try {
      const response = await axios.get(`${API_BASE_URL}/tools/${toolId}`);
      return response.data.data.tool;
    } catch (error) {
      console.error(`Error fetching tool ${toolId}:`, error);
      throw new Error(`Failed to fetch tool ${toolId}`);
    }
  }

  /**
   * Execute a specific tool with parameters
   */
  async executeTool(
    toolId: string,
    parameters: Record<string, any> = {},
    options: Record<string, any> = {}
  ): Promise<ExecutionResult> {
    try {
      const response = await axios.post(`${API_BASE_URL}/tools/${toolId}/execute`, {
        parameters,
        options
      });
      return response.data;
    } catch (error) {
      console.error(`Error executing tool ${toolId}:`, error);
      throw new Error(`Failed to execute tool: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Toggle tool enabled/disabled status
   */
  async toggleTool(toolId: string, enabled: boolean): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/tools/${toolId}/toggle`, { enabled });
    } catch (error) {
      console.error(`Error toggling tool ${toolId}:`, error);
      throw new Error('Failed to toggle tool status');
    }
  }

  /**
   * Get tool categories with counts
   */
  async getCategories(): Promise<ToolCategory[]> {
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`);
      return response.data.data.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Get execution queue status
   */
  async getExecutionQueue(): Promise<any> {
    try {
      const response = await axios.get(`${API_BASE_URL}/execution/queue`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching execution queue:', error);
      throw new Error('Failed to fetch execution queue');
    }
  }

  /**
   * Trigger discovery refresh
   */
  async refreshDiscovery(): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/discovery/refresh`);
    } catch (error) {
      console.error('Error refreshing discovery:', error);
      throw new Error('Failed to refresh discovery');
    }
  }

  /**
   * Setup WebSocket connection for real-time updates
   */
  setupWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wsConnection = new WebSocket(WS_BASE_URL);

        this.wsConnection.onopen = () => {
          console.log('🔌 MCP WebSocket connected');
          resolve();
        };

        this.wsConnection.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleWebSocketMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.wsConnection.onclose = () => {
          console.log('🔌 MCP WebSocket disconnected');
          // Attempt to reconnect after 5 seconds
          setTimeout(() => {
            if (this.wsConnection?.readyState === WebSocket.CLOSED) {
              this.setupWebSocket();
            }
          }, 5000);
        };

        this.wsConnection.onerror = (error) => {
          console.error('MCP WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleWebSocketMessage(message: any) {
    const { type, data } = message;

    // Emit event to listeners
    this.emit(type, data);

    // Log important events
    switch (type) {
      case 'server-discovered':
        console.log(`🔍 Server discovered: ${data.config.name}`);
        break;
      case 'tools-discovered':
        console.log(`🔧 Tools discovered: ${data.toolCount} tools on ${data.serverId}`);
        break;
      case 'tool-execution-started':
        console.log(`🚀 Tool execution started: ${data.tool.name}`);
        break;
      case 'tool-execution-completed':
        console.log(`✅ Tool execution completed: ${data.tool.name}`);
        break;
      case 'tool-execution-failed':
        console.log(`❌ Tool execution failed: ${data.tool.name}`);
        break;
    }
  }

  /**
   * Add event listener for WebSocket events
   */
  on(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }

  /**
   * Close WebSocket connection
   */
  disconnect() {
    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
    }
    this.eventListeners.clear();
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.wsConnection?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const mcpApi = new McpApiService();
export default mcpApi;