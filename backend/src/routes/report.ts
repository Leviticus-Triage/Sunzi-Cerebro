import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { 
  createReport, 
  getReport, 
  listReports, 
  updateReport,
  addScanToReport,
  ReportConfig,
  ReportStatus
} from '../services/reportService';

export const router = express.Router();

// Custom validation middleware
const validateReportConfig = (req: Request, res: Response, next: express.NextFunction) => {
  const { type, title } = req.body;
  
  if (!type || !['vulnerability', 'compliance', 'network', 'executive'].includes(type)) {
    return res.status(400).json({ message: 'Invalid report type' });
  }
  
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ message: 'Title is required' });
  }
  
  next();
};

const validateStatusUpdate = (req: Request, res: Response, next: express.NextFunction) => {
  const { status } = req.body;
  
  if (!status || !['draft', 'generating', 'completed', 'archived'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  
  next();
};

// List all reports
router.get('/', requireAuth, (req: Request, res: Response) => {
  const reports = listReports();
  res.json({ reports });
});

// Get specific report
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const report = getReport(req.params.id);
  if (!report) return res.status(404).json({ message: 'Report not found' });
  res.json({ report });
});

// Create new report
router.post('/', requireAuth, validateReportConfig, async (req: Request, res: Response) => {
  const config: ReportConfig = {
    type: req.body.type,
    title: req.body.title,
    description: req.body.description,
    period: req.body.period,
    includeScans: req.body.includeScans,
    format: req.body.format
  };

  try {
    const report = createReport(config);
    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create report' });
  }
});

// Update report status
router.put('/:id/status', requireAuth, validateStatusUpdate, async (req: Request, res: Response) => {
  try {
    const report = updateReport(req.params.id, {
      status: req.body.status as ReportStatus
    });
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update report' });
  }
});

// Add scan results to report
router.post('/:id/scans', requireAuth, async (req: Request, res: Response) => {
  const { scanResult } = req.body;
  
  if (!scanResult) {
    return res.status(400).json({ message: 'Scan result is required' });
  }

  try {
    const report = addScanToReport(req.params.id, scanResult);
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json({ report });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add scan results' });
  }
});