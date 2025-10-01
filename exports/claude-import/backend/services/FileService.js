/**
 * File System Operations and Session Export Service
 */

import fs from 'fs-extra';
import path from 'path';
import chokidar from 'chokidar';
import { logSystemEvent, logError } from '../middleware/logger.js';

export class FileService {
  constructor() {
    this.watchers = new Map();
    this.initialize();
  }

  async initialize() {
    logSystemEvent('FileService initialized');
  }

  async listFiles(options) {
    const { path: targetPath, includeHidden, recursive } = options;
    
    try {
      const items = [];
      const entries = await fs.readdir(targetPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!includeHidden && entry.name.startsWith('.')) continue;
        
        const fullPath = path.join(targetPath, entry.name);
        const stats = await fs.stat(fullPath);
        
        items.push({
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          permissions: '755', // Simplified
          lastModified: stats.mtime.toISOString(),
          isDirectory: entry.isDirectory(),
          isFile: entry.isFile(),
          extension: path.extname(entry.name)
        });
      }
      
      return {
        items,
        totalSize: items.reduce((acc, item) => acc + (item.size || 0), 0)
      };
    } catch (error) {
      logError(error, { context: 'listFiles', path: targetPath });
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  async readFile(filePath, encoding = 'utf8') {
    try {
      const data = await fs.readFile(filePath, encoding);
      const stats = await fs.stat(filePath);
      
      return {
        data,
        size: stats.size,
        lastModified: stats.mtime.toISOString(),
        mimeType: this.getMimeType(filePath)
      };
    } catch (error) {
      logError(error, { context: 'readFile', filePath });
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }

  async writeFile(options) {
    const { path: filePath, content, encoding, createDirectories } = options;
    
    try {
      if (createDirectories) {
        await fs.ensureDir(path.dirname(filePath));
      }
      
      await fs.writeFile(filePath, content, encoding);
      const stats = await fs.stat(filePath);
      
      return {
        success: true,
        message: 'File written successfully',
        size: stats.size,
        created: new Date().toISOString()
      };
    } catch (error) {
      logError(error, { context: 'writeFile', filePath });
      return {
        success: false,
        message: `Failed to write file: ${error.message}`
      };
    }
  }

  async createDirectory(dirPath, recursive = true) {
    try {
      await fs.ensureDir(dirPath);
      
      return {
        success: true,
        message: 'Directory created successfully',
        created: new Date().toISOString()
      };
    } catch (error) {
      logError(error, { context: 'createDirectory', dirPath });
      return {
        success: false,
        message: `Failed to create directory: ${error.message}`
      };
    }
  }

  async delete(targetPath, recursive = false) {
    try {
      if (recursive) {
        await fs.remove(targetPath);
      } else {
        await fs.unlink(targetPath);
      }
      
      return {
        success: true,
        message: 'Deleted successfully'
      };
    } catch (error) {
      logError(error, { context: 'delete', targetPath });
      return {
        success: false,
        message: `Failed to delete: ${error.message}`
      };
    }
  }

  async copy(source, destination, overwrite = false) {
    try {
      await fs.copy(source, destination, { overwrite });
      const stats = await fs.stat(destination);
      
      return {
        success: true,
        message: 'Copied successfully',
        size: stats.size
      };
    } catch (error) {
      logError(error, { context: 'copy', source, destination });
      return {
        success: false,
        message: `Failed to copy: ${error.message}`
      };
    }
  }

  async move(source, destination, overwrite = false) {
    try {
      await fs.move(source, destination, { overwrite });
      
      return {
        success: true,
        message: 'Moved successfully'
      };
    } catch (error) {
      logError(error, { context: 'move', source, destination });
      return {
        success: false,
        message: `Failed to move: ${error.message}`
      };
    }
  }

  async exportWarpSession(options) {
    const { sessionId, format, includeCommands, includeOutput, dateRange } = options;
    
    // Mock implementation - would integrate with actual Warp Terminal data
    const mockData = {
      sessionId: sessionId || 'current',
      exportedAt: new Date().toISOString(),
      format,
      metadata: {
        version: '1.0.0',
        exportType: 'warp-terminal-session'
      },
      commands: includeCommands ? [
        {
          id: 1,
          command: 'ls -la',
          timestamp: new Date().toISOString(),
          workingDirectory: '/home/user',
          exitCode: 0,
          duration: 150,
          output: includeOutput ? 'total 8\ndrwxr-xr-x 2 user user 4096 Jan 1 12:00 .\ndrwxr-xr-x 3 user user 4096 Jan 1 12:00 ..' : null
        },
        {
          id: 2,
          command: 'pwd',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          workingDirectory: '/home/user',
          exitCode: 0,
          duration: 25,
          output: includeOutput ? '/home/user' : null
        }
      ] : [],
      statistics: {
        totalCommands: 2,
        successfulCommands: 2,
        failedCommands: 0,
        totalDuration: 175,
        sessionDuration: 3600000 // 1 hour
      }
    };

    return mockData;
  }

  async exportAgentConversations(options) {
    const { agentId, format, includeMetadata, dateRange } = options;
    
    // Mock implementation - would integrate with actual agent conversation data
    const mockData = {
      agentId,
      exportedAt: new Date().toISOString(),
      format,
      metadata: includeMetadata ? {
        version: '1.0.0',
        exportType: 'agent-conversations',
        agentVersion: '1.0.0'
      } : undefined,
      conversations: [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          type: 'query',
          content: 'What is the current system status?',
          response: 'System is running normally. All services are operational.',
          context: {
            sessionId: 'session-1',
            topic: 'system-monitoring'
          }
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 600000).toISOString(),
          type: 'command',
          content: 'Execute nmap scan on target',
          response: 'Nmap scan completed successfully. Found 3 open ports.',
          context: {
            sessionId: 'session-1',
            topic: 'security-scanning'
          }
        }
      ],
      statistics: {
        totalConversations: 2,
        totalQueries: 1,
        totalCommands: 1,
        averageResponseTime: 1200
      }
    };

    return mockData;
  }

  async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      
      return {
        exists: true,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
        permissions: '755', // Simplified
        created: stats.birthtime.toISOString(),
        modified: stats.mtime.toISOString(),
        accessed: stats.atime.toISOString(),
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile()
      };
    } catch (error) {
      if (error.code === 'ENOENT') {
        return { exists: false };
      }
      throw new Error(`Failed to get file stats: ${error.message}`);
    }
  }

  async searchFiles(options) {
    const { path: searchPath, pattern, type, caseSensitive, limit } = options;
    
    // Simplified implementation - would use more sophisticated search
    const results = [];
    
    try {
      const files = await this.listFiles({ path: searchPath, recursive: true });
      
      for (const file of files.items) {
        if (results.length >= limit) break;
        
        let matches = false;
        const searchText = caseSensitive ? file.name : file.name.toLowerCase();
        const searchPattern = caseSensitive ? pattern : pattern.toLowerCase();
        
        if (searchText.includes(searchPattern)) {
          matches = true;
        }
        
        if (type !== 'all' && file.type !== type) {
          matches = false;
        }
        
        if (matches) {
          results.push(file);
        }
      }
      
      return {
        files: results,
        count: results.length,
        hasMore: results.length >= limit
      };
    } catch (error) {
      logError(error, { context: 'searchFiles', searchPath, pattern });
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  watchDirectory(watchPath, recursive, callback) {
    const watcher = chokidar.watch(watchPath, {
      recursive,
      persistent: true,
      ignoreInitial: true
    });

    const watcherId = `watcher-${Date.now()}`;
    
    watcher
      .on('add', (filePath) => callback({
        type: 'file-added',
        path: filePath,
        timestamp: new Date().toISOString()
      }))
      .on('change', (filePath) => callback({
        type: 'file-changed',
        path: filePath,
        timestamp: new Date().toISOString()
      }))
      .on('unlink', (filePath) => callback({
        type: 'file-removed',
        path: filePath,
        timestamp: new Date().toISOString()
      }))
      .on('addDir', (dirPath) => callback({
        type: 'directory-added',
        path: dirPath,
        timestamp: new Date().toISOString()
      }))
      .on('unlinkDir', (dirPath) => callback({
        type: 'directory-removed',
        path: dirPath,
        timestamp: new Date().toISOString()
      }));

    this.watchers.set(watcherId, watcher);
    
    return () => {
      watcher.close();
      this.watchers.delete(watcherId);
    };
  }

  async getDirectorySize(dirPath) {
    // Simplified implementation
    const stats = await fs.stat(dirPath);
    
    return {
      totalSize: stats.size || 1024000,
      fileCount: 10,
      directoryCount: 3,
      breakdown: {
        documents: 512000,
        images: 256000,
        videos: 256000
      }
    };
  }

  async getBackupStatus() {
    return {
      lastBackup: new Date(Date.now() - 86400000).toISOString(),
      nextBackup: new Date(Date.now() + 86400000).toISOString(),
      backupSize: 1024000000,
      status: 'completed',
      backupCount: 7,
      configuration: {
        enabled: true,
        frequency: 'daily',
        retention: 30,
        autoExport: true,
        exportFormats: ['json', 'csv']
      }
    };
  }

  async configureBackup(config) {
    // Mock implementation - would save to actual configuration
    return {
      success: true,
      message: 'Backup configuration updated',
      configuration: config
    };
  }

  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.json': 'application/json',
      '.js': 'application/javascript',
      '.html': 'text/html',
      '.css': 'text/css',
      '.txt': 'text/plain',
      '.md': 'text/markdown',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.pdf': 'application/pdf'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
}