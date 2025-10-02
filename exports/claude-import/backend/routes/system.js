/**
 * System Information and Monitoring Routes
 * Provides system health, performance metrics, and monitoring data
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { SystemService } from '../services/SystemService.js';

const router = express.Router();
const systemService = new SystemService();

// Get system information
router.get('/info', asyncHandler(async (req, res) => {
  const info = await systemService.getSystemInfo();
  
  res.json({
    success: true,
    data: {
      platform: info.platform,
      architecture: info.arch,
      cpus: info.cpus,
      memory: info.memory,
      uptime: info.uptime,
      nodejs: info.nodejs,
      hostname: info.hostname,
      username: info.username,
      shell: info.shell,
      environment: info.environment
    },
    timestamp: new Date().toISOString()
  });
}));

// Get system health status
router.get('/health', asyncHandler(async (req, res) => {
  const health = await systemService.getHealthStatus();
  
  res.json({
    success: true,
    data: {
      overall: health.overall,
      cpu: health.cpu,
      memory: health.memory,
      disk: health.disk,
      network: health.network,
      services: health.services,
      lastCheck: health.lastCheck,
      issues: health.issues
    },
    timestamp: new Date().toISOString()
  });
}));

// Get real-time system metrics
router.get('/metrics', asyncHandler(async (req, res) => {
  const { timeframe = '1h' } = req.query;
  const metrics = await systemService.getMetrics(timeframe);
  
  res.json({
    success: true,
    data: {
      timeframe,
      current: {
        cpu: metrics.current.cpu,
        memory: metrics.current.memory,
        disk: metrics.current.disk,
        network: metrics.current.network,
        processes: metrics.current.processes
      },
      history: metrics.history,
      trends: metrics.trends
    },
    timestamp: new Date().toISOString()
  });
}));

// Get process information
router.get('/processes', asyncHandler(async (req, res) => {
  const { limit = 20, sortBy = 'cpu' } = req.query;
  const processes = await systemService.getProcesses({
    limit: parseInt(limit),
    sortBy
  });
  
  res.json({
    success: true,
    data: {
      processes: processes.list,
      totalCount: processes.total,
      systemLoad: processes.systemLoad,
      memoryUsage: processes.memoryUsage
    },
    timestamp: new Date().toISOString()
  });
}));

// Get disk usage information
router.get('/disk', asyncHandler(async (req, res) => {
  const diskInfo = await systemService.getDiskInfo();
  
  res.json({
    success: true,
    data: {
      disks: diskInfo.disks.map(disk => ({
        filesystem: disk.filesystem,
        size: disk.size,
        used: disk.used,
        available: disk.available,
        usagePercent: disk.usagePercent,
        mountpoint: disk.mountpoint
      })),
      totalDisk: diskInfo.total,
      warnings: diskInfo.warnings
    },
    timestamp: new Date().toISOString()
  });
}));

// Get network information
router.get('/network', asyncHandler(async (req, res) => {
  const networkInfo = await systemService.getNetworkInfo();
  
  res.json({
    success: true,
    data: {
      interfaces: networkInfo.interfaces.map(iface => ({
        name: iface.name,
        type: iface.type,
        ip4: iface.ip4,
        ip6: iface.ip6,
        mac: iface.mac,
        status: iface.status,
        speed: iface.speed,
        duplex: iface.duplex
      })),
      connections: networkInfo.connections,
      statistics: networkInfo.statistics
    },
    timestamp: new Date().toISOString()
  });
}));

// Get service status
router.get('/services', asyncHandler(async (req, res) => {
  const services = await systemService.getServicesStatus();
  
  res.json({
    success: true,
    data: {
      services: services.map(service => ({
        name: service.name,
        status: service.status,
        pid: service.pid,
        cpu: service.cpu,
        memory: service.memory,
        uptime: service.uptime,
        port: service.port,
        description: service.description
      })),
      runningCount: services.filter(s => s.status === 'running').length,
      stoppedCount: services.filter(s => s.status === 'stopped').length,
      errorCount: services.filter(s => s.status === 'error').length
    },
    timestamp: new Date().toISOString()
  });
}));

// Get system logs
router.get('/logs', asyncHandler(async (req, res) => {
  const { limit = 100, level = 'all', service } = req.query;
  
  const logs = await systemService.getSystemLogs({
    limit: parseInt(limit),
    level,
    service
  });
  
  res.json({
    success: true,
    data: {
      logs: logs.entries,
      totalCount: logs.total,
      level,
      service: service || 'all'
    },
    timestamp: new Date().toISOString()
  });
}));

// Start system service
router.post('/services/:serviceName/start', asyncHandler(async (req, res) => {
  const { serviceName } = req.params;
  const result = await systemService.startService(serviceName);
  
  res.json({
    success: result.success,
    message: result.message,
    data: {
      service: serviceName,
      status: result.status,
      pid: result.pid
    },
    timestamp: new Date().toISOString()
  });
}));

// Stop system service
router.post('/services/:serviceName/stop', asyncHandler(async (req, res) => {
  const { serviceName } = req.params;
  const result = await systemService.stopService(serviceName);
  
  res.json({
    success: result.success,
    message: result.message,
    data: {
      service: serviceName,
      status: result.status
    },
    timestamp: new Date().toISOString()
  });
}));

// Restart system service
router.post('/services/:serviceName/restart', asyncHandler(async (req, res) => {
  const { serviceName } = req.params;
  const result = await systemService.restartService(serviceName);
  
  res.json({
    success: result.success,
    message: result.message,
    data: {
      service: serviceName,
      status: result.status,
      pid: result.pid
    },
    timestamp: new Date().toISOString()
  });
}));

// Get environment variables
router.get('/environment', asyncHandler(async (req, res) => {
  const { filter } = req.query;
  const env = await systemService.getEnvironment(filter);
  
  res.json({
    success: true,
    data: {
      variables: env.variables,
      filtered: !!filter,
      count: Object.keys(env.variables).length
    },
    timestamp: new Date().toISOString()
  });
}));

// Monitor system resources in real-time
router.get('/monitor', asyncHandler(async (req, res) => {
  // Set up server-sent events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const cleanup = systemService.startMonitoring((data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
  
  // Handle client disconnect
  req.on('close', () => {
    cleanup();
  });
}));

// Get system alerts
router.get('/alerts', asyncHandler(async (req, res) => {
  const { severity = 'all', limit = 50 } = req.query;
  const alerts = await systemService.getAlerts({
    severity,
    limit: parseInt(limit)
  });
  
  res.json({
    success: true,
    data: {
      alerts: alerts.list,
      summary: alerts.summary,
      severity,
      count: alerts.count
    },
    timestamp: new Date().toISOString()
  });
}));

// Clear system alerts
router.delete('/alerts', asyncHandler(async (req, res) => {
  const { ids } = req.body;
  const result = await systemService.clearAlerts(ids);
  
  res.json({
    success: result.success,
    message: result.message,
    data: {
      clearedCount: result.clearedCount,
      remainingCount: result.remainingCount
    },
    timestamp: new Date().toISOString()
  });
}));

// System backup status
router.get('/backup', asyncHandler(async (req, res) => {
  const backupStatus = await systemService.getBackupStatus();
  
  res.json({
    success: true,
    data: {
      lastBackup: backupStatus.lastBackup,
      nextBackup: backupStatus.nextBackup,
      backupSize: backupStatus.backupSize,
      status: backupStatus.status,
      backupCount: backupStatus.backupCount,
      configuration: backupStatus.configuration
    },
    timestamp: new Date().toISOString()
  });
}));

// Trigger system backup
router.post('/backup', asyncHandler(async (req, res) => {
  const { type = 'incremental', description } = req.body;
  const result = await systemService.createBackup({ type, description });
  
  res.json({
    success: result.success,
    message: result.message,
    data: {
      backupId: result.backupId,
      size: result.size,
      duration: result.duration,
      type
    },
    timestamp: new Date().toISOString()
  });
}));

export default router;