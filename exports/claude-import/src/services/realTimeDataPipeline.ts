/**
 * 🌊 REAL-TIME DATA PIPELINE SERVICE
 * Enterprise-Grade WebSocket Streaming for MCP Tool Execution
 * Live Progress Tracking, Results Streaming, System Monitoring
 */

import { EventEmitter } from 'events'
import enterpriseSecurity from './enterpriseSecurity'

// Pipeline Configuration
const PIPELINE_CONFIG = {
  WEBSOCKET_URL: 'ws://localhost:8890/ws/mcp-real',
  RECONNECT_INTERVAL: 5000,
  HEARTBEAT_INTERVAL: 30000,
  MAX_RECONNECT_ATTEMPTS: 10,
  BUFFER_SIZE: 1000,
  COMPRESSION: true,
  AUTHENTICATION_TIMEOUT: 10000
}

// Data Types
export interface DataStreamEvent {
  id: string
  type: 'tool_execution' | 'server_status' | 'discovery' | 'system_metrics' | 'security_alert'
  timestamp: string
  source: string
  data: any
  metadata: {
    userId?: string
    sessionId?: string
    correlationId?: string
    priority: 'low' | 'medium' | 'high' | 'critical'
  }
}

export interface ToolExecutionStream {
  toolId: string
  executionId: string
  status: 'queued' | 'starting' | 'running' | 'completing' | 'completed' | 'failed'
  progress: {
    percentage: number
    stage: string
    eta?: number
    throughput?: number
  }
  output: {
    stdout: string[]
    stderr: string[]
    structured?: any
  }
  metrics: {
    startTime: string
    endTime?: string
    duration?: number
    resourceUsage: {
      cpu?: number
      memory?: number
      network?: number
    }
  }
  result?: any
  error?: {
    code: string
    message: string
    stack?: string
  }
}

export interface ServerStatusStream {
  serverId: string
  serverName: string
  status: 'online' | 'offline' | 'degraded' | 'maintenance'
  health: {
    score: number
    checks: {
      connectivity: boolean
      authentication: boolean
      latency: number
      toolAvailability: number
    }
  }
  metrics: {
    requestsPerSecond: number
    averageResponseTime: number
    errorRate: number
    uptime: number
  }
  toolCount: number
  lastUpdate: string
}

export interface SystemMetricsStream {
  timestamp: string
  cpu: {
    usage: number
    cores: number
    load: number[]
  }
  memory: {
    usage: number
    total: number
    available: number
  }
  network: {
    bytesIn: number
    bytesOut: number
    connectionsActive: number
  }
  disk: {
    usage: number
    available: number
    readOps: number
    writeOps: number
  }
  processes: {
    total: number
    mcpServers: number
    toolExecutions: number
  }
}

class RealTimeDataPipeline extends EventEmitter {
  private ws: WebSocket | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectAttempts = 0
  private isAuthenticated = false
  private messageBuffer: DataStreamEvent[] = []
  private subscriptions: Map<string, Set<string>> = new Map()

  // Stream stores
  private toolExecutions: Map<string, ToolExecutionStream> = new Map()
  private serverStatuses: Map<string, ServerStatusStream> = new Map()
  private systemMetrics: SystemMetricsStream | null = null

  constructor() {
    super()
    this.initialize()
  }

  /**
   * Initialize data pipeline
   */
  private initialize() {
    console.log('🌊 Initializing Real-Time Data Pipeline...')
    this.connect()

    // Listen for authentication changes
    enterpriseSecurity.on('authenticated', () => {
      this.authenticate()
    })

    enterpriseSecurity.on('logged_out', () => {
      this.disconnect()
    })
  }

  /**
   * Connect to WebSocket
   */
  private connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      console.log('🔌 Connecting to WebSocket:', PIPELINE_CONFIG.WEBSOCKET_URL)

      this.ws = new WebSocket(PIPELINE_CONFIG.WEBSOCKET_URL)

      this.ws.onopen = () => {
        console.log('✅ WebSocket connected')
        this.reconnectAttempts = 0
        this.authenticate()
        this.startHeartbeat()
        this.emit('connected')
      }

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data)
      }

      this.ws.onclose = () => {
        console.log('❌ WebSocket disconnected')
        this.isAuthenticated = false
        this.stopHeartbeat()
        this.scheduleReconnect()
        this.emit('disconnected')
      }

      this.ws.onerror = (error) => {
        console.error('💥 WebSocket error:', error)
        this.emit('error', error)
      }

    } catch (error) {
      console.error('❌ Failed to connect WebSocket:', error)
      this.scheduleReconnect()
    }
  }

  /**
   * Authenticate WebSocket connection
   */
  private authenticate() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return
    }

    const context = enterpriseSecurity.getContext()
    if (!context) {
      console.warn('⚠️ No security context for WebSocket authentication')
      return
    }

    const authMessage = {
      type: 'authenticate',
      data: {
        token: context.tokens.accessToken,
        sessionId: context.session.id,
        userId: context.user.id
      },
      timestamp: new Date().toISOString()
    }

    this.send(authMessage)

    // Set authentication timeout
    setTimeout(() => {
      if (!this.isAuthenticated) {
        console.error('❌ WebSocket authentication timeout')
        this.disconnect()
      }
    }, PIPELINE_CONFIG.AUTHENTICATION_TIMEOUT)
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string) {
    try {
      const message = JSON.parse(data)

      switch (message.type) {
        case 'auth_success':
          this.isAuthenticated = true
          console.log('🔐 WebSocket authenticated successfully')
          this.emit('authenticated')
          this.flushMessageBuffer()
          break

        case 'auth_failed':
          console.error('❌ WebSocket authentication failed:', message.error)
          this.disconnect()
          break

        case 'tool-execution-started':
        case 'tool-execution-progress':
        case 'tool-execution-completed':
        case 'tool-execution-failed':
          this.handleToolExecutionEvent(message)
          break

        case 'server-discovered':
        case 'server-status-update':
        case 'server-health-check':
          this.handleServerStatusEvent(message)
          break

        case 'system-metrics':
          this.handleSystemMetricsEvent(message)
          break

        case 'security-alert':
          this.handleSecurityAlert(message)
          break

        case 'pong':
          // Heartbeat response
          break

        default:
          console.warn('⚠️ Unknown message type:', message.type)
      }

      // Emit generic data event
      this.emit('data', message)

    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error)
    }
  }

  /**
   * Handle tool execution events
   */
  private handleToolExecutionEvent(message: any) {
    const { data } = message
    const executionId = data.executionId || data.tool?.id

    if (!executionId) return

    let execution = this.toolExecutions.get(executionId)

    switch (message.type) {
      case 'tool-execution-started':
        execution = {
          toolId: data.tool.id,
          executionId,
          status: 'starting',
          progress: {
            percentage: 0,
            stage: 'Initializing'
          },
          output: {
            stdout: [],
            stderr: []
          },
          metrics: {
            startTime: data.timestamp || new Date().toISOString(),
            resourceUsage: {}
          }
        }
        break

      case 'tool-execution-progress':
        if (execution) {
          execution.status = 'running'
          execution.progress = {
            ...execution.progress,
            percentage: data.progress?.percentage || execution.progress.percentage,
            stage: data.progress?.stage || execution.progress.stage,
            eta: data.progress?.eta,
            throughput: data.progress?.throughput
          }

          if (data.output?.stdout) {
            execution.output.stdout.push(...data.output.stdout)
          }
          if (data.output?.stderr) {
            execution.output.stderr.push(...data.output.stderr)
          }
          if (data.output?.structured) {
            execution.output.structured = data.output.structured
          }

          if (data.metrics?.resourceUsage) {
            execution.metrics.resourceUsage = {
              ...execution.metrics.resourceUsage,
              ...data.metrics.resourceUsage
            }
          }
        }
        break

      case 'tool-execution-completed':
        if (execution) {
          execution.status = 'completed'
          execution.progress.percentage = 100
          execution.progress.stage = 'Completed'
          execution.metrics.endTime = data.timestamp || new Date().toISOString()
          execution.metrics.duration = data.metrics?.duration
          execution.result = data.result
        }
        break

      case 'tool-execution-failed':
        if (execution) {
          execution.status = 'failed'
          execution.progress.stage = 'Failed'
          execution.metrics.endTime = data.timestamp || new Date().toISOString()
          execution.error = data.error
        }
        break
    }

    if (execution) {
      this.toolExecutions.set(executionId, execution)
      this.emit('tool_execution_update', execution)
    }
  }

  /**
   * Handle server status events
   */
  private handleServerStatusEvent(message: any) {
    const { data } = message
    const serverId = data.serverId || data.config?.id

    if (!serverId) return

    let status = this.serverStatuses.get(serverId)

    switch (message.type) {
      case 'server-discovered':
        status = {
          serverId,
          serverName: data.config.name,
          status: 'online',
          health: {
            score: 100,
            checks: {
              connectivity: true,
              authentication: true,
              latency: 0,
              toolAvailability: 100
            }
          },
          metrics: {
            requestsPerSecond: 0,
            averageResponseTime: 0,
            errorRate: 0,
            uptime: 0
          },
          toolCount: data.toolCount || 0,
          lastUpdate: data.timestamp || new Date().toISOString()
        }
        break

      case 'server-status-update':
        if (status) {
          status.status = data.status
          status.toolCount = data.toolCount || status.toolCount
          status.lastUpdate = data.timestamp || new Date().toISOString()
        }
        break

      case 'server-health-check':
        if (status) {
          status.health = {
            ...status.health,
            ...data.health
          }
          status.metrics = {
            ...status.metrics,
            ...data.metrics
          }
          status.lastUpdate = data.timestamp || new Date().toISOString()
        }
        break
    }

    if (status) {
      this.serverStatuses.set(serverId, status)
      this.emit('server_status_update', status)
    }
  }

  /**
   * Handle system metrics events
   */
  private handleSystemMetricsEvent(message: any) {
    this.systemMetrics = message.data
    this.emit('system_metrics_update', this.systemMetrics)
  }

  /**
   * Handle security alerts
   */
  private handleSecurityAlert(message: any) {
    console.warn('🚨 Security Alert:', message.data)
    this.emit('security_alert', message.data)
  }

  /**
   * Subscribe to specific data streams
   */
  subscribe(streamType: string, filterId?: string) {
    if (!this.subscriptions.has(streamType)) {
      this.subscriptions.set(streamType, new Set())
    }

    if (filterId) {
      this.subscriptions.get(streamType)!.add(filterId)
    }

    // Send subscription message
    this.send({
      type: 'subscribe',
      data: {
        streamType,
        filterId
      },
      timestamp: new Date().toISOString()
    })

    console.log(`📡 Subscribed to stream: ${streamType}${filterId ? ` (${filterId})` : ''}`)
  }

  /**
   * Unsubscribe from data streams
   */
  unsubscribe(streamType: string, filterId?: string) {
    if (filterId && this.subscriptions.has(streamType)) {
      this.subscriptions.get(streamType)!.delete(filterId)
    } else {
      this.subscriptions.delete(streamType)
    }

    // Send unsubscription message
    this.send({
      type: 'unsubscribe',
      data: {
        streamType,
        filterId
      },
      timestamp: new Date().toISOString()
    })

    console.log(`📡 Unsubscribed from stream: ${streamType}${filterId ? ` (${filterId})` : ''}`)
  }

  /**
   * Send message to WebSocket
   */
  private send(message: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.messageBuffer.push(message)
      return
    }

    if (!this.isAuthenticated && message.type !== 'authenticate') {
      this.messageBuffer.push(message)
      return
    }

    try {
      this.ws.send(JSON.stringify(message))
    } catch (error) {
      console.error('❌ Failed to send WebSocket message:', error)
    }
  }

  /**
   * Flush message buffer
   */
  private flushMessageBuffer() {
    while (this.messageBuffer.length > 0) {
      const message = this.messageBuffer.shift()
      if (message) {
        this.send(message)
      }
    }
  }

  /**
   * Start heartbeat
   */
  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      this.send({
        type: 'ping',
        timestamp: new Date().toISOString()
      })
    }, PIPELINE_CONFIG.HEARTBEAT_INTERVAL)
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect() {
    if (this.reconnectAttempts >= PIPELINE_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      console.error('❌ Max reconnect attempts reached')
      this.emit('max_reconnect_attempts')
      return
    }

    this.reconnectAttempts++
    console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts}/${PIPELINE_CONFIG.MAX_RECONNECT_ATTEMPTS}`)

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, PIPELINE_CONFIG.RECONNECT_INTERVAL * this.reconnectAttempts)
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    this.stopHeartbeat()

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.isAuthenticated = false
    this.messageBuffer = []
    console.log('👋 WebSocket disconnected')
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.isAuthenticated
  }

  /**
   * Get tool execution stream
   */
  getToolExecution(executionId: string): ToolExecutionStream | null {
    return this.toolExecutions.get(executionId) || null
  }

  /**
   * Get all tool executions
   */
  getAllToolExecutions(): ToolExecutionStream[] {
    return Array.from(this.toolExecutions.values())
  }

  /**
   * Get server status
   */
  getServerStatus(serverId: string): ServerStatusStream | null {
    return this.serverStatuses.get(serverId) || null
  }

  /**
   * Get all server statuses
   */
  getAllServerStatuses(): ServerStatusStream[] {
    return Array.from(this.serverStatuses.values())
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetricsStream | null {
    return this.systemMetrics
  }

  /**
   * Clear old data
   */
  clearOldData(maxAge: number = 24 * 60 * 60 * 1000) { // 24 hours
    const cutoff = Date.now() - maxAge

    // Clear old tool executions
    for (const [id, execution] of this.toolExecutions.entries()) {
      const startTime = new Date(execution.metrics.startTime).getTime()
      if (startTime < cutoff) {
        this.toolExecutions.delete(id)
      }
    }

    // Clear old server statuses
    for (const [id, status] of this.serverStatuses.entries()) {
      const lastUpdate = new Date(status.lastUpdate).getTime()
      if (lastUpdate < cutoff) {
        this.serverStatuses.delete(id)
      }
    }

    console.log('🧹 Cleared old data from streams')
  }
}

// Export singleton instance
export const realTimeDataPipeline = new RealTimeDataPipeline()
export default realTimeDataPipeline