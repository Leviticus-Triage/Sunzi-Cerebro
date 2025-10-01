import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import { RequestHandler } from 'express';

export const securityHeaders: RequestHandler = helmet();

export const corsMiddleware: RequestHandler = cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit to 200 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
});
