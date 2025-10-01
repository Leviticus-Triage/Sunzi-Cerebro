import express, { Request, Response } from 'express';
const { check, validationResult } = require('express-validator');
import { verifyToken, signAccessToken, signRefreshToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { verifyUserCredentials } from '../services/userService';
import { storeRefreshToken, rotateRefreshToken, revokeRefreshToken, findRefreshToken } from '../services/tokenService';

export const router = express.Router();

// POST /login
router.post(
  '/login',
  [
    check('username').isString().trim().notEmpty(),
    check('password').isString().trim().notEmpty()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { username, password } = req.body;
      const user = await verifyUserCredentials(username, password);

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const userToken = { sub: user.id, username: user.username };
      const access = signAccessToken(userToken);
      const refresh = signRefreshToken(userToken);
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

      await storeRefreshToken(refresh, user.id, expiresAt);
      // Debug: prüfe, ob Token in DB steht
      try {
        const { db } = require('../db/sqlite');
        const stored = await db.get('SELECT token, user_id, expires_at FROM refresh_tokens WHERE token = ?', refresh);
        logger.debug('DEBUG login stored=', stored);
      } catch (e) {
        logger.debug('DEBUG login db check failed', e);
      }

      return res.json({ 
        access, 
        refresh,
        userId: user.id 
      });
    } catch (err) {
      logger.error('Login failed:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// GET /me
router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization as string | undefined;
  if (!authHeader) return res.status(401).json({ message: 'Missing token' });

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token) as any;
  if (!payload) return res.status(401).json({ message: 'Invalid token' });

  return res.json({ user: { id: payload.sub as string, username: payload.username as string } });
});

// POST /refresh
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refresh } = req.body;
    if (!refresh) return res.status(400).json({ message: 'Missing refresh token' });

    // Validiere Token-Signatur und Payload
    const payload = verifyToken(refresh) as any;
    if (!payload) return res.status(401).json({ message: 'Invalid refresh token signature' });
    if (payload.typ !== 'refresh') return res.status(401).json({ message: 'Invalid token type' });

    const sub = payload.sub as string | undefined;
    const username = payload.username as string | undefined;
    if (!sub || !username) return res.status(401).json({ message: 'Invalid token payload' });

    // Validiere Token in der Datenbank
    const stored = await findRefreshToken(refresh);
    logger.debug('DEBUG refresh payload=', payload, 'stored=', stored);
    if (!stored) return res.status(401).json({ message: 'Refresh token not found or expired' });

    if (stored.user_id !== sub) {
      logger.debug(`DEBUG ownership mismatch: stored.user_id=${stored.user_id} sub=${sub}`);
      await revokeRefreshToken(refresh);
      return res.status(401).json({ message: 'Invalid token ownership' });
    }

    // Validiere Benutzer existiert noch
    const { db } = require('../db/sqlite');
    const user = await db.get('SELECT username FROM users WHERE id = ? AND username = ?', sub, username);
    if (!user) {
      await revokeRefreshToken(refresh);
      return res.status(401).json({ message: 'User not found' });
    }

    // Generiere neue Token und versuche Rotation mit mehreren Versuchen bei Kollisionen
    const userToken = { sub, username };
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

    const maxAttempts = 5;
    let rotRes: any = null;
    let newRefresh: string | null = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      newRefresh = signRefreshToken(userToken);
  logger.debug(`refresh: attempt ${attempt} tokenPrefix=${newRefresh?.slice(0,8)}`);
      rotRes = await rotateRefreshToken(refresh, newRefresh, sub, expiresAt);
      if (rotRes && rotRes.success) break;
      if (!rotRes) break;
      // Only retry on token insertion collision
      if (rotRes.reason !== 'Token insertion failed' && rotRes.reason !== 'New token already exists') {
        break;
      }
      // otherwise continue and generate a new refresh token
    }

    if (!rotRes || !rotRes.success) {
      return res.status(401).json({ message: rotRes?.reason || 'Token rotation failed after retries' });
    }

    const access = signAccessToken(userToken);
    return res.json({ access, refresh: newRefresh });
  } catch (err) {
    logger.error('Token refresh failed:', err);
    return res.status(500).json({ message: 'Token refresh failed' });
  }
});

// POST /logout
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const { refresh } = req.body;
    if (!refresh) return res.status(400).json({ message: 'Missing refresh token' });

    await revokeRefreshToken(refresh);
    return res.json({ ok: true });
    } catch (err) {
      logger.error('Logout failed:', err);
      return res.status(500).json({ message: 'Logout failed' });
    }
});
