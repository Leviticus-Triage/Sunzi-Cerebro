import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';

const app = express();
app.use(express.json());

// mount auth router
const { router: authRouter } = require('../routes/auth');
app.use('/api/auth', authRouter);

// ensure DB and demo user for tests
const { initDb, closeDb } = require('../db/sqlite');
const { findUserByUsername, createUser } = require('../services/userService');

beforeAll(async () => {
  await initDb();
  const demo = await findUserByUsername('demo').catch(() => null);
  if (!demo) await createUser('demo', 'demo');
});

afterAll(async () => {
  await closeDb();
});

describe('Auth routes', () => {
  beforeEach(async () => {
    // Clear any existing data and create test user
    const { db } = require('../db/sqlite');
    await db.run('DELETE FROM refresh_tokens');
    await db.run('DELETE FROM users WHERE username = ?', 'demo');
    await createUser('demo', 'demo');
  });

  it('should login with demo user', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'demo', password: 'demo' });
    expect(res.status).toBe(200);
    expect(res.body.access).toBeTruthy();
    expect(res.body.refresh).toBeTruthy();
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'x', password: 'y' });
    expect(res.status).toBe(401);
  });
});
