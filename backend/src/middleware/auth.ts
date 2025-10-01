import { RequestHandler } from 'express';
import { verifyToken } from '../utils/jwt';

export const requireAuth: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization as string | undefined;
  if (!authHeader) return res.status(401).json({ message: 'Missing token' });
  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token as string);
  if (!payload) return res.status(401).json({ message: 'Invalid token' });
  // attach user to request for downstream handlers
  (req as any).user = payload;
  return next();
};
