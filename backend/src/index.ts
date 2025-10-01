import express from 'express';
// security middleware moved to dedicated module
import { corsMiddleware, securityHeaders, apiRateLimiter } from './middleware/security';
import dotenv from 'dotenv';
import { initDb } from './db/sqlite';
import { findUserByUsername, createUser } from './services/userService';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { setupRoutes } from './routes';
import { setupWebSocket } from './websocket';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const port = process.env.PORT || 8890;

// Middleware
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(express.json());
app.use(apiRateLimiter);

// HTTP Server
const server = createServer(app);

// WebSocket Server
const wss = new WebSocketServer({ server });
setupWebSocket(wss);

// API Routes
setupRoutes(app);

// Import health service
import { getSystemHealth } from './services/healthService';

// Enhanced Health Check Endpoints
app.get('/health', async (_, res) => {
  try {
    const health = await getSystemHealth();
    res.json({ status: 'ok', metrics: health });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({ status: 'error', message: 'Health check failed' });
  }
});

// Error Handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(err.stack);
  res.status(500).send('Something broke!');
});

const start = async () => {
  await initDb();
  // ensure demo user exists
  const demo = await findUserByUsername('demo').catch(() => null);
  if (!demo) {
    await createUser('demo', 'demo');
    logger.info('Created demo user');
  }

  server.listen(port, () => {
    logger.info(`Server running on port ${port}`);
  });
};

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});