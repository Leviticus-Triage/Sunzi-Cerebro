/**
 * User Profile Management UI Components
 * Complete user profile management interface with preferences and security settings
 * Part of Sunzi Cerebro Enterprise Security Platform
 */

import React, { useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Switch,
  FormControl,
  FormLabel,
  FormControlLabel,
  RadioGroup,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Paper,
  Tooltip,
  Badge,
  LinearProgress,
} from '@mui/material'
import {
  Person as PersonIcon,
  Edit as EditIcon,
  PhotoCamera as CameraIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  ColorLens as ThemeIcon,
  Language as LanguageIcon,
  VpnKey as KeyIcon,
  History as HistoryIcon,
  Download as ExportIcon,
  Delete as DeleteIcon,
  Shield as ShieldIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'

// Types for User Profile
interface UserProfile {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  role: 'admin' | 'pentester' | 'analyst' | 'viewer'
  avatar?: string
  bio?: string
  phone?: string
  department?: string
  location?: string
  timezone: string
  language: 'en' | 'de'
  theme: 'light' | 'dark' | 'auto'
  notifications: {
    email: boolean
    push: boolean
    security: boolean
    system: boolean
  }
  security: {
    twoFactorEnabled: boolean
    lastPasswordChange: string
    sessionTimeout: number
    ipWhitelist: string[]
  }
  preferences: {
    dashboardLayout: 'grid' | 'list'
    autoRefresh: boolean
    soundEffects: boolean
    compactMode: boolean
  }
}

interface SecurityEvent {
  id: string
  type: 'login' | 'logout' | 'password_change' | 'profile_update' | '2fa_enabled'
  timestamp: string
  location: string
  ip: string
  userAgent: string
  status: 'success' | 'failed' | 'suspicious'
}

// Mock data
const mockSecurityEvents: SecurityEvent[] = [
  {
    id: '1',
    type: 'login',
    timestamp: '2025-09-26T09:30:00Z',
    location: 'Berlin, Germany',
    ip: '192.168.1.100',
    userAgent: 'Chrome 118.0.0.0',
    status: 'success'
  },
  {
    id: '2',
    type: 'profile_update',
    timestamp: '2025-09-26T08:15:00Z',
    location: 'Berlin, Germany',
    ip: '192.168.1.100',
    userAgent: 'Chrome 118.0.0.0',
    status: 'success'
  },
  {
    id: '3',
    type: 'login',
    timestamp: '2025-09-25T16:45:00Z',
    location: 'Unknown Location',
    ip: '203.0.113.42',
    userAgent: 'Firefox 119.0',
    status: 'suspicious'
  }
]

// Tab Panel Component
interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index} style={{ width: '100%' }}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
)

// Profile Information Tab
interface ProfileInfoTabProps {
  profile: UserProfile
  onSave: (updates: Partial<UserProfile>) => void
}

const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({ profile, onSave }) => {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState(profile)
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)

  const handleSave = () => {
    onSave(formData)
    setEditing(false)
  }

  const handleCancel = () => {
    setFormData(profile)
    setEditing(false)
  }

  const handleChange = (field: keyof UserProfile) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }))
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent sx={{ textAlign: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
              <Avatar
                src={profile.avatar}
                sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
              >
                <PersonIcon sx={{ fontSize: 60 }} />
              </Avatar>
              <IconButton
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'background.paper',
                  border: '2px solid',
                  borderColor: 'background.paper',
                  '&:hover': { bgcolor: 'background.paper' }
                }}
                onClick={() => setAvatarDialogOpen(true)}
              >
                <CameraIcon />
              </IconButton>
            </Box>

            <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
              {profile.firstName} {profile.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              @{profile.username}
            </Typography>
            <Chip
              label={profile.role.toUpperCase()}
              color={profile.role === 'admin' ? 'error' :
                     profile.role === 'pentester' ? 'primary' :
                     profile.role === 'analyst' ? 'warning' : 'default'}
              sx={{ mb: 2 }}
            />

            {profile.bio && (
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                {profile.bio}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader
            title="Profile Information"
            action={
              <Button
                startIcon={editing ? <CancelIcon /> : <EditIcon />}
                onClick={editing ? handleCancel : () => setEditing(true)}
                variant={editing ? 'outlined' : 'contained'}
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </Button>
            }
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  value={formData.firstName || ''}
                  onChange={handleChange('firstName')}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  value={formData.lastName || ''}
                  onChange={handleChange('lastName')}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  value={formData.phone || ''}
                  onChange={handleChange('phone')}
                  disabled={!editing}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Department"
                  value={formData.department || ''}
                  onChange={handleChange('department')}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={formData.location || ''}
                  onChange={handleChange('location')}
                  disabled={!editing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth disabled={!editing}>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={formData.timezone}
                    onChange={handleChange('timezone')}
                    label="Timezone"
                  >
                    <MenuItem value="UTC">UTC</MenuItem>
                    <MenuItem value="Europe/Berlin">Europe/Berlin</MenuItem>
                    <MenuItem value="America/New_York">America/New_York</MenuItem>
                    <MenuItem value="Asia/Tokyo">Asia/Tokyo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Bio"
                  value={formData.bio || ''}
                  onChange={handleChange('bio')}
                  disabled={!editing}
                  placeholder="Tell us about yourself..."
                />
              </Grid>
            </Grid>

            {editing && (
              <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Avatar Upload Dialog */}
      <Dialog
        open={avatarDialogOpen}
        onClose={() => setAvatarDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Update Profile Picture</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Avatar
              src={profile.avatar}
              sx={{ width: 150, height: 150, mx: 'auto', mb: 3 }}
            >
              <PersonIcon sx={{ fontSize: 75 }} />
            </Avatar>
            <Button
              variant="contained"
              startIcon={<CameraIcon />}
              component="label"
            >
              Choose Image
              <input type="file" hidden accept="image/*" />
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvatarDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setAvatarDialogOpen(false)}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

// Security Settings Tab
interface SecurityTabProps {
  profile: UserProfile
  events: SecurityEvent[]
  onSecurityUpdate: (updates: Partial<UserProfile['security']>) => void
}

const SecurityTab: React.FC<SecurityTabProps> = ({ profile, events, onSecurityUpdate }) => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [show2FADialog, setShow2FADialog] = useState(false)

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'login': return <PersonIcon />
      case 'logout': return <PersonIcon />
      case 'password_change': return <KeyIcon />
      case 'profile_update': return <EditIcon />
      case '2fa_enabled': return <ShieldIcon />
      default: return <SecurityIcon />
    }
  }

  const getEventColor = (status: string) => {
    switch (status) {
      case 'success': return 'success'
      case 'failed': return 'error'
      case 'suspicious': return 'warning'
      default: return 'default'
    }
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Security Settings"
            avatar={<SecurityIcon color="primary" />}
          />
          <CardContent>
            <List>
              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: profile.security.twoFactorEnabled ? 'success.main' : 'warning.main' }}>
                    <ShieldIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Two-Factor Authentication"
                  secondary={profile.security.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant={profile.security.twoFactorEnabled ? 'outlined' : 'contained'}
                    color={profile.security.twoFactorEnabled ? 'error' : 'primary'}
                    onClick={() => setShow2FADialog(true)}
                  >
                    {profile.security.twoFactorEnabled ? 'Disable' : 'Enable'}
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>

              <Divider />

              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <KeyIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Password"
                  secondary={`Last changed: ${new Date(profile.security.lastPasswordChange).toLocaleDateString()}`}
                />
                <ListItemSecondaryAction>
                  <Button
                    variant="outlined"
                    onClick={() => setShowPasswordDialog(true)}
                  >
                    Change
                  </Button>
                </ListItemSecondaryAction>
              </ListItem>

              <Divider />

              <ListItem>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'info.main' }}>
                    <HistoryIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Session Timeout"
                  secondary={`${profile.security.sessionTimeout} minutes`}
                />
                <ListItemSecondaryAction>
                  <FormControl size="small">
                    <Select
                      value={profile.security.sessionTimeout}
                      onChange={(e) => onSecurityUpdate({ sessionTimeout: e.target.value as number })}
                    >
                      <MenuItem value={30}>30 min</MenuItem>
                      <MenuItem value={60}>1 hour</MenuItem>
                      <MenuItem value={240}>4 hours</MenuItem>
                      <MenuItem value={480}>8 hours</MenuItem>
                    </Select>
                  </FormControl>
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Security Activity"
            avatar={<HistoryIcon color="primary" />}
            action={
              <Button startIcon={<ExportIcon />} size="small">
                Export Log
              </Button>
            }
          />
          <CardContent>
            <List>
              {events.map((event) => (
                <ListItem key={event.id}>
                  <ListItemAvatar>
                    <Badge
                      variant="dot"
                      color={getEventColor(event.status)}
                      overlap="circular"
                    >
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {getEventIcon(event.type)}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {event.type.replace('_', ' ')}
                        </Typography>
                        {event.status === 'suspicious' && (
                          <Chip label="Suspicious" size="small" color="warning" />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {new Date(event.timestamp).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {event.location} • {event.ip}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Password Change Dialog */}
      <Dialog
        open={showPasswordDialog}
        onClose={() => setShowPasswordDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              type="password"
              label="Current Password"
              margin="normal"
            />
            <TextField
              fullWidth
              type="password"
              label="New Password"
              margin="normal"
            />
            <TextField
              fullWidth
              type="password"
              label="Confirm New Password"
              margin="normal"
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and symbols.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPasswordDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setShowPasswordDialog(false)}>
            Update Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* 2FA Dialog */}
      <Dialog
        open={show2FADialog}
        onClose={() => setShow2FADialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Two-Factor Authentication</DialogTitle>
        <DialogContent>
          {!profile.security.twoFactorEnabled ? (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <ShieldIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                Enhance Your Security
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Two-factor authentication adds an extra layer of security to your account.
              </Typography>
              <Alert severity="info">
                You'll need an authenticator app like Google Authenticator or Authy.
              </Alert>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <WarningIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                Disable Two-Factor Authentication
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Are you sure you want to disable 2FA? This will make your account less secure.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShow2FADialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={profile.security.twoFactorEnabled ? 'error' : 'primary'}
            onClick={() => {
              onSecurityUpdate({ twoFactorEnabled: !profile.security.twoFactorEnabled })
              setShow2FADialog(false)
            }}
          >
            {profile.security.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

// Preferences Tab
interface PreferencesTabProps {
  profile: UserProfile
  onPreferencesUpdate: (updates: Partial<UserProfile>) => void
}

const PreferencesTab: React.FC<PreferencesTabProps> = ({ profile, onPreferencesUpdate }) => {
  const handleChange = (section: 'notifications' | 'preferences', field: string) => (event: any) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
    onPreferencesUpdate({
      [section]: {
        ...profile[section],
        [field]: value
      }
    })
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Appearance & Language"
            avatar={<ThemeIcon color="primary" />}
          />
          <CardContent>
            <Box sx={{ mb: 3 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Theme</FormLabel>
                <RadioGroup
                  value={profile.theme}
                  onChange={(e) => onPreferencesUpdate({ theme: e.target.value as any })}
                >
                  <FormControlLabel value="light" control={<Radio />} label="Light" />
                  <FormControlLabel value="dark" control={<Radio />} label="Dark" />
                  <FormControlLabel value="auto" control={<Radio />} label="Auto (System)" />
                </RadioGroup>
              </FormControl>
            </Box>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={profile.language}
                onChange={(e) => onPreferencesUpdate({ language: e.target.value as any })}
                label="Language"
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="de">Deutsch</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>Interface Preferences</Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={profile.preferences.compactMode}
                    onChange={handleChange('preferences', 'compactMode')}
                  />
                }
                label="Compact Mode"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={profile.preferences.soundEffects}
                    onChange={handleChange('preferences', 'soundEffects')}
                  />
                }
                label="Sound Effects"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={profile.preferences.autoRefresh}
                    onChange={handleChange('preferences', 'autoRefresh')}
                  />
                }
                label="Auto Refresh Dashboard"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardHeader
            title="Notifications"
            avatar={<NotificationsIcon color="primary" />}
          />
          <CardContent>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>Notification Preferences</Typography>

            <List>
              <ListItem>
                <ListItemText primary="Email Notifications" secondary="Receive updates via email" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={profile.notifications.email}
                    onChange={handleChange('notifications', 'email')}
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem>
                <ListItemText primary="Push Notifications" secondary="Browser push notifications" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={profile.notifications.push}
                    onChange={handleChange('notifications', 'push')}
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem>
                <ListItemText primary="Security Alerts" secondary="Critical security notifications" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={profile.notifications.security}
                    onChange={handleChange('notifications', 'security')}
                  />
                </ListItemSecondaryAction>
              </ListItem>

              <ListItem>
                <ListItemText primary="System Updates" secondary="System maintenance and updates" />
                <ListItemSecondaryAction>
                  <Switch
                    checked={profile.notifications.system}
                    onChange={handleChange('notifications', 'system')}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

// Main User Profile Management Component
const UserProfileManagement: React.FC = () => {
  const { user: authUser } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const [profile, setProfile] = useState<UserProfile>({
    id: authUser?.id || 'mock-user-1',
    username: authUser?.username || 'sunzi.cerebro',
    email: authUser?.email || 'admin@sunzi-cerebro.local',
    firstName: authUser?.firstName || 'Sun',
    lastName: authUser?.lastName || 'Tzu',
    role: (authUser?.role as any) || 'admin',
    bio: 'Strategic security analyst and penetration testing expert.',
    phone: '+49 30 12345678',
    department: 'Cybersecurity',
    location: 'Berlin, Germany',
    timezone: 'Europe/Berlin',
    language: 'de',
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      security: true,
      system: false
    },
    security: {
      twoFactorEnabled: true,
      lastPasswordChange: '2025-09-15T10:30:00Z',
      sessionTimeout: 240,
      ipWhitelist: []
    },
    preferences: {
      dashboardLayout: 'grid',
      autoRefresh: true,
      soundEffects: false,
      compactMode: false
    }
  })

  const [securityEvents] = useState<SecurityEvent[]>(mockSecurityEvents)

  const handleProfileUpdate = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }))
  }

  const handleSecurityUpdate = (updates: Partial<UserProfile['security']>) => {
    setProfile(prev => ({
      ...prev,
      security: { ...prev.security, ...updates }
    }))
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
        User Profile
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your profile information, security settings, and preferences
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab icon={<PersonIcon />} label="Profile" />
          <Tab icon={<SecurityIcon />} label="Security" />
          <Tab icon={<ThemeIcon />} label="Preferences" />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <ProfileInfoTab profile={profile} onSave={handleProfileUpdate} />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <SecurityTab
            profile={profile}
            events={securityEvents}
            onSecurityUpdate={handleSecurityUpdate}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <PreferencesTab profile={profile} onPreferencesUpdate={handleProfileUpdate} />
        </TabPanel>
      </Paper>
    </Box>
  )
}

export default UserProfileManagement