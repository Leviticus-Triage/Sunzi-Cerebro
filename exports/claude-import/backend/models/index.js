/**
 * Sequelize Models Index - PostgreSQL Production Ready
 * Database ORM initialization and model relationships
 * Sunzi Cerebro Enterprise v3.2.0
 */

import fs from 'fs';
import path from 'path';
import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import databaseConfig from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.NODE_ENV || 'development';
const config = databaseConfig.config[env];
const db = {};

let sequelize;

// Initialize Sequelize with enhanced configuration
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, {
    ...config,
    logging: config.logging,
    benchmark: true,
    retry: {
      max: 3,
      timeout: 30000
    }
  });
}

// Load all model files
const modelFiles = fs
  .readdirSync(__dirname)
  .filter(file =>
    file.indexOf('.') !== 0 &&
    file !== path.basename(__filename) &&
    file.slice(-3) === '.js'
  );

// Import all models
for (const file of modelFiles) {
  const model = await import(path.join(__dirname, file));
  const modelDefinition = model.default(sequelize, Sequelize.DataTypes);
  db[modelDefinition.name] = modelDefinition;
}

// Set up associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Add Sequelize instance and constructor to db object
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Database connection validation with retry logic
const connectWithRetry = async (retries = 5) => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection has been established successfully.');

    // Sync database in development
    if (env === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database synchronized successfully.');
    }
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);

    if (retries > 0) {
      console.log(`🔄 Retrying database connection... (${5 - retries + 1}/5)`);
      setTimeout(() => connectWithRetry(retries - 1), 5000);
    } else {
      console.error('💀 Failed to connect to database after 5 attempts');
      process.exit(1);
    }
  }
};

// Initialize connection
connectWithRetry();

export default db;