/**
 * Scans API Routes
 * Security scan management and history
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// In-memory scan storage (will be replaced with database later)
const scans = [
  {
    id: 'scan-001',
    name: 'Production Network Scan',
    target: '192.168.1.0/24',
    status: 'completed',
    progress: 100,
    vulnerabilities: 8,
    startTime: '2025-10-01 12:30:00',
    endTime: '2025-10-01 13:15:00',
    duration: '45 minutes',
    tool: 'nmap',
    findings: {
      critical: 1,
      high: 2,
      medium: 3,
      low: 2
    }
  },
  {
    id: 'scan-002',
    name: 'Web Application Security Test',
    target: 'https://app.example.com',
    status: 'running',
    progress: 67,
    vulnerabilities: 3,
    startTime: '2025-10-01 14:00:00',
    estimatedEnd: '15:30:00',
    tool: 'burpsuite',
    findings: {
      critical: 0,
      high: 1,
      medium: 2,
      low: 0
    }
  },
  {
    id: 'scan-003',
    name: 'Vulnerability Assessment - DMZ',
    target: 'dmz.corp.local',
    status: 'scheduled',
    progress: 0,
    vulnerabilities: 0,
    startTime: '2025-10-01 16:00:00',
    estimatedEnd: '17:00:00',
    tool: 'openvas'
  },
  {
    id: 'scan-004',
    name: 'Port Scan - External Perimeter',
    target: 'external.example.com',
    status: 'completed',
    progress: 100,
    vulnerabilities: 5,
    startTime: '2025-10-01 09:00:00',
    endTime: '2025-10-01 09:45:00',
    duration: '45 minutes',
    tool: 'masscan',
    findings: {
      critical: 0,
      high: 1,
      medium: 2,
      low: 2
    }
  },
  {
    id: 'scan-005',
    name: 'SSL/TLS Configuration Check',
    target: 'api.example.com',
    status: 'failed',
    progress: 35,
    vulnerabilities: 0,
    startTime: '2025-10-01 11:00:00',
    endTime: '2025-10-01 11:20:00',
    error: 'Connection timeout - target unreachable',
    tool: 'sslscan'
  }
];

/**
 * GET /api/scans/recent
 * Get recent scans with status and results
 */
router.get('/recent', asyncHandler(async (req, res) => {
  const { limit = 10, status } = req.query;

  let recentScans = [...scans];

  // Filter by status if provided
  if (status) {
    recentScans = recentScans.filter(scan => scan.status === status);
  }

  // Sort by start time (most recent first)
  recentScans.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  // Limit results
  recentScans = recentScans.slice(0, parseInt(limit));

  // Calculate summary statistics
  const totalCompleted = scans.filter(s => s.status === 'completed').length;
  const totalRunning = scans.filter(s => s.status === 'running').length;
  const totalScheduled = scans.filter(s => s.status === 'scheduled').length;
  const totalFailed = scans.filter(s => s.status === 'failed').length;
  const totalVulnerabilities = scans
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + (s.vulnerabilities || 0), 0);

  res.json({
    success: true,
    data: {
      recent: recentScans,
      totalCompleted,
      totalRunning,
      totalScheduled,
      totalFailed,
      totalScans: scans.length,
      totalVulnerabilities
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/scans/:scanId
 * Get detailed information about a specific scan
 */
router.get('/:scanId', asyncHandler(async (req, res) => {
  const { scanId } = req.params;
  const scan = scans.find(s => s.id === scanId);

  if (!scan) {
    return res.status(404).json({
      success: false,
      error: `Scan with ID '${scanId}' not found`,
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    data: scan,
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/scans
 * Get all scans with filtering and pagination
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    status,
    tool,
    page = 1,
    limit = 20,
    sortBy = 'startTime',
    sortOrder = 'desc'
  } = req.query;

  let filteredScans = [...scans];

  // Apply filters
  if (status) {
    filteredScans = filteredScans.filter(s => s.status === status);
  }
  if (tool) {
    filteredScans = filteredScans.filter(s => s.tool === tool);
  }

  // Sort
  filteredScans.sort((a, b) => {
    const aVal = a[sortBy] || '';
    const bVal = b[sortBy] || '';

    if (sortOrder === 'desc') {
      return bVal > aVal ? 1 : -1;
    }
    return aVal > bVal ? 1 : -1;
  });

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedScans = filteredScans.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      scans: paginatedScans,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: filteredScans.length,
        total_pages: Math.ceil(filteredScans.length / limit),
        has_next: endIndex < filteredScans.length,
        has_prev: page > 1
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * POST /api/scans
 * Create a new scan
 */
router.post('/', asyncHandler(async (req, res) => {
  const { name, target, tool, options } = req.body;

  if (!name || !target || !tool) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: name, target, tool',
      timestamp: new Date().toISOString()
    });
  }

  const newScan = {
    id: `scan-${Date.now()}`,
    name,
    target,
    tool,
    status: 'scheduled',
    progress: 0,
    vulnerabilities: 0,
    startTime: new Date().toISOString(),
    options: options || {}
  };

  scans.unshift(newScan);

  res.status(201).json({
    success: true,
    message: 'Scan created successfully',
    data: newScan,
    timestamp: new Date().toISOString()
  });
}));

/**
 * DELETE /api/scans/:scanId
 * Delete a scan
 */
router.delete('/:scanId', asyncHandler(async (req, res) => {
  const { scanId } = req.params;
  const index = scans.findIndex(s => s.id === scanId);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: `Scan with ID '${scanId}' not found`,
      timestamp: new Date().toISOString()
    });
  }

  scans.splice(index, 1);

  res.json({
    success: true,
    message: 'Scan deleted successfully',
    timestamp: new Date().toISOString()
  });
}));

export default router;
