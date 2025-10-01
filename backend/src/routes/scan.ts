import express, { Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { createScan, getScan, listScans, updateScanStatus, ScanConfig, ScanStatus } from '../services/scanService';

export const router = express.Router();

// Custom validation middleware
const validateScanConfig = (req: Request, res: Response, next: express.NextFunction) => {
  const { type, target, intensity, steps } = req.body;
  
  if (!type || !['vulnerability', 'compliance', 'network', 'config'].includes(type)) {
    return res.status(400).json({ message: 'Invalid scan type' });
  }
  
  if (!target || typeof target !== 'string') {
    return res.status(400).json({ message: 'Invalid target' });
  }
  
  if (!intensity || !['low', 'medium', 'high'].includes(intensity)) {
    return res.status(400).json({ message: 'Invalid intensity' });
  }
  
  if (!Array.isArray(steps)) {
    return res.status(400).json({ message: 'Steps must be an array' });
  }
  
  next();
};

const validateStatusUpdate = (req: Request, res: Response, next: express.NextFunction) => {
  const { status } = req.body;
  
  if (!status || !['queued', 'running', 'completed', 'failed'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  
  next();
};

// List all scans
router.get('/', requireAuth, (req: Request, res: Response) => {
  const scans = listScans();
  res.json({ scans });
});

// Get specific scan
router.get('/:id', requireAuth, (req: Request, res: Response) => {
  const scan = getScan(req.params.id);
  if (!scan) return res.status(404).json({ message: 'Scan not found' });
  res.json({ scan });
});

// Create new scan
router.post('/', requireAuth, validateScanConfig, async (req: Request, res: Response) => {
  const config: ScanConfig = {
    type: req.body.type,
    target: req.body.target,
    intensity: req.body.intensity,
    steps: req.body.steps,
    timeout: req.body.timeout
  };

  try {
    const scan = createScan(config);
    // Trigger async scan process
    setTimeout(() => {
      updateScanStatus(scan.id, 'running');
    }, 0);
    res.json({ scan });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create scan' });
  }
});

// Update scan status
router.put('/:id/status', requireAuth, validateStatusUpdate, async (req: Request, res: Response) => {
  try {
    const scan = updateScanStatus(
      req.params.id,
      req.body.status as ScanStatus,
      req.body.result,
      req.body.error
    );
    if (!scan) return res.status(404).json({ message: 'Scan not found' });
    res.json({ scan });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update scan' });
  }
});