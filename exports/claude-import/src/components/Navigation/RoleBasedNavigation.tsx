/**
 * Role-Based Navigation Components
 * Provides navigation elements that respect user role permissions
 * Part of Sunzi Cerebro Enterprise Security Platform
 */

import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Chip,
  Tooltip,
  Collapse,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon,
  Description as ReportsIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  Assistant as AssistantIcon,
  Build as ToolsIcon,
  Scanner as ScannerIcon,
  AdminPanelSettings as AdminIcon,
  ExpandLess,
  ExpandMore,
  VpnKey as AuthIcon,
  Storage as DatabaseIcon,
  Psychology as StrategyIcon,
  Hexagon as HexStrikeIcon,
  FlashOn as GodModeIcon,
  Gavel as ComplianceIcon,
} from '@mui/icons-material'
import { useAuth, hasPermission, User } from '../../hooks/useAuth'

// Navigation item interface
interface NavItem {
  id: string
  title: string
  path: string
  icon: React.ReactElement
  requiredRole: User['role'] | User['role'][] | null
  description: string
  badge?: string
  children?: NavItem[]
}

// Navigation configuration
const navigationConfig: NavItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    path: '/dashboard',
    icon: <DashboardIcon />,
    requiredRole: null, // All authenticated users
    description: 'System overview and status'
  },
  {
    id: 'tools',
    title: 'Security Tools',
    path: '/tools',
    icon: <ToolsIcon />,
    requiredRole: ['admin', 'pentester'],
    description: 'Penetration testing and security tools',
    badge: 'PRO',
    children: [
      {
        id: 'mcp-toolset',
        title: 'MCP Toolset',
        path: '/mcp-toolset',
        icon: <SecurityIcon />,
        requiredRole: ['admin', 'pentester'],
        description: '278+ MCP Security Tools',
        badge: 'NEW'
      },
      {
        id: 'hexstrike-ai',
        title: 'HexStrike AI',
        path: '/hexstrike-ai',
        icon: <HexStrikeIcon />,
        requiredRole: ['admin', 'pentester'],
        description: '150+ Advanced Penetration Testing Tools',
        badge: 'AI'
      },
      {
        id: 'mcp-god-mode',
        title: 'MCP God Mode',
        path: '/mcp-god-mode',
        icon: <GodModeIcon />,
        requiredRole: 'admin',
        description: '190+ Expert Security Tools - Admin Only',
        badge: 'GOD'
      }
    ]
  },
  {
    id: 'scans',
    title: 'Scan Management',
    path: '/scans',
    icon: <ScannerIcon />,
    requiredRole: ['admin', 'pentester', 'analyst'],
    description: 'Security scan orchestration and monitoring'
  },
  {
    id: 'analytics',
    title: 'Analytics',
    path: '/analytics',
    icon: <AnalyticsIcon />,
    requiredRole: ['admin', 'pentester', 'analyst'],
    description: 'Advanced security analytics and intelligence',
    badge: 'AI'
  },
  {
    id: 'strategic-framework',
    title: 'Strategic Framework',
    path: '/strategic-framework',
    icon: <StrategyIcon />,
    requiredRole: ['admin', 'pentester', 'analyst'],
    description: 'Sun Tzu\'s Art of War applied to cybersecurity',
    badge: '孙子'
  },
  {
    id: 'compliance',
    title: 'Compliance Dashboard',
    path: '/compliance',
    icon: <ComplianceIcon />,
    requiredRole: 'admin',
    description: 'NIS-2, GDPR, ISO 27001 regulatory compliance',
    badge: 'EU'
  },
  {
    id: 'reports',
    title: 'Reports',
    path: '/reports',
    icon: <ReportsIcon />,
    requiredRole: null, // All authenticated users
    description: 'Security reports and documentation'
  },
  {
    id: 'assistant',
    title: 'AI Assistant',
    path: '/assistant',
    icon: <AssistantIcon />,
    requiredRole: null, // All authenticated users
    description: 'AI-powered security assistance'
  },
  {
    id: 'settings',
    title: 'Settings',
    path: '/settings',
    icon: <SettingsIcon />,
    requiredRole: null, // All authenticated users
    description: 'Application configuration and preferences'
  },
  {
    id: 'admin',
    title: 'Administration',
    path: '/admin',
    icon: <AdminIcon />,
    requiredRole: 'admin',
    description: 'System administration and user management',
    badge: 'ADMIN',
    children: [
      {
        id: 'admin-users',
        title: 'User Management',
        path: '/admin/users',
        icon: <AuthIcon />,
        requiredRole: 'admin',
        description: 'Manage users and permissions'
      },
      {
        id: 'admin-database',
        title: 'Database Admin',
        path: '/admin/database',
        icon: <DatabaseIcon />,
        requiredRole: 'admin',
        description: 'Database administration interface'
      }
    ]
  }
]

// Role-based navigation item component
interface RoleBasedNavItemProps {
  item: NavItem
  level?: number
  onItemClick?: (item: NavItem) => void
}

const RoleBasedNavItem: React.FC<RoleBasedNavItemProps> = ({
  item,
  level = 0,
  onItemClick
}) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = React.useState(false)

  // Check if user has permission for this item
  const hasAccess = !item.requiredRole || (user && hasPermission(user, item.requiredRole))

  // Check if item is currently active
  const isActive = location.pathname === item.path ||
                   (item.children && item.children.some(child => location.pathname === child.path))

  // Handle item click
  const handleClick = () => {
    if (item.children && item.children.length > 0) {
      setOpen(!open)
    } else {
      navigate(item.path)
      if (onItemClick) {
        onItemClick(item)
      }
    }
  }

  // Don't render if user doesn't have access
  if (!hasAccess) {
    return null
  }

  return (
    <>
      <Tooltip title={item.description} placement="right" arrow>
        <ListItem disablePadding>
          <ListItemButton
            selected={isActive}
            onClick={handleClick}
            sx={{
              pl: 2 + (level * 2),
              minHeight: 48,
              borderRadius: 1,
              mx: 1,
              mb: 0.5,
              '&.Mui-selected': {
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
                '& .MuiListItemIcon-root': {
                  color: 'white',
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 40,
                color: isActive ? 'inherit' : 'text.secondary',
              }}
            >
              {item.icon}
            </ListItemIcon>

            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '0.875rem',
                    }}
                  >
                    {item.title}
                  </Typography>
                  {item.badge && (
                    <Chip
                      label={item.badge}
                      size="small"
                      color={item.badge === 'ADMIN' ? 'error' :
                             item.badge === 'PRO' ? 'primary' : 'success'}
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Box>
              }
            />

            {item.children && item.children.length > 0 && (
              open ? <ExpandLess /> : <ExpandMore />
            )}
          </ListItemButton>
        </ListItem>
      </Tooltip>

      {/* Render children if they exist */}
      {item.children && item.children.length > 0 && (
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children
              .filter(child => !child.requiredRole || (user && hasPermission(user, child.requiredRole)))
              .map((child) => (
                <RoleBasedNavItem
                  key={child.id}
                  item={child}
                  level={level + 1}
                  onItemClick={onItemClick}
                />
              ))}
          </List>
        </Collapse>
      )}
    </>
  )
}

// Main role-based navigation component
interface RoleBasedNavigationProps {
  onItemClick?: (item: NavItem) => void
  variant?: 'full' | 'compact'
}

const RoleBasedNavigation: React.FC<RoleBasedNavigationProps> = ({
  onItemClick,
  variant = 'full'
}) => {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  // Filter navigation items based on user permissions
  const accessibleItems = navigationConfig.filter(item =>
    !item.requiredRole || hasPermission(user, item.requiredRole)
  )

  return (
    <Box sx={{ width: '100%' }}>
      {variant === 'full' && (
        <Box sx={{ p: 2 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            Navigation
          </Typography>
          <Divider sx={{ mt: 1, mb: 2 }} />
        </Box>
      )}

      <List sx={{ width: '100%', py: 0 }}>
        {accessibleItems.map((item, index) => (
          <React.Fragment key={item.id}>
            <RoleBasedNavItem
              item={item}
              onItemClick={onItemClick}
            />

            {/* Add dividers between major sections */}
            {variant === 'full' && index < accessibleItems.length - 1 &&
             (item.id === 'dashboard' || item.id === 'reports' || item.id === 'settings') && (
              <Divider sx={{ my: 1, mx: 2 }} />
            )}
          </React.Fragment>
        ))}
      </List>

      {variant === 'full' && (
        <Box sx={{ p: 2, mt: 2 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Role: <Chip
              label={user.role.toUpperCase()}
              size="small"
              color={user.role === 'admin' ? 'error' :
                     user.role === 'pentester' ? 'primary' :
                     user.role === 'analyst' ? 'warning' : 'default'}
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default RoleBasedNavigation

// Export navigation configuration for use in other components
export { navigationConfig, type NavItem }

// Utility function to get accessible navigation items for a user
export const getAccessibleNavItems = (user: User | null): NavItem[] => {
  if (!user) return []

  return navigationConfig.filter(item =>
    !item.requiredRole || hasPermission(user, item.requiredRole)
  ).map(item => ({
    ...item,
    children: item.children?.filter(child =>
      !child.requiredRole || hasPermission(user, child.requiredRole)
    )
  }))
}

// Breadcrumb component for navigation context
interface NavigationBreadcrumbsProps {
  currentPath?: string
}

export const NavigationBreadcrumbs: React.FC<NavigationBreadcrumbsProps> = ({
  currentPath
}) => {
  const location = useLocation()
  const path = currentPath || location.pathname
  const { user } = useAuth()

  if (!user) return null

  // Find current navigation item
  const findNavItem = (items: NavItem[], searchPath: string): NavItem | null => {
    for (const item of items) {
      if (item.path === searchPath) {
        return item
      }
      if (item.children) {
        const found = findNavItem(item.children, searchPath)
        if (found) return found
      }
    }
    return null
  }

  const accessibleItems = getAccessibleNavItems(user)
  const currentItem = findNavItem(accessibleItems, path)

  if (!currentItem) return null

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2 }}>
      {currentItem.icon}
      <Typography variant="h6" component="h1" sx={{ fontWeight: 600 }}>
        {currentItem.title}
      </Typography>
      {currentItem.badge && (
        <Chip
          label={currentItem.badge}
          size="small"
          color={currentItem.badge === 'ADMIN' ? 'error' :
                 currentItem.badge === 'PRO' ? 'primary' : 'success'}
        />
      )}
    </Box>
  )
}