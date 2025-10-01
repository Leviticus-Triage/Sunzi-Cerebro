import { db } from '../db/sqlite';
import { logger } from '../utils/logger';

export const storeRefreshToken = async (token: string, userId: string, expiresAt: number) => {
  if (!db) throw new Error('DB not initialized');
  // use INSERT OR REPLACE to avoid UNIQUE constraint failures during rotation
  await db.run('INSERT OR REPLACE INTO refresh_tokens (token, user_id, expires_at) VALUES (?, ?, ?)', token, userId, expiresAt);
};

export const revokeRefreshToken = async (token: string) => {
  if (!db) throw new Error('DB not initialized');
  const res = await db.run('DELETE FROM refresh_tokens WHERE token = ?', token);
  return res;
};

export const rotateRefreshToken = async (oldToken: string, newToken: string, userId: string, expiresAt: number) => {
  if (!db) throw new Error('DB not initialized');

  await db.run('BEGIN TRANSACTION');
  try {
  // Prüfe ob der alte Token gültig ist und dem richtigen Benutzer gehört
  logger.debug('rotate: checking existing token', { oldToken, userId, now: Date.now() });
    const existingToken = await db.get(
      `SELECT token, user_id, expires_at, replaced_by 
       FROM refresh_tokens 
       WHERE token = ? AND user_id = ? AND expires_at > ? AND replaced_by IS NULL`,
      oldToken,
      userId,
      Date.now()
    );
  logger.debug('rotate: existingToken=', existingToken);

    if (!existingToken) {
      await db.run('ROLLBACK');
      return { success: false, reason: 'Token not found, expired, or already rotated' };
    }

    // Versuche den neuen Token einzufügen. Wenn ein UNIQUE-Constraint verletzt wird,
    // behandeln wir das als Rotation-Failure und rollen zurück.
    let insertRes;
    try {
      insertRes = await db.run(
        'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES (?, ?, ?)',
        newToken,
        userId,
        expiresAt
      );
      logger.debug('rotate: insertRes=', insertRes);
    } catch (err) {
      logger.debug('rotate: insert failed', err);
      await db.run('ROLLBACK');
      return { success: false, reason: 'Token insertion failed' };
    }

    // Dann markiere den alten Token als rotiert
    const updateRes = await db.run(
      'UPDATE refresh_tokens SET replaced_by = ? WHERE token = ? AND replaced_by IS NULL',
      newToken,
      oldToken
    );
  logger.debug('rotate: updateRes=', updateRes);

    // @ts-ignore
    const changes = typeof updateRes?.changes === 'number' ? updateRes.changes : undefined;
    if (!updateRes || changes === 0) {
      logger.debug('rotate: update affected 0 rows, rolling back');
      await db.run('ROLLBACK');
      return { success: false, reason: 'Token rotation failed' };
    }

    await db.run('COMMIT');
    return { success: true };
    } catch (error) {
      await db.run('ROLLBACK');
      logger.error('rotate: unexpected error', { error });
      throw error;
    }
};

export const findRefreshToken = async (token: string) => {
  if (!db) throw new Error('DB not initialized');
  const now = Date.now();
  
  // Hole Token mit allen relevanten Informationen
  const row = await db.get(
    `SELECT t1.token, t1.user_id, t1.expires_at, t1.replaced_by,
            t2.token as replacement_token, t2.expires_at as replacement_expires_at
     FROM refresh_tokens t1
     LEFT JOIN refresh_tokens t2 ON t1.replaced_by = t2.token
     WHERE t1.token = ?`,
    token
  );

  // Token existiert nicht
  if (!row) return null;

  // Token ist abgelaufen
  if (row.expires_at < now) {
    logger.debug('findRefreshToken: token expired, revoking', { token });
    await revokeRefreshToken(token);
    return null;
  }

  // Token wurde durch einen anderen ersetzt
  if (row.replaced_by) {
    // Wenn der Ersatz-Token auch abgelaufen ist, lösche beide
    if (row.replacement_expires_at && row.replacement_expires_at < now) {
      logger.debug('findRefreshToken: replacement expired, revoking both', { token, replacement: row.replacement_token });
      await revokeRefreshToken(row.replacement_token);
      await revokeRefreshToken(token);
    } else {
      // Nur den alten Token löschen
      logger.debug('findRefreshToken: token replaced, revoking old token', { token, replacement: row.replacement_token });
      await revokeRefreshToken(token);
    }
    return null;
  }

  return row;
};

export const isTokenExpired = (expiresAt: number): boolean => {
  return expiresAt < Date.now();
};
