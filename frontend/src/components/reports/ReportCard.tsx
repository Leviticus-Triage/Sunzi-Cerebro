import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton
} from '@mui/material';
import {
  Download as DownloadIcon,
  DeleteOutline as DeleteIcon
} from '@mui/icons-material';

interface Report {
  id: string;
  title: string;
  timestamp: string;
  type: string;
  status: string;
  size: string;
}

interface ReportCardProps {
  report: Report;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'success';
    case 'in progress':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};

const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onDownload,
  onDelete
}) => {
  const { id, title, timestamp, type, status, size } = report;

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2
          }}
        >
          <Typography variant="h6" component="div" noWrap>
            {title}
          </Typography>
          <Chip
            label={status}
            color={getStatusColor(status)}
            size="small"
          />
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          gutterBottom
        >
          Type: {type}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Generated: {timestamp}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Size: {size}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            mt: 2
          }}
        >
          <IconButton
            size="small"
            onClick={() => onDownload(id)}
            sx={{ mr: 1 }}
          >
            <DownloadIcon />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onDelete(id)}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ReportCard;