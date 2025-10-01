import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from '@jest/globals';

const app = express();
app.use(express.json());

// mount routers
const { router: mcpRouter } = require('../routes/mcp');
const { router: authRouter } = require('../routes/auth');
app.use('/api/mcp', mcpRouter);
app.use('/api/auth', authRouter);

// ensure DB and demo user for tests
const { initDb, closeDb } = require('../db/sqlite');
const { findUserByUsername, createUser } = require('../services/userService');

beforeAll(async () => {
  await initDb();
});

afterAll(async () => {
  await closeDb();
});

describe('MCP routes', () => {
  beforeEach(async () => {
    // Clear any existing data and create test user
    const { db } = require('../db/sqlite');
    await db.run('DELETE FROM refresh_tokens');
    await db.run('DELETE FROM users WHERE username = ?', 'demo');
    await createUser('demo', 'demo');
  });

  it('should return tools list', async () => {
    const res = await request(app).get('/api/mcp/tools');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tools)).toBe(true);
  });

  it('should require auth to activate tool', async () => {
    const res = await request(app).post('/api/mcp/tools/tool-1/activate');
    expect(res.status).toBe(401);
  });

  it('should activate tool with token', async () => {
    const login = await request(app).post('/api/auth/login').send({ username: 'demo', password: 'demo' });
    const res = await request(app)
      .post('/api/mcp/tools/tool-1/activate')
      .set('Authorization', `Bearer ${login.body.access}`)
      .send();
    expect(res.status).toBe(200);
    expect(res.body.tool.status).toBe('active');
  });

  it('should support token refresh for MCP endpoints', async () => {
    // Get initial tokens from login
    const login = await request(app).post('/api/auth/login').send({ username: 'demo', password: 'demo' });
    expect(login.status).toBe(200);
    const refresh = login.body.refresh;

    // Get new tokens through refresh
    const r = await request(app).post('/api/auth/refresh').send({ refresh });
    expect(r.status).toBe(200);
    expect(r.body.access).toBeTruthy();
    expect(r.body.refresh).toBeTruthy();

    // Verify new access token works with MCP endpoint
    const mcp = await request(app)
      .post('/api/mcp/tools/tool-1/activate')
      .set('Authorization', `Bearer ${r.body.access}`)
      .send();
    expect(mcp.status).toBe(200);
    expect(mcp.body.tool.status).toBe('active');
  });
});
