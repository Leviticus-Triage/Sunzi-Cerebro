import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface HealthMetricsChartProps {
  data: Array<{
    timestamp: string;
    responseTime: number;
    cpuUsage: number;
    memoryUsage: number;
  }>;
}

const HealthMetricsChart: React.FC<HealthMetricsChartProps> = ({ data }) => {
  const theme = useTheme();

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          System Health Metrics
        </Typography>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              style={{ fontSize: '0.8rem' }}
            />
            <YAxis style={{ fontSize: '0.8rem' }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="responseTime"
              stroke={theme.palette.primary.main}
              name="Response Time (ms)"
            />
            <Line
              type="monotone"
              dataKey="cpuUsage"
              stroke={theme.palette.secondary.main}
              name="CPU Usage (%)"
            />
            <Line
              type="monotone"
              dataKey="memoryUsage"
              stroke={theme.palette.error.main}
              name="Memory Usage (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default HealthMetricsChart;