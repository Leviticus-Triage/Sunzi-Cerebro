/**
 * System Health Card Component
 * Displays real-time MCP system health metrics
 */

import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  LinearProgress,
  Avatar,
  Grid
} from '@mui/material'
import {
  CheckCircle as HealthyIcon,
  Warning as DegradedIcon,
  Error as CriticalIcon,
  Speed as SpeedIcon,
  Extension as ToolIcon,
  Hub as ConnectivityIcon
} from '@mui/icons-material'
import type { DashboardMcpData } from '../../hooks/useMcpData'

interface SystemHealthCardProps {
  mcpData: DashboardMcpData
  lastUpdate?: Date | null
}

const SystemHealthCard: React.FC<SystemHealthCardProps> = ({ mcpData, lastUpdate }) => {
  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <HealthyIcon sx={{ color: 'success.main' }} />
      case 'degraded':
        return <DegradedIcon sx={{ color: 'warning.main' }} />
      case 'critical':
        return <CriticalIcon sx={{ color: 'error.main' }} />
      default:
        return <CriticalIcon sx={{ color: 'grey.500' }} />
    }
  }

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'success'
      case 'degraded':
        return 'warning'
      case 'critical':
        return 'error'
      default:
        return 'default'
    }
  }

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never'

    const now = new Date()
    const diff = now.getTime() - lastUpdate.getTime()
    const seconds = Math.floor(diff / 1000)

    if (seconds < 30) return 'Just now'
    if (seconds < 60) return `${seconds}s ago`

    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`

    return lastUpdate.toLocaleTimeString()
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={3}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" component="h3">
              System Health
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              {getHealthIcon(mcpData.systemHealth.overallStatus)}
              <Chip
                label={mcpData.systemHealth.overallStatus.toUpperCase()}
                color={getHealthColor(mcpData.systemHealth.overallStatus) as any}
                size="small"
              />
            </Box>
          </Box>

          {/* Key Metrics */}
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Box textAlign="center">
                <Avatar sx={{ bgcolor: 'primary.main', margin: '0 auto', mb: 1 }}>
                  <ConnectivityIcon />
                </Avatar>
                <Typography variant="h4" color="primary.main">
                  {mcpData.activeServers}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Servers
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={4}>
              <Box textAlign="center">
                <Avatar sx={{ bgcolor: 'secondary.main', margin: '0 auto', mb: 1 }}>
                  <ToolIcon />
                </Avatar>
                <Typography variant="h4" color="secondary.main">
                  {mcpData.totalTools}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Tools
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={4}>
              <Box textAlign="center">
                <Avatar sx={{ bgcolor: 'info.main', margin: '0 auto', mb: 1 }}>
                  <SpeedIcon />
                </Avatar>
                <Typography variant="h4" color="info.main">
                  {mcpData.systemHealth.averageResponseTime}ms
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Avg Response
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Health Metrics */}
          <Stack spacing={2}>
            <Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">MCP Connectivity</Typography>
                <Typography variant="body2" color="text.secondary">
                  {mcpData.systemHealth.mcpConnectivity}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={mcpData.systemHealth.mcpConnectivity}
                sx={{ height: 8, borderRadius: 4 }}
                color={mcpData.systemHealth.mcpConnectivity > 80 ? 'success' :
                       mcpData.systemHealth.mcpConnectivity > 50 ? 'warning' : 'error'}
              />
            </Box>

            <Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Tool Availability</Typography>
                <Typography variant="body2" color="text.secondary">
                  {mcpData.systemHealth.toolAvailability}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={mcpData.systemHealth.toolAvailability}
                sx={{ height: 8, borderRadius: 4 }}
                color="success"
              />
            </Box>
          </Stack>

          {/* Last Update */}
          <Typography variant="caption" color="text.secondary" textAlign="center">
            Last updated: {formatLastUpdate()}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default SystemHealthCard