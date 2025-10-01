/**
 * Security Policies Management
 * Enterprise-grade security policy configuration and enforcement
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Switch,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Slider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
} from '@mui/material'
import {
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Policy as PolicyIcon,
  Lock as LockIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  VpnKey as AuthIcon,
  AccessTime as SessionIcon,
  NetworkCheck as NetworkIcon,
  Storage as DataIcon,
  Visibility as AuditIcon,
  Block as RestrictIcon,
  Speed as PerformanceIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material'

interface SecurityPolicy {
  id: string
  name: string
  category: 'authentication' | 'authorization' | 'data_protection' | 'network' | 'audit' | 'compliance'
  description: string
  enabled: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  lastModified: string
  modifiedBy: string
  config: Record<string, any>
  complianceStandards: string[]
  affectedResources: string[]
}

interface PolicyTemplate {
  id: string
  name: string
  description: string
  category: string
  defaultConfig: Record<string, any>
  complianceMapping: string[]
}

export const SecurityPolicies: React.FC = () => {
  const [policies, setPolicies] = useState<SecurityPolicy[]>([])
  const [templates, setTemplates] = useState<PolicyTemplate[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState<SecurityPolicy | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [complianceScore, setComplianceScore] = useState(0)

  const [newPolicy, setNewPolicy] = useState({
    name: '',
    category: 'authentication' as const,
    description: '',
    enabled: true,
    severity: 'medium' as const,
    config: {}
  })

  useEffect(() => {
    loadSecurityPolicies()
    loadPolicyTemplates()
  }, [])

  const loadSecurityPolicies = async () => {
    try {
      // Simulate API call - replace with actual backend integration
      const mockPolicies: SecurityPolicy[] = [
        {
          id: 'auth-001',
          name: 'Multi-Factor Authentication',
          category: 'authentication',
          description: 'Enforce MFA for all user accounts with administrative privileges',
          enabled: true,
          severity: 'high',
          lastModified: new Date().toISOString(),
          modifiedBy: 'admin.user',
          config: {
            enforceForRoles: ['admin', 'pentester'],
            mfaMethods: ['totp', 'sms', 'hardware_key'],
            gracePeriod: 7
          },
          complianceStandards: ['SOX', 'GDPR', 'ISO27001'],
          affectedResources: ['user_accounts', 'admin_panel', 'mcp_tools']
        },
        {
          id: 'auth-002',
          name: 'Password Policy',
          category: 'authentication',
          description: 'Enforce strong password requirements and rotation policies',
          enabled: true,
          severity: 'medium',
          lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          modifiedBy: 'security.admin',
          config: {
            minLength: 12,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            maxAge: 90,
            preventReuse: 12
          },
          complianceStandards: ['PCI-DSS', 'HIPAA'],
          affectedResources: ['user_accounts']
        },
        {
          id: 'data-001',
          name: 'Data Encryption at Rest',
          category: 'data_protection',
          description: 'Ensure all sensitive data is encrypted using AES-256',
          enabled: true,
          severity: 'critical',
          lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          modifiedBy: 'system.admin',
          config: {
            algorithm: 'AES-256-GCM',
            keyRotationDays: 365,
            encryptScanResults: true,
            encryptUserData: true,
            encryptAuditLogs: true
          },
          complianceStandards: ['GDPR', 'SOX', 'HIPAA'],
          affectedResources: ['database', 'file_storage', 'audit_logs']
        },
        {
          id: 'net-001',
          name: 'Network Access Control',
          category: 'network',
          description: 'Restrict network access based on IP allowlists and geographic location',
          enabled: false,
          severity: 'high',
          lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          modifiedBy: 'network.admin',
          config: {
            allowedIpRanges: ['192.168.0.0/16', '10.0.0.0/8'],
            blockedCountries: ['CN', 'RU', 'IR'],
            enableGeoBlocking: false,
            allowVpnAccess: true
          },
          complianceStandards: ['SOX'],
          affectedResources: ['api_endpoints', 'admin_panel']
        },
        {
          id: 'audit-001',
          name: 'Comprehensive Audit Logging',
          category: 'audit',
          description: 'Log all security-relevant events for compliance and forensics',
          enabled: true,
          severity: 'high',
          lastModified: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          modifiedBy: 'compliance.officer',
          config: {
            logAuthEvents: true,
            logDataAccess: true,
            logAdminActions: true,
            logScanActivities: true,
            retentionDays: 2555, // 7 years
            enableRealTimeMonitoring: true
          },
          complianceStandards: ['SOX', 'GDPR', 'PCI-DSS', 'HIPAA'],
          affectedResources: ['all_systems']
        }
      ]

      setPolicies(mockPolicies)

      // Calculate compliance score
      const enabledPolicies = mockPolicies.filter(p => p.enabled)
      const score = (enabledPolicies.length / mockPolicies.length) * 100
      setComplianceScore(score)

    } catch (error) {
      console.error('Failed to load security policies:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPolicyTemplates = async () => {
    try {
      const mockTemplates: PolicyTemplate[] = [
        {
          id: 'template-mfa',
          name: 'Multi-Factor Authentication',
          description: 'Standard MFA policy for enterprise environments',
          category: 'authentication',
          defaultConfig: {
            enforceForRoles: ['admin'],
            mfaMethods: ['totp'],
            gracePeriod: 30
          },
          complianceMapping: ['SOX', 'GDPR']
        },
        {
          id: 'template-encryption',
          name: 'Data Encryption Policy',
          description: 'Comprehensive data encryption requirements',
          category: 'data_protection',
          defaultConfig: {
            algorithm: 'AES-256-GCM',
            keyRotationDays: 365,
            encryptScanResults: true
          },
          complianceMapping: ['GDPR', 'HIPAA']
        }
      ]

      setTemplates(mockTemplates)
    } catch (error) {
      console.error('Failed to load policy templates:', error)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <AuthIcon />
      case 'authorization': return <ShieldIcon />
      case 'data_protection': return <DataIcon />
      case 'network': return <NetworkIcon />
      case 'audit': return <AuditIcon />
      case 'compliance': return <PolicyIcon />
      default: return <SecurityIcon />
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

  const handleTogglePolicy = async (policyId: string, enabled: boolean) => {
    try {
      // Simulate API call
      setPolicies(prev => prev.map(p =>
        p.id === policyId ? { ...p, enabled, lastModified: new Date().toISOString() } : p
      ))

      // Recalculate compliance score
      const updatedPolicies = policies.map(p =>
        p.id === policyId ? { ...p, enabled } : p
      )
      const enabledCount = updatedPolicies.filter(p => p.enabled).length
      setComplianceScore((enabledCount / updatedPolicies.length) * 100)

      console.log(`✅ Policy ${policyId} ${enabled ? 'enabled' : 'disabled'}`)
    } catch (error) {
      console.error('Failed to toggle policy:', error)
    }
  }

  const handleCreatePolicy = async () => {
    try {
      const policy: SecurityPolicy = {
        id: `custom-${Date.now()}`,
        ...newPolicy,
        lastModified: new Date().toISOString(),
        modifiedBy: 'current.user',
        config: {},
        complianceStandards: [],
        affectedResources: []
      }

      setPolicies(prev => [...prev, policy])
      setCreateDialogOpen(false)

      // Reset form
      setNewPolicy({
        name: '',
        category: 'authentication',
        description: '',
        enabled: true,
        severity: 'medium',
        config: {}
      })

      console.log('✅ Security policy created:', policy.name)
    } catch (error) {
      console.error('Failed to create policy:', error)
    }
  }

  const renderPolicyCard = (policy: SecurityPolicy) => (
    <Card key={policy.id} elevation={2}>
      <CardHeader
        avatar={getCategoryIcon(policy.category)}
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">{policy.name}</Typography>
            <Chip
              label={policy.severity.toUpperCase()}
              size="small"
              color={getSeverityColor(policy.severity)}
            />
          </Box>
        }
        subheader={policy.description}
        action={
          <FormControlLabel
            control={
              <Switch
                checked={policy.enabled}
                onChange={(e) => handleTogglePolicy(policy.id, e.target.checked)}
                color="primary"
              />
            }
            label={policy.enabled ? 'Enabled' : 'Disabled'}
          />
        }
      />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Category</Typography>
            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
              {policy.category.replace('_', ' ')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Last Modified</Typography>
            <Typography variant="body2">
              {new Date(policy.lastModified).toLocaleDateString()}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Compliance Standards</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
              {policy.complianceStandards.map((standard) => (
                <Chip key={standard} label={standard} size="small" variant="outlined" />
              ))}
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">Affected Resources</Typography>
            <Typography variant="body2">
              {policy.affectedResources.join(', ')}
            </Typography>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => {
              setSelectedPolicy(policy)
              setEditDialogOpen(true)
            }}
          >
            Configure
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </Box>
      </CardContent>
    </Card>
  )

  const renderCreatePolicyDialog = () => (
    <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Create Security Policy</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              label="Policy Name"
              fullWidth
              value={newPolicy.name}
              onChange={(e) => setNewPolicy(prev => ({ ...prev, name: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={newPolicy.category}
                onChange={(e) => setNewPolicy(prev => ({ ...prev, category: e.target.value as any }))}
              >
                <MenuItem value="authentication">Authentication</MenuItem>
                <MenuItem value="authorization">Authorization</MenuItem>
                <MenuItem value="data_protection">Data Protection</MenuItem>
                <MenuItem value="network">Network Security</MenuItem>
                <MenuItem value="audit">Audit & Logging</MenuItem>
                <MenuItem value="compliance">Compliance</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={newPolicy.severity}
                onChange={(e) => setNewPolicy(prev => ({ ...prev, severity: e.target.value as any }))}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={newPolicy.description}
              onChange={(e) => setNewPolicy(prev => ({ ...prev, description: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={newPolicy.enabled}
                  onChange={(e) => setNewPolicy(prev => ({ ...prev, enabled: e.target.checked }))}
                />
              }
              label="Enable policy immediately"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleCreatePolicy}>Create Policy</Button>
      </DialogActions>
    </Dialog>
  )

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PolicyIcon />
          Security Policies & Compliance
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Policy
        </Button>
      </Box>

      {/* Compliance Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Compliance Overview" />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Overall Compliance Score</Typography>
                  <Typography variant="body2">{Math.round(complianceScore)}%</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={complianceScore}
                  color={complianceScore > 80 ? 'success' : complianceScore > 60 ? 'warning' : 'error'}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <Typography variant="h4" color="success.main">
                    {policies.filter(p => p.enabled).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Enabled Policies</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h4" color="warning.main">
                    {policies.filter(p => p.severity === 'critical').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Critical Policies</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="h4" color="info.main">
                    {new Set(policies.flatMap(p => p.complianceStandards)).size}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Standards Covered</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Quick Actions" />
            <CardContent>
              <Stack spacing={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ShieldIcon />}
                  onClick={() => {/* Enable all critical policies */}}
                >
                  Enable All Critical
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AuditIcon />}
                  onClick={() => {/* Run compliance audit */}}
                >
                  Run Compliance Audit
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PolicyIcon />}
                  onClick={() => {/* Export policies */}}
                >
                  Export Policies
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Policy Categories */}
      <Grid container spacing={3}>
        {Object.entries(
          policies.reduce((acc, policy) => {
            if (!acc[policy.category]) acc[policy.category] = []
            acc[policy.category].push(policy)
            return acc
          }, {} as Record<string, SecurityPolicy[]>)
        ).map(([category, categoryPolicies]) => (
          <Grid item xs={12} key={category}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {getCategoryIcon(category)}
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {category.replace('_', ' ')} ({categoryPolicies.length})
                  </Typography>
                  <Chip
                    label={`${categoryPolicies.filter(p => p.enabled).length} enabled`}
                    size="small"
                    color="primary"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {categoryPolicies.map(policy => (
                    <Grid item xs={12} md={6} lg={4} key={policy.id}>
                      {renderPolicyCard(policy)}
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        ))}
      </Grid>

      {renderCreatePolicyDialog()}
    </Box>
  )
}

export default SecurityPolicies