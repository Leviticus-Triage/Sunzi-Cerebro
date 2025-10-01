import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';

const app = express();
app.use(express.json());

  // mount routers
const { router: authRouter } = require('../routes/auth');
app.use('/api/auth', authRouter);

// test helpers
const { initDb, closeDb } = require('../db/sqlite');
const { findUserByUsername, createUser } = require('../services/userService');
const { storeRefreshToken, findRefreshToken } = require('../services/tokenService');

// Increase Jest timeout for long-running tests
jest.setTimeout(10000);beforeAll(async () => {
  await initDb();
});

afterAll(async () => {
  await closeDb();
});

describe('Refresh token rotation and expiry', () => {
  beforeEach(async () => {
    // Clear any existing tokens and create test user
    const { db } = require('../db/sqlite');
    await db.run('DELETE FROM refresh_tokens');
    await db.run('DELETE FROM users WHERE username = ?', 'demo');
    await createUser('demo', 'demo');
  });

  it('should rotate refresh token and invalidate the old one', async () => {
    const login = await request(app).post('/api/auth/login').send({ username: 'demo', password: 'demo' });
    expect(login.status).toBe(200);
    const oldRefresh = login.body.refresh;

    // exchange refresh for new tokens
    const r1 = await request(app).post('/api/auth/refresh').send({ refresh: oldRefresh });
    expect(r1.status).toBe(200);
    expect(r1.body.refresh).toBeTruthy();
    const newRefresh = r1.body.refresh;

  // using old refresh should fail (one-time-use semantics)
  const r2 = await request(app).post('/api/auth/refresh').send({ refresh: oldRefresh });
  expect(r2.status).toBe(401);
  });

  it('should reject expired refresh tokens', async () => {
    // create a refresh token manually with short expiry
    const login = await request(app).post('/api/auth/login').send({ username: 'demo', password: 'demo' });
    expect(login.status).toBe(200);
    const refresh = login.body.refresh;

    // overwrite the DB entry with an expired timestamp
    const { db } = require('../db/sqlite');
    const expiredAt = Date.now() - 1000; // already expired
    await storeRefreshToken(refresh, login.body.userId || 'dummy', expiredAt);

    const r = await request(app).post('/api/auth/refresh').send({ refresh });
    expect(r.status).toBe(401);
  });

  it('should handle concurrent refresh token usage', async () => {
    const login = await request(app).post('/api/auth/login').send({ username: 'demo', password: 'demo' });
    expect(login.status).toBe(200);
    const refresh = login.body.refresh;

    // Try to use the same refresh token twice in quick succession
    const r1 = await request(app).post('/api/auth/refresh').send({ refresh });
    const r2 = await request(app).post('/api/auth/refresh').send({ refresh });

    // First request should succeed, second should fail
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(401);
  });

  it('should maintain token chain integrity', async () => {
    // Login to get initial token
    const login = await request(app).post('/api/auth/login').send({ username: 'demo', password: 'demo' });
    expect(login.status).toBe(200);
    let currentRefresh = login.body.refresh;

    // Perform multiple rotations
    for (let i = 0; i < 3; i++) {
      const r = await request(app).post('/api/auth/refresh').send({ refresh: currentRefresh });
      expect(r.status).toBe(200);
      expect(r.body.refresh).toBeTruthy();
      expect(r.body.refresh).not.toBe(currentRefresh);
      currentRefresh = r.body.refresh;
    }

    // Verify old tokens in the chain are invalid
    const r = await request(app).post('/api/auth/refresh').send({ refresh: login.body.refresh });
    expect(r.status).toBe(401);
  });
});
