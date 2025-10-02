import React from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
} from '@mui/material'
import {
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon,
  Error as ErrorIcon,
} from '@mui/icons-material'

const NotFound: React.FC = () => {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/')
  }

  const handleGoBack = () => {
    navigate(-1)
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
      <Paper
        elevation={10}
        sx={{
          width: '100%',
          maxWidth: 500,
          borderRadius: 3,
          overflow: 'hidden',
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            background: 'linear-gradient(135deg, #fb5454 0%, #ff9b26 100%)',
            color: 'white',
            py: 4,
            px: 3,
          }}
        >
          <ErrorIcon sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h1" component="h1" sx={{ fontWeight: 700, fontSize: '4rem', mb: 1 }}>
            404
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Seite nicht gefunden
          </Typography>
        </Box>

        <Box sx={{ p: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            Ops! Diese Seite existiert nicht.
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Die angeforderte Seite konnte nicht gefunden werden. Sie wurde möglicherweise verschoben, gelöscht oder die URL ist falsch.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              sx={{
                py: 1.5,
                px: 3,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                background: 'linear-gradient(45deg, #00327c, #3e94ff)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #001e52, #2a76d1)',
                },
              }}
            >
              Zur Startseite
            </Button>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              sx={{
                py: 1.5,
                px: 3,
                borderRadius: 2,
                fontWeight: 600,
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
              Zurück
            </Button>
          </Stack>
        </Box>

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
    </Box>
  )
}

export default NotFound