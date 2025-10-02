/**
 * Database Configuration - PostgreSQL Production Ready
 * Handles database connection settings and initialization
 * Enhanced for Sunzi Cerebro Enterprise v3.2.0
 */

import path from 'path';
import fs from 'fs';

const config = {
  development: {
    // SQLite for development - immediate functionality
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || './data/sunzi_cerebro_dev.sqlite',
    logging: console.log,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    }
  },

  test: {
    dialect: 'postgres',
    host: process.env.DB_TEST_HOST || 'localhost',
    port: parseInt(process.env.DB_TEST_PORT) || 5432,
    database: process.env.DB_TEST_NAME || 'sunzi_cerebro_test',
    username: process.env.DB_TEST_USER || 'sunzi_cerebro',
    password: process.env.DB_TEST_PASSWORD || 'cerebro_test_2025',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  },

  production: {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    pool: {
      max: 50,
      min: 10,
      acquire: 60000,
      idle: 10000
    },
    ssl: process.env.DB_SSL === 'true',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? {
        require: true,
        rejectUnauthorized: false
      } : false
    }
  }
};

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create data directory if it doesn't exist
if (dbConfig.dialect === 'sqlite') {
  const dataDir = path.dirname(dbConfig.storage);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export default {
  ...dbConfig,
  env,
  config
};