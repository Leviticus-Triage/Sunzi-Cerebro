import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Avatar,
  Stack,
  Paper,
  Divider,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material'
import {
  Security as SecurityIcon,
  BugReport as BugReportIcon,
  NetworkCheck as NetworkCheckIcon,
  Web as WebIcon,
  Storage as StorageIcon,
  PlayArrow as PlayArrowIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
  Extension as ExtensionIcon,
  Visibility as ViewIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useMcpData } from '../../hooks/useMcpData'

interface ToolExecution {
  id: string
  toolName: string
  status: 'running' | 'completed' | 'failed'
  progress: number
  result?: string
  error?: string
}

interface ToolCategory {
  name: string
  count: number
  color: string
  icon: React.ReactNode
}

const toolCategories: ToolCategory[] = [
  {
    name: 'Network Security',
    count: 0,
    color: '#00ca82',
    icon: <NetworkCheckIcon />
  },
  {
    name: 'Web Security',
    count: 0,
    color: '#3e94ff',
    icon: <WebIcon />
  },
  {
    name: 'Vulnerability Assessment',
    count: 0,
    color: '#ff9b26',
    icon: <BugReportIcon />
  },
  {
    name: 'Digital Forensics',
    count: 0,
    color: '#fb5454',
    icon: <StorageIcon />
  },
  {
    name: 'Penetration Testing',
    count: 0,
    color: '#2a76d1',
    icon: <SecurityIcon />
  },
  {
    name: 'MCP Extensions',
    count: 0,
    color: '#9c27b0',
    icon: <ExtensionIcon />
  }
]

const Tools: React.FC = () => {
  const { data: mcpData, loading, error, refetch } = useMcpData()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [toolDialog, setToolDialog] = useState<{ open: boolean, tool?: any }>({ open: false })
  const [configDialog, setConfigDialog] = useState<{ open: boolean, tool?: any }>({ open: false })
  const [executions, setExecutions] = useState<ToolExecution[]>([])
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as const })

  const allTools = React.useMemo(() => {
    if (!mcpData) return []

    const tools: any[] = []
    mcpData.servers.forEach(server => {
      server.tools?.forEach(tool => {
        tools.push({
          id: `${server.id}-${tool.name}`,
          name: tool.name,
          description: tool.description || `${tool.name} tool from ${server.name}`,
          category: categorizeToolByName(tool.name),
          status: server.status === 'active' ? 'active' : 'inactive',
          serverId: server.id,
          serverName: server.name,
          lastRun: 'Never',
          usage: Math.floor(Math.random() * 100),
          icon: getToolIcon(tool.name),
          color: getToolColor(tool.name),
          schema: tool.inputSchema
        })
      })
    })
    return tools
  }, [mcpData])

  const categories = React.useMemo(() => {
    const cats = ['All', ...toolCategories.map(cat => cat.name)]
    return cats
  }, [])

  const categorizeToolByName = (toolName: string): string => {
    const name = toolName.toLowerCase()
    if (name.includes('nmap') || name.includes('network') || name.includes('scan') || name.includes('port')) {
      return 'Network Security'
    }
    if (name.includes('web') || name.includes('http') || name.includes('url') || name.includes('browser')) {
      return 'Web Security'
    }
    if (name.includes('vuln') || name.includes('cve') || name.includes('security') || name.includes('audit')) {
      return 'Vulnerability Assessment'
    }
    if (name.includes('forensic') || name.includes('file') || name.includes('hash') || name.includes('analyze')) {
      return 'Digital Forensics'
    }
    if (name.includes('exploit') || name.includes('payload') || name.includes('attack') || name.includes('pentest')) {
      return 'Penetration Testing'
    }
    return 'MCP Extensions'
  }

  const getToolIcon = (toolName: string) => {
    const name = toolName.toLowerCase()
    if (name.includes('network') || name.includes('nmap') || name.includes('scan')) return <NetworkCheckIcon />
    if (name.includes('web') || name.includes('http')) return <WebIcon />
    if (name.includes('vuln') || name.includes('bug')) return <BugReportIcon />
    if (name.includes('file') || name.includes('storage')) return <StorageIcon />
    if (name.includes('security') || name.includes('exploit')) return <SecurityIcon />
    return <ExtensionIcon />
  }

  const getToolColor = (toolName: string): string => {
    const name = toolName.toLowerCase()
    if (name.includes('network') || name.includes('nmap')) return '#00ca82'
    if (name.includes('web') || name.includes('http')) return '#3e94ff'
    if (name.includes('vuln') || name.includes('bug')) return '#ff9b26'
    if (name.includes('file') || name.includes('storage')) return '#fb5454'
    if (name.includes('security') || name.includes('exploit')) return '#2a76d1'
    return '#9c27b0'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'running':
        return 'primary'
      case 'inactive':
        return 'error'
      case 'maintenance':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Aktiv'
      case 'running':
        return 'Läuft'
      case 'inactive':
        return 'Inaktiv'
      case 'maintenance':
        return 'Wartung'
      default:
        return 'Unbekannt'
    }
  }

  const filteredTools = selectedCategory === 'All'
    ? allTools
    : allTools.filter(tool => tool.category === selectedCategory)

  const handleToolStart = async (tool: any) => {
    try {
      setSnackbar({ open: true, message: `Starting ${tool.name}...`, severity: 'info' })

      // Simulate tool execution
      const execution: ToolExecution = {
        id: Date.now().toString(),
        toolName: tool.name,
        status: 'running',
        progress: 0
      }

      setExecutions(prev => [...prev, execution])

      // Simulate progress
      const progressInterval = setInterval(() => {
        setExecutions(prev =>
          prev.map(exec =>
            exec.id === execution.id
              ? { ...exec, progress: Math.min(100, exec.progress + Math.random() * 20) }
              : exec
          )
        )
      }, 1000)

      // Simulate completion after 5 seconds
      setTimeout(() => {
        clearInterval(progressInterval)
        setExecutions(prev =>
          prev.map(exec =>
            exec.id === execution.id
              ? { ...exec, status: 'completed', progress: 100, result: `${tool.name} completed successfully` }
              : exec
          )
        )
        setSnackbar({ open: true, message: `${tool.name} completed successfully`, severity: 'success' })
      }, 5000)

    } catch (error) {
      setSnackbar({ open: true, message: `Failed to start ${tool.name}`, severity: 'error' })
    }
  }

  const handleToolInfo = (tool: any) => {
    setToolDialog({ open: true, tool })
  }

  const handleToolConfig = (tool: any) => {
    setConfigDialog({ open: true, tool })
  }

  const handleRefresh = () => {
    refetch()
    setSnackbar({ open: true, message: 'Tools refreshed', severity: 'success' })
  }

  // Show loading state
  if (loading && !mcpData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="h6">Loading security tools...</Typography>
        </Stack>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Security Tools
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Verwalten und führen Sie Ihre {allTools.length} verfügbaren Security-Tools aus.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          Aktualisieren
        </Button>
      </Box>

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          Fehler beim Laden der Tools: {error}
        </Alert>
      )}

      {/* Category Stats */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Tool Kategorien</Typography>
        <Grid container spacing={2}>
          {toolCategories.map((category) => {
            const categoryCount = allTools.filter(tool => tool.category === category.name).length
            return (
              <Grid item xs={6} sm={4} md={2} key={category.name}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'scale(1.05)', boxShadow: 2 }
                  }}
                  onClick={() => setSelectedCategory(category.name)}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Avatar sx={{ bgcolor: category.color, margin: '0 auto', mb: 1 }}>
                      {category.icon}
                    </Avatar>
                    <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                      {categoryCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {category.name}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </Paper>

      {/* Category Filter */}
      <Paper sx={{ p: 2, mb: 4 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
          <Typography variant="body2" sx={{ mr: 1, color: 'text.secondary' }}>Filter:</Typography>
          {categories.map((category) => {
            const count = category === 'All' ? allTools.length : allTools.filter(tool => tool.category === category).length
            return (
              <Chip
                key={category}
                label={`${category} (${count})`}
                variant={selectedCategory === category ? 'filled' : 'outlined'}
                color={selectedCategory === category ? 'primary' : 'default'}
                onClick={() => setSelectedCategory(category)}
                sx={{ mb: 1 }}
              />
            )
          })}
        </Stack>
      </Paper>

      {/* Active Executions */}
      {executions.length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Aktive Tool-Ausführungen</Typography>
          <Stack spacing={2}>
            {executions.filter(exec => exec.status === 'running').map((execution) => (
              <Box key={execution.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" sx={{ minWidth: 120 }}>{execution.toolName}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={execution.progress}
                  sx={{ flexGrow: 1 }}
                />
                <Typography variant="body2" sx={{ minWidth: 50 }}>{Math.round(execution.progress)}%</Typography>
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Tools Grid */}
      <Grid container spacing={3}>
        {filteredTools.map((tool) => (
          <Grid item xs={12} md={6} lg={4} key={tool.id}>
            <Card
              sx={{
                height: '100%',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                  <Avatar
                    sx={{
                      bgcolor: tool.color,
                      mr: 2,
                      width: 50,
                      height: 50,
                    }}
                  >
                    {tool.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }} noWrap>
                        {tool.name}
                      </Typography>
                      <Chip
                        label={getStatusText(tool.status)}
                        color={getStatusColor(tool.status)}
                        size="small"
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      {tool.category} • {tool.serverName}
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }} noWrap>
                  {tool.description}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption">Verfügbarkeit</Typography>
                    <Typography variant="caption">{tool.usage}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={tool.usage}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: tool.color,
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary">
                    Zuletzt ausgeführt: {tool.lastRun}
                  </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Stack direction="row" spacing={1} justifyContent="space-between">
                  <Button
                    variant="contained"
                    startIcon={<PlayArrowIcon />}
                    size="small"
                    disabled={tool.status !== 'active'}
                    onClick={() => handleToolStart(tool)}
                    sx={{
                      backgroundColor: tool.color,
                      '&:hover': {
                        backgroundColor: tool.color,
                        opacity: 0.8,
                      },
                    }}
                  >
                    Starten
                  </Button>
                  <Box>
                    <Tooltip title="Konfigurieren">
                      <IconButton
                        size="small"
                        color="default"
                        onClick={() => handleToolConfig(tool)}
                      >
                        <SettingsIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Tool Information">
                      <IconButton
                        size="small"
                        color="default"
                        onClick={() => handleToolInfo(tool)}
                      >
                        <InfoIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredTools.length === 0 && !loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Keine Tools in dieser Kategorie gefunden
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedCategory === 'All'
              ? 'Überprüfen Sie die MCP-Server Verbindung'
              : 'Wählen Sie eine andere Kategorie aus oder verwenden Sie "All", um alle Tools anzuzeigen.'
            }
          </Typography>
        </Paper>
      )}

      {/* Tool Info Dialog */}
      <Dialog
        open={toolDialog.open}
        onClose={() => setToolDialog({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Tool Information: {toolDialog.tool?.name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body1">
              <strong>Beschreibung:</strong> {toolDialog.tool?.description}
            </Typography>
            <Typography variant="body1">
              <strong>Kategorie:</strong> {toolDialog.tool?.category}
            </Typography>
            <Typography variant="body1">
              <strong>Server:</strong> {toolDialog.tool?.serverName}
            </Typography>
            <Typography variant="body1">
              <strong>Status:</strong> {getStatusText(toolDialog.tool?.status)}
            </Typography>
            {toolDialog.tool?.schema && (
              <Box>
                <Typography variant="h6" gutterBottom>Schema:</Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                  <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
                    {JSON.stringify(toolDialog.tool.schema, null, 2)}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToolDialog({ open: false })}>Schließen</Button>
        </DialogActions>
      </Dialog>

      {/* Tool Config Dialog */}
      <Dialog
        open={configDialog.open}
        onClose={() => setConfigDialog({ open: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Tool Konfiguration: {configDialog.tool?.name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Parameter 1"
              placeholder="Geben Sie Parameter ein..."
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Parameter 2"
              placeholder="Weitere Konfiguration..."
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Optionen"
              multiline
              rows={4}
              placeholder="Zusätzliche Tool-Optionen..."
              variant="outlined"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialog({ open: false })}>Abbrechen</Button>
          <Button
            variant="contained"
            onClick={() => {
              setConfigDialog({ open: false })
              setSnackbar({ open: true, message: 'Konfiguration gespeichert', severity: 'success' })
            }}
          >
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default Tools