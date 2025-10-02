/**
 * Advanced Security Scan Orchestrator
 * Provides intelligent, multi-stage security scanning with real-time progress
 * Integrates with MCP tools for comprehensive penetration testing workflows
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Badge,
  Tooltip,
  Fade,
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Security as SecurityIcon,
  BugReport as VulnerabilityIcon,
  NetworkPing as NetworkIcon,
  WebAsset as WebIcon,
  Storage as DatabaseIcon,
  Cloud as CloudIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon,
  Launch as LaunchIcon,
} from '@mui/icons-material'
import mcpService from '../../services/mcpService'
import type { SecurityOperation } from '../../services/mcpService'

// Operation types with detailed configurations
const OPERATION_TYPES = {
  reconnaissance: {
    name: 'Reconnaissance',
    icon: <NetworkIcon />,
    description: 'Information gathering and target enumeration',
    estimatedDuration: '5-15 min',
    riskLevel: 'low',
    steps: ['DNS enumeration', 'Subdomain discovery', 'Port scanning', 'Service detection']
  },
  vulnerability_scan: {
    name: 'Vulnerability Assessment',
    icon: <VulnerabilityIcon />,
    description: 'Comprehensive vulnerability detection and analysis',
    estimatedDuration: '15-45 min',
    riskLevel: 'medium',
    steps: ['CVE scanning', 'Misconfiguration detection', 'Weak credentials check', 'SSL/TLS analysis']
  },
  network_mapping: {
    name: 'Network Mapping',
    icon: <NetworkIcon />,
    description: 'Detailed network topology and asset discovery',
    estimatedDuration: '10-30 min',
    riskLevel: 'low',
    steps: ['Network discovery', 'OS fingerprinting', 'Service enumeration', 'Topology mapping']
  },
  exploitation: {
    name: 'Exploitation Testing',
    icon: <SecurityIcon />,
    description: 'Controlled exploitation attempts (High Risk)',
    estimatedDuration: '30-120 min',
    riskLevel: 'high',
    steps: ['Exploit research', 'Payload preparation', 'Controlled execution', 'Impact assessment']
  }
}

interface ScanConfiguration {
  target: string
  operationType: keyof typeof OPERATION_TYPES
  intensity: 'light' | 'medium' | 'aggressive'
  concurrent: boolean
  timeout: number
  customTools: string[]
}

interface ScanResult {
  tool: string
  status: 'success' | 'error' | 'timeout'
  result?: any
  error?: string
  timestamp: string
  duration?: number
}

export const SecurityScanOrchestrator: React.FC = () => {
  const [configuration, setConfiguration] = useState<ScanConfiguration>({
    target: '',
    operationType: 'reconnaissance',
    intensity: 'medium',
    concurrent: false,
    timeout: 300,
    customTools: []
  })

  const [activeOperations, setActiveOperations] = useState<SecurityOperation[]>([])
  const [selectedOperation, setSelectedOperation] = useState<SecurityOperation | null>(null)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [availableTools, setAvailableTools] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  // Load available tools and operations on mount
  useEffect(() => {
    loadAvailableData()
    const interval = setInterval(refreshOperations, 2000)
    return () => clearInterval(interval)
  }, [])

  const loadAvailableData = async () => {
    try {
      const servers = await mcpService.getServers()
      const toolNames = servers.flatMap(server =>
        Array.from({ length: server.toolCount }, (_, i) => `${server.name.toLowerCase()}_tool_${i + 1}`)
      )
      setAvailableTools(toolNames)
    } catch (error) {
      console.error('Failed to load available tools:', error)
    }
  }

  const refreshOperations = () => {
    const operations = mcpService.getAllOperations()
    setActiveOperations(operations)
  }

  const handleStartScan = async () => {
    if (!configuration.target.trim()) {
      setError('Please specify a target')
      return
    }

    try {
      setIsScanning(true)
      setError(null)

      const operationId = await mcpService.createSecurityOperation(
        configuration.operationType,
        configuration.target,
        {
          verbosity: configuration.intensity === 'light' ? 1 : configuration.intensity === 'medium' ? 2 : 3,
          concurrent: configuration.concurrent
        }
      )

      console.log(`✅ Started security operation: ${operationId}`)

      // Refresh operations to show the new one
      refreshOperations()

    } catch (error: any) {
      setError(error.message || 'Failed to start scan')
      console.error('Scan start error:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const handleStopOperation = async (operationId: string) => {
    try {
      const success = mcpService.stopOperation(operationId)
      if (success) {
        refreshOperations()
      }
    } catch (error) {
      console.error('Failed to stop operation:', error)
    }
  }

  const getOperationStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'executing': return 'primary'
      case 'error': return 'error'
      case 'planning': return 'warning'
      default: return 'default'
    }
  }

  const getOperationStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <SuccessIcon color="success" />
      case 'executing': return <TimelineIcon color="primary" />
      case 'error': return <ErrorIcon color="error" />
      case 'planning': return <SettingsIcon color="warning" />
      default: return <InfoIcon />
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'success'
      case 'medium': return 'warning'
      case 'high': return 'error'
      default: return 'default'
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <SecurityIcon color="primary" />
        Advanced Security Orchestration
      </Typography>

      <Grid container spacing={3}>
        {/* Configuration Panel */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader
              title="Scan Configuration"
              avatar={<SettingsIcon color="primary" />}
            />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Target (IP, Domain, or CIDR)"
                  value={configuration.target}
                  onChange={(e) => setConfiguration(prev => ({ ...prev, target: e.target.value }))}
                  placeholder="192.168.1.1, example.com, 10.0.0.0/24"
                  fullWidth
                  error={!!error && !configuration.target.trim()}
                  helperText={error && !configuration.target.trim() ? "Target is required" : ""}
                />

                <FormControl fullWidth>
                  <InputLabel>Operation Type</InputLabel>
                  <Select
                    value={configuration.operationType}
                    onChange={(e) => setConfiguration(prev => ({
                      ...prev,
                      operationType: e.target.value as keyof typeof OPERATION_TYPES
                    }))}
                  >
                    {Object.entries(OPERATION_TYPES).map(([key, type]) => (
                      <MenuItem key={key} value={key}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {type.icon}
                          {type.name}
                          <Chip
                            label={type.riskLevel.toUpperCase()}
                            size="small"
                            color={getRiskLevelColor(type.riskLevel)}
                            sx={{ ml: 1 }}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Scan Intensity</InputLabel>
                  <Select
                    value={configuration.intensity}
                    onChange={(e) => setConfiguration(prev => ({
                      ...prev,
                      intensity: e.target.value as 'light' | 'medium' | 'aggressive'
                    }))}
                  >
                    <MenuItem value="light">Light (Stealth, Basic scans)</MenuItem>
                    <MenuItem value="medium">Medium (Balanced approach)</MenuItem>
                    <MenuItem value="aggressive">Aggressive (Comprehensive, Faster)</MenuItem>
                  </Select>
                </FormControl>

                {/* Operation Details */}
                <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {OPERATION_TYPES[configuration.operationType].name} Details
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {OPERATION_TYPES[configuration.operationType].description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Chip
                      label={`Est. ${OPERATION_TYPES[configuration.operationType].estimatedDuration}`}
                      size="small"
                      icon={<TimelineIcon />}
                    />
                    <Chip
                      label={`Risk: ${OPERATION_TYPES[configuration.operationType].riskLevel.toUpperCase()}`}
                      size="small"
                      color={getRiskLevelColor(OPERATION_TYPES[configuration.operationType].riskLevel)}
                    />
                  </Box>

                  <Typography variant="subtitle2" gutterBottom>Scan Steps:</Typography>
                  <Stepper orientation="vertical" sx={{ pl: 0 }}>
                    {OPERATION_TYPES[configuration.operationType].steps.map((step, index) => (
                      <Step key={index} active>
                        <StepLabel>{step}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Paper>

                <Button
                  variant="contained"
                  size="large"
                  startIcon={isScanning ? <StopIcon /> : <PlayIcon />}
                  onClick={handleStartScan}
                  disabled={isScanning || !configuration.target.trim()}
                  fullWidth
                  sx={{ py: 1.5 }}
                >
                  {isScanning ? 'Starting Scan...' : 'Start Security Scan'}
                </Button>

                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Operations Panel */}
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Active Operations
                  <Badge badgeContent={activeOperations.length} color="primary">
                    <TimelineIcon />
                  </Badge>
                </Box>
              }
              action={
                <IconButton onClick={refreshOperations}>
                  <RefreshIcon />
                </IconButton>
              }
            />
            <CardContent sx={{ maxHeight: 600, overflow: 'auto' }}>
              {activeOperations.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                  No active operations
                </Typography>
              ) : (
                <List>
                  {activeOperations.map((operation) => (
                    <Fade in key={operation.id}>
                      <ListItem
                        sx={{
                          border: 1,
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1,
                          bgcolor: operation.status === 'executing' ? 'action.hover' : 'background.paper'
                        }}
                      >
                        <ListItemIcon>
                          {getOperationStatusIcon(operation.status)}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="subtitle2">
                                {OPERATION_TYPES[operation.type]?.name || operation.type}
                              </Typography>
                              <Chip
                                label={operation.status}
                                size="small"
                                color={getOperationStatusColor(operation.status)}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                Target: {operation.target}
                              </Typography>
                              {operation.status === 'executing' && (
                                <LinearProgress
                                  variant="determinate"
                                  value={operation.progress}
                                  sx={{ mt: 1 }}
                                />
                              )}
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Tooltip title="View Details">
                            <IconButton
                              onClick={() => {
                                setSelectedOperation(operation)
                                setDetailsDialogOpen(true)
                              }}
                            >
                              <LaunchIcon />
                            </IconButton>
                          </Tooltip>
                          {operation.status === 'executing' && (
                            <Tooltip title="Stop Operation">
                              <IconButton
                                color="error"
                                onClick={() => handleStopOperation(operation.id)}
                              >
                                <StopIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                    </Fade>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Operation Details Dialog */}
      <Dialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Operation Details: {selectedOperation?.id}
        </DialogTitle>
        <DialogContent>
          {selectedOperation && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Type:</Typography>
                  <Typography>{OPERATION_TYPES[selectedOperation.type]?.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Status:</Typography>
                  <Chip
                    label={selectedOperation.status}
                    color={getOperationStatusColor(selectedOperation.status)}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Target:</Typography>
                  <Typography>{selectedOperation.target}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Progress:</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={selectedOperation.progress}
                      sx={{ flexGrow: 1 }}
                    />
                    <Typography variant="body2">{selectedOperation.progress}%</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Tools:</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {selectedOperation.tools.map((tool) => (
                      <Chip key={tool} label={tool} size="small" />
                    ))}
                  </Box>
                </Grid>
                {selectedOperation.results && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Results:</Typography>
                    <Paper sx={{ p: 2, mt: 1, bgcolor: 'background.default' }}>
                      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem' }}>
                        {JSON.stringify(selectedOperation.results, null, 2)}
                      </pre>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default SecurityScanOrchestrator