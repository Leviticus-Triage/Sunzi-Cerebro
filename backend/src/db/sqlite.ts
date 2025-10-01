import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

const DEFAULT_DB_PATH = path.join(__dirname, '../../data/dev.sqlite');

// Use an in-memory database when running tests to avoid collisions between Jest workers
const DB_PATH = process.env.NODE_ENV === 'test' ? ':memory:' : (process.env.DB_PATH || DEFAULT_DB_PATH);

export let db: Database | null = null;

export const initDb = async () => {
  // For file-backed DB, ensure parent directory exists so sqlite can create the file
  if (DB_PATH !== ':memory:') {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password_hash TEXT
    );
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      token TEXT PRIMARY KEY,
      user_id TEXT,
      expires_at INTEGER,
      replaced_by TEXT,
      FOREIGN KEY (replaced_by) REFERENCES refresh_tokens(token)
    );
  `);
  
  // Add indexes for performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
  `);
};

export const closeDb = async () => {
  if (db) await db.close();
};
