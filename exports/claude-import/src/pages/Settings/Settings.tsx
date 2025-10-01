import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Divider,
  Alert,
  Snackbar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Stack,
} from '@mui/material'
import {
  Settings as SettingsIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Code as APIIcon,
  ColorLens as ThemeIcon,
  Language as LanguageIcon,
  Storage as StorageIcon,
  CloudDownload as BackupIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { useAuth } from '../../hooks/useAuth'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
}

const Settings: React.FC = () => {
  const { user, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState(0)
  const [settings, setSettings] = useState({
    // User Settings
    username: user?.username || '',
    email: user?.email || '',
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',

    // Security Settings
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordStrength: 'strong',

    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    securityAlerts: true,
    toolExecutionNotifications: true,

    // Theme Settings
    theme: user?.preferences?.theme || 'light',
    language: user?.preferences?.language || 'de',

    // API Settings
    apiKeys: [
      { name: 'HexStrike AI', key: '••••••••••••1234', active: true },
      { name: 'MCP-God-Mode', key: '••••••••••••5678', active: true },
    ],

    // System Settings
    autoBackup: true,
    backupFrequency: '4hours',
    maxToolExecutions: 100,
    cacheTimeout: 3600,
  })

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info'
  })

  const [apiKeyDialog, setApiKeyDialog] = useState(false)
  const [newApiKey, setNewApiKey] = useState({ name: '', key: '' })

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSettings = async () => {
    try {
      // Update user preferences
      await updateUser({
        firstName: settings.firstName,
        lastName: settings.lastName,
        email: settings.email,
        preferences: {
          theme: settings.theme as 'light' | 'dark',
          language: settings.language as 'de' | 'en',
          notifications: settings.emailNotifications
        }
      })

      // Save other settings to localStorage for now
      localStorage.setItem('sunzi_settings', JSON.stringify(settings))

      setSnackbar({
        open: true,
        message: 'Einstellungen erfolgreich gespeichert!',
        severity: 'success'
      })

      console.log('✅ Settings saved:', settings)

    } catch (error: any) {
      setSnackbar({
        open: true,
        message: 'Fehler beim Speichern der Einstellungen',
        severity: 'error'
      })
      console.error('❌ Failed to save settings:', error)
    }
  }

  const handleAddApiKey = () => {
    if (newApiKey.name && newApiKey.key) {
      setSettings(prev => ({
        ...prev,
        apiKeys: [...prev.apiKeys, { ...newApiKey, active: true }]
      }))
      setNewApiKey({ name: '', key: '' })
      setApiKeyDialog(false)
      setSnackbar({
        open: true,
        message: 'API-Schlüssel hinzugefügt!',
        severity: 'success'
      })
    }
  }

  const handleRemoveApiKey = (index: number) => {
    setSettings(prev => ({
      ...prev,
      apiKeys: prev.apiKeys.filter((_, i) => i !== index)
    }))
    setSnackbar({
      open: true,
      message: 'API-Schlüssel entfernt!',
      severity: 'info'
    })
  }

  // Load saved settings on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('sunzi_settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.warn('Failed to load saved settings:', error)
      }
    }
  }, [])

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          Einstellungen
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Konfigurieren Sie Sunzi Cerebro nach Ihren Anforderungen
        </Typography>
      </Box>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab icon={<PersonIcon />} label="Benutzer" />
            <Tab icon={<SecurityIcon />} label="Sicherheit" />
            <Tab icon={<NotificationsIcon />} label="Benachrichtigungen" />
            <Tab icon={<ThemeIcon />} label="Darstellung" />
            <Tab icon={<APIIcon />} label="API-Schlüssel" />
            <Tab icon={<StorageIcon />} label="System" />
          </Tabs>
        </Box>

        {/* User Settings */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Benutzername"
                value={settings.username}
                onChange={(e) => handleSettingChange('username', e.target.value)}
                disabled
                helperText="Benutzername kann nicht geändert werden"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="E-Mail"
                type="email"
                value={settings.email}
                onChange={(e) => handleSettingChange('email', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Vorname"
                value={settings.firstName}
                onChange={(e) => handleSettingChange('firstName', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nachname"
                value={settings.lastName}
                onChange={(e) => handleSettingChange('lastName', e.target.value)}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Settings */}
        <TabPanel value={activeTab} index={1}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Authentifizierung
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.twoFactorEnabled}
                      onChange={(e) => handleSettingChange('twoFactorEnabled', e.target.checked)}
                    />
                  }
                  label="Zwei-Faktor-Authentifizierung aktivieren"
                />
                <Box sx={{ mt: 2 }}>
                  <FormControl fullWidth>
                    <InputLabel>Session-Timeout</InputLabel>
                    <Select
                      value={settings.sessionTimeout}
                      onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
                    >
                      <MenuItem value={15}>15 Minuten</MenuItem>
                      <MenuItem value={30}>30 Minuten</MenuItem>
                      <MenuItem value={60}>1 Stunde</MenuItem>
                      <MenuItem value={240}>4 Stunden</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </TabPanel>

        {/* Notification Settings */}
        <TabPanel value={activeTab} index={2}>
          <Stack spacing={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                />
              }
              label="E-Mail-Benachrichtigungen"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.pushNotifications}
                  onChange={(e) => handleSettingChange('pushNotifications', e.target.checked)}
                />
              }
              label="Push-Benachrichtigungen"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.securityAlerts}
                  onChange={(e) => handleSettingChange('securityAlerts', e.target.checked)}
                />
              }
              label="Sicherheitswarnungen"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.toolExecutionNotifications}
                  onChange={(e) => handleSettingChange('toolExecutionNotifications', e.target.checked)}
                />
              }
              label="Tool-Ausführungsbenachrichtigungen"
            />
          </Stack>
        </TabPanel>

        {/* Theme Settings */}
        <TabPanel value={activeTab} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Design</InputLabel>
                <Select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                >
                  <MenuItem value="light">Hell</MenuItem>
                  <MenuItem value="dark">Dunkel</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Sprache</InputLabel>
                <Select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                >
                  <MenuItem value="de">Deutsch</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </TabPanel>

        {/* API Keys */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">API-Schlüssel</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setApiKeyDialog(true)}
            >
              Hinzufügen
            </Button>
          </Box>
          <List>
            {settings.apiKeys.map((apiKey, index) => (
              <ListItem key={index} divider>
                <ListItemText
                  primary={apiKey.name}
                  secondary={apiKey.key}
                />
                <ListItemSecondaryAction>
                  <Chip
                    label={apiKey.active ? 'Aktiv' : 'Inaktiv'}
                    color={apiKey.active ? 'success' : 'default'}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <IconButton
                    edge="end"
                    onClick={() => handleRemoveApiKey(index)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </TabPanel>

        {/* System Settings */}
        <TabPanel value={activeTab} index={5}>
          <Stack spacing={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Backup-Einstellungen
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoBackup}
                      onChange={(e) => handleSettingChange('autoBackup', e.target.checked)}
                    />
                  }
                  label="Automatische Backups"
                />
                {settings.autoBackup && (
                  <Box sx={{ mt: 2 }}>
                    <FormControl fullWidth>
                      <InputLabel>Backup-Häufigkeit</InputLabel>
                      <Select
                        value={settings.backupFrequency}
                        onChange={(e) => handleSettingChange('backupFrequency', e.target.value)}
                      >
                        <MenuItem value="1hour">Stündlich</MenuItem>
                        <MenuItem value="4hours">Alle 4 Stunden</MenuItem>
                        <MenuItem value="daily">Täglich</MenuItem>
                        <MenuItem value="weekly">Wöchentlich</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Performance-Einstellungen
                </Typography>
                <TextField
                  fullWidth
                  type="number"
                  label="Maximale Tool-Ausführungen"
                  value={settings.maxToolExecutions}
                  onChange={(e) => handleSettingChange('maxToolExecutions', parseInt(e.target.value))}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  type="number"
                  label="Cache-Timeout (Sekunden)"
                  value={settings.cacheTimeout}
                  onChange={(e) => handleSettingChange('cacheTimeout', parseInt(e.target.value))}
                />
              </CardContent>
            </Card>
          </Stack>
        </TabPanel>

        <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
          >
            Zurücksetzen
          </Button>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
          >
            Einstellungen speichern
          </Button>
        </Box>
      </Paper>

      {/* API Key Dialog */}
      <Dialog open={apiKeyDialog} onClose={() => setApiKeyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Neuen API-Schlüssel hinzufügen</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Service-Name"
            value={newApiKey.name}
            onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            label="API-Schlüssel"
            type="password"
            value={newApiKey.key}
            onChange={(e) => setNewApiKey(prev => ({ ...prev, key: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApiKeyDialog(false)}>Abbrechen</Button>
          <Button onClick={handleAddApiKey} variant="contained">Hinzufügen</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        message={snackbar.message}
      />
    </Box>
  )
}

export default Settings