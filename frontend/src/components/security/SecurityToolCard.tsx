import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Button,
  Typography,
  Chip,
  Box
} from '@mui/material';
import { PlayArrow, Stop } from '@mui/icons-material';

interface SecurityToolCardProps {
  tool: {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'inactive';
    version: string;
  };
  onToggle: (id: string) => void;
}

const SecurityToolCard: React.FC<SecurityToolCardProps> = ({
  tool,
  onToggle
}) => {
  const { id, name, description, status, version } = tool;

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2
          }}
        >
          <Typography variant="h6" component="div">
            {name}
          </Typography>
          <Chip
            label={status}
            color={status === 'active' ? 'success' : 'default'}
            size="small"
          />
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 2 }}
        >
          {description}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Version: {version}
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          startIcon={status === 'active' ? <Stop /> : <PlayArrow />}
          onClick={() => onToggle(id)}
          color={status === 'active' ? 'error' : 'success'}
        >
          {status === 'active' ? 'Stop' : 'Start'}
        </Button>
      </CardActions>
    </Card>
  );
};

export default SecurityToolCard;