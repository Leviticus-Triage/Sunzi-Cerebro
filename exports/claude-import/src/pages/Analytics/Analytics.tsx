/**
 * 📊 ANALYTICS PAGE
 * Enterprise Security Intelligence & Performance Analytics
 * Comprehensive Metrics Dashboard for Sunzi Cerebro Platform
 */

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Container,
  Breadcrumbs,
  Link,
  Tab,
  Tabs,
  Paper,
  Alert
} from '@mui/material'
import {
  Assessment as AnalyticsIcon,
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon,
  Security as SecurityIcon,
  Speed as PerformanceIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import AnalyticsDashboard from '../../components/Analytics/AnalyticsDashboard'

const Analytics: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true)

  useEffect(() => {
    // Initialize analytics data collection
    console.log('📊 Analytics page loaded - initializing data collection')
  }, [])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return <AnalyticsDashboard />
      case 1:
        return (
          <Box p={3}>
            <Typography variant="h5" gutterBottom>
              Performance Analytics
            </Typography>
            <Alert severity="info">
              Advanced performance analytics and trend analysis coming soon.
              This will include historical performance data, predictive analytics,
              and capacity planning insights.
            </Alert>
          </Box>
        )
      case 2:
        return (
          <Box p={3}>
            <Typography variant="h5" gutterBottom>
              Security Intelligence
            </Typography>
            <Alert severity="info">
              Deep security intelligence analytics including threat correlation,
              attack pattern recognition, and security posture trending will be
              available in this section.
            </Alert>
          </Box>
        )
      case 3:
        return (
          <Box p={3}>
            <Typography variant="h5" gutterBottom>
              Historical Trends
            </Typography>
            <Alert severity="info">
              Historical trend analysis with customizable time ranges,
              comparative analytics, and forecasting capabilities
              will be implemented here.
            </Alert>
          </Box>
        )
      default:
        return <AnalyticsDashboard />
    }
  }

  if (!analyticsEnabled) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Analytics Engine Unavailable
          </Typography>
          <Typography>
            The analytics engine could not be initialized. Please check the system configuration
            and ensure all required services are running.
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
          <AnalyticsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Analytics
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Security Analytics
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Enterprise-grade security intelligence and performance analytics for the Sunzi Cerebro platform
        </Typography>
      </Box>

      {/* Analytics Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<DashboardIcon />}
            label="Executive Dashboard"
            sx={{ textTransform: 'none', fontWeight: 'medium' }}
          />
          <Tab
            icon={<PerformanceIcon />}
            label="Performance Analytics"
            sx={{ textTransform: 'none', fontWeight: 'medium' }}
          />
          <Tab
            icon={<SecurityIcon />}
            label="Security Intelligence"
            sx={{ textTransform: 'none', fontWeight: 'medium' }}
          />
          <Tab
            icon={<TimelineIcon />}
            label="Historical Trends"
            sx={{ textTransform: 'none', fontWeight: 'medium' }}
          />
        </Tabs>

        {/* Tab Content */}
        <Box sx={{ minHeight: 600 }}>
          {renderTabContent()}
        </Box>
      </Paper>

      {/* Footer Information */}
      <Box sx={{ mt: 4, p: 2, backgroundColor: 'grey.50', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Analytics data is collected in real-time and updated every 30 seconds.
          All metrics are retained for 90 days in compliance with enterprise security standards.
        </Typography>
      </Box>
    </Container>
  )
}

export default Analytics