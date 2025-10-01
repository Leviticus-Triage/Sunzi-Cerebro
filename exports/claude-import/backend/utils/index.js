/**
 * Utility Functions
 * Common utilities used across the backend application
 */

const crypto = require('crypto');
const path = require('path');
const fs = require('fs-extra');
const { promisify } = require('util');

/**
 * Generate a unique request ID
 */
const generateRequestId = () => {
  return crypto.randomBytes(16).toString('hex');
};

/**
 * Generate a secure random string
 * @param {number} length - Length of the random string
 * @returns {string} Random hex string
 */
const generateSecureRandom = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize filename for safe file operations
 * @param {string} filename - Original filename
 * @returns {string} Sanitized filename
 */
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '');
};

/**
 * Format bytes to human readable format
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted byte string
 */
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format duration in milliseconds to human readable format
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

/**
 * Deep merge objects
 * @param {object} target - Target object
 * @param {...object} sources - Source objects to merge
 * @returns {object} Merged object
 */
const deepMerge = (target, ...sources) => {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
};

/**
 * Check if value is an object
 * @param {any} item - Item to check
 * @returns {boolean} Whether item is an object
 */
const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} retries - Number of retries
 * @param {number} delay - Initial delay in ms
 * @returns {Promise} Promise that resolves with function result
 */
const retryWithBackoff = async (fn, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithBackoff(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @param {boolean} immediate - Execute immediately
 * @returns {Function} Debounced function
 */
const debounce = (func, wait, immediate) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Ensure directory exists
 * @param {string} dirPath - Directory path
 */
const ensureDir = async (dirPath) => {
  try {
    await fs.ensureDir(dirPath);
  } catch (error) {
    throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
  }
};

/**
 * Safe JSON parse
 * @param {string} jsonString - JSON string to parse
 * @param {any} defaultValue - Default value if parsing fails
 * @returns {any} Parsed JSON or default value
 */
const safeJsonParse = (jsonString, defaultValue = null) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Get file extension
 * @param {string} filename - Filename
 * @returns {string} File extension
 */
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase();
};

/**
 * Check if file has allowed extension
 * @param {string} filename - Filename to check
 * @param {string[]} allowedExtensions - Array of allowed extensions
 * @returns {boolean} Whether file extension is allowed
 */
const hasAllowedExtension = (filename, allowedExtensions) => {
  const extension = getFileExtension(filename);
  return allowedExtensions.includes(extension);
};

/**
 * Create timestamp string for filenames
 * @returns {string} Timestamp string
 */
const createTimestampString = () => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
};

/**
 * Validate port number
 * @param {number} port - Port number to validate
 * @returns {boolean} Whether port is valid
 */
const isValidPort = (port) => {
  return Number.isInteger(port) && port > 0 && port < 65536;
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} Whether URL is valid
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get system uptime in human readable format
 * @returns {string} Formatted uptime
 */
const getFormattedUptime = () => {
  return formatDuration(process.uptime() * 1000);
};

/**
 * Create error response object
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} status - HTTP status code
 * @param {any} details - Additional error details
 * @returns {object} Error response object
 */
const createError = (message, code = 'GENERIC_ERROR', status = 500, details = null) => {
  return {
    error: {
      message,
      code,
      status,
      details,
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Create success response object
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @param {object} meta - Additional metadata
 * @returns {object} Success response object
 */
const createResponse = (data, message = 'Success', meta = {}) => {
  return {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  };
};

module.exports = {
  generateRequestId,
  generateSecureRandom,
  isValidEmail,
  sanitizeFilename,
  formatBytes,
  formatDuration,
  deepMerge,
  isObject,
  retryWithBackoff,
  debounce,
  throttle,
  ensureDir,
  safeJsonParse,
  getFileExtension,
  hasAllowedExtension,
  createTimestampString,
  isValidPort,
  isValidUrl,
  getFormattedUptime,
  createError,
  createResponse
};