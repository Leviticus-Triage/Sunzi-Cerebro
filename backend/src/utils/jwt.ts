import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

const JWT_SECRET = (process.env.JWT_SECRET || 'dev-secret-change-me') as jwt.Secret;
const ACCESS_EXPIRES_IN = process.env.ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';

export const signAccessToken = (payload: object): string => {
  return jwt.sign({ ...payload, typ: 'access' } as object, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN } as jwt.SignOptions);
};

// Include a unique jti for refresh tokens to avoid collisions when tests freeze time
export const signRefreshToken = (payload: object): string => {
  const withJti = { ...payload, typ: 'refresh', jti: randomUUID() } as object;
  return jwt.sign(withJti, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string): object | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as object;
  } catch (err) {
    return null;
  }
};
