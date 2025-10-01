import { db } from '../db/sqlite';
import bcrypt from 'bcryptjs';
// Use Node's built-in crypto.randomUUID to avoid ESM-only 'uuid' import issues in Jest
import { randomUUID } from 'crypto';

export const createUser = async (username: string, password: string) => {
  if (!db) throw new Error('DB not initialized');
  
  // Check if user already exists
  const existing = await findUserByUsername(username);
  if (existing) {
    // Return existing user if password matches
    const ok = await bcrypt.compare(password, existing.password_hash);
    if (ok) return { id: existing.id, username: existing.username };
    throw new Error('Username already exists');
  }
  
  // Create new user
  const hash = await bcrypt.hash(password, 10);
  const id = randomUUID();
  await db.run('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)', id, username, hash);
  return { id, username };
};

export const findUserByUsername = async (username: string) => {
  if (!db) throw new Error('DB not initialized');
  const row = await db.get('SELECT id, username, password_hash FROM users WHERE username = ?', username);
  return row;
};

export const verifyUserCredentials = async (username: string, password: string) => {
  const user = await findUserByUsername(username);
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  return { id: user.id, username: user.username };
};
