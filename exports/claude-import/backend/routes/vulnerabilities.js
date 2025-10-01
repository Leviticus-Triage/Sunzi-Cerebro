/**
 * Vulnerabilities API Routes
 * Vulnerability tracking and management
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// In-memory vulnerability storage (will be replaced with database later)
const vulnerabilities = [
  {
    id: 'vuln-001',
    title: 'SQL Injection in Login Form',
    severity: 'critical',
    cvss: 9.8,
    status: 'open',
    target: 'https://app.example.com/login',
    discoveredBy: 'Web Application Scan',
    discoveredAt: '2025-10-01 14:15:00',
    description: 'The login form is vulnerable to SQL injection attacks through the username parameter.',
    impact: 'Complete database compromise, data theft, authentication bypass',
    recommendation: 'Implement parameterized queries and input validation',
    cve: 'CVE-2024-XXXXX',
    cwe: 'CWE-89'
  },
  {
    id: 'vuln-002',
    title: 'Outdated OpenSSL Version',
    severity: 'high',
    cvss: 8.1,
    status: 'open',
    target: 'api.example.com',
    discoveredBy: 'SSL/TLS Configuration Check',
    discoveredAt: '2025-10-01 13:30:00',
    description: 'Server is running OpenSSL 1.0.1 which has known critical vulnerabilities',
    impact: 'SSL/TLS connection compromise, man-in-the-middle attacks',
    recommendation: 'Update OpenSSL to version 3.0+ immediately',
    cve: 'CVE-2014-0160 (Heartbleed)',
    cwe: 'CWE-327'
  },
  {
    id: 'vuln-003',
    title: 'Open SMB Ports on Production Server',
    severity: 'high',
    cvss: 7.5,
    status: 'in_progress',
    target: '192.168.1.50',
    discoveredBy: 'Production Network Scan',
    discoveredAt: '2025-10-01 12:45:00',
    description: 'SMB ports (445, 139) are exposed to the internet',
    impact: 'Potential for ransomware attacks, unauthorized file access',
    recommendation: 'Close SMB ports or restrict access to internal network only',
    cve: null,
    cwe: 'CWE-200'
  },
  {
    id: 'vuln-004',
    title: 'Cross-Site Scripting (XSS) in Search',
    severity: 'medium',
    cvss: 6.1,
    status: 'open',
    target: 'https://app.example.com/search',
    discoveredBy: 'Web Application Scan',
    discoveredAt: '2025-10-01 14:22:00',
    description: 'Search functionality does not properly sanitize user input',
    impact: 'Session hijacking, credential theft, malicious redirects',
    recommendation: 'Implement output encoding and Content Security Policy',
    cve: null,
    cwe: 'CWE-79'
  },
  {
    id: 'vuln-005',
    title: 'Weak Password Policy',
    severity: 'medium',
    cvss: 5.3,
    status: 'open',
    target: 'User Authentication System',
    discoveredBy: 'Manual Security Review',
    discoveredAt: '2025-10-01 11:00:00',
    description: 'Password policy allows short passwords without complexity requirements',
    impact: 'Increased risk of brute force attacks and credential stuffing',
    recommendation: 'Enforce minimum 12 characters with complexity requirements',
    cve: null,
    cwe: 'CWE-521'
  },
  {
    id: 'vuln-006',
    title: 'Directory Listing Enabled',
    severity: 'medium',
    cvss: 5.0,
    status: 'resolved',
    target: 'https://app.example.com/assets/',
    discoveredBy: 'Web Application Scan',
    discoveredAt: '2025-09-28 10:15:00',
    resolvedAt: '2025-09-30 16:30:00',
    description: 'Web server allows directory listing exposing file structure',
    impact: 'Information disclosure, easier reconnaissance for attackers',
    recommendation: 'Disable directory listing in web server configuration',
    cve: null,
    cwe: 'CWE-548'
  },
  {
    id: 'vuln-007',
    title: 'Missing Security Headers',
    severity: 'low',
    cvss: 3.7,
    status: 'open',
    target: 'https://app.example.com',
    discoveredBy: 'Security Header Analysis',
    discoveredAt: '2025-10-01 09:30:00',
    description: 'Missing X-Frame-Options, X-Content-Type-Options, and CSP headers',
    impact: 'Increased vulnerability to clickjacking and MIME-type attacks',
    recommendation: 'Add security headers to web server configuration',
    cve: null,
    cwe: 'CWE-693'
  },
  {
    id: 'vuln-008',
    title: 'Outdated jQuery Library',
    severity: 'low',
    cvss: 4.3,
    status: 'open',
    target: 'https://app.example.com',
    discoveredBy: 'Client-Side Security Scan',
    discoveredAt: '2025-10-01 14:30:00',
    description: 'Application uses jQuery 1.8.3 which has known vulnerabilities',
    impact: 'Potential XSS vulnerabilities through jQuery',
    recommendation: 'Update jQuery to latest stable version (3.7.1+)',
    cve: 'CVE-2015-9251',
    cwe: 'CWE-79'
  }
];

/**
 * GET /api/vulnerabilities/summary
 * Get vulnerability summary and statistics
 */
router.get('/summary', asyncHandler(async (req, res) => {
  // Calculate breakdown by severity
  const breakdown = {
    critical: vulnerabilities.filter(v => v.severity === 'critical').length,
    high: vulnerabilities.filter(v => v.severity === 'high').length,
    medium: vulnerabilities.filter(v => v.severity === 'medium').length,
    low: vulnerabilities.filter(v => v.severity === 'low').length
  };

  // Calculate status breakdown
  const statusBreakdown = {
    open: vulnerabilities.filter(v => v.status === 'open').length,
    in_progress: vulnerabilities.filter(v => v.status === 'in_progress').length,
    resolved: vulnerabilities.filter(v => v.status === 'resolved').length,
    false_positive: vulnerabilities.filter(v => v.status === 'false_positive').length
  };

  // Calculate risk score (weighted by severity)
  const weights = { critical: 10, high: 7, medium: 4, low: 2 };
  const totalWeight =
    breakdown.critical * weights.critical +
    breakdown.high * weights.high +
    breakdown.medium * weights.medium +
    breakdown.low * weights.low;
  const maxPossibleWeight = vulnerabilities.length * weights.critical;
  const riskScore = maxPossibleWeight > 0
    ? Math.round((totalWeight / maxPossibleWeight) * 100)
    : 0;

  // Top vulnerable targets
  const targetCounts = {};
  vulnerabilities.forEach(v => {
    targetCounts[v.target] = (targetCounts[v.target] || 0) + 1;
  });
  const topTargets = Object.entries(targetCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([target, count]) => ({ target, count }));

  // Recent discoveries (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentDiscoveries = vulnerabilities.filter(v =>
    new Date(v.discoveredAt) > sevenDaysAgo
  ).length;

  res.json({
    success: true,
    data: {
      total: vulnerabilities.length,
      breakdown,
      statusBreakdown,
      riskScore,
      topTargets,
      recentDiscoveries,
      averageCvss: (
        vulnerabilities.reduce((sum, v) => sum + v.cvss, 0) / vulnerabilities.length
      ).toFixed(1),
      trend: {
        weeklyChange: '+12%',
        direction: 'increasing'
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/vulnerabilities
 * Get all vulnerabilities with filtering and pagination
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    severity,
    status,
    target,
    page = 1,
    limit = 20,
    sortBy = 'cvss',
    sortOrder = 'desc'
  } = req.query;

  let filtered = [...vulnerabilities];

  // Apply filters
  if (severity) {
    filtered = filtered.filter(v => v.severity === severity);
  }
  if (status) {
    filtered = filtered.filter(v => v.status === status);
  }
  if (target) {
    filtered = filtered.filter(v => v.target.includes(target));
  }

  // Sort
  filtered.sort((a, b) => {
    const aVal = a[sortBy] || 0;
    const bVal = b[sortBy] || 0;
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginated = filtered.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      vulnerabilities: paginated,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_items: filtered.length,
        total_pages: Math.ceil(filtered.length / limit),
        has_next: endIndex < filtered.length,
        has_prev: page > 1
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * GET /api/vulnerabilities/:vulnId
 * Get detailed information about a specific vulnerability
 */
router.get('/:vulnId', asyncHandler(async (req, res) => {
  const { vulnId } = req.params;
  const vuln = vulnerabilities.find(v => v.id === vulnId);

  if (!vuln) {
    return res.status(404).json({
      success: false,
      error: `Vulnerability with ID '${vulnId}' not found`,
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    data: vuln,
    timestamp: new Date().toISOString()
  });
}));

/**
 * PATCH /api/vulnerabilities/:vulnId/status
 * Update vulnerability status
 */
router.patch('/:vulnId/status', asyncHandler(async (req, res) => {
  const { vulnId } = req.params;
  const { status } = req.body;

  const vuln = vulnerabilities.find(v => v.id === vulnId);

  if (!vuln) {
    return res.status(404).json({
      success: false,
      error: `Vulnerability with ID '${vulnId}' not found`,
      timestamp: new Date().toISOString()
    });
  }

  const validStatuses = ['open', 'in_progress', 'resolved', 'false_positive'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      timestamp: new Date().toISOString()
    });
  }

  vuln.status = status;
  if (status === 'resolved') {
    vuln.resolvedAt = new Date().toISOString();
  }

  res.json({
    success: true,
    message: 'Vulnerability status updated',
    data: vuln,
    timestamp: new Date().toISOString()
  });
}));

export default router;
