import { Express } from 'express';

// Import all routers
import { router as authRouter } from './auth';
import { router as mcpRouter } from './mcp';
import { router as scanRouter } from './scan';
import { router as reportRouter } from './report';

export const setupRoutes = (app: Express) => {
  app.use('/api/auth', authRouter);
  app.use('/api/mcp', mcpRouter);
  app.use('/api/scans', scanRouter);
  app.use('/api/reports', reportRouter);
};