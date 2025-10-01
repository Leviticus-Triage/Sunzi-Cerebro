import React, { useState } from 'react';
import {
  Grid,
  Typography,
  Box,
  Button,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import ReportCard from './ReportCard';

interface Report {
  id: string;
  title: string;
  timestamp: string;
  type: string;
  status: string;
  size: string;
}

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([
    {
      id: 'report-1',
      title: 'Weekly Security Scan Report',
      timestamp: '2024-03-10 15:30',
      type: 'Security Scan',
      status: 'Completed',
      size: '2.5 MB'
    },
    {
      id: 'report-2',
      title: 'System Health Analysis',
      timestamp: '2024-03-09 10:15',
      type: 'Health Check',
      status: 'Completed',
      size: '1.8 MB'
    },
    // Add more reports...
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [newReport, setNewReport] = useState({
    title: '',
    type: '',
    status: ''
  });

  const handleDownload = (id: string) => {
    // Implement download logic
    console.log('Downloading report:', id);
  };

  const handleDelete = (id: string) => {
    setReports(reports.filter(report => report.id !== id));
  };

  const handleGenerateReport = () => {
    const report: Report = {
      id: `report-${Date.now()}`,
      title: newReport.title,
      timestamp: new Date().toLocaleString(),
      type: newReport.type,
      status: 'In Progress',
      size: 'Calculating...'
    };
    setReports([report, ...reports]);
    setNewReport({ title: '', type: '', status: '' });
    setOpenDialog(false);
  };

  const filteredReports = reports.filter(report =>
    report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Reports
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}
        >
          <TextField
            placeholder="Search reports..."
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              )
            }}
            sx={{ width: 300 }}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Generate Report
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {filteredReports.map((report) => (
          <Grid item key={report.id} xs={12} sm={6} md={4}>
            <ReportCard
              report={report}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Generate New Report</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Report Title"
            fullWidth
            value={newReport.title}
            onChange={(e) =>
              setNewReport({ ...newReport, title: e.target.value })
            }
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Report Type</InputLabel>
            <Select
              value={newReport.type}
              label="Report Type"
              onChange={(e) =>
                setNewReport({ ...newReport, type: e.target.value })
              }
            >
              <MenuItem value="Security Scan">Security Scan</MenuItem>
              <MenuItem value="Health Check">Health Check</MenuItem>
              <MenuItem value="Performance Analysis">
                Performance Analysis
              </MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleGenerateReport}
            variant="contained"
            disabled={!newReport.title || !newReport.type}
          >
            Generate
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReportsPage;