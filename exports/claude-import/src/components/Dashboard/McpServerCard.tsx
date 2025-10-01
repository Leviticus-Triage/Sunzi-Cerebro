/**
 * MCP Server Status Card Component
 * Displays real-time MCP server information
 */

import React from 'react'
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Stack,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  CheckCircle as ActiveIcon,
  Error as InactiveIcon,
  Warning as DegradedIcon,
  Refresh as RefreshIcon,
  Extension as ToolIcon,
  Visibility as ViewIcon,
  Settings as ConfigIcon
} from '@mui/icons-material'
import type { McpServerStatus } from '../../hooks/useMcpData'

interface McpServerCardProps {
  server: McpServerStatus
  onRefresh?: (serverId: string) => void
  onViewTools?: (serverId: string) => void
  onServerConfig?: (serverId: string) => void
}

const McpServerCard: React.FC<McpServerCardProps> = ({ server, onRefresh, onViewTools, onServerConfig }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <ActiveIcon sx={{ color: 'success.main' }} />
      case 'inactive':
        return <InactiveIcon sx={{ color: 'error.main' }} />
      case 'degraded':
        return <DegradedIcon sx={{ color: 'warning.main' }} />
      default:
        return <InactiveIcon sx={{ color: 'grey.500' }} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success'
      case 'inactive':
        return 'error'
      case 'degraded':
        return 'warning'
      default:
        return 'default'
    }
  }

  const formatLastCheck = (lastCheck: string) => {
    try {
      const date = new Date(lastCheck)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMinutes = Math.floor(diffMs / (1000 * 60))

      if (diffMinutes < 1) return 'Just now'
      if (diffMinutes < 60) return `${diffMinutes}m ago`

      const diffHours = Math.floor(diffMinutes / 60)
      return `${diffHours}h ago`
    } catch {
      return 'Unknown'
    }
  }

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" component="h3" noWrap>
              {server.name}
            </Typography>
            {onRefresh && (
              <Tooltip title="Refresh server status">
                <IconButton
                  size="small"
                  onClick={() => onRefresh(server.id)}
                  sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Status */}
          <Box display="flex" alignItems="center" gap={1}>
            {getStatusIcon(server.status)}
            <Chip
              label={server.status.toUpperCase()}
              color={getStatusColor(server.status) as any}
              size="small"
              variant="outlined"
            />
          </Box>

          {/* Tools Count */}
          <Box display="flex" alignItems="center" gap={1}>
            <ToolIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="body2">
              <strong>{server.toolCount}</strong> tools available
            </Typography>
          </Box>

          {/* Response Time */}
          {server.responseTime && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Response Time: {server.responseTime}ms
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.max(0, Math.min(100, 100 - (server.responseTime / 200) * 100))}
                sx={{ height: 4, borderRadius: 2 }}
              />
            </Box>
          )}

          {/* Action Buttons */}
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            {onViewTools && (
              <Tooltip title="View Tools">
                <IconButton
                  size="small"
                  onClick={() => onViewTools(server.id)}
                  color="primary"
                >
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onServerConfig && (
              <Tooltip title="Configure Server">
                <IconButton
                  size="small"
                  onClick={() => onServerConfig(server.id)}
                  color="secondary"
                >
                  <ConfigIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>

          {/* Last Check */}
          <Typography variant="caption" color="text.secondary">
            Last check: {formatLastCheck(server.lastCheck)}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default McpServerCard