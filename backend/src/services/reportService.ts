import { v4 as uuidv4 } from 'uuid';
import { ScanResult } from './scanService';

export type ReportType = 'vulnerability' | 'compliance' | 'network' | 'executive';
export type ReportStatus = 'draft' | 'generating' | 'completed' | 'archived';

export interface ReportConfig {
  type: ReportType;
  title: string;
  description?: string;
  period?: {
    start: Date;
    end: Date;
  };
  includeScans?: string[]; // Scan IDs to include
  format?: 'pdf' | 'html';
}

interface Finding {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'closed' | 'in-progress';
  detectedAt: Date;
  updatedAt?: Date;
  closedAt?: Date;
  scanId?: string;
  evidence?: string;
  remediation?: string;
}

interface Metric {
  name: string;
  value: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  previousValue?: number;
  targetValue?: number;
}

export interface Report {
  id: string;
  config: ReportConfig;
  status: ReportStatus;
  findings: Finding[];
  metrics: Metric[];
  summary: {
    findings: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      total: number;
    };
    complianceScore?: number;
    riskLevel?: string;
    recommendations: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  generatedAt?: Date;
  generatedBy?: string;
}

const reports = new Map<string, Report>();

export const createReport = (config: ReportConfig): Report => {
  const report: Report = {
    id: uuidv4(),
    config,
    status: 'draft',
    findings: [],
    metrics: [],
    summary: {
      findings: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
      recommendations: []
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  reports.set(report.id, report);
  return report;
};

export const getReport = (id: string): Report | undefined => {
  return reports.get(id);
};

export const listReports = (): Report[] => {
  return Array.from(reports.values());
};

export const updateReport = (
  id: string,
  updates: {
    status?: ReportStatus;
    findings?: Finding[];
    metrics?: Metric[];
    summary?: Report['summary'];
    generatedAt?: Date;
    generatedBy?: string;
  }
): Report | undefined => {
  const report = reports.get(id);
  if (!report) return undefined;

  Object.assign(report, {
    ...updates,
    updatedAt: new Date()
  });

  // If status changes to completed, set generation timestamp
  if (updates.status === 'completed' && report.status !== 'completed') {
    report.generatedAt = new Date();
  }

  reports.set(id, report);
  return report;
};

export const addScanToReport = (reportId: string, scanResult: ScanResult): Report | undefined => {
  const report = reports.get(reportId);
  if (!report) return undefined;

  // Convert scan findings to report findings
  const newFindings: Finding[] = scanResult.findings.map(f => ({
    id: uuidv4(),
    title: f.type,
    description: f.description,
    severity: f.risk,
    status: 'open',
    detectedAt: new Date(),
    remediation: f.recommendation
  }));

  // Update report findings
  report.findings = [...report.findings, ...newFindings];

  // Update summary
  report.summary.findings = {
    critical: report.findings.filter(f => f.severity === 'critical').length,
    high: report.findings.filter(f => f.severity === 'high').length,
    medium: report.findings.filter(f => f.severity === 'medium').length,
    low: report.findings.filter(f => f.severity === 'low').length,
    total: report.findings.length
  };

  // Update metrics
  const severityDistribution: Metric = {
    name: 'Finding Severity Distribution',
    value: report.findings.length,
    unit: 'findings'
  };

  report.metrics = [severityDistribution];
  report.updatedAt = new Date();

  reports.set(report.id, report);
  return report;
};