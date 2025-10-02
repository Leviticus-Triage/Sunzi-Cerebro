/**
 * Logging Middleware
 * HTTP request logging for the Sunzi Cerebro backend
 */

import { v4 as uuidv4 } from 'uuid';

export const logger = (req, res, next) => {
  // Generate unique request ID
  req.requestId = uuidv4();
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);

  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Log request
  console.log(`📥 ${timestamp} [${req.requestId}] ${req.method} ${req.path}`, {
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent') || 'unknown',
    contentLength: req.get('Content-Length') || 0,
    ...(Object.keys(req.query).length > 0 && { query: req.query }),
    ...(req.body && Object.keys(req.body).length > 0 && { 
      bodyKeys: Object.keys(req.body).filter(key => !['password', 'token', 'secret'].includes(key.toLowerCase()))
    })
  });

  // Capture the original send function
  const originalSend = res.send;
  const originalJson = res.json;

  // Override res.send to log response
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const responseTimestamp = new Date().toISOString();
    
    console.log(`📤 ${responseTimestamp} [${req.requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      contentLength: data ? data.length : 0,
      ...(res.statusCode >= 400 && { error: true })
    });

    originalSend.call(this, data);
  };

  // Override res.json to log response
  res.json = function(data) {
    const duration = Date.now() - startTime;
    const responseTimestamp = new Date().toISOString();
    
    console.log(`📤 ${responseTimestamp} [${req.requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      dataSize: JSON.stringify(data).length,
      ...(res.statusCode >= 400 && { error: true }),
      ...(data && data.error && { errorType: data.error.message })
    });

    originalJson.call(this, data);
  };

  // Handle response finish event for cases where send/json aren't called
  res.on('finish', () => {
    if (!res.headersSent) {
      const duration = Date.now() - startTime;
      const responseTimestamp = new Date().toISOString();
      
      console.log(`📤 ${responseTimestamp} [${req.requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms) [finish]`);
    }
  });

  next();
};

export const logSystemEvent = (event, data = {}) => {
  const timestamp = new Date().toISOString();
  console.log(`🔔 ${timestamp} [SYSTEM] ${event}`, data);
};

export const logError = (error, context = {}) => {
  const timestamp = new Date().toISOString();
  console.error(`❌ ${timestamp} [ERROR]`, {
    message: error.message,
    stack: error.stack,
    ...context
  });
};

export const logWebSocketEvent = (event, connectionId, data = {}) => {
  const timestamp = new Date().toISOString();
  console.log(`🔌 ${timestamp} [WS:${connectionId}] ${event}`, data);
};