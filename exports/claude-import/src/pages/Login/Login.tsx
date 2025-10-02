import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Divider,
  Paper,
  Avatar,
  Fade,
  CircularProgress,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Security as SecurityIcon,
  Login as LoginIcon,
} from '@mui/icons-material'
import { useAuth, mockUser } from '../../hooks/useAuth.tsx'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, isLoading } = useAuth()

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect nach Login
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear error when user starts typing
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password) {
      setError('Bitte füllen Sie alle Felder aus.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      await login(formData.username, formData.password)
      // Navigation wird durch useEffect gehandhabt
    } catch (err: any) {
      setError(err.message || 'Login fehlgeschlagen. Bitte versuchen Sie es erneut.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mock Login für Development
  const handleMockLogin = async () => {
    setIsSubmitting(true)
    setError('')
    
    try {
      // Simuliere API Delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // In der Entwicklung können wir einen Mock-User verwenden
      // TODO: Entfernen in Produktion
      await login('sunzi.cerebro', 'admin123')
    } catch (err: any) {
      setError(err.message || 'Mock login fehlgeschlagen')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  if (isLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    )
  }

  return (
    <Box 
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8faff 0%, #e8f4ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Fade in timeout={800}>
        <Paper
          elevation={10}
          sx={{
            width: '100%',
            maxWidth: 450,
            borderRadius: 3,
            overflow: 'hidden',
          }}
        >
          {/* Header Section */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #00327c 0%, #3e94ff 100%)',
              color: 'white',
              textAlign: 'center',
              py: 4,
              px: 3,
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                mx: 'auto',
                mb: 2,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <SecurityIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Sunzi Cerebro
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Advanced Security Intelligence Platform
            </Typography>
          </Box>

          {/* Login Form */}
          <CardContent sx={{ p: 4 }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 600, textAlign: 'center' }}>
                Anmelden
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <TextField
                fullWidth
                label="Benutzername"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                variant="outlined"
                margin="normal"
                autoComplete="username"
                autoFocus
                disabled={isSubmitting}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <TextField
                fullWidth
                label="Passwort"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                variant="outlined"
                margin="normal"
                autoComplete="current-password"
                disabled={isSubmitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                        disabled={isSubmitting}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <LoginIcon />}
                sx={{
                  mb: 2,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'none',
                  background: 'linear-gradient(45deg, #00327c, #3e94ff)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #001e52, #2a76d1)',
                  },
                }}
              >
                {isSubmitting ? 'Anmelden...' : 'Anmelden'}
              </Button>

              {/* Development Only - Mock Login */}
              {process.env.NODE_ENV === 'development' && (
                <>
                  <Divider sx={{ my: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Entwicklung
                    </Typography>
                  </Divider>

                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={handleMockLogin}
                    disabled={isSubmitting}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 500,
                      textTransform: 'none',
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        borderColor: 'primary.dark',
                        backgroundColor: 'primary.main',
                        color: 'white',
                      },
                    }}
                  >
                    Mock Login (Demo)
                  </Button>

                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      <strong>Demo-Zugangsdaten:</strong><br />
                      Benutzername: sunzi.cerebro<br />
                      Passwort: admin123
                    </Typography>
                  </Alert>
                </>
              )}
            </Box>
          </CardContent>

          {/* Footer */}
          <Box
            sx={{
              bgcolor: 'grey.50',
              textAlign: 'center',
              py: 2,
              px: 3,
              borderTop: '1px solid',
              borderColor: 'grey.200',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              © 2024 Sunzi Cerebro. Alle Rechte vorbehalten.
            </Typography>
          </Box>
        </Paper>
      </Fade>
    </Box>
  )
}

export default Login