/**
 * Audit Logging Component
 * Comprehensive audit trail for enterprise compliance and security monitoring
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Stack,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Badge,
  Avatar,
  LinearProgress,
} from '@mui/material'
import {
  History as HistoryIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Success as SuccessIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Filter as FilterIcon,
  Visibility as ViewIcon,
  Timeline as TimelineIcon,
  AdminPanelSettings as AdminIcon,
  Shield as ComplianceIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material'

interface AuditEvent {
  id: string
  timestamp: string
  userId: string
  username: string
  tenantId: string
  action: string
  resource: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'success' | 'failure' | 'warning'
  ipAddress: string
  userAgent: string
  metadata: Record<string, any>
  complianceFlags: string[]
}

interface AuditFilters {
  severity: string[]
  action: string[]
  status: string[]
  dateRange: {
    start: Date | null
    end: Date | null
  }
  userId: string
  tenantId: string
  resource: string
}

export const AuditLogging: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [filters, setFilters] = useState<AuditFilters>({
    severity: [],
    action: [],
    status: [],
    dateRange: { start: null, end: null },
    userId: '',
    tenantId: '',
    resource: ''
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [exportLoading, setExportLoading] = useState(false)

  useEffect(() => {
    loadAuditEvents()
  }, [page, rowsPerPage, filters, searchTerm])

  const loadAuditEvents = async () => {
    setLoading(true)
    try {
      // Simulate API call - replace with actual backend integration
      const mockEvents: AuditEvent[] = Array.from({ length: 100 }, (_, i) => ({
        id: `audit-${Date.now()}-${i}`,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        userId: `user-${Math.floor(Math.random() * 50)}`,
        username: ['admin.user', 'john.doe', 'jane.smith', 'security.analyst'][Math.floor(Math.random() * 4)],
        tenantId: `tenant-${Math.floor(Math.random() * 5)}`,
        action: ['login', 'logout', 'scan_started', 'scan_completed', 'user_created', 'policy_changed', 'data_exported'][Math.floor(Math.random() * 7)],
        resource: ['authentication', 'mcp_tools', 'user_management', 'security_scans', 'system_config'][Math.floor(Math.random() * 5)],
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
        status: ['success', 'failure', 'warning'][Math.floor(Math.random() * 3)] as any,
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        metadata: {
          toolsUsed: Math.floor(Math.random() * 10),
          duration: Math.floor(Math.random() * 300),
          targetCount: Math.floor(Math.random() * 5)
        },
        complianceFlags: Math.random() > 0.8 ? ['SOX', 'GDPR'] : []
      }))

      // Apply filters and search
      let filteredEvents = mockEvents

      if (searchTerm) {
        filteredEvents = filteredEvents.filter(event =>
          event.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.resource.toLowerCase().includes(searchTerm.toLowerCase())
        )
      }

      if (filters.severity.length > 0) {
        filteredEvents = filteredEvents.filter(event => filters.severity.includes(event.severity))
      }

      if (filters.status.length > 0) {
        filteredEvents = filteredEvents.filter(event => filters.status.includes(event.status))
      }

      setEvents(filteredEvents.slice(page * rowsPerPage, (page + 1) * rowsPerPage))
    } catch (error) {
      console.error('Failed to load audit events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error'
      case 'high': return 'warning'
      case 'medium': return 'info'
      case 'low': return 'success'
      default: return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'success'
      case 'failure': return 'error'
      case 'warning': return 'warning'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <SuccessIcon />
      case 'failure': return <ErrorIcon />
      case 'warning': return <WarningIcon />
      default: return <InfoIcon />
    }
  }

  const handleExportEvents = async () => {
    setExportLoading(true)
    try {
      // Simulate export API call
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Create CSV content
      const csvContent = [
        'Timestamp,User,Action,Resource,Severity,Status,IP Address',
        ...events.map(event =>
          `${event.timestamp},${event.username},${event.action},${event.resource},${event.severity},${event.status},${event.ipAddress}`
        )
      ].join('\n')

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      console.log('✅ Audit log exported successfully')
    } catch (error) {
      console.error('❌ Failed to export audit log:', error)
    } finally {
      setExportLoading(false)
    }
  }

  const renderEventDetails = () => (
    <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <HistoryIcon />
          Audit Event Details
        </Box>
      </DialogTitle>
      <DialogContent>
        {selectedEvent && (
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Basic Information" />
                <CardContent>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Event ID</Typography>
                      <Typography variant="body2">{selectedEvent.id}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Timestamp</Typography>
                      <Typography variant="body2">
                        {new Date(selectedEvent.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">User</Typography>
                      <Typography variant="body2">{selectedEvent.username}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Action</Typography>
                      <Typography variant="body2">{selectedEvent.action}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Resource</Typography>
                      <Typography variant="body2">{selectedEvent.resource}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader title="Security Context" />
                <CardContent>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Severity</Typography>
                      <Chip
                        label={selectedEvent.severity.toUpperCase()}
                        color={getSeverityColor(selectedEvent.severity)}
                        size="small"
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                      <Chip
                        label={selectedEvent.status}
                        color={getStatusColor(selectedEvent.status)}
                        size="small"
                        icon={getStatusIcon(selectedEvent.status)}
                      />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">IP Address</Typography>
                      <Typography variant="body2">{selectedEvent.ipAddress}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">User Agent</Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                        {selectedEvent.userAgent}
                      </Typography>
                    </Box>
                    {selectedEvent.complianceFlags.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Compliance Flags</Typography>
                        <Stack direction="row" spacing={1}>
                          {selectedEvent.complianceFlags.map((flag) => (
                            <Chip
                              key={flag}
                              label={flag}
                              size="small"
                              color="warning"
                              icon={<ComplianceIcon />}
                            />
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardHeader title="Event Metadata" />
                <CardContent>
                  <pre style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px', overflow: 'auto' }}>
                    {JSON.stringify(selectedEvent.metadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        <Button variant="contained" startIcon={<DownloadIcon />}>
          Export Event
        </Button>
      </DialogActions>
    </Dialog>
  )

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          Audit Logging & Compliance
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={() => {/* Toggle filters */}}
          >
            Filters
          </Button>
          <Button
            variant="contained"
            startIcon={exportLoading ? <LinearProgress /> : <DownloadIcon />}
            onClick={handleExportEvents}
            disabled={exportLoading}
          >
            {exportLoading ? 'Exporting...' : 'Export Log'}
          </Button>
        </Box>
      </Box>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Severity</InputLabel>
                <Select
                  multiple
                  value={filters.severity}
                  onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value as string[] }))}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {['low', 'medium', 'high', 'critical'].map((severity) => (
                    <MenuItem key={severity} value={severity}>
                      {severity.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  multiple
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as string[] }))}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {['success', 'failure', 'warning'].map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Alert severity="info" sx={{ py: 0.5 }}>
                Real-time audit monitoring active • {events.length} events loaded
              </Alert>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Resource</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Compliance</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <LinearProgress sx={{ my: 2 }} />
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(event.timestamp).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 24, height: 24 }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          <Typography variant="body2">{event.username}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{event.action}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{event.resource}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.severity}
                          size="small"
                          color={getSeverityColor(event.severity)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={event.status}
                          size="small"
                          color={getStatusColor(event.status)}
                          icon={getStatusIcon(event.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {event.complianceFlags.length > 0 ? (
                          <Badge badgeContent={event.complianceFlags.length} color="warning">
                            <ComplianceIcon color="warning" />
                          </Badge>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedEvent(event)
                              setDetailsOpen(true)
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={1000} // Total count would come from API
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        </CardContent>
      </Card>

      {renderEventDetails()}
    </Box>
  )
}

export default AuditLogging