/**
 * 📊 ADVANCED ANALYTICS DASHBOARD
 * Enterprise-Grade Security Intelligence & Metrics Visualization
 * Real-time Performance Monitoring, Threat Intelligence, Compliance Reporting
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Alert,
  LinearProgress,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Divider
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Speed as SpeedIcon,
  Shield as ShieldIcon,
  Assessment as AssessmentIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  BugReport as BugReportIcon,
  Visibility as VisibilityIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'
import analyticsEngine, {
  AnalyticsDashboard as DashboardData,
  SecurityMetrics,
  ThreatIntelligence,
  PerformanceMetrics,
  SecurityPosture
} from '../../services/analyticsEngine'

interface AnalyticsDashboardProps {
  refreshInterval?: number
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  refreshInterval = 30000
}) => {
  // State Management
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedThreat, setSelectedThreat] = useState<ThreatIntelligence | null>(null)
  const [threatDialogOpen, setThreatDialogOpen] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview')

  /**
   * Load dashboard data
   */
  const loadDashboardData = useCallback(async () => {
    try {
      const data = await analyticsEngine.getAnalyticsDashboard()
      setDashboardData(data)
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Auto-refresh dashboard
   */
  useEffect(() => {
    loadDashboardData()

    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [loadDashboardData, autoRefresh, refreshInterval])

  /**
   * Handle threat intelligence click
   */
  const handleThreatClick = (threat: ThreatIntelligence) => {
    setSelectedThreat(threat)
    setThreatDialogOpen(true)
  }

  /**
   * Handle alert acknowledgment
   */
  const handleAcknowledgeAlert = (alertId: string) => {
    analyticsEngine.acknowledgeAlert(alertId)
    loadDashboardData()
  }

  /**
   * Get health status color
   */
  const getHealthColor = (health: string) => {
    const colors = {
      excellent: '#4caf50',
      good: '#8bc34a',
      fair: '#ff9800',
      poor: '#f44336'
    }
    return colors[health as keyof typeof colors] || '#757575'
  }

  /**
   * Get severity color
   */
  const getSeverityColor = (severity: string) => {
    const colors = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#f44336',
      critical: '#9c27b0',
      info: '#2196f3',
      warning: '#ff9800',
      error: '#f44336'
    }
    return colors[severity as keyof typeof colors] || '#757575'
  }

  /**
   * Render executive summary cards
   */
  const renderExecutiveSummary = () => {
    if (!dashboardData) return null

    const { summary } = dashboardData

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {summary.totalTools}
                  </Typography>
                  <Typography variant="body2">Security Tools</Typography>
                </Box>
                <SecurityIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {summary.activeServers}
                  </Typography>
                  <Typography variant="body2">Active Servers</Typography>
                </Box>
                <SpeedIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {summary.dailyExecutions}
                  </Typography>
                  <Typography variant="body2">Daily Executions</Typography>
                </Box>
                <AssessmentIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {summary.securityScore}%
                  </Typography>
                  <Typography variant="body2">Security Score</Typography>
                </Box>
                <ShieldIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {summary.complianceScore}%
                  </Typography>
                  <Typography variant="body2">Compliance</Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ backgroundColor: getHealthColor(summary.overallHealth), color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {summary.overallHealth}
                  </Typography>
                  <Typography variant="body2">Overall Health</Typography>
                </Box>
                <DashboardIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  /**
   * Render real-time metrics
   */
  const renderRealTimeMetrics = () => {
    if (!dashboardData) return null

    const { realTimeMetrics } = dashboardData

    return (
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="Tool Execution Metrics"
              avatar={<AssessmentIcon />}
              action={
                <Chip
                  label="Live"
                  color="success"
                  size="small"
                  icon={<TimelineIcon />}
                />
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Executions</Typography>
                  <Typography variant="h6">{realTimeMetrics.toolExecutions.total}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Success Rate</Typography>
                  <Box display="flex" alignItems="center">
                    <Typography variant="h6" sx={{ mr: 1 }}>
                      {realTimeMetrics.toolExecutions.total > 0
                        ? Math.round((realTimeMetrics.toolExecutions.successful / realTimeMetrics.toolExecutions.total) * 100)
                        : 100}%
                    </Typography>
                    <TrendingUpIcon color="success" fontSize="small" />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Avg. Execution Time</Typography>
                  <Typography variant="h6">
                    {Math.round(realTimeMetrics.toolExecutions.averageExecutionTime)}ms
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Error Rate</Typography>
                  <Typography variant="h6" color={realTimeMetrics.toolExecutions.errorRate < 0.1 ? 'success.main' : 'error.main'}>
                    {(realTimeMetrics.toolExecutions.errorRate * 100).toFixed(1)}%
                  </Typography>
                </Grid>
              </Grid>

              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Execution Distribution
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={realTimeMetrics.toolExecutions.total > 0
                    ? (realTimeMetrics.toolExecutions.successful / realTimeMetrics.toolExecutions.total) * 100
                    : 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader
              title="System Performance"
              avatar={<SpeedIcon />}
              action={
                <Chip
                  label={`${realTimeMetrics.systemPerformance.serverUptime}% Uptime`}
                  color="success"
                  size="small"
                />
              }
            />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">CPU</Typography>
                  <Box display="flex" alignItems="center">
                    <CircularProgress
                      variant="determinate"
                      value={realTimeMetrics.systemPerformance.resourceUtilization.cpu}
                      size={40}
                      thickness={4}
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2">
                      {realTimeMetrics.systemPerformance.resourceUtilization.cpu}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Memory</Typography>
                  <Box display="flex" alignItems="center">
                    <CircularProgress
                      variant="determinate"
                      value={realTimeMetrics.systemPerformance.resourceUtilization.memory}
                      size={40}
                      thickness={4}
                      sx={{ mr: 1 }}
                      color="warning"
                    />
                    <Typography variant="body2">
                      {realTimeMetrics.systemPerformance.resourceUtilization.memory}%
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">Network</Typography>
                  <Box display="flex" alignItems="center">
                    <CircularProgress
                      variant="determinate"
                      value={realTimeMetrics.systemPerformance.resourceUtilization.network}
                      size={40}
                      thickness={4}
                      sx={{ mr: 1 }}
                      color="info"
                    />
                    <Typography variant="body2">
                      {realTimeMetrics.systemPerformance.resourceUtilization.network}%
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Response Time</Typography>
                  <Typography variant="h6">{realTimeMetrics.systemPerformance.responseTime}ms</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Throughput</Typography>
                  <Typography variant="h6">{realTimeMetrics.systemPerformance.throughput} req/min</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    )
  }

  /**
   * Render threat intelligence panel
   */
  const renderThreatIntelligence = () => {
    if (!dashboardData || dashboardData.threatIntelligence.length === 0) {
      return (
        <Card sx={{ mb: 4 }}>
          <CardHeader
            title="Threat Intelligence"
            avatar={<BugReportIcon />}
            action={<Chip label="No Active Threats" color="success" size="small" />}
          />
          <CardContent>
            <Alert severity="success">
              No active threats detected. System security posture is optimal.
            </Alert>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title="Threat Intelligence"
          avatar={<BugReportIcon />}
          action={
            <Badge badgeContent={dashboardData.threatIntelligence.length} color="error">
              <NotificationsIcon />
            </Badge>
          }
        />
        <CardContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Threat</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData.threatIntelligence.slice(0, 5).map((threat) => (
                  <TableRow key={threat.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {threat.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(threat.timestamp).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={threat.severity}
                        size="small"
                        sx={{
                          backgroundColor: getSeverityColor(threat.severity),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>{threat.type.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <LinearProgress
                        variant="determinate"
                        value={threat.confidence * 100}
                        sx={{ width: 60 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={threat.status}
                        size="small"
                        variant="outlined"
                        color={threat.status === 'active' ? 'error' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleThreatClick(threat)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    )
  }

  /**
   * Render active alerts
   */
  const renderActiveAlerts = () => {
    if (!dashboardData || dashboardData.alerts.length === 0) {
      return null
    }

    return (
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title="Active Alerts"
          avatar={<WarningIcon />}
          action={
            <Badge badgeContent={dashboardData.alerts.length} color="warning">
              <NotificationsIcon />
            </Badge>
          }
        />
        <CardContent>
          {dashboardData.alerts.slice(0, 3).map((alert) => (
            <Alert
              key={alert.id}
              severity={alert.severity as any}
              sx={{ mb: 2 }}
              action={
                <Button
                  size="small"
                  onClick={() => handleAcknowledgeAlert(alert.id)}
                >
                  Acknowledge
                </Button>
              }
            >
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {alert.title}
              </Typography>
              <Typography variant="caption" display="block">
                {alert.description}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(alert.timestamp).toLocaleString()}
              </Typography>
            </Alert>
          ))}
        </CardContent>
      </Card>
    )
  }

  /**
   * Render security posture
   */
  const renderSecurityPosture = () => {
    if (!dashboardData) return null

    const { securityPosture } = dashboardData

    return (
      <Card sx={{ mb: 4 }}>
        <CardHeader
          title="Security Posture"
          avatar={<ShieldIcon />}
          action={
            <Chip
              label={`${securityPosture.overallScore}% Secure`}
              color={securityPosture.overallScore >= 80 ? 'success' : 'warning'}
              size="small"
            />
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            {Object.entries(securityPosture.categories).map(([category, score]) => (
              <Grid item xs={12} sm={6} md={4} key={category}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={score}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: score >= 80 ? '#4caf50' : score >= 60 ? '#ff9800' : '#f44336'
                      }
                    }}
                  />
                  <Typography variant="caption">{score}%</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {securityPosture.recommendations.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>Security Recommendations</Typography>
              {securityPosture.recommendations.slice(0, 3).map((rec, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" width="100%">
                      <Chip
                        label={rec.priority}
                        size="small"
                        color={rec.priority === 'high' ? 'error' : rec.priority === 'medium' ? 'warning' : 'default'}
                        sx={{ mr: 2 }}
                      />
                      <Typography variant="body2">{rec.title}</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" paragraph>
                      {rec.description}
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Chip label={`Effort: ${rec.effort}`} size="small" variant="outlined" />
                      <Chip label={`Impact: ${rec.impact}`} size="small" variant="outlined" />
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>
    )
  }

  /**
   * Render threat detail dialog
   */
  const renderThreatDialog = () => (
    <Dialog
      open={threatDialogOpen}
      onClose={() => setThreatDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Threat Intelligence Details</Typography>
          <IconButton onClick={() => setThreatDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {selectedThreat && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>{selectedThreat.title}</Typography>
              <Typography variant="body2" paragraph>{selectedThreat.description}</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Threat Details</Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                <Chip
                  label={`Severity: ${selectedThreat.severity}`}
                  sx={{ backgroundColor: getSeverityColor(selectedThreat.severity), color: 'white' }}
                />
                <Chip label={`Type: ${selectedThreat.type}`} variant="outlined" />
                <Chip label={`Source: ${selectedThreat.source}`} variant="outlined" />
                <Chip label={`Confidence: ${(selectedThreat.confidence * 100).toFixed(0)}%`} variant="outlined" />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Affected Systems</Typography>
              {selectedThreat.affectedSystems.map((system, index) => (
                <Chip key={index} label={system} variant="outlined" sx={{ mr: 1, mb: 1 }} />
              ))}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Indicators</Typography>
              {selectedThreat.indicators.map((indicator, index) => (
                <Typography key={index} variant="body2" component="div" sx={{ fontFamily: 'monospace', mb: 0.5 }}>
                  • {indicator}
                </Typography>
              ))}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Mitigation Steps</Typography>
              {selectedThreat.mitigation.map((step, index) => (
                <Typography key={index} variant="body2" component="div" sx={{ mb: 0.5 }}>
                  {index + 1}. {step}
                </Typography>
              ))}
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setThreatDialogOpen(false)}>Close</Button>
        <Button
          variant="contained"
          onClick={() => {
            if (selectedThreat) {
              analyticsEngine.updateThreatStatus(selectedThreat.id, 'investigating')
              loadDashboardData()
              setThreatDialogOpen(false)
            }
          }}
        >
          Mark as Investigating
        </Button>
      </DialogActions>
    </Dialog>
  )

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Analytics Dashboard...
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Dashboard Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <DashboardIcon sx={{ mr: 2 }} />
          Security Analytics Dashboard
        </Typography>

        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>View Mode</InputLabel>
            <Select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as any)}
              label="View Mode"
            >
              <MenuItem value="overview">Overview</MenuItem>
              <MenuItem value="detailed">Detailed</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={() => analyticsEngine.exportAnalyticsData('pdf')}
          >
            Export
          </Button>

          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={loadDashboardData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Executive Summary */}
      {renderExecutiveSummary()}

      {/* Real-time Metrics */}
      {renderRealTimeMetrics()}

      {/* Active Alerts */}
      {renderActiveAlerts()}

      {/* Threat Intelligence */}
      {renderThreatIntelligence()}

      {/* Security Posture */}
      {renderSecurityPosture()}

      {/* Threat Detail Dialog */}
      {renderThreatDialog()}
    </Box>
  )
}

export default AnalyticsDashboard