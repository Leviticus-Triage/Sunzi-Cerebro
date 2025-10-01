/**
 * 🏢 ENTERPRISE ADMINISTRATION DASHBOARD
 * Multi-Tenant Management & Organizational Architecture
 * Tenant Creation, User Management, Resource Monitoring
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Switch,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  CircularProgress
} from '@mui/material'
import {
  Business as BusinessIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon,
  Storage as StorageIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  ExpandMore as ExpandMoreIcon,
  Domain as DomainIcon,
  AccountTree as OrgIcon,
  AdminPanelSettings as AdminIcon,
  Timeline as TimelineIcon,
  History as HistoryIcon,
  Policy as PolicyIcon
} from '@mui/icons-material'
import multiTenantManager, {
  Tenant,
  Organization,
  TenantUser,
  ResourceQuota
} from '../../services/multiTenantManager'
import AuditLogging from './AuditLogging'
import SecurityPolicies from './SecurityPolicies'

interface EnterpriseAdminProps {
  currentUserRole?: 'system_admin' | 'tenant_admin' | 'org_admin'
}

const EnterpriseAdmin: React.FC<EnterpriseAdminProps> = ({
  currentUserRole = 'system_admin'
}) => {
  // State Management
  const [activeTab, setActiveTab] = useState(0)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [users, setUsers] = useState<TenantUser[]>([])
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  // Dialog States
  const [createTenantOpen, setCreateTenantOpen] = useState(false)
  const [createOrgOpen, setCreateOrgOpen] = useState(false)
  const [createUserOpen, setCreateUserOpen] = useState(false)
  const [tenantDetailsOpen, setTenantDetailsOpen] = useState(false)

  // Form States
  const [newTenant, setNewTenant] = useState({
    name: '',
    domain: '',
    tier: 'professional' as const,
    owner: {
      username: '',
      email: '',
      firstName: '',
      lastName: ''
    },
    branding: {
      companyName: '',
      primaryColor: '#00327c'
    }
  })

  const [newOrganization, setNewOrganization] = useState({
    name: '',
    type: 'department' as const,
    parent: ''
  })

  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'analyst' as const,
    organizationId: ''
  })

  /**
   * Load dashboard data
   */
  const loadData = useCallback(async () => {
    try {
      // Simulate loading tenant data
      const tenantStats = multiTenantManager.getTenantStatistics()
      console.log('📊 Enterprise Admin - Tenant Statistics:', tenantStats)

      // For demo purposes, get current tenant configuration
      const currentTenant = multiTenantManager.getTenantConfiguration()
      if (currentTenant) {
        setTenants([currentTenant])
        setSelectedTenant(currentTenant)

        const tenantOrgs = multiTenantManager.getTenantOrganizations(currentTenant.id)
        setOrganizations(tenantOrgs)

        const tenantUsers = multiTenantManager.getTenantUsers(currentTenant.id)
        setUsers(tenantUsers)
      }
    } catch (error) {
      console.error('❌ Failed to load enterprise admin data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  /**
   * Handle tenant creation
   */
  const handleCreateTenant = async () => {
    try {
      const tenant = await multiTenantManager.createTenant(newTenant)
      setTenants(prev => [...prev, tenant])
      setCreateTenantOpen(false)

      // Reset form
      setNewTenant({
        name: '',
        domain: '',
        tier: 'professional',
        owner: { username: '', email: '', firstName: '', lastName: '' },
        branding: { companyName: '', primaryColor: '#00327c' }
      })

      console.log('✅ Tenant created successfully:', tenant.name)
    } catch (error) {
      console.error('❌ Failed to create tenant:', error)
    }
  }

  /**
   * Handle organization creation
   */
  const handleCreateOrganization = async () => {
    if (!selectedTenant) return

    try {
      const organization = await multiTenantManager.createOrganization(
        selectedTenant.id,
        newOrganization
      )
      setOrganizations(prev => [...prev, organization])
      setCreateOrgOpen(false)

      // Reset form
      setNewOrganization({ name: '', type: 'department', parent: '' })

      console.log('✅ Organization created successfully:', organization.name)
    } catch (error) {
      console.error('❌ Failed to create organization:', error)
    }
  }

  /**
   * Handle user creation
   */
  const handleCreateUser = async () => {
    if (!selectedTenant) return

    try {
      const user = await multiTenantManager.createTenantUser(selectedTenant.id, newUser)
      setUsers(prev => [...prev, user])
      setCreateUserOpen(false)

      // Reset form
      setNewUser({
        username: '', email: '', firstName: '', lastName: '',
        role: 'analyst', organizationId: ''
      })

      console.log('✅ User created successfully:', user.profile.username)
    } catch (error) {
      console.error('❌ Failed to create user:', error)
    }
  }

  /**
   * Get subscription tier color
   */
  const getTierColor = (tier: string) => {
    const colors = {
      starter: '#ff9800',
      professional: '#2196f3',
      enterprise: '#9c27b0'
    }
    return colors[tier as keyof typeof colors] || '#757575'
  }

  /**
   * Get status color
   */
  const getStatusColor = (status: string) => {
    const colors = {
      active: '#4caf50',
      trial: '#ff9800',
      suspended: '#f44336',
      expired: '#757575'
    }
    return colors[status as keyof typeof colors] || '#757575'
  }

  /**
   * Render tenants overview
   */
  const renderTenantsOverview = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Tenant Management</Typography>
        {currentUserRole === 'system_admin' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateTenantOpen(true)}
          >
            Create Tenant
          </Button>
        )}
      </Box>

      <Grid container spacing={3}>
        {tenants.map((tenant) => (
          <Grid item xs={12} md={6} lg={4} key={tenant.id}>
            <Card>
              <CardHeader
                avatar={
                  <Avatar sx={{ bgcolor: getTierColor(tenant.subscription.tier) }}>
                    <BusinessIcon />
                  </Avatar>
                }
                title={tenant.name}
                subheader={tenant.domain}
                action={
                  <Chip
                    label={tenant.subscription.status}
                    size="small"
                    sx={{
                      backgroundColor: getStatusColor(tenant.subscription.status),
                      color: 'white'
                    }}
                  />
                }
              />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Tier</Typography>
                    <Chip
                      label={tenant.subscription.tier}
                      size="small"
                      sx={{ backgroundColor: getTierColor(tenant.subscription.tier), color: 'white' }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Users</Typography>
                    <Typography variant="h6">
                      {tenant.resourceUsage.activeUsers}/{tenant.resourceUsage.maxUsers}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tool Executions
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(tenant.resourceUsage.toolExecutions.current / tenant.resourceUsage.toolExecutions.limit) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption">
                      {tenant.resourceUsage.toolExecutions.current} / {tenant.resourceUsage.toolExecutions.limit}
                    </Typography>
                  </Grid>
                </Grid>

                <Box display="flex" justifyContent="space-between" mt={2}>
                  <Button
                    size="small"
                    startIcon={<VisibilityIcon />}
                    onClick={() => {
                      setSelectedTenant(tenant)
                      setTenantDetailsOpen(true)
                    }}
                  >
                    Details
                  </Button>
                  <Button
                    size="small"
                    startIcon={<SettingsIcon />}
                    onClick={() => multiTenantManager.switchTenant(tenant.id)}
                  >
                    Switch
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )

  /**
   * Render organizations management
   */
  const renderOrganizations = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Organizations</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateOrgOpen(true)}
          disabled={!selectedTenant}
        >
          Create Organization
        </Button>
      </Box>

      {!selectedTenant && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Select a tenant to manage organizations
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Members</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {organizations.map((org) => (
              <TableRow key={org.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <OrgIcon sx={{ mr: 1 }} />
                    {org.name}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={org.type} size="small" variant="outlined" />
                </TableCell>
                <TableCell>{org.members.length}</TableCell>
                <TableCell>
                  {new Date(org.created).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit Organization">
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Organization">
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )

  /**
   * Render users management
   */
  const renderUsers = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">User Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateUserOpen(true)}
          disabled={!selectedTenant}
        >
          Create User
        </Button>
      </Box>

      {!selectedTenant && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Select a tenant to manage users
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Organizations</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Login</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                      {user.profile.firstName.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {user.profile.firstName} {user.profile.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.profile.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  {user.roles.map((role, index) => (
                    <Chip
                      key={index}
                      label={role.role}
                      size="small"
                      sx={{ mr: 0.5 }}
                      color={role.role === 'owner' || role.role === 'admin' ? 'primary' : 'default'}
                    />
                  ))}
                </TableCell>
                <TableCell>{user.organizationIds.length}</TableCell>
                <TableCell>
                  <Chip
                    label={user.status}
                    size="small"
                    color={user.status === 'active' ? 'success' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  {new Date(user.lastLogin).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Tooltip title="Edit User">
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Suspend User">
                    <IconButton size="small" color="warning">
                      <BlockIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )

  /**
   * Render resource monitoring
   */
  const renderResourceMonitoring = () => (
    <Box>
      <Typography variant="h5" gutterBottom>Resource Monitoring</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="System Overview" avatar={<TrendingUpIcon />} />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Total Tenants</Typography>
                  <Typography variant="h4">{tenants.length}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Active Users</Typography>
                  <Typography variant="h4">{users.length}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Organizations</Typography>
                  <Typography variant="h4">{organizations.length}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">System Health</Typography>
                  <Chip label="Optimal" color="success" />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Resource Utilization" avatar={<StorageIcon />} />
            <CardContent>
              {selectedTenant && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Tool Executions
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(selectedTenant.resourceUsage.toolExecutions.current / selectedTenant.resourceUsage.toolExecutions.limit) * 100}
                      sx={{ height: 8, borderRadius: 4, mb: 1 }}
                    />
                    <Typography variant="caption">
                      {selectedTenant.resourceUsage.toolExecutions.current} / {selectedTenant.resourceUsage.toolExecutions.limit} executions
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Storage Usage
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(selectedTenant.resourceUsage.storage.used / selectedTenant.resourceUsage.storage.limit) * 100}
                      sx={{ height: 8, borderRadius: 4, mb: 1 }}
                      color="warning"
                    />
                    <Typography variant="caption">
                      {Math.round(selectedTenant.resourceUsage.storage.used / (1024 * 1024))} MB /
                      {Math.round(selectedTenant.resourceUsage.storage.limit / (1024 * 1024))} MB
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Active Users
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={(selectedTenant.resourceUsage.activeUsers / selectedTenant.resourceUsage.maxUsers) * 100}
                      sx={{ height: 8, borderRadius: 4, mb: 1 }}
                      color="info"
                    />
                    <Typography variant="caption">
                      {selectedTenant.resourceUsage.activeUsers} / {selectedTenant.resourceUsage.maxUsers} users
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )

  /**
   * Render create tenant dialog
   */
  const renderCreateTenantDialog = () => (
    <Dialog open={createTenantOpen} onClose={() => setCreateTenantOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Create New Tenant</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Tenant Name"
              fullWidth
              value={newTenant.name}
              onChange={(e) => setNewTenant(prev => ({ ...prev, name: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Domain"
              fullWidth
              value={newTenant.domain}
              onChange={(e) => setNewTenant(prev => ({ ...prev, domain: e.target.value }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Subscription Tier</InputLabel>
              <Select
                value={newTenant.tier}
                onChange={(e) => setNewTenant(prev => ({ ...prev, tier: e.target.value as any }))}
              >
                <MenuItem value="starter">Starter</MenuItem>
                <MenuItem value="professional">Professional</MenuItem>
                <MenuItem value="enterprise">Enterprise</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Company Name"
              fullWidth
              value={newTenant.branding.companyName}
              onChange={(e) => setNewTenant(prev => ({
                ...prev,
                branding: { ...prev.branding, companyName: e.target.value }
              }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Owner Username"
              fullWidth
              value={newTenant.owner.username}
              onChange={(e) => setNewTenant(prev => ({
                ...prev,
                owner: { ...prev.owner, username: e.target.value }
              }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Owner Email"
              fullWidth
              type="email"
              value={newTenant.owner.email}
              onChange={(e) => setNewTenant(prev => ({
                ...prev,
                owner: { ...prev.owner, email: e.target.value }
              }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="First Name"
              fullWidth
              value={newTenant.owner.firstName}
              onChange={(e) => setNewTenant(prev => ({
                ...prev,
                owner: { ...prev.owner, firstName: e.target.value }
              }))}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Last Name"
              fullWidth
              value={newTenant.owner.lastName}
              onChange={(e) => setNewTenant(prev => ({
                ...prev,
                owner: { ...prev.owner, lastName: e.target.value }
              }))}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setCreateTenantOpen(false)}>Cancel</Button>
        <Button variant="contained" onClick={handleCreateTenant}>Create Tenant</Button>
      </DialogActions>
    </Dialog>
  )

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          Loading Enterprise Administration...
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" sx={{ display: 'flex', alignItems: 'center' }}>
          <AdminIcon sx={{ mr: 2 }} />
          Enterprise Administration
        </Typography>

        {selectedTenant && (
          <Chip
            label={`Current: ${selectedTenant.name}`}
            color="primary"
            variant="outlined"
            avatar={<BusinessIcon />}
          />
        )}
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab icon={<BusinessIcon />} label="Tenants" />
          <Tab icon={<OrgIcon />} label="Organizations" />
          <Tab icon={<PeopleIcon />} label="Users" />
          <Tab icon={<StorageIcon />} label="Resources" />
          <Tab icon={<PolicyIcon />} label="Security Policies" />
          <Tab icon={<HistoryIcon />} label="Audit Logs" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && renderTenantsOverview()}
      {activeTab === 1 && renderOrganizations()}
      {activeTab === 2 && renderUsers()}
      {activeTab === 3 && renderResourceMonitoring()}
      {activeTab === 4 && <SecurityPolicies />}
      {activeTab === 5 && <AuditLogging />}

      {/* Dialogs */}
      {renderCreateTenantDialog()}

      {/* Additional dialogs would be implemented here */}
    </Box>
  )
}

export default EnterpriseAdmin