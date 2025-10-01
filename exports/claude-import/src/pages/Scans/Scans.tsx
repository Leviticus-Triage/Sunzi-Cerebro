import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  Tooltip,
  Divider,
  CircularProgress,
} from '@mui/material'
import {
  BugReport as BugReportIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Stop as StopIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Security as SecurityIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material'
import { useMcpData } from '../../hooks/useMcpData'
import SecurityScanOrchestrator from '../../components/SecurityOrchestration/SecurityScanOrchestrator'

interface ScanResult {
  id: string
  name: string
  type: string
  target: string
  status: 'running' | 'completed' | 'failed' | 'paused' | 'scheduled' | 'stopped'
  progress: number
  startTime: string
  endTime?: string
  duration?: string
  findings: number
  severity: {
    critical: number
    high: number
    medium: number
    low: number
  }
  tool: string
  server: string
  logs?: string[]
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`scans-tabpanel-${index}`}
      aria-labelledby={`scans-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

const Scans: React.FC = () => {
  const { data: mcpData, loading, error } = useMcpData()
  const [activeTab, setActiveTab] = useState(0)
  const [scans, setScans] = useState<ScanResult[]>([])
  const [newScanDialog, setNewScanDialog] = useState(false)
  const [viewScanDialog, setViewScanDialog] = useState<{ open: boolean, scan?: ScanResult }>({ open: false })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' as const })
  const [newScan, setNewScan] = useState({
    name: '',
    type: 'network-scan',
    target: '',
    tool: '',
    server: '',
    schedule: 'immediate'
  })

  // Generate some realistic mock scan data
  useEffect(() => {
    const mockScans: ScanResult[] = [
      {
        id: 'scan-1',
        name: 'Network Security Assessment',
        type: 'Network Scan',
        target: '192.168.1.0/24',
        status: 'running',
        progress: 67,
        startTime: new Date(Date.now() - 1200000).toLocaleString(),
        findings: 15,
        severity: { critical: 2, high: 5, medium: 6, low: 2 },
        tool: 'Nmap + Nuclei',
        server: 'HexStrike AI',
        logs: [
          'Starting network discovery...',
          'Scanning ports on 192.168.1.1',
          'Found 23 open ports',
          'Running vulnerability checks...',
          'Critical vulnerability detected on port 22'
        ]
      },
      {
        id: 'scan-2',
        name: 'Web Application Security Test',
        type: 'Web Scan',
        target: 'https://example-app.com',
        status: 'completed',
        progress: 100,
        startTime: new Date(Date.now() - 3600000).toLocaleString(),
        endTime: new Date(Date.now() - 600000).toLocaleString(),
        duration: '50 minutes',
        findings: 8,
        severity: { critical: 1, high: 2, medium: 3, low: 2 },
        tool: 'Burp Suite',
        server: 'MCP-God-Mode',
        logs: [
          'Starting web application scan...',
          'Crawling application structure...',
          'Testing for SQL injection...',
          'Testing for XSS vulnerabilities...',
          'Scan completed successfully'
        ]
      },
      {
        id: 'scan-3',
        name: 'API Security Audit',
        type: 'API Scan',
        target: 'api.example.com',
        status: 'failed',
        progress: 34,
        startTime: new Date(Date.now() - 2400000).toLocaleString(),
        findings: 0,
        severity: { critical: 0, high: 0, medium: 0, low: 0 },
        tool: 'API Testing Suite',
        server: 'AttackMCP',
        logs: [
          'Starting API security audit...',
          'Authentication failed',
          'Unable to connect to target',
          'ERROR: Timeout after 30 seconds',
          'Scan terminated due to connection issues'
        ]
      },
      {
        id: 'scan-4',
        name: 'Database Security Check',
        type: 'Database Scan',
        target: 'db-server-01',
        status: 'scheduled',
        progress: 0,
        startTime: new Date(Date.now() + 3600000).toLocaleString(),
        findings: 0,
        severity: { critical: 0, high: 0, medium: 0, low: 0 },
        tool: 'Database Scanner',
        server: 'HexStrike AI',
        logs: []
      }
    ]

    setScans(mockScans)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'primary'
      case 'completed':
        return 'success'
      case 'failed':
        return 'error'
      case 'paused':
        return 'warning'
      case 'scheduled':
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <CircularProgress size={20} />
      case 'completed':
        return <CompletedIcon />
      case 'failed':
        return <ErrorIcon />
      case 'paused':
        return <PauseIcon />
      case 'scheduled':
        return <ScheduleIcon />
      default:
        return <InfoIcon />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#fb5454'
      case 'high':
        return '#ff9b26'
      case 'medium':
        return '#2a76d1'
      case 'low':
        return '#00ca82'
      default:
        return '#99adcb'
    }
  }

  const getFilteredScans = () => {
    switch (activeTab) {
      case 0: // Active
        return scans.filter(scan => ['running', 'paused'].includes(scan.status))
      case 1: // Completed
        return scans.filter(scan => scan.status === 'completed')
      case 2: // Failed
        return scans.filter(scan => scan.status === 'failed')
      case 3: // Scheduled
        return scans.filter(scan => scan.status === 'scheduled')
      case 4: // All
        return scans
      default:
        return scans
    }
  }

  const handleScanAction = (scanId: string, action: 'start' | 'pause' | 'stop' | 'delete') => {
    setScans(prev => prev.map(scan => {
      if (scan.id !== scanId) return scan

      switch (action) {
        case 'start':
          return { ...scan, status: 'running' as const }
        case 'pause':
          return { ...scan, status: 'paused' as const }
        case 'stop':
          return { ...scan, status: 'stopped' as const }
        default:
          return scan
      }
    }))

    if (action === 'delete') {
      setScans(prev => prev.filter(scan => scan.id !== scanId))
    }

    setSnackbar({
      open: true,
      message: `Scan ${action === 'delete' ? 'deleted' : `${action}ed`} successfully`,
      severity: 'success'
    })
  }

  const handleCreateScan = () => {
    if (!newScan.name || !newScan.target) {
      setSnackbar({ open: true, message: 'Please fill in required fields', severity: 'error' })
      return
    }

    const scan: ScanResult = {
      id: `scan-${Date.now()}`,
      name: newScan.name,
      type: newScan.type,
      target: newScan.target,
      status: newScan.schedule === 'immediate' ? 'running' : 'scheduled',
      progress: 0,
      startTime: newScan.schedule === 'immediate'
        ? new Date().toLocaleString()
        : new Date(Date.now() + 3600000).toLocaleString(),
      findings: 0,
      severity: { critical: 0, high: 0, medium: 0, low: 0 },
      tool: newScan.tool || 'Auto-selected',
      server: newScan.server || 'Auto-assigned',
      logs: newScan.schedule === 'immediate'
        ? [`Starting ${newScan.type} scan...`]
        : [`Scan scheduled for ${new Date(Date.now() + 3600000).toLocaleString()}`]
    }

    setScans(prev => [scan, ...prev])
    setNewScanDialog(false)
    setNewScan({ name: '', type: 'network-scan', target: '', tool: '', server: '', schedule: 'immediate' })
    setSnackbar({ open: true, message: 'Scan created successfully', severity: 'success' })
  }

  const getOverallStats = () => {
    return {
      total: scans.length,
      running: scans.filter(s => s.status === 'running').length,
      completed: scans.filter(s => s.status === 'completed').length,
      failed: scans.filter(s => s.status === 'failed').length,
      totalFindings: scans.reduce((sum, scan) => sum + scan.findings, 0),
      criticalFindings: scans.reduce((sum, scan) => sum + scan.severity.critical, 0)
    }
  }

  const stats = getOverallStats()
  const filteredScans = getFilteredScans()

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Security Scans
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Verwalten Sie Ihre aktiven Security-Scans und überwachen Sie den Fortschritt.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => setSnackbar({ open: true, message: 'Scans refreshed', severity: 'success' })}
          >
            Aktualisieren
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewScanDialog(true)}
          >
            Neuer Scan
          </Button>
        </Stack>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600 }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Scans
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                {stats.running}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Running
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                {stats.completed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main" sx={{ fontWeight: 600 }}>
                {stats.failed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Failed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                {stats.totalFindings}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Findings
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h4" color="error.main" sx={{ fontWeight: 600 }}>
                {stats.criticalFindings}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Critical Issues
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab
            label="Advanced Orchestration"
            icon={<SecurityIcon />}
            iconPosition="start"
          />
          <Tab label={`Active (${scans.filter(s => ['running', 'paused'].includes(s.status)).length})`} />
          <Tab label={`Completed (${scans.filter(s => s.status === 'completed').length})`} />
          <Tab label={`Failed (${scans.filter(s => s.status === 'failed').length})`} />
          <Tab label={`Scheduled (${scans.filter(s => s.status === 'scheduled').length})`} />
          <Tab label={`All (${scans.length})`} />
        </Tabs>

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          <SecurityScanOrchestrator />
        </TabPanel>

        <TabPanel value={activeTab} index={activeTab > 0 ? activeTab : 1}>
          <Box sx={{ px: 3, pb: 3 }}>
            {filteredScans.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <BugReportIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Keine Scans in dieser Kategorie
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {activeTab === 0 && "Starten Sie einen neuen Scan oder überprüfen Sie andere Kategorien."}
                  {activeTab === 1 && "Noch keine abgeschlossenen Scans vorhanden."}
                  {activeTab === 2 && "Keine fehlgeschlagenen Scans - gut so!"}
                  {activeTab === 3 && "Keine geplanten Scans vorhanden."}
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {filteredScans.map((scan) => (
                  <Grid item xs={12} lg={6} key={scan.id}>
                    <Card>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {scan.name}
                              </Typography>
                              <Chip
                                icon={getStatusIcon(scan.status)}
                                label={scan.status.toUpperCase()}
                                color={getStatusColor(scan.status)}
                                size="small"
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {scan.type} • {scan.target} • {scan.tool}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            {scan.status === 'running' && (
                              <Tooltip title="Pause Scan">
                                <IconButton size="small" onClick={() => handleScanAction(scan.id, 'pause')}>
                                  <PauseIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {scan.status === 'paused' && (
                              <Tooltip title="Resume Scan">
                                <IconButton size="small" onClick={() => handleScanAction(scan.id, 'start')}>
                                  <PlayArrowIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {['running', 'paused'].includes(scan.status) && (
                              <Tooltip title="Stop Scan">
                                <IconButton size="small" onClick={() => handleScanAction(scan.id, 'stop')}>
                                  <StopIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="View Details">
                              <IconButton size="small" onClick={() => setViewScanDialog({ open: true, scan })}>
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            {scan.status === 'completed' && (
                              <Tooltip title="Download Report">
                                <IconButton size="small">
                                  <DownloadIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete Scan">
                              <IconButton size="small" color="error" onClick={() => handleScanAction(scan.id, 'delete')}>
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Box>

                        {scan.status === 'running' && (
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2">Progress</Typography>
                              <Typography variant="body2">{scan.progress}%</Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={scan.progress}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="body2" color="text.secondary">
                            Started: {scan.startTime}
                          </Typography>
                          {scan.endTime && (
                            <Typography variant="body2" color="text.secondary">
                              Duration: {scan.duration}
                            </Typography>
                          )}
                        </Box>

                        {scan.findings > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              Findings: {scan.findings} issues detected
                            </Typography>
                            <Stack direction="row" spacing={1}>
                              {scan.severity.critical > 0 && (
                                <Chip
                                  label={`${scan.severity.critical} Critical`}
                                  size="small"
                                  sx={{ bgcolor: getSeverityColor('critical'), color: 'white' }}
                                />
                              )}
                              {scan.severity.high > 0 && (
                                <Chip
                                  label={`${scan.severity.high} High`}
                                  size="small"
                                  sx={{ bgcolor: getSeverityColor('high'), color: 'white' }}
                                />
                              )}
                              {scan.severity.medium > 0 && (
                                <Chip
                                  label={`${scan.severity.medium} Medium`}
                                  size="small"
                                  sx={{ bgcolor: getSeverityColor('medium'), color: 'white' }}
                                />
                              )}
                              {scan.severity.low > 0 && (
                                <Chip
                                  label={`${scan.severity.low} Low`}
                                  size="small"
                                  sx={{ bgcolor: getSeverityColor('low'), color: 'white' }}
                                />
                              )}
                            </Stack>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </TabPanel>
      </Paper>

      {/* New Scan Dialog */}
      <Dialog
        open={newScanDialog}
        onClose={() => setNewScanDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Neuer Security-Scan erstellen</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Scan Name"
              value={newScan.name}
              onChange={(e) => setNewScan({ ...newScan, name: e.target.value })}
              placeholder="z.B. Network Security Assessment"
              required
            />

            <FormControl fullWidth>
              <InputLabel>Scan Type</InputLabel>
              <Select
                value={newScan.type}
                onChange={(e) => setNewScan({ ...newScan, type: e.target.value })}
              >
                <MenuItem value="network-scan">Network Scan</MenuItem>
                <MenuItem value="web-scan">Web Application Scan</MenuItem>
                <MenuItem value="api-scan">API Security Test</MenuItem>
                <MenuItem value="database-scan">Database Security Check</MenuItem>
                <MenuItem value="vulnerability-scan">Vulnerability Assessment</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Target"
              value={newScan.target}
              onChange={(e) => setNewScan({ ...newScan, target: e.target.value })}
              placeholder="z.B. 192.168.1.0/24 oder https://example.com"
              required
            />

            <FormControl fullWidth>
              <InputLabel>Tool (Optional)</InputLabel>
              <Select
                value={newScan.tool}
                onChange={(e) => setNewScan({ ...newScan, tool: e.target.value })}
              >
                <MenuItem value="">Auto-Select Best Tool</MenuItem>
                <MenuItem value="nmap">Nmap</MenuItem>
                <MenuItem value="nuclei">Nuclei</MenuItem>
                <MenuItem value="burp-suite">Burp Suite</MenuItem>
                <MenuItem value="sqlmap">SQLMap</MenuItem>
                <MenuItem value="nikto">Nikto</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>MCP Server (Optional)</InputLabel>
              <Select
                value={newScan.server}
                onChange={(e) => setNewScan({ ...newScan, server: e.target.value })}
              >
                <MenuItem value="">Auto-Assign</MenuItem>
                <MenuItem value="hexstrike">HexStrike AI</MenuItem>
                <MenuItem value="mcp-god-mode">MCP-God-Mode</MenuItem>
                <MenuItem value="attackmcp">AttackMCP</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Schedule</InputLabel>
              <Select
                value={newScan.schedule}
                onChange={(e) => setNewScan({ ...newScan, schedule: e.target.value })}
              >
                <MenuItem value="immediate">Start Immediately</MenuItem>
                <MenuItem value="1hour">Start in 1 Hour</MenuItem>
                <MenuItem value="tomorrow">Start Tomorrow</MenuItem>
                <MenuItem value="custom">Custom Schedule</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewScanDialog(false)}>Abbrechen</Button>
          <Button variant="contained" onClick={handleCreateScan}>
            Scan erstellen
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Scan Details Dialog */}
      <Dialog
        open={viewScanDialog.open}
        onClose={() => setViewScanDialog({ open: false })}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Scan Details: {viewScanDialog.scan?.name}
        </DialogTitle>
        <DialogContent>
          {viewScanDialog.scan && (
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Type:</Typography>
                  <Typography variant="body1">{viewScanDialog.scan.type}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Target:</Typography>
                  <Typography variant="body1">{viewScanDialog.scan.target}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Tool:</Typography>
                  <Typography variant="body1">{viewScanDialog.scan.tool}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Server:</Typography>
                  <Typography variant="body1">{viewScanDialog.scan.server}</Typography>
                </Grid>
              </Grid>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom>Scan Logs</Typography>
                <Paper sx={{ p: 2, maxHeight: 200, overflow: 'auto', bgcolor: 'grey.50' }}>
                  {viewScanDialog.scan.logs?.map((log, index) => (
                    <Typography key={index} variant="body2" sx={{ fontFamily: 'monospace', mb: 0.5 }}>
                      [{new Date(Date.now() - (viewScanDialog.scan!.logs!.length - index) * 60000).toLocaleTimeString()}] {log}
                    </Typography>
                  )) || <Typography variant="body2" color="text.secondary">No logs available</Typography>}
                </Paper>
              </Box>

              {viewScanDialog.scan.findings > 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Security Findings</Typography>
                  <Grid container spacing={2}>
                    {Object.entries(viewScanDialog.scan.severity).map(([severity, count]) => (
                      count > 0 && (
                        <Grid item xs={3} key={severity}>
                          <Paper sx={{ p: 2, textAlign: 'center', bgcolor: getSeverityColor(severity), color: 'white' }}>
                            <Typography variant="h5" sx={{ fontWeight: 600 }}>
                              {count}
                            </Typography>
                            <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                              {severity}
                            </Typography>
                          </Paper>
                        </Grid>
                      )
                    ))}
                  </Grid>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewScanDialog({ open: false })}>Schließen</Button>
          {viewScanDialog.scan?.status === 'completed' && (
            <Button variant="contained" startIcon={<DownloadIcon />}>
              Report herunterladen
            </Button>
          )}
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

export default Scans