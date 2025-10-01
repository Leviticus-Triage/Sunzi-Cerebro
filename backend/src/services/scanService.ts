import { v4 as uuidv4 } from 'uuid';

export type ScanType = 'vulnerability' | 'compliance' | 'network' | 'config';
export type ScanStatus = 'queued' | 'running' | 'completed' | 'failed';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface ScanStep {
  id: string;
  name: string;
  description: string;
  status: ScanStatus;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ScanConfig {
  type: ScanType;
  target: string;
  intensity: 'low' | 'medium' | 'high';
  steps: string[]; // IDs of steps to execute
  timeout?: number; // in seconds
}

export interface ScanResult {
  findings: Array<{
    id: string;
    type: string;
    risk: RiskLevel;
    description: string;
    recommendation?: string;
  }>;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface Scan {
  id: string;
  config: ScanConfig;
  status: ScanStatus;
  steps: ScanStep[];
  result?: ScanResult;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

const scans = new Map<string, Scan>();

const predefinedSteps = {
  'cve': { name: 'CVE scanning', description: 'Scan for known vulnerabilities' },
  'config': { name: 'Misconfiguration detection', description: 'Check for security misconfigurations' },
  'creds': { name: 'Weak credentials check', description: 'Test for weak or default credentials' },
  'ssl': { name: 'SSL/TLS analysis', description: 'Analyze SSL/TLS configuration' }
};

export const createScan = (config: ScanConfig): Scan => {
  const scan: Scan = {
    id: uuidv4(),
    config,
    status: 'queued',
    steps: config.steps.map(stepId => ({
      id: stepId,
      ...predefinedSteps[stepId as keyof typeof predefinedSteps],
      status: 'queued'
    })),
    createdAt: new Date()
  };
  
  scans.set(scan.id, scan);
  return scan;
};

export const getScan = (id: string): Scan | undefined => {
  return scans.get(id);
};

export const listScans = (): Scan[] => {
  return Array.from(scans.values());
};

export const updateScanStatus = (id: string, status: ScanStatus, result?: ScanResult, error?: string): Scan | undefined => {
  const scan = scans.get(id);
  if (!scan) return undefined;

  scan.status = status;
  if (status === 'running' && !scan.startedAt) {
    scan.startedAt = new Date();
  } else if (['completed', 'failed'].includes(status) && !scan.completedAt) {
    scan.completedAt = new Date();
  }

  if (result) scan.result = result;
  if (error) scan.error = error;

  scans.set(id, scan);
  return scan;
};