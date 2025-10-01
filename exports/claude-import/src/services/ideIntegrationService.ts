// IDE Integration Service
// Unterstützt Claude Desktop, VS Code (Cline), Cursor, Warp Terminal

export interface IDEConnection {
  type: 'claude_desktop' | 'vscode_cline' | 'cursor' | 'warp'
  status: 'connected' | 'disconnected' | 'error'
  endpoint?: string
  capabilities: string[]
}

export interface CodeContext {
  fileName: string
  filePath: string
  content: string
  language: string
  selection?: {
    start: number
    end: number
    text: string
  }
}

export interface IDECommand {
  command: string
  args?: any
  context?: CodeContext
}

class IDEIntegrationService {
  private connections = new Map<string, IDEConnection>()
  private activeConnections: string[] = []

  constructor() {
    this.initializeConnections()
  }

  private initializeConnections() {
    // Claude Desktop - MCP Connection
    this.connections.set('claude_desktop', {
      type: 'claude_desktop',
      status: 'disconnected',
      capabilities: ['chat', 'code_analysis', 'file_operations', 'mcp_tools']
    })

    // VS Code mit Cline Extension
    this.connections.set('vscode_cline', {
      type: 'vscode_cline',
      status: 'disconnected',
      endpoint: 'http://localhost:3001', // Default Cline port
      capabilities: ['file_operations', 'terminal', 'debugging', 'extensions']
    })

    // Cursor IDE
    this.connections.set('cursor', {
      type: 'cursor',
      status: 'disconnected',
      endpoint: 'http://localhost:42000', // Cursor AI port
      capabilities: ['ai_completion', 'file_operations', 'terminal', 'chat']
    })

    // Warp Terminal
    this.connections.set('warp', {
      type: 'warp',
      status: 'disconnected',
      endpoint: 'ws://localhost:2022', // Warp WebSocket
      capabilities: ['terminal', 'ai_commands', 'workflows', 'blocks']
    })
  }

  // ========================
  // CLAUDE DESKTOP INTEGRATION
  // ========================
  async connectClaudeDesktop(): Promise<boolean> {
    try {
      // Claude Desktop über MCP-Server verbinden
      const mcpConfigPath = '/home/danii/.config/claude/claude_desktop_config.json'
      
      // Prüfe ob Claude Desktop MCP Config existiert
      const configExists = await this.checkFileExists(mcpConfigPath)
      
      if (!configExists) {
        await this.createClaudeMCPConfig(mcpConfigPath)
      }

      // Teste Verbindung über MCP
      const response = await fetch('http://localhost:8890/health')
      if (response.ok) {
        const connection = this.connections.get('claude_desktop')!
        connection.status = 'connected'
        connection.endpoint = 'http://localhost:8890'
        this.activeConnections.push('claude_desktop')
        return true
      }
    } catch (error) {
      console.error('Claude Desktop connection failed:', error)
      const connection = this.connections.get('claude_desktop')!
      connection.status = 'error'
    }
    return false
  }

  private async createClaudeMCPConfig(configPath: string): Promise<void> {
    const config = {
      "mcpServers": {
        "sunzi-cerebro": {
          "command": "node",
          "args": ["/home/danii/Cerebrum/mcp-server/index.js"],
          "env": {
            "CEREBRO_HOST": "localhost",
            "CEREBRO_PORT": "3000"
          }
        },
        "hexstrike-ai": {
          "command": "python",
          "args": ["-m", "hexstrike.mcp_server"],
          "env": {
            "HEXSTRIKE_PORT": "8890"
          }
        }
      }
    }

    // Config Datei erstellen (würde normalerweise file system access benötigen)
    console.log('Claude MCP Config:', JSON.stringify(config, null, 2))
  }

  // ========================
  // VS CODE CLINE INTEGRATION
  // ========================
  async connectVSCodeCline(): Promise<boolean> {
    try {
      // Prüfe ob Cline Extension aktiv ist
      const response = await fetch('http://localhost:3001/api/status')
      
      if (response.ok) {
        const connection = this.connections.get('vscode_cline')!
        connection.status = 'connected'
        this.activeConnections.push('vscode_cline')
        return true
      }
    } catch (error) {
      console.error('VS Code Cline connection failed:', error)
      
      // Fallback: VS Code Command Line Interface
      return await this.connectVSCodeCLI()
    }
    return false
  }

  private async connectVSCodeCLI(): Promise<boolean> {
    try {
      // Öffne VS Code mit current project
      await this.executeCommand('code', ['/home/danii/Cerebrum/sunzi-cerebro-react-framework'])
      
      const connection = this.connections.get('vscode_cline')!
      connection.status = 'connected'
      connection.endpoint = 'cli'
      this.activeConnections.push('vscode_cline')
      return true
    } catch (error) {
      console.error('VS Code CLI connection failed:', error)
      return false
    }
  }

  async sendToVSCodeCline(command: IDECommand): Promise<any> {
    const connection = this.connections.get('vscode_cline')
    if (connection?.status !== 'connected') {
      throw new Error('VS Code Cline not connected')
    }

    if (connection.endpoint === 'cli') {
      return await this.executeVSCodeCLICommand(command)
    } else {
      return await this.sendClineAPICommand(command)
    }
  }

  private async executeVSCodeCLICommand(command: IDECommand): Promise<any> {
    switch (command.command) {
      case 'open_file':
        return await this.executeCommand('code', [command.args.filePath])
      
      case 'create_file':
        // Erstelle Datei und öffne in VS Code
        await this.createFile(command.args.filePath, command.args.content || '')
        return await this.executeCommand('code', [command.args.filePath])
      
      case 'run_terminal':
        return await this.executeCommand('code', ['--command', 'workbench.action.terminal.new'])
      
      default:
        throw new Error(`Unsupported VS Code CLI command: ${command.command}`)
    }
  }

  // ========================
  // CURSOR IDE INTEGRATION
  // ========================
  async connectCursor(): Promise<boolean> {
    try {
      // Prüfe Cursor AI Service
      const response = await fetch('http://localhost:42000/api/health')
      
      if (response.ok) {
        const connection = this.connections.get('cursor')!
        connection.status = 'connected'
        this.activeConnections.push('cursor')
        return true
      }
    } catch (error) {
      console.error('Cursor connection failed:', error)
      
      // Fallback: Cursor CLI
      return await this.connectCursorCLI()
    }
    return false
  }

  private async connectCursorCLI(): Promise<boolean> {
    try {
      await this.executeCommand('cursor', ['/home/danii/Cerebrum/sunzi-cerebro-react-framework'])
      
      const connection = this.connections.get('cursor')!
      connection.status = 'connected'
      connection.endpoint = 'cli'
      this.activeConnections.push('cursor')
      return true
    } catch (error) {
      console.error('Cursor CLI connection failed:', error)
      return false
    }
  }

  async sendToCursor(command: IDECommand): Promise<any> {
    const connection = this.connections.get('cursor')
    if (connection?.status !== 'connected') {
      throw new Error('Cursor not connected')
    }

    if (connection.endpoint === 'cli') {
      return await this.executeCursorCLICommand(command)
    } else {
      return await this.sendCursorAPICommand(command)
    }
  }

  // ========================
  // WARP TERMINAL INTEGRATION
  // ========================
  async connectWarp(): Promise<boolean> {
    try {
      // Warp WebSocket Verbindung
      const ws = new WebSocket('ws://localhost:2022/api/v1/terminal')
      
      return new Promise((resolve) => {
        ws.onopen = () => {
          const connection = this.connections.get('warp')!
          connection.status = 'connected'
          this.activeConnections.push('warp')
          resolve(true)
        }

        ws.onerror = () => {
          // Fallback: Warp CLI
          this.connectWarpCLI().then(resolve)
        }

        // Timeout nach 5 Sekunden
        setTimeout(() => {
          if (ws.readyState !== WebSocket.OPEN) {
            ws.close()
            this.connectWarpCLI().then(resolve)
          }
        }, 5000)
      })
    } catch (error) {
      console.error('Warp connection failed:', error)
      return await this.connectWarpCLI()
    }
  }

  private async connectWarpCLI(): Promise<boolean> {
    try {
      // Öffne Warp Terminal im Projekt
      await this.executeCommand('warp-terminal', ['--working-directory', '/home/danii/Cerebrum/sunzi-cerebro-react-framework'])
      
      const connection = this.connections.get('warp')!
      connection.status = 'connected'
      connection.endpoint = 'cli'
      this.activeConnections.push('warp')
      return true
    } catch (error) {
      console.error('Warp CLI connection failed:', error)
      return false
    }
  }

  async sendToWarp(command: IDECommand): Promise<any> {
    const connection = this.connections.get('warp')
    if (connection?.status !== 'connected') {
      throw new Error('Warp not connected')
    }

    // Warp Terminal Command
    if (command.command === 'execute_terminal') {
      return await this.executeWarpCommand(command.args.script)
    }
    
    throw new Error(`Unsupported Warp command: ${command.command}`)
  }

  // ========================
  // UNIVERSAL IDE OPERATIONS
  // ========================
  
  // Sende Code zu allen verbundenen IDEs
  async broadcastCode(code: string, fileName: string, language: string): Promise<void> {
    const promises = this.activeConnections.map(async (ideType) => {
      try {
        switch (ideType) {
          case 'vscode_cline':
            await this.sendToVSCodeCline({
              command: 'create_file',
              args: { filePath: `/tmp/${fileName}`, content: code }
            })
            break
          
          case 'cursor':
            await this.sendToCursor({
              command: 'create_file',
              args: { filePath: `/tmp/${fileName}`, content: code }
            })
            break
          
          case 'warp':
            await this.sendToWarp({
              command: 'execute_terminal',
              args: { script: `echo "${code}" > /tmp/${fileName}` }
            })
            break
        }
      } catch (error) {
        console.error(`Failed to broadcast to ${ideType}:`, error)
      }
    })

    await Promise.allSettled(promises)
  }

  // Führe Security Tool aus und öffne Ergebnis in IDE
  async executeSecurityToolInIDE(toolName: string, parameters: any, ideType?: string): Promise<any> {
    // Führe Tool über MCP aus
    const mcpResponse = await fetch('http://localhost:8890/execute_command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: `${toolName} ${Object.values(parameters).join(' ')}`
      })
    })

    const result = await mcpResponse.json()

    // Erstelle Report File
    const reportContent = this.formatSecurityReport(toolName, parameters, result)
    const reportFileName = `security_report_${toolName}_${Date.now()}.md`

    // Sende an IDE(s)
    if (ideType && this.activeConnections.includes(ideType)) {
      await this.sendToSpecificIDE(ideType, reportContent, reportFileName)
    } else {
      await this.broadcastCode(reportContent, reportFileName, 'markdown')
    }

    return result
  }

  private formatSecurityReport(toolName: string, parameters: any, result: any): string {
    return `# Security Tool Report: ${toolName}

## Execution Parameters
\`\`\`json
${JSON.stringify(parameters, null, 2)}
\`\`\`

## Results
\`\`\`
${JSON.stringify(result, null, 2)}
\`\`\`

## Generated: ${new Date().toISOString()}
`
  }

  // ========================
  // UTILITY METHODS
  // ========================
  
  private async executeCommand(command: string, args: string[] = []): Promise<any> {
    // Simuliert Kommando-Ausführung
    console.log(`Executing: ${command} ${args.join(' ')}`)
    return { success: true, command, args }
  }

  private async checkFileExists(filePath: string): Promise<boolean> {
    // File existence check würde normalerweise file system access benötigen
    return false
  }

  private async createFile(filePath: string, content: string): Promise<void> {
    console.log(`Creating file: ${filePath}`)
    console.log(`Content: ${content}`)
  }

  private async sendToSpecificIDE(ideType: string, content: string, fileName: string): Promise<void> {
    switch (ideType) {
      case 'vscode_cline':
        await this.sendToVSCodeCline({
          command: 'create_file',
          args: { filePath: `/tmp/${fileName}`, content }
        })
        break
      
      case 'cursor':
        await this.sendToCursor({
          command: 'create_file',
          args: { filePath: `/tmp/${fileName}`, content }
        })
        break
      
      case 'warp':
        await this.sendToWarp({
          command: 'execute_terminal',
          args: { script: `echo "${content}" > /tmp/${fileName} && cat /tmp/${fileName}` }
        })
        break
    }
  }

  // ========================
  // API METHODS FOR REACT
  // ========================

  getConnections(): Map<string, IDEConnection> {
    return this.connections
  }

  getActiveConnections(): string[] {
    return this.activeConnections
  }

  async connectAllIDEs(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}

    results.claude_desktop = await this.connectClaudeDesktop()
    results.vscode_cline = await this.connectVSCodeCline()
    results.cursor = await this.connectCursor()
    results.warp = await this.connectWarp()

    return results
  }

  async disconnectIDE(ideType: string): Promise<boolean> {
    const connection = this.connections.get(ideType)
    if (connection) {
      connection.status = 'disconnected'
      this.activeConnections = this.activeConnections.filter(id => id !== ideType)
      return true
    }
    return false
  }

  async sendCursorAPICommand(command: IDECommand): Promise<any> {
    const response = await fetch('http://localhost:42000/api/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command)
    })
    return await response.json()
  }

  async sendClineAPICommand(command: IDECommand): Promise<any> {
    const response = await fetch('http://localhost:3001/api/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(command)
    })
    return await response.json()
  }

  private async executeCursorCLICommand(command: IDECommand): Promise<any> {
    switch (command.command) {
      case 'open_file':
        return await this.executeCommand('cursor', [command.args.filePath])
      case 'create_file':
        await this.createFile(command.args.filePath, command.args.content || '')
        return await this.executeCommand('cursor', [command.args.filePath])
      default:
        throw new Error(`Unsupported Cursor CLI command: ${command.command}`)
    }
  }

  private async executeWarpCommand(script: string): Promise<any> {
    return await this.executeCommand('warp-terminal', ['-c', script])
  }
}

export const ideIntegrationService = new IDEIntegrationService()
export default ideIntegrationService