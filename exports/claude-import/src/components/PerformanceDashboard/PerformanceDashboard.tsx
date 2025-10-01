/**
 * Performance Dashboard Component
 * Real-time performance monitoring and SLA validation dashboard
 *
 * Features:
 * - Live performance metrics (P50, P95, P99)
 * - Availability tracking
 * - Circuit breaker status
 * - Cache performance
 * - Cost tracking
 * - SLA compliance indicators
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Divider,
  Button
} from '@mui/material';
import {
  Speed as SpeedIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Memory as CacheIcon,
  AttachMoney as CostIcon,
  Refresh as RefreshIcon,
  Timeline as MetricsIcon,
  Storage as CircuitIcon
} from '@mui/icons-material';
import axios from 'axios';

// Types
interface PerformanceMetrics {
  timestamp: number;
  uptime: {
    ms: number;
    formatted: string;
  };
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
    avg: number;
    min: number;
    max: number;
  };
  availability: {
    percentage: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
  };
  throughput: {
    requestsPerSecond: number;
    peakRPS: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  costs: {
    total: number;
    perRequest: number;
    budget: number;
    remaining: number;
  };
  sla: {
    targets: {
      responseTime: {
        p50: number;
        p95: number;
        p99: number;
      };
      availability: number;
      errorRate: number;
    };
    compliance: {
      compliant: boolean;
      violations: any[];
    };
  };
  providers: Array<{
    name: string;
    availability: number;
    avgDuration: number;
    requests: number;
    circuitBreaker?: {
      state: string;
      failures: number;
    };
  }>;
  alerts: Array<{
    severity: string;
    type: string;
    message: string;
    recommendation: string;
  }>;
}

const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch metrics
  const fetchMetrics = async () => {
    try {
      const response = await axios.get('http://localhost:8890/api/performance/metrics');
      setMetrics(response.data.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching performance metrics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Metric Card Component
  const MetricCard = ({ title, value, unit, target, icon, trend }: any) => {
    const isWithinTarget = target ? value <= target : true;
    const percentOfTarget = target ? (value / target) * 100 : 0;

    return (
      <Card elevation={3}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ mr: 2, color: isWithinTarget ? 'success.main' : 'error.main' }}>
              {icon}
            </Box>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {typeof value === 'number' ? value.toFixed(value < 10 ? 2 : 0) : value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {unit}
                </Typography>
                {trend && (
                  <Box sx={{ ml: 1 }}>
                    {trend === 'up' ? (
                      <TrendingUpIcon color="error" fontSize="small" />
                    ) : (
                      <TrendingDownIcon color="success" fontSize="small" />
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          {target && (
            <>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, percentOfTarget)}
                color={isWithinTarget ? 'success' : 'error'}
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                Target: {target}{unit} {isWithinTarget ? '✅' : '❌'}
              </Typography>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading && !metrics) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading performance metrics...</Typography>
      </Box>
    );
  }

  if (error && !metrics) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load performance metrics: {error}
        </Alert>
      </Box>
    );
  }

  if (!metrics) return null;

  const slaCompliant = metrics.sla.compliance.compliant;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Performance Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Uptime: {metrics.uptime.formatted}
            </Typography>
            <Chip
              label={slaCompliant ? 'SLA Compliant' : 'SLA Violations'}
              color={slaCompliant ? 'success' : 'error'}
              size="small"
              icon={slaCompliant ? <CheckIcon /> : <ErrorIcon />}
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto-refresh"
          />
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchMetrics}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {metrics.alerts && metrics.alerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {metrics.alerts.map((alert, index) => (
            <Alert
              key={index}
              severity={alert.severity as any}
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {alert.message}
              </Typography>
              <Typography variant="body2">
                {alert.recommendation}
              </Typography>
            </Alert>
          ))}
        </Box>
      )}

      {/* Key Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="P95 Response Time"
            value={metrics.responseTime.p95}
            unit="ms"
            target={metrics.sla.targets.responseTime.p95}
            icon={<SpeedIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="P99 Response Time"
            value={metrics.responseTime.p99}
            unit="ms"
            target={metrics.sla.targets.responseTime.p99}
            icon={<SpeedIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Availability"
            value={metrics.availability.percentage}
            unit="%"
            target={metrics.sla.targets.availability}
            icon={<CheckIcon />}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Throughput"
            value={metrics.throughput.requestsPerSecond}
            unit=" RPS"
            icon={<MetricsIcon />}
          />
        </Grid>
      </Grid>

      {/* Response Time Details */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Response Time Distribution
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { label: 'Min', value: metrics.responseTime.min },
                  { label: 'P50 (Median)', value: metrics.responseTime.p50 },
                  { label: 'Average', value: metrics.responseTime.avg },
                  { label: 'P95', value: metrics.responseTime.p95 },
                  { label: 'P99', value: metrics.responseTime.p99 },
                  { label: 'Max', value: metrics.responseTime.max }
                ].map((item) => (
                  <Box key={item.label}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2">{item.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.value.toFixed(2)}ms
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(100, (item.value / metrics.responseTime.max) * 100)}
                      sx={{ height: 6, borderRadius: 3 }}
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Cache Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <CacheIcon sx={{ mr: 1 }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Cache Performance
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Hit Rate
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {metrics.cache.hitRate.toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Hits
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {metrics.cache.hits.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Misses
                  </Typography>
                  <Typography variant="h5">
                    {metrics.cache.misses.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Efficiency
                  </Typography>
                  <Chip
                    label={metrics.cache.hitRate > 80 ? 'Excellent' : metrics.cache.hitRate > 60 ? 'Good' : 'Needs Improvement'}
                    color={metrics.cache.hitRate > 80 ? 'success' : metrics.cache.hitRate > 60 ? 'warning' : 'error'}
                    size="small"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Provider Status */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Provider Performance & Circuit Breakers
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Provider</TableCell>
                  <TableCell align="right">Requests</TableCell>
                  <TableCell align="right">Availability</TableCell>
                  <TableCell align="right">Avg Response</TableCell>
                  <TableCell align="center">Circuit Breaker</TableCell>
                  <TableCell align="center">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {metrics.providers.map((provider) => {
                  const circuitState = provider.circuitBreaker?.state || 'closed';
                  const isHealthy = provider.availability > 95 && circuitState === 'closed';

                  return (
                    <TableRow key={provider.name}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {provider.name}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {provider.requests.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          color={provider.availability > 99 ? 'success.main' : provider.availability > 95 ? 'warning.main' : 'error.main'}
                          sx={{ fontWeight: 600 }}
                        >
                          {provider.availability.toFixed(2)}%
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {provider.avgDuration.toFixed(0)}ms
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={circuitState.toUpperCase()}
                          color={
                            circuitState === 'closed' ? 'success' :
                            circuitState === 'half-open' ? 'warning' : 'error'
                          }
                          size="small"
                          icon={<CircuitIcon />}
                        />
                      </TableCell>
                      <TableCell align="center">
                        {isHealthy ? (
                          <CheckIcon color="success" />
                        ) : (
                          <WarningIcon color="warning" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Cost Tracking */}
      {metrics.costs.budget > 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CostIcon sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Cost Tracking
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Total Cost
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  ${metrics.costs.total.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Per Request
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  ${metrics.costs.perRequest.toFixed(4)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Budget
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  ${metrics.costs.budget.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2" color="text.secondary">
                  Remaining
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    color: metrics.costs.remaining > 0 ? 'success.main' : 'error.main'
                  }}
                >
                  ${metrics.costs.remaining.toFixed(2)}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, (metrics.costs.total / metrics.costs.budget) * 100)}
                  color={metrics.costs.remaining > 0 ? 'primary' : 'error'}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* SLA Compliance Details */}
      {!slaCompliant && metrics.sla.compliance.violations.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'error.main' }}>
              SLA Violations
            </Typography>
            {metrics.sla.compliance.violations.map((violation: any, index: number) => (
              <Alert key={index} severity={violation.severity} sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {violation.type.replace(/_/g, ' ').toUpperCase()}
                </Typography>
                <Typography variant="body2">
                  Current: {typeof violation.current === 'number' ? violation.current.toFixed(2) : violation.current}
                  {' '} / Target: {typeof violation.target === 'number' ? violation.target.toFixed(2) : violation.target}
                </Typography>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PerformanceDashboard;