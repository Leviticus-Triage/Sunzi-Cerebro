/**
 * 🏢 ENTERPRISE MANAGEMENT PAGE
 * Multi-Tenant Administration & Enterprise Features
 * Organizational Architecture, User Management, Resource Monitoring
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Container,
  Breadcrumbs,
  Link,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider
} from '@mui/material'
import {
  AdminPanelSettings as AdminIcon,
  Dashboard as DashboardIcon,
  Business as BusinessIcon,
  Security as SecurityIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import EnterpriseAdmin from '../../components/EnterpriseAdmin/EnterpriseAdmin'
import multiTenantManager from '../../services/multiTenantManager'
import { useAuth } from '../../hooks/useAuth'

const Enterprise: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tenantInfo, setTenantInfo] = useState<any>(null)
  const [enterpriseEnabled, setEnterpriseEnabled] = useState(true)

  useEffect(() => {
    // Load current tenant information
    const currentTenant = multiTenantManager.getTenantConfiguration()
    if (currentTenant) {
      setTenantInfo(currentTenant)
    }

    // Check if user has enterprise admin permissions
    if (!user || !['admin', 'owner'].includes(user.role)) {
      setEnterpriseEnabled(false)
    }
  }, [user])

  if (!enterpriseEnabled) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Access Denied - Enterprise Administration
          </Typography>
          <Typography>
            You do not have sufficient permissions to access enterprise administration features.
            Please contact your system administrator if you need access to multi-tenant management.
          </Typography>
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link
          color="inherit"
          href="#"
          onClick={(e) => {
            e.preventDefault()
            navigate('/')
          }}
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <DashboardIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <AdminIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Enterprise
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Enterprise Management
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Multi-tenant administration, organizational architecture, and enterprise-grade features
        </Typography>
      </Box>

      {/* Current Tenant Information */}
      {tenantInfo && (
        <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center">
                <BusinessIcon sx={{ fontSize: 40, color: 'white', mr: 2 }} />
                <Box>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold' }}>
                    {tenantInfo.name}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'white', opacity: 0.9 }}>
                    {tenantInfo.domain} • {tenantInfo.configuration.branding.companyName}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" gap={2}>
                <Chip
                  label={tenantInfo.subscription.tier}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                <Chip
                  label={tenantInfo.subscription.status}
                  sx={{
                    backgroundColor: tenantInfo.subscription.status === 'active'
                      ? 'rgba(76, 175, 80, 0.8)'
                      : 'rgba(255, 152, 0, 0.8)',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2, backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
                  Active Users
                </Typography>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  {tenantInfo.resourceUsage.activeUsers} / {tenantInfo.resourceUsage.maxUsers}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
                  Tool Executions
                </Typography>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  {tenantInfo.resourceUsage.toolExecutions.current} / {tenantInfo.resourceUsage.toolExecutions.limit}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
                  Storage Used
                </Typography>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  {Math.round(tenantInfo.resourceUsage.storage.used / (1024 * 1024))} MB
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2" sx={{ color: 'white', opacity: 0.8 }}>
                  Subscription Valid Until
                </Typography>
                <Typography variant="h6" sx={{ color: 'white' }}>
                  {new Date(tenantInfo.subscription.validUntil).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Enterprise Features Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <BusinessIcon sx={{ fontSize: 32, color: 'primary.main', mr: 2 }} />
                <Typography variant="h6">Multi-Tenant Architecture</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Complete tenant isolation with dedicated resources, custom branding,
                and independent configuration management for enterprise deployment.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <SecurityIcon sx={{ fontSize: 32, color: 'success.main', mr: 2 }} />
                <Typography variant="h6">Enterprise Security</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Advanced RBAC, SSO integration, audit logging, compliance reporting,
                and enterprise-grade security policies with centralized management.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AnalyticsIcon sx={{ fontSize: 32, color: 'warning.main', mr: 2 }} />
                <Typography variant="h6">Advanced Analytics</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Cross-tenant analytics, resource utilization monitoring, performance
                metrics, and enterprise reporting with customizable dashboards.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Enterprise Administration Dashboard */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <EnterpriseAdmin currentUserRole="system_admin" />
        </CardContent>
      </Card>

      {/* Footer Information */}
      <Box sx={{ mt: 4, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Enterprise features include multi-tenant isolation, advanced security controls,
          and comprehensive audit logging. All data is encrypted and compliant with enterprise security standards.
        </Typography>
      </Box>
    </Container>
  )
}

export default Enterprise