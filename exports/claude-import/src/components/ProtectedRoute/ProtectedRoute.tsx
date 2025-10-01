/**
 * Protected Route Component
 * Handles authentication-based route protection
 * Part of Sunzi Cerebro Enterprise Security Platform
 */

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Box, CircularProgress, Typography, Paper, Fade } from '@mui/material'
import { Security as SecurityIcon } from '@mui/icons-material'
import { useAuth, hasPermission } from '../../hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'pentester' | 'analyst' | 'viewer' | Array<'admin' | 'pentester' | 'analyst' | 'viewer'>
  fallbackPath?: string
}

/**
 * Loading Component for Authentication State
 */
const AuthLoadingScreen: React.FC = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    sx={{
      background: 'linear-gradient(135deg, #f8faff 0%, #e0edfe 100%)',
      flexDirection: 'column',
      gap: 3
    }}
  >
    <Fade in timeout={800}>
      <Paper
        elevation={8}
        sx={{
          p: 4,
          borderRadius: 3,
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <SecurityIcon
          sx={{
            fontSize: 60,
            color: 'primary.main',
            mb: 2,
            animation: 'pulse 2s ease-in-out infinite',
            '@keyframes pulse': {
              '0%': { opacity: 0.6, transform: 'scale(1)' },
              '50%': { opacity: 1, transform: 'scale(1.05)' },
              '100%': { opacity: 0.6, transform: 'scale(1)' },
            },
          }}
        />

        <CircularProgress
          size={40}
          thickness={4}
          sx={{
            color: 'primary.main',
            mb: 3,
          }}
        />

        <Typography
          variant="h6"
          component="h1"
          sx={{
            color: 'primary.main',
            fontWeight: 600,
            mb: 1
          }}
        >
          Sunzi Cerebro
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'text.secondary',
            fontSize: '0.95rem'
          }}
        >
          Authentifizierung wird überprüft...
        </Typography>
      </Paper>
    </Fade>
  </Box>
)

/**
 * Access Denied Component for Insufficient Permissions
 */
const AccessDeniedScreen: React.FC<{ requiredRole: any, userRole: string }> = ({ requiredRole, userRole }) => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    sx={{
      background: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)',
      p: 2
    }}
  >
    <Fade in timeout={800}>
      <Paper
        elevation={10}
        sx={{
          p: 4,
          borderRadius: 3,
          textAlign: 'center',
          maxWidth: 500,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: 'error.light',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            bgcolor: 'error.main',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 3,
          }}
        >
          <SecurityIcon sx={{ fontSize: 40 }} />
        </Box>

        <Typography
          variant="h5"
          component="h1"
          sx={{
            color: 'error.main',
            fontWeight: 700,
            mb: 2
          }}
        >
          Zugriff verweigert
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: 'text.primary',
            mb: 2,
            lineHeight: 1.6
          }}
        >
          Sie verfügen nicht über die erforderlichen Berechtigungen für den Zugriff auf diese Ressource.
        </Typography>

        <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2, mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Erforderliche Rolle:</strong> {Array.isArray(requiredRole) ? requiredRole.join(', ') : requiredRole}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Ihre Rolle:</strong> {userRole}
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontStyle: 'italic'
          }}
        >
          Wenden Sie sich an Ihren Administrator, um zusätzliche Berechtigungen anzufordern.
        </Typography>
      </Paper>
    </Fade>
  </Box>
)

/**
 * Protected Route Component
 * Wraps components that require authentication and/or specific permissions
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/login'
}) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Show loading screen while checking authentication
  if (isLoading) {
    return <AuthLoadingScreen />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to={fallbackPath}
        state={{ from: location }}
        replace
      />
    )
  }

  // Check role-based permissions if required
  if (requiredRole) {
    const hasRequiredPermission = hasPermission(user, requiredRole)

    if (!hasRequiredPermission) {
      return (
        <AccessDeniedScreen
          requiredRole={requiredRole}
          userRole={user?.role || 'viewer'}
        />
      )
    }
  }

  // User is authenticated and authorized
  return <>{children}</>
}

export default ProtectedRoute

// Export convenience wrapper components for common role requirements
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="admin">
    {children}
  </ProtectedRoute>
)

export const PentesterRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole={['admin', 'pentester']}>
    {children}
  </ProtectedRoute>
)

export const AnalystRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole={['admin', 'pentester', 'analyst']}>
    {children}
  </ProtectedRoute>
)

export const ViewerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole={['admin', 'pentester', 'analyst', 'viewer']}>
    {children}
  </ProtectedRoute>
)