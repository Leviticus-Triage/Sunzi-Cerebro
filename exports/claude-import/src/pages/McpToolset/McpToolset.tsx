import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Badge,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tab,
  Tabs,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Tooltip,
  IconButton,
  CircularProgress,
  LinearProgress,
  Snackbar,
} from '@mui/material'
import {
  ExpandMore as ExpandMoreIcon,
  Extension as ExtensionIcon,
  PlayArrow as PlayArrowIcon,
  Settings as SettingsIcon,
  Link as LinkIcon,
  Save as SaveIcon,
  Code as CodeIcon,
  Security as SecurityIcon,
  BugReport as BugReportIcon,
  NetworkCheck as NetworkCheckIcon,
  Search as SearchIcon,
  Category as CategoryIcon,
  AccountTree as AccountTreeIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Psychology as AIIcon,
} from '@mui/icons-material'
import { useParams } from 'react-router-dom'
import mcpApi, { McpTool, McpServer, ToolCategory, ExecutionResult } from '../../services/mcpApi'
import WorkflowBuilder from '../../components/WorkflowBuilder/WorkflowBuilder'
import AIRecommendations from '../../components/AIRecommendations/AIRecommendations'
import { RecommendationContext, ToolRecommendation } from '../../services/aiRecommendationEngine'

// Remove local interface - using imported types from mcpApi

interface ToolChain {
  id: string
  name: string
  description: string
  tools: string[] // Tool IDs
  trigger: 'manual' | 'automated' | 'conditional'
  conditions?: Record<string, any>
  enabled: boolean
}

// REAL MCP API INTEGRATION - NO MORE MOCK DATA

export const McpToolset: React.FC = () => {
  const { category, toolId } = useParams()
  const [selectedCategory, setSelectedCategory] = useState<string>(category || 'all')
  const [selectedTool, setSelectedTool] = useState<McpTool | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toolChains, setToolChains] = useState<ToolChain[]>([])
  const [activeTab, setActiveTab] = useState(0)

  // REAL DATA STATES - NO MORE MOCK DATA
  const [tools, setTools] = useState<McpTool[]>([])
  const [categories, setCategories] = useState<ToolCategory[]>([])
  const [servers, setServers] = useState<McpServer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [executionStatus, setExecutionStatus] = useState<Record<string, string>>({})
  const [totalTools, setTotalTools] = useState(0)

  // ADDITIONAL STATE FOR REAL FUNCTIONALITY
  const [executionLoading, setExecutionLoading] = useState<Record<string, boolean>>({})
  const [executionResults, setExecutionResults] = useState<Record<string, ExecutionResult>>({})
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info')
  const [refreshing, setRefreshing] = useState(false)
  const [toolParameters, setToolParameters] = useState<Record<string, any>>({})

  // REAL DATA LOADING EFFECT
  useEffect(() => {
    loadMcpData()
    setupWebSocketConnection()

    // Cleanup on unmount
    return () => {
      mcpApi.disconnect()
    }
  }, [])

  // Load all MCP data from real API
  const loadMcpData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Loading real MCP data...')

      // Load servers, categories, and tools in parallel
      const [serversData, categoriesData, toolsData] = await Promise.all([
        mcpApi.getServers(),
        mcpApi.getCategories(),
        mcpApi.getTools({ limit: 1000 }) // Load all tools
      ])

      setServers(serversData)
      setCategories(categoriesData)
      setTools(toolsData.data.tools)
      setTotalTools(toolsData.data.pagination.total_items)

      console.log(`✅ Loaded ${serversData.length} servers, ${categoriesData.length} categories, ${toolsData.data.tools.length} tools`)

    } catch (error: any) {
      console.error('💥 Error loading MCP data:', error)
      setError(error.message || 'Failed to load MCP data')
      showSnackbar('Failed to load MCP data: ' + error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // REAL TOOL EXECUTION HANDLER
  const handleToolExecution = async (tool: McpTool) => {
    try {
      setExecutionLoading(prev => ({ ...prev, [tool.id]: true }))
      setExecutionStatus(prev => ({ ...prev, [tool.id]: 'running' }))

      console.log(`🚀 Executing tool: ${tool.name}`)

      // Get parameters for this tool
      const parameters = toolParameters[tool.id] || {}

      // Execute the tool via real MCP API
      const result = await mcpApi.executeTool(tool.id, parameters)

      setExecutionResults(prev => ({ ...prev, [tool.id]: result }))
      setExecutionStatus(prev => ({ ...prev, [tool.id]: 'completed' }))

      showSnackbar(`Tool "${tool.name}" executed successfully`, 'success')

      console.log(`✅ Tool execution completed: ${tool.name}`, result)

    } catch (error: any) {
      console.error(`❌ Tool execution failed: ${tool.name}`, error)
      setExecutionStatus(prev => ({ ...prev, [tool.id]: 'failed' }))
      showSnackbar(`Tool execution failed: ${error.message}`, 'error')
    } finally {
      setExecutionLoading(prev => ({ ...prev, [tool.id]: false }))
    }
  }

  // REAL TOOL UPDATE HANDLER
  const handleToolUpdate = async (updatedTool: McpTool) => {
    try {
      console.log(`🔧 Updating tool: ${updatedTool.name}`)

      // Toggle tool status via real API
      await mcpApi.toggleTool(updatedTool.id, updatedTool.enabled)

      // Update local state
      setTools(prev => prev.map(tool =>
        tool.id === updatedTool.id ? updatedTool : tool
      ))

      setDialogOpen(false)
      showSnackbar(`Tool "${updatedTool.name}" updated successfully`, 'success')

      console.log(`✅ Tool updated: ${updatedTool.name}`)

    } catch (error: any) {
      console.error(`❌ Tool update failed: ${updatedTool.name}`, error)
      showSnackbar(`Tool update failed: ${error.message}`, 'error')
    }
  }

  // DISCOVERY REFRESH HANDLER
  const handleRefreshDiscovery = async () => {
    try {
      setRefreshing(true)
      console.log('🔄 Refreshing MCP discovery...')

      await mcpApi.refreshDiscovery()
      await loadMcpData() // Reload data after refresh

      showSnackbar('MCP discovery refreshed successfully', 'success')
      console.log('✅ MCP discovery refreshed')

    } catch (error: any) {
      console.error('❌ Discovery refresh failed:', error)
      showSnackbar(`Discovery refresh failed: ${error.message}`, 'error')
    } finally {
      setRefreshing(false)
    }
  }

  // SNACKBAR HELPER
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  // Setup WebSocket for real-time updates
  const setupWebSocketConnection = async () => {
    try {
      await mcpApi.setupWebSocket()

      // Listen for real-time events
      mcpApi.on('server-discovered', (data: any) => {
        console.log('🔍 Server discovered, refreshing data...', data)
        loadMcpData()
        showSnackbar(`New server discovered: ${data.config?.name || 'Unknown'}`, 'info')
      })

      mcpApi.on('tools-discovered', (data: any) => {
        console.log('🔧 Tools discovered, refreshing data...', data)
        loadMcpData()
        showSnackbar(`${data.toolCount} new tools discovered`, 'info')
      })

      mcpApi.on('tool-execution-started', (execution: any) => {
        setExecutionStatus(prev => ({
          ...prev,
          [execution.tool?.id || execution.toolId]: 'running'
        }))
        setExecutionLoading(prev => ({
          ...prev,
          [execution.tool?.id || execution.toolId]: true
        }))
      })

      mcpApi.on('tool-execution-completed', (execution: any) => {
        const toolId = execution.tool?.id || execution.toolId
        setExecutionStatus(prev => ({
          ...prev,
          [toolId]: 'completed'
        }))
        setExecutionLoading(prev => ({
          ...prev,
          [toolId]: false
        }))
        if (execution.result) {
          setExecutionResults(prev => ({
            ...prev,
            [toolId]: execution.result
          }))
        }
      })

      mcpApi.on('tool-execution-failed', (execution: any) => {
        const toolId = execution.tool?.id || execution.toolId
        setExecutionStatus(prev => ({
          ...prev,
          [toolId]: 'failed'
        }))
        setExecutionLoading(prev => ({
          ...prev,
          [toolId]: false
        }))
        showSnackbar(`Tool execution failed: ${execution.error || 'Unknown error'}`, 'error')
      })

    } catch (error) {
      console.warn('⚠️ WebSocket connection failed:', error)
      showSnackbar('Real-time updates unavailable', 'warning')
    }
  }

  const filteredTools = tools.filter(tool => {
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tool.serverName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleToolSelect = (tool: McpTool) => {
    setSelectedTool(tool)
    // Initialize tool parameters if not already set
    if (!toolParameters[tool.id]) {
      setToolParameters(prev => ({
        ...prev,
        [tool.id]: {}
      }))
    }
    setDialogOpen(true)
  }

  // REAL CATEGORY ICON MAPPING
  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId.toLowerCase()) {
      case 'exploitation':
      case 'exploit':
        return <SecurityIcon />
      case 'reconnaissance':
      case 'recon':
        return <SearchIcon />
      case 'vulnerability-scanning':
      case 'scanning':
        return <BugReportIcon />
      case 'network':
      case 'networking':
        return <NetworkCheckIcon />
      case 'code-analysis':
      case 'code':
        return <CodeIcon />
      case 'automation':
      case 'workflow':
        return <AccountTreeIcon />
      default:
        return <ExtensionIcon />
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'success'
      case 'medium': return 'warning'
      case 'high': return 'error'
      case 'critical': return 'error'
      default: return 'default'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low': return <CheckCircleIcon />
      case 'medium': return <WarningIcon />
      case 'high': return <ErrorIcon />
      case 'critical': return <ErrorIcon />
      default: return <InfoIcon />
    }
  }

  const getServerColor = (server: string) => {
    switch (server.toLowerCase()) {
      case 'hexstrike':
      case 'hexstrike-ai':
        return '#ff6b35'
      case 'attackmcp':
      case 'attack-mcp':
        return '#f7931e'
      case 'auto-pentest':
      case 'autopentest':
        return '#4dabf7'
      case 'local':
        return '#28a745'
      default: return '#868e96'
    }
  }

  const getExecutionStatusIcon = (toolId: string) => {
    const status = executionStatus[toolId]
    const isLoading = executionLoading[toolId]

    if (isLoading) {
      return <CircularProgress size={16} />
    }

    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />
      case 'failed':
        return <ErrorIcon color="error" />
      case 'running':
        return <CircularProgress size={16} />
      default:
        return null
    }
  }

  // LOADING STATE
  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
            <ExtensionIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            MCP Toolset Management
          </Typography>
          <LinearProgress sx={{ mt: 2 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading MCP tools and servers...
          </Typography>
        </Box>
      </Box>
    )
  }

  // ERROR STATE
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
            <ExtensionIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            MCP Toolset Management
          </Typography>
          <Alert severity="error" sx={{ mt: 2 }}>
            <strong>Error loading MCP data:</strong> {error}
          </Alert>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadMcpData}
            sx={{ mt: 2 }}
          >
            Retry
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header with Real Data */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
          <ExtensionIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          MCP Toolset Management
          <Chip label={`${totalTools} Tools`} color="success" size="medium" />
          {refreshing && <CircularProgress size={24} />}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Verwalte über {totalTools} MCP Tools via {servers.length} aktive Server
        </Typography>
        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
          🎯 <strong>Live Status:</strong> {servers.filter(s => s.status === 'online').length} aktive Server • {categories.length} Kategorien • {tools.filter(t => t.enabled).length} aktivierte Tools
        </Alert>
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            startIcon={<RefreshIcon />}
            onClick={handleRefreshDiscovery}
            disabled={refreshing}
            size="small"
          >
            Discovery Refresh
          </Button>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadMcpData}
            disabled={loading}
            size="small"
          >
            Reload Data
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab icon={<ExtensionIcon />} label="Tool Bibliothek" />
          <Tab icon={<AIIcon />} label="AI Empfehlungen" />
          <Tab icon={<AccountTreeIcon />} label="Tool Chains" />
          <Tab icon={<SettingsIcon />} label="Server Status" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <>
          {/* Search and Filter */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Tool suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Kategorie</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Kategorie"
                >
                  <MenuItem value="all">Alle Kategorien</MenuItem>
                  {categories.map(cat => (
                    <MenuItem key={cat.id} value={cat.id}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getCategoryIcon(cat.id)}
                        {cat.name} ({cat.count})
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Category Overview */}
          {selectedCategory === 'all' && (
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {categories.map(cat => (
                <Grid item xs={12} sm={6} md={3} key={cat.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 }
                    }}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 3 }}>
                      <Box sx={{ color: 'primary.main', mb: 1 }}>
                        {React.cloneElement(getCategoryIcon(cat.id), { sx: { fontSize: 40 } })}
                      </Box>
                      <Typography variant="h6" gutterBottom>
                        {cat.name}
                      </Typography>
                      <Badge badgeContent={cat.count} color="primary" />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Tools Grid */}
          <Grid container spacing={3}>
            {filteredTools.map(tool => (
              <Grid item xs={12} md={6} lg={4} key={tool.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                        {tool.name}
                        {getExecutionStatusIcon(tool.id) && (
                          <Box component="span" sx={{ ml: 1 }}>
                            {getExecutionStatusIcon(tool.id)}
                          </Box>
                        )}
                      </Typography>
                      <Chip
                        size="small"
                        label={tool.serverName.toUpperCase()}
                        sx={{
                          bgcolor: getServerColor(tool.serverName),
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {tool.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                      <Chip
                        size="small"
                        label={tool.category}
                        icon={getCategoryIcon(tool.category)}
                      />
                      <Chip
                        size="small"
                        label={tool.riskLevel}
                        color={getRiskColor(tool.riskLevel)}
                        icon={getRiskIcon(tool.riskLevel)}
                      />
                      {!tool.enabled && (
                        <Chip size="small" label="Disabled" color="default" />
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Verwendet: {tool.usageCount}x
                        {tool.lastUsed && ` • Zuletzt: ${new Date(tool.lastUsed).toLocaleDateString()}`}
                      </Typography>
                      {executionResults[tool.id] && (
                        <Tooltip title="Letztes Ergebnis anzeigen">
                          <IconButton size="small">
                            <InfoIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      startIcon={executionLoading[tool.id] ? <CircularProgress size={16} /> : <PlayArrowIcon />}
                      variant="contained"
                      color="primary"
                      disabled={!tool.enabled || executionLoading[tool.id]}
                      onClick={() => handleToolExecution(tool)}
                    >
                      {executionLoading[tool.id] ? 'Läuft...' : 'Ausführen'}
                    </Button>
                    <Button
                      size="small"
                      startIcon={<SettingsIcon />}
                      onClick={() => handleToolSelect(tool)}
                    >
                      Konfigurieren
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {activeTab === 1 && (
        <AIRecommendations
          availableTools={tools}
          onToolSelect={(tool, context) => {
            console.log('🧠 AI recommended tool selected:', tool.name, context)
            setSelectedTool(tool)
            setDialogOpen(true)
          }}
          onExecute={(tool, recommendation) => {
            console.log('🚀 Executing AI recommended tool:', tool.name, recommendation)
            handleToolExecution(tool)
          }}
          previousTools={Object.keys(executionResults)}
        />
      )}

      {activeTab === 2 && (
        <WorkflowBuilder
          availableTools={tools}
          onSaveWorkflow={(workflow) => {
            console.log('💾 Saving workflow:', workflow)
            showSnackbar(`Workflow "${workflow.name}" gespeichert`, 'success')
          }}
          onExecuteWorkflow={async (workflow) => {
            console.log('🚀 Executing workflow:', workflow)
            showSnackbar(`Workflow "${workflow.name}" wird ausgeführt...`, 'info')

            // Execute workflow nodes sequentially or in parallel
            for (const node of workflow.nodes) {
              const tool = tools.find(t => t.id === node.toolId)
              if (tool) {
                try {
                  await handleToolExecution(tool)
                } catch (error) {
                  if (workflow.settings.errorHandling === 'stop') {
                    throw error
                  }
                }
              }
            }

            showSnackbar(`Workflow "${workflow.name}" abgeschlossen`, 'success')
          }}
        />
      )}

      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>
            MCP Server Status - Live Data
          </Typography>

          <Grid container spacing={3}>
            {servers.map(server => (
              <Grid item xs={12} md={6} lg={4} key={server.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {server.name}
                      </Typography>
                      <Chip
                        label={server.status.toUpperCase()}
                        color={server.status === 'online' ? 'success' : server.status === 'degraded' ? 'warning' : 'error'}
                        size="small"
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Endpoint:</strong> {server.endpoint}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Tools:</strong> {server.toolCount}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      <strong>Zuletzt gesehen:</strong> {new Date(server.lastSeen).toLocaleString()}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        size="small"
                        label={`${server.toolCount} Tools`}
                        color="primary"
                      />
                      <Chip
                        size="small"
                        label={server.status === 'online' ? 'Aktiv' : 'Inaktiv'}
                        color={server.status === 'online' ? 'success' : 'default'}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {servers.length === 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Keine MCP Server gefunden. Stellen Sie sicher, dass die Server gestartet sind.
            </Alert>
          )}
        </Box>
      )}

      {/* Tool Configuration Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        {selectedTool && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SettingsIcon />
                {selectedTool.name} - Konfiguration
                <Chip
                  size="small"
                  label={selectedTool.riskLevel}
                  color={getRiskColor(selectedTool.riskLevel)}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                {/* Tool Information */}
                <Alert severity="info" sx={{ mb: 3 }}>
                  <strong>Server:</strong> {selectedTool.serverName}<br />
                  <strong>Kategorie:</strong> {selectedTool.category}<br />
                  <strong>Risk Level:</strong> {selectedTool.riskLevel}<br />
                  <strong>Verwendungen:</strong> {selectedTool.usageCount}x
                </Alert>

                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedTool.enabled}
                      onChange={(e) => setSelectedTool({
                        ...selectedTool,
                        enabled: e.target.checked
                      })}
                    />
                  }
                  label="Tool aktiviert"
                />

                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                  Tool Schema & Parameter
                </Typography>

                {/* Real Parameter Configuration */}
                {selectedTool.schema?.properties && Object.entries(selectedTool.schema.properties).map(([key, schema]: [string, any]) => (
                  <Box key={key} sx={{ mb: 2 }}>
                    <TextField
                      fullWidth
                      label={key}
                      value={toolParameters[selectedTool.id]?.[key] || ''}
                      onChange={(e) => setToolParameters(prev => ({
                        ...prev,
                        [selectedTool.id]: {
                          ...prev[selectedTool.id],
                          [key]: e.target.value
                        }
                      }))}
                      helperText={schema.description || `Type: ${schema.type}`}
                      required={selectedTool.schema.required?.includes(key)}
                      type={schema.type === 'number' || schema.type === 'integer' ? 'number' : 'text'}
                    />
                  </Box>
                ))}

                {/* Tool Metadata */}
                <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                  Tool Metadata
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Endpoint:</strong> {selectedTool.metadata.endpoint}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Entdeckt am:</strong> {new Date(selectedTool.metadata.discoveredAt).toLocaleString()}
                  </Typography>
                  {selectedTool.lastUsed && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Zuletzt verwendet:</strong> {new Date(selectedTool.lastUsed).toLocaleString()}
                    </Typography>
                  )}
                </Box>

                {/* Execution Results */}
                {executionResults[selectedTool.id] && (
                  <>
                    <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
                      Letztes Ausführungsergebnis
                    </Typography>
                    <Alert severity={executionResults[selectedTool.id].success ? 'success' : 'error'} sx={{ mb: 2 }}>
                      <strong>Status:</strong> {executionResults[selectedTool.id].success ? 'Erfolgreich' : 'Fehlgeschlagen'}<br />
                      <strong>Message:</strong> {executionResults[selectedTool.id].message}<br />
                      <strong>Zeit:</strong> {new Date(executionResults[selectedTool.id].timestamp).toLocaleString()}
                    </Alert>
                  </>
                )}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button
                startIcon={<PlayArrowIcon />}
                onClick={() => {
                  handleToolExecution(selectedTool)
                  setDialogOpen(false)
                }}
                disabled={!selectedTool.enabled || executionLoading[selectedTool.id]}
              >
                Tool Ausführen
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={() => handleToolUpdate(selectedTool)}
              >
                Speichern
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default McpToolset