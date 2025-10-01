import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Close as CloseIcon,
  GetApp as InstallIcon,
  CloudOff as OfflineIcon,
  Notifications as NotificationsIcon,
  Sync as SyncIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { pwaService } from '../../services/pwaService';

interface PWAInstallPromptProps {
  open?: boolean;
  onClose?: () => void;
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  open: controlledOpen,
  onClose
}) => {
  const [open, setOpen] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Listen for install prompt ready event
    const handleInstallReady = () => {
      setCanInstall(true);

      // Auto-show prompt after 30 seconds on first visit
      const hasShownPrompt = localStorage.getItem('pwa-install-prompt-shown');
      if (!hasShownPrompt) {
        setTimeout(() => {
          setOpen(true);
          localStorage.setItem('pwa-install-prompt-shown', 'true');
        }, 30000); // 30 seconds
      }
    };

    window.addEventListener('pwa-install-ready', handleInstallReady);

    // Check if can install on mount
    setCanInstall(pwaService.canInstall());

    return () => {
      window.removeEventListener('pwa-install-ready', handleInstallReady);
    };
  }, []);

  // Use controlled or uncontrolled state
  const isOpen = controlledOpen !== undefined ? controlledOpen : open;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setOpen(false);
    }

    // Track dismissal
    localStorage.setItem('pwa-install-prompt-dismissed', new Date().toISOString());
  };

  const handleInstall = async () => {
    setInstalling(true);

    try {
      const accepted = await pwaService.showInstallPrompt();

      if (accepted) {
        console.log('[PWA] App installation accepted');
        handleClose();
      } else {
        console.log('[PWA] App installation declined');
      }
    } catch (error) {
      console.error('[PWA] Installation failed:', error);
    } finally {
      setInstalling(false);
    }
  };

  const handleRemindLater = () => {
    localStorage.setItem('pwa-install-remind-later', new Date().toISOString());
    handleClose();
  };

  if (!canInstall) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          background: 'linear-gradient(135deg, #00327c 0%, #001f4d 100%)',
          color: '#ffffff'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <InstallIcon sx={{ fontSize: 32 }} />
            <Typography variant="h6" fontWeight={600}>
              Sunzi Cerebro installieren
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" sx={{ color: '#ffffff' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" sx={{ mb: 3, color: 'rgba(255, 255, 255, 0.9)' }}>
          Installieren Sie Sunzi Cerebro als Progressive Web App für ein optimales
          Benutzererlebnis mit erweiterten Funktionen für Enterprise Security Management.
        </Typography>

        <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', borderRadius: 2, p: 2, mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>
            Enterprise-Funktionen:
          </Typography>

          <List dense sx={{ p: 0 }}>
            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <OfflineIcon sx={{ color: '#4caf50', fontSize: 24 }} />
              </ListItemIcon>
              <ListItemText
                primary="Vollständige Offline-Funktionalität"
                secondary="Zugriff auf 340+ Security Tools ohne Internetverbindung"
                primaryTypographyProps={{ fontWeight: 500, color: '#ffffff' }}
                secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}
              />
            </ListItem>

            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <NotificationsIcon sx={{ color: '#ff9800', fontSize: 24 }} />
              </ListItemIcon>
              <ListItemText
                primary="Push-Benachrichtigungen"
                secondary="Echtzeit-Alerts für kritische Sicherheitsereignisse"
                primaryTypographyProps={{ fontWeight: 500, color: '#ffffff' }}
                secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}
              />
            </ListItem>

            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <SyncIcon sx={{ color: '#2196f3', fontSize: 24 }} />
              </ListItemIcon>
              <ListItemText
                primary="Automatische Synchronisation"
                secondary="Nahtlose Datensynchronisation im Hintergrund"
                primaryTypographyProps={{ fontWeight: 500, color: '#ffffff' }}
                secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}
              />
            </ListItem>

            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <SpeedIcon sx={{ color: '#9c27b0', fontSize: 24 }} />
              </ListItemIcon>
              <ListItemText
                primary="Schnellere Performance"
                secondary="Optimierte Ladezeiten und nahtlose Navigation"
                primaryTypographyProps={{ fontWeight: 500, color: '#ffffff' }}
                secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}
              />
            </ListItem>

            <ListItem sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                <SecurityIcon sx={{ color: '#f44336', fontSize: 24 }} />
              </ListItemIcon>
              <ListItemText
                primary="Enterprise-Security"
                secondary="MDM-kompatibel mit NIS-2, GDPR, ISO 27001 Compliance"
                primaryTypographyProps={{ fontWeight: 500, color: '#ffffff' }}
                secondaryTypographyProps={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem' }}
              />
            </ListItem>
          </List>
        </Box>

        <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1, p: 1.5 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            <strong>Tipp:</strong> Die App wird auf Ihrem Home-Bildschirm installiert
            und verhält sich wie eine native Anwendung mit vollständigem Offline-Zugriff.
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleRemindLater}
          sx={{
            color: 'rgba(255, 255, 255, 0.8)',
            '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
          }}
        >
          Später erinnern
        </Button>
        <Button
          onClick={handleInstall}
          variant="contained"
          startIcon={<InstallIcon />}
          disabled={installing}
          sx={{
            bgcolor: '#ffffff',
            color: '#00327c',
            fontWeight: 600,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.9)'
            }
          }}
        >
          {installing ? 'Installiere...' : 'Jetzt installieren'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PWAInstallPrompt;
