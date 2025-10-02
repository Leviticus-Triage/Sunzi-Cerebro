/**
 * 🔗 MCP WORKFLOW BUILDER - ENTERPRISE TOOL CHAINING SYSTEM
 * Professional Drag-and-Drop Interface for MCP Tool Workflows
 * NO MOCK DATA - Production Ready with Real Tool Integration
 */

import React, { useState, useCallback, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Paper,
  Grid,
  Select,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
} from '@mui/material'

import {
  AccountTree as WorkflowIcon,
  Extension as ToolIcon,
  PlayArrow as PlayIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Link as LinkIcon,
  Settings as SettingsIcon,
  Timeline as TimelineIcon,
  Code as CodeIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowRight as ArrowRightIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Memory as MemoryIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material'

import { McpTool, ExecutionResult } from '../../services/mcpApi'

// Workflow Types
interface WorkflowNode {
  id: string
  toolId: string
  toolName: string
  position: { x: number; y: number }
  parameters: Record<string, any>
  conditions?: {
    executeIf?: string
    skipIf?: string
    retryCount?: number
    timeout?: number
  }
  status?: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  result?: ExecutionResult
}

interface WorkflowConnection {
  id: string
  sourceNodeId: string
  targetNodeId: string
  sourcePort: string
  targetPort: string
  condition?: string
  dataMapping?: Record<string, string> // Map output fields to input fields
}

interface Workflow {
  id: string
  name: string
  description: string
  nodes: WorkflowNode[]
  connections: WorkflowConnection[]
  settings: {
    parallel: boolean
    maxConcurrency: number
    errorHandling: 'stop' | 'continue' | 'rollback'
    timeout: number
    retryPolicy: {
      enabled: boolean
      maxRetries: number
      backoff: 'linear' | 'exponential'
    }
  }
  metadata: {
    created: string
    lastModified: string
    version: string
    tags: string[]
  }
}

interface WorkflowBuilderProps {
  availableTools: McpTool[]
  onSaveWorkflow: (workflow: Workflow) => void
  onExecuteWorkflow: (workflow: Workflow) => void
  existingWorkflow?: Workflow
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  availableTools,
  onSaveWorkflow,
  onExecuteWorkflow,
  existingWorkflow
}) => {
  // Workflow State
  const [workflow, setWorkflow] = useState<Workflow>(existingWorkflow || {
    id: `workflow_${Date.now()}`,
    name: 'Neuer Workflow',
    description: '',
    nodes: [],
    connections: [],
    settings: {
      parallel: false,
      maxConcurrency: 3,
      errorHandling: 'stop',
      timeout: 300,
      retryPolicy: {
        enabled: true,
        maxRetries: 3,
        backoff: 'exponential'
      }
    },
    metadata: {
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      version: '1.0.0',
      tags: []
    }
  })

  // UI State
  const [toolDrawerOpen, setToolDrawerOpen] = useState(false)
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [draggedTool, setDraggedTool] = useState<McpTool | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
  const [executeDialogOpen, setExecuteDialogOpen] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResults, setExecutionResults] = useState<Record<string, ExecutionResult>>({})

  // Canvas State
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

  // Tool Categories for Drawer
  const toolCategories = availableTools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = []
    }
    acc[tool.category].push(tool)
    return acc
  }, {} as Record<string, McpTool[]>)

  // Add Node to Workflow
  const addNode = useCallback((tool: McpTool, position: { x: number; y: number }) => {
    const newNode: WorkflowNode = {
      id: `node_${Date.now()}`,
      toolId: tool.id,
      toolName: tool.name,
      position,
      parameters: {},
      conditions: {
        retryCount: 3,
        timeout: 120
      }
    }

    setWorkflow(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
      metadata: {
        ...prev.metadata,
        lastModified: new Date().toISOString()
      }
    }))
  }, [])

  // Remove Node
  const removeNode = useCallback((nodeId: string) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.filter(node => node.id !== nodeId),
      connections: prev.connections.filter(
        conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
      ),
      metadata: {
        ...prev.metadata,
        lastModified: new Date().toISOString()
      }
    }))
  }, [])

  // Update Node
  const updateNode = useCallback((nodeId: string, updates: Partial<WorkflowNode>) => {
    setWorkflow(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
      metadata: {
        ...prev.metadata,
        lastModified: new Date().toISOString()
      }
    }))
  }, [])

  // Add Connection
  const addConnection = useCallback((sourceNodeId: string, targetNodeId: string) => {
    const newConnection: WorkflowConnection = {
      id: `conn_${Date.now()}`,
      sourceNodeId,
      targetNodeId,
      sourcePort: 'output',
      targetPort: 'input',
      dataMapping: {}
    }

    setWorkflow(prev => ({
      ...prev,
      connections: [...prev.connections, newConnection],
      metadata: {
        ...prev.metadata,
        lastModified: new Date().toISOString()
      }
    }))
  }, [])

  // Handle Tool Drag Start
  const handleDragStart = (tool: McpTool) => {
    setDraggedTool(tool)
    setIsDragging(true)
  }

  // Handle Canvas Drop
  const handleCanvasDrop = (event: React.DragEvent) => {
    event.preventDefault()
    if (draggedTool) {
      const rect = event.currentTarget.getBoundingClientRect()
      const position = {
        x: (event.clientX - rect.left - canvasOffset.x) / zoom,
        y: (event.clientY - rect.top - canvasOffset.y) / zoom
      }
      addNode(draggedTool, position)
    }
    setDraggedTool(null)
    setIsDragging(false)
  }

  // Execute Workflow
  const handleExecuteWorkflow = async () => {
    setIsExecuting(true)
    setExecuteDialogOpen(false)

    try {
      console.log('🚀 Executing workflow:', workflow.name)

      // Reset node statuses
      setWorkflow(prev => ({
        ...prev,
        nodes: prev.nodes.map(node => ({ ...node, status: 'pending' }))
      }))

      // Execute workflow via callback
      await onExecuteWorkflow(workflow)

      console.log('✅ Workflow execution completed')
    } catch (error) {
      console.error('❌ Workflow execution failed:', error)
    } finally {
      setIsExecuting(false)
    }
  }

  // Save Workflow
  const handleSaveWorkflow = () => {
    const updatedWorkflow = {
      ...workflow,
      metadata: {
        ...workflow.metadata,
        lastModified: new Date().toISOString()
      }
    }
    setWorkflow(updatedWorkflow)
    onSaveWorkflow(updatedWorkflow)
  }

  // Get Node Color based on Status
  const getNodeColor = (status?: string) => {
    switch (status) {
      case 'running': return '#2196f3'
      case 'completed': return '#4caf50'
      case 'failed': return '#f44336'
      case 'skipped': return '#ff9800'
      default: return '#9e9e9e'
    }
  }

  // Get Tool Icon
  const getToolIcon = (tool: McpTool) => {
    switch (tool.category.toLowerCase()) {
      case 'reconnaissance':
      case 'recon':
        return <ToolIcon />
      case 'exploitation':
        return <CodeIcon />
      case 'scanning':
        return <MemoryIcon />
      default:
        return <ToolIcon />
    }
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <WorkflowIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {workflow.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {workflow.nodes.length} Tools • {workflow.connections.length} Verbindungen
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<AddIcon />}
              onClick={() => setToolDrawerOpen(true)}
              variant="outlined"
              size="small"
            >
              Tools
            </Button>
            <Button
              startIcon={<SettingsIcon />}
              onClick={() => setSettingsDialogOpen(true)}
              variant="outlined"
              size="small"
            >
              Einstellungen
            </Button>
            <Button
              startIcon={<SaveIcon />}
              onClick={handleSaveWorkflow}
              variant="outlined"
              size="small"
            >
              Speichern
            </Button>
            <Button
              startIcon={isExecuting ? <TimelineIcon /> : <PlayIcon />}
              onClick={() => setExecuteDialogOpen(true)}
              variant="contained"
              disabled={workflow.nodes.length === 0 || isExecuting}
              size="small"
            >
              {isExecuting ? 'Läuft...' : 'Ausführen'}
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Canvas */}
        <Box
          sx={{
            flex: 1,
            position: 'relative',
            overflow: 'hidden',
            bgcolor: '#fafafa',
            backgroundImage: 'radial-gradient(circle, #ccc 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
          onDrop={handleCanvasDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {/* Workflow Nodes */}
          {workflow.nodes.map(node => {
            const tool = availableTools.find(t => t.id === node.toolId)
            if (!tool) return null

            return (
              <Card
                key={node.id}
                sx={{
                  position: 'absolute',
                  left: node.position.x,
                  top: node.position.y,
                  width: 200,
                  minHeight: 120,
                  cursor: 'pointer',
                  border: 2,
                  borderColor: getNodeColor(node.status),
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  '&:hover': {
                    boxShadow: 3
                  }
                }}
                onClick={() => setSelectedNode(node)}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getToolIcon(tool)}
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                        {tool.name}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeNode(node.id)
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    {tool.description.substring(0, 80)}...
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      size="small"
                      label={tool.category}
                      sx={{ fontSize: '0.6rem', height: 20 }}
                    />
                    <Chip
                      size="small"
                      label={tool.riskLevel}
                      color={tool.riskLevel === 'low' ? 'success' : tool.riskLevel === 'high' ? 'error' : 'warning'}
                      sx={{ fontSize: '0.6rem', height: 20 }}
                    />
                    {node.status && (
                      <Chip
                        size="small"
                        label={node.status}
                        sx={{
                          fontSize: '0.6rem',
                          height: 20,
                          bgcolor: getNodeColor(node.status),
                          color: 'white'
                        }}
                      />
                    )}
                  </Box>

                  {/* Connection Points */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: -8,
                      top: '50%',
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: 'primary.main',
                      border: 2,
                      borderColor: 'background.paper',
                      transform: 'translateY(-50%)'
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      right: -8,
                      top: '50%',
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: 'secondary.main',
                      border: 2,
                      borderColor: 'background.paper',
                      transform: 'translateY(-50%)'
                    }}
                  />
                </CardContent>
              </Card>
            )
          })}

          {/* Workflow Connections */}
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1
            }}
          >
            {workflow.connections.map(connection => {
              const sourceNode = workflow.nodes.find(n => n.id === connection.sourceNodeId)
              const targetNode = workflow.nodes.find(n => n.id === connection.targetNodeId)

              if (!sourceNode || !targetNode) return null

              const startX = (sourceNode.position.x + 200) * zoom
              const startY = (sourceNode.position.y + 60) * zoom
              const endX = targetNode.position.x * zoom
              const endY = (targetNode.position.y + 60) * zoom

              return (
                <g key={connection.id}>
                  <path
                    d={`M ${startX} ${startY} C ${startX + 50} ${startY} ${endX - 50} ${endY} ${endX} ${endY}`}
                    stroke="#1976d2"
                    strokeWidth="2"
                    fill="none"
                    markerEnd="url(#arrowhead)"
                  />
                </g>
              )
            })}

            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#1976d2" />
              </marker>
            </defs>
          </svg>

          {/* Empty State */}
          {workflow.nodes.length === 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
                color: 'text.secondary'
              }}
            >
              <WorkflowIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" gutterBottom>
                Workflow Builder
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Ziehen Sie Tools aus der Seitenleiste, um einen Workflow zu erstellen
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setToolDrawerOpen(true)}
                variant="outlined"
              >
                Tools hinzufügen
              </Button>
            </Box>
          )}
        </Box>
      </Box>

      {/* Tool Drawer */}
      <Drawer
        anchor="left"
        open={toolDrawerOpen}
        onClose={() => setToolDrawerOpen(false)}
        sx={{ '& .MuiDrawer-paper': { width: 320 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Verfügbare MCP Tools
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Ziehen Sie Tools in den Canvas, um sie zum Workflow hinzuzufügen
          </Typography>
        </Box>

        <List>
          {Object.entries(toolCategories).map(([category, tools]) => (
            <Box key={category}>
              <ListItem>
                <ListItemText
                  primary={category}
                  secondary={`${tools.length} Tools`}
                  primaryTypographyProps={{ variant: 'subtitle2', fontWeight: 600 }}
                />
              </ListItem>

              {tools.map(tool => (
                <ListItem
                  key={tool.id}
                  sx={{
                    pl: 4,
                    cursor: 'grab',
                    '&:hover': { bgcolor: 'action.hover' },
                    '&:active': { cursor: 'grabbing' }
                  }}
                  draggable
                  onDragStart={() => handleDragStart(tool)}
                >
                  <ListItemIcon>
                    {getToolIcon(tool)}
                  </ListItemIcon>
                  <ListItemText
                    primary={tool.name}
                    secondary={`${tool.serverName} • ${tool.riskLevel}`}
                    primaryTypographyProps={{ variant: 'body2' }}
                    secondaryTypographyProps={{ variant: 'caption' }}
                  />
                  <Chip
                    size="small"
                    label={tool.riskLevel}
                    color={tool.riskLevel === 'low' ? 'success' : tool.riskLevel === 'high' ? 'error' : 'warning'}
                  />
                </ListItem>
              ))}
            </Box>
          ))}
        </List>
      </Drawer>

      {/* Workflow Settings Dialog */}
      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <SettingsIcon />
            Workflow Einstellungen
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {/* Basic Settings */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Workflow Name"
                value={workflow.name}
                onChange={(e) => setWorkflow(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Beschreibung"
                value={workflow.description}
                onChange={(e) => setWorkflow(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>

            {/* Execution Settings */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={workflow.settings.parallel}
                    onChange={(e) => setWorkflow(prev => ({
                      ...prev,
                      settings: { ...prev.settings, parallel: e.target.checked }
                    }))}
                  />
                }
                label="Parallele Ausführung"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Max. Parallelität"
                value={workflow.settings.maxConcurrency}
                onChange={(e) => setWorkflow(prev => ({
                  ...prev,
                  settings: { ...prev.settings, maxConcurrency: parseInt(e.target.value) }
                }))}
                disabled={!workflow.settings.parallel}
              />
            </Grid>

            {/* Error Handling */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Fehlerbehandlung</InputLabel>
                <Select
                  value={workflow.settings.errorHandling}
                  onChange={(e) => setWorkflow(prev => ({
                    ...prev,
                    settings: { ...prev.settings, errorHandling: e.target.value as any }
                  }))}
                  label="Fehlerbehandlung"
                >
                  <MenuItem value="stop">Bei Fehler stoppen</MenuItem>
                  <MenuItem value="continue">Bei Fehler fortfahren</MenuItem>
                  <MenuItem value="rollback">Bei Fehler zurückrollen</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Timeout (Sekunden)"
                value={workflow.settings.timeout}
                onChange={(e) => setWorkflow(prev => ({
                  ...prev,
                  settings: { ...prev.settings, timeout: parseInt(e.target.value) }
                }))}
              />
            </Grid>

            {/* Retry Policy */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={workflow.settings.retryPolicy.enabled}
                    onChange={(e) => setWorkflow(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        retryPolicy: { ...prev.settings.retryPolicy, enabled: e.target.checked }
                      }
                    }))}
                  />
                }
                label="Wiederholungen aktivieren"
              />
            </Grid>
            {workflow.settings.retryPolicy.enabled && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Max. Wiederholungen"
                    value={workflow.settings.retryPolicy.maxRetries}
                    onChange={(e) => setWorkflow(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        retryPolicy: { ...prev.settings.retryPolicy, maxRetries: parseInt(e.target.value) }
                      }
                    }))}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Backoff Strategie</InputLabel>
                    <Select
                      value={workflow.settings.retryPolicy.backoff}
                      onChange={(e) => setWorkflow(prev => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          retryPolicy: { ...prev.settings.retryPolicy, backoff: e.target.value as any }
                        }
                      }))}
                      label="Backoff Strategie"
                    >
                      <MenuItem value="linear">Linear</MenuItem>
                      <MenuItem value="exponential">Exponentiell</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button variant="contained" onClick={() => setSettingsDialogOpen(false)}>
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Execute Workflow Dialog */}
      <Dialog open={executeDialogOpen} onClose={() => setExecuteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PlayIcon />
            Workflow ausführen
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Der Workflow "{workflow.name}" wird mit {workflow.nodes.length} Tools ausgeführt.
          </Alert>

          <Typography variant="h6" gutterBottom>
            Workflow Zusammenfassung:
          </Typography>
          <List dense>
            {workflow.nodes.map((node, index) => {
              const tool = availableTools.find(t => t.id === node.toolId)
              return (
                <ListItem key={node.id}>
                  <ListItemIcon>
                    <Typography variant="body2" sx={{ minWidth: 24 }}>
                      {index + 1}.
                    </Typography>
                  </ListItemIcon>
                  <ListItemText
                    primary={tool?.name || 'Unknown Tool'}
                    secondary={`${tool?.category} • ${tool?.riskLevel} Risk`}
                  />
                </ListItem>
              )
            })}
          </List>

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
            Ausführungseinstellungen:
          </Typography>
          <Box>
            <Typography variant="body2">
              • Parallele Ausführung: {workflow.settings.parallel ? 'Ja' : 'Nein'}
            </Typography>
            <Typography variant="body2">
              • Fehlerbehandlung: {workflow.settings.errorHandling}
            </Typography>
            <Typography variant="body2">
              • Timeout: {workflow.settings.timeout} Sekunden
            </Typography>
            <Typography variant="body2">
              • Wiederholungen: {workflow.settings.retryPolicy.enabled ? `${workflow.settings.retryPolicy.maxRetries}x` : 'Deaktiviert'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExecuteDialogOpen(false)}>
            Abbrechen
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            onClick={handleExecuteWorkflow}
            color="primary"
          >
            Workflow starten
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default WorkflowBuilder