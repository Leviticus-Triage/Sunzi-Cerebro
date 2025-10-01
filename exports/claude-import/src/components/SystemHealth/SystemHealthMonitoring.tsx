/**
 * System Health Monitoring UI Components
 * Real-time system health monitoring and alerting interface
 * Part of Sunzi Cerebro Enterprise Security Platform
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  LinearProgress,
  Alert,
  Avatar,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  CircularProgress,
  Badge,
} from '@mui/material'
import {
  Computer as SystemIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Speed as CpuIcon,
  NetworkCheck as NetworkIcon,
  Database as DatabaseIcon,
  Security as SecurityIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as SuccessIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Timeline as MetricsIcon,
  NotificationsActive as AlertIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material'

// Types for System Health Monitoring
interface SystemMetrics {
  cpu: {
    usage: number
    cores: number
    temperature?: number
    processes: number
  }
  memory: {
    used: number
    total: number
    available: number
    usage: number
  }
  storage: {
    used: number
    total: number
    available: number
    usage: number
  }
  network: {
    bytesIn: number
    bytesOut: number
    packetsIn: number
    packetsOut: number
    latency: number
    status: 'connected' | 'disconnected' | 'limited'
  }
  database: {
    connections: number
    queries: number
    avgResponseTime: number
    errors: number
    uptime: number
    status: 'healthy' | 'warning' | 'error'
  }
  services: {
    running: number
    stopped: number
    failed: number
    total: number
  }
}

interface SystemAlert {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: string
  component: string
  resolved: boolean
}

// Mock data for development
const mockMetrics: SystemMetrics = {
  cpu: {
    usage: 72.4,
    cores: 12,
    temperature: 58,
    processes: 127
  },
  memory: {
    used: 11584905216,
    total: 15534419968,
    available: 3949514752,
    usage: 74.6
  },
  storage: {
    used: 52428800000,
    total: 128000000000,
    available: 75571200000,
    usage: 41.0
  },
  network: {
    bytesIn: 1024000000,
    bytesOut: 512000000,
    packetsIn: 875432,
    packetsOut: 432187,
    latency: 15,
    status: 'connected'
  },
  database: {
    connections: 12,
    queries: 1543,
    avgResponseTime: 8,
    errors: 0,
    uptime: 99.7,
    status: 'healthy'
  },
  services: {
    running: 8,
    stopped: 2,
    failed: 0,
    total: 10
  }
}

const mockAlerts: SystemAlert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'High CPU Usage',
    message: 'CPU usage has been above 70% for the last 15 minutes',
    timestamp: '2025-09-26T09:45:00Z',
    component: 'System',
    resolved: false
  },
  {
    id: '2',
    type: 'info',
    title: 'Database Query Performance',
    message: 'Average query response time improved to 8ms',
    timestamp: '2025-09-26T09:30:00Z',
    component: 'Database',
    resolved: true
  },
  {
    id: '3',
    type: 'success',
    title: 'System Backup Completed',
    message: 'Daily system backup completed successfully',
    timestamp: '2025-09-26T06:00:00Z',
    component: 'Storage',
    resolved: true
  }
]

// Metric Card Component
interface MetricCardProps {
  title: string
  value: number
  unit: string
  icon: React.ReactElement
  color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'
  trend?: 'up' | 'down' | 'stable'
  threshold?: { warning: number; critical: number }
  details?: Record<string, any>
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  color,
  trend,
  threshold,
  details
}) => {
  const [showDetails, setShowDetails] = useState(false)

  const getStatusColor = () => {
    if (threshold) {
      if (value >= threshold.critical) return 'error'
      if (value >= threshold.warning) return 'warning'
      return 'success'
    }
    return color
  }

  const statusColor = getStatusColor()

  return (
    <>
      <Card
        elevation={2}
        sx={{
          height: '100%',
          cursor: details ? 'pointer' : 'default',
          border: statusColor === 'error' ? '2px solid' : '1px solid',
          borderColor: statusColor === 'error' ? 'error.main' : 'divider',
          transition: 'all 0.3s ease',
          '&:hover': details ? {
            elevation: 4,
            transform: 'translateY(-2px)'
          } : {}
        }}
        onClick={() => details && setShowDetails(true)}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: `${statusColor}.main`, mr: 2 }}>
              {icon}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: `${statusColor}.main` }}>
                  {typeof value === 'number' ? value.toFixed(1) : value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {unit}
                </Typography>
                {trend && (
                  <Box sx={{ ml: 1 }}>
                    {trend === 'up' ? (
                      <TrendingUpIcon color="success" fontSize="small" />
                    ) : trend === 'down' ? (
                      <TrendingDownIcon color="error" fontSize="small" />
                    ) : null}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {threshold && (
            <Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, (value / threshold.critical) * 100)}
                color={statusColor as any}
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                Threshold: {threshold.warning}% warning, {threshold.critical}% critical
              </Typography>
            </Box>
          )}

          {statusColor === 'error' && (
            <Alert severity="error" sx={{ mt: 2 }}>
              Critical threshold exceeded!
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      {details && (
        <Dialog
          open={showDetails}
          onClose={() => setShowDetails(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: `${statusColor}.main` }}>
                {icon}
              </Avatar>
              <Box>
                <Typography variant="h6">{title} Details</Typography>
                <Typography variant="body2" color="text.secondary">
                  Current: {value.toFixed(1)}{unit}
                </Typography>
              </Box>
            </Box>
          </DialogTitle>

          <DialogContent>
            <List>
              {Object.entries(details).map(([key, val]) => (
                <ListItem key={key}>
                  <ListItemText
                    primary={key.charAt(0).toUpperCase() + key.slice(1)}
                    secondary={typeof val === 'number' ? val.toLocaleString() : val}
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>

          <DialogActions>
            <Button onClick={() => setShowDetails(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  )
}

// System Alerts Component
interface SystemAlertsProps {
  alerts: SystemAlert[]
  onResolve?: (alertId: string) => void
  onDismiss?: (alertId: string) => void
}

const SystemAlerts: React.FC<SystemAlertsProps> = ({
  alerts,
  onResolve,
  onDismiss
}) => {
  const [showResolved, setShowResolved] = useState(false)

  const unresolvedAlerts = alerts.filter(alert => !alert.resolved)
  const resolvedAlerts = alerts.filter(alert => alert.resolved)

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <ErrorIcon />
      case 'warning': return <WarningIcon />
      case 'success': return <SuccessIcon />
      default: return <InfoIcon />
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          System Alerts
          {unresolvedAlerts.length > 0 && (
            <Badge badgeContent={unresolvedAlerts.length} color="error" sx={{ ml: 1 }} />
          )}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
            />
          }
          label="Show resolved"
        />
      </Box>

      {unresolvedAlerts.length === 0 && !showResolved && (
        <Alert severity="success">
          <Typography>No active alerts. System is running normally.</Typography>
        </Alert>
      )}

      <List>
        {/* Unresolved Alerts */}
        {unresolvedAlerts.map((alert) => (
          <ListItem
            key={alert.id}
            sx={{
              border: '1px solid',
              borderColor: `${alert.type}.light`,
              borderRadius: 2,
              mb: 1,
              bgcolor: `${alert.type}.light`,
              opacity: 0.9,
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: `${alert.type}.main`, color: 'white' }}>
                {getAlertIcon(alert.type)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {alert.title}
                  </Typography>
                  <Chip
                    label={alert.component}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {alert.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(alert.timestamp).toLocaleString()}
                  </Typography>
                </Box>
              }
            />
            <ListItemSecondaryAction>
              <Button
                size="small"
                variant="outlined"
                onClick={() => onResolve?.(alert.id)}
                sx={{ mr: 1 }}
              >
                Resolve
              </Button>
              <IconButton
                size="small"
                onClick={() => onDismiss?.(alert.id)}
              >
                <ErrorIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}

        {/* Resolved Alerts */}
        {showResolved && (
          <>
            {unresolvedAlerts.length > 0 && <Divider sx={{ my: 2 }} />}
            {resolvedAlerts.map((alert) => (
              <ListItem
                key={alert.id}
                sx={{
                  opacity: 0.6,
                  borderRadius: 2,
                  mb: 1,
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <SuccessIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle2">
                        {alert.title}
                      </Typography>
                      <Chip
                        label="Resolved"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2">
                      {alert.message}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </>
        )}
      </List>
    </Paper>
  )
}

// Main System Health Monitoring Component
interface SystemHealthMonitoringProps {
  onRefresh?: () => void
  autoRefresh?: boolean
  refreshInterval?: number
}

const SystemHealthMonitoring: React.FC<SystemHealthMonitoringProps> = ({
  onRefresh,
  autoRefresh = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [metrics, setMetrics] = useState<SystemMetrics>(mockMetrics)
  const [alerts, setAlerts] = useState<SystemAlert[]>(mockAlerts)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Simulate real-time updates
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      // Simulate metric updates
      setMetrics(prev => ({
        ...prev,
        cpu: {
          ...prev.cpu,
          usage: Math.max(0, Math.min(100, prev.cpu.usage + (Math.random() - 0.5) * 10))
        },
        memory: {
          ...prev.memory,
          usage: Math.max(0, Math.min(100, prev.memory.usage + (Math.random() - 0.5) * 5))
        },
        network: {
          ...prev.network,
          latency: Math.max(1, prev.network.latency + (Math.random() - 0.5) * 5)
        }
      }))
      setLastUpdate(new Date())
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  const handleRefresh = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      setLastUpdate(new Date())
      onRefresh?.()
    }, 1000)
  }

  const handleResolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, resolved: true } : alert
    ))
  }

  const handleDismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            System Health Monitoring
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time system performance and health metrics
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
          <Button
            variant="outlined"
            startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
            onClick={handleRefresh}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard
            title="CPU Usage"
            value={metrics.cpu.usage}
            unit="%"
            icon={<CpuIcon />}
            color="primary"
            threshold={{ warning: 70, critical: 90 }}
            details={{
              cores: metrics.cpu.cores,
              processes: metrics.cpu.processes,
              temperature: metrics.cpu.temperature ? `${metrics.cpu.temperature}°C` : 'N/A'
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard
            title="Memory Usage"
            value={metrics.memory.usage}
            unit="%"
            icon={<MemoryIcon />}
            color="secondary"
            threshold={{ warning: 80, critical: 95 }}
            details={{
              used: formatBytes(metrics.memory.used),
              total: formatBytes(metrics.memory.total),
              available: formatBytes(metrics.memory.available)
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard
            title="Storage Usage"
            value={metrics.storage.usage}
            unit="%"
            icon={<StorageIcon />}
            color="info"
            threshold={{ warning: 85, critical: 95 }}
            details={{
              used: formatBytes(metrics.storage.used),
              total: formatBytes(metrics.storage.total),
              available: formatBytes(metrics.storage.available)
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard
            title="Network Latency"
            value={metrics.network.latency}
            unit="ms"
            icon={<NetworkIcon />}
            color="success"
            threshold={{ warning: 50, critical: 200 }}
            details={{
              status: metrics.network.status,
              bytesIn: formatBytes(metrics.network.bytesIn),
              bytesOut: formatBytes(metrics.network.bytesOut),
              packetsIn: metrics.network.packetsIn.toLocaleString(),
              packetsOut: metrics.network.packetsOut.toLocaleString()
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard
            title="Database Response"
            value={metrics.database.avgResponseTime}
            unit="ms"
            icon={<DatabaseIcon />}
            color="warning"
            threshold={{ warning: 20, critical: 100 }}
            details={{
              connections: metrics.database.connections,
              queries: metrics.database.queries,
              errors: metrics.database.errors,
              uptime: `${metrics.database.uptime}%`,
              status: metrics.database.status
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={4} lg={2}>
          <MetricCard
            title="Services Running"
            value={(metrics.services.running / metrics.services.total) * 100}
            unit="%"
            icon={<SecurityIcon />}
            color="success"
            threshold={{ warning: 80, critical: 60 }}
            details={{
              running: metrics.services.running,
              stopped: metrics.services.stopped,
              failed: metrics.services.failed,
              total: metrics.services.total
            }}
          />
        </Grid>
      </Grid>

      {/* Alerts Section */}
      <SystemAlerts
        alerts={alerts}
        onResolve={handleResolveAlert}
        onDismiss={handleDismissAlert}
      />
    </Box>
  )
}

export default SystemHealthMonitoring