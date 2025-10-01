import { WebSocketServer } from 'ws';
import { logger } from './utils/logger';

export const setupWebSocket = (wss: WebSocketServer) => {
  wss.on('connection', (ws) => {
    logger.info('Client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        // Handle incoming messages
        logger.info('Received message:', data);
      } catch (err) {
        logger.error('Error processing message:', err);
      }
    });

    ws.on('close', () => {
      logger.info('Client disconnected');
    });
  });
};