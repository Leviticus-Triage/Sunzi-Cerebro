import React from 'react';
import { Grid } from '@mui/material';
import {
  Security,
  Speed,
  Check,
  Warning
} from '@mui/icons-material';
import StatsCard from './StatsCard';
import HealthMetricsChart from './HealthMetricsChart';
import RecentScansTable from './RecentScansTable';

const mockHealthData = [
  {
    timestamp: '10:00',
    responseTime: 150,
    cpuUsage: 45,
    memoryUsage: 60
  },
  // Add more mock data points...
];

const mockScans = [
  {
    id: 'scan-001',
    tool: 'AttackMCP',
    timestamp: '2024-03-10 15:30',
    status: 'Completed',
    findings: 3
  },
  // Add more mock scan results...
];

const Dashboard: React.FC = () => {
  return (
    <Grid container spacing={3}>
      {/* Stats Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <StatsCard
          title="Active Security Tools"
          value={4}
          icon={<Security />}
          color="primary.main"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatsCard
          title="Average Response Time"
          value="150ms"
          icon={<Speed />}
          color="secondary.main"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatsCard
          title="Successful Scans"
          value={15}
          icon={<Check />}
          color="success.main"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatsCard
          title="Security Issues"
          value={3}
          icon={<Warning />}
          color="error.main"
        />
      </Grid>

      {/* Health Metrics Chart */}
      <Grid item xs={12}>
        <HealthMetricsChart data={mockHealthData} />
      </Grid>

      {/* Recent Scans Table */}
      <Grid item xs={12}>
        <RecentScansTable scans={mockScans} />
      </Grid>
    </Grid>
  );
};

export default Dashboard;