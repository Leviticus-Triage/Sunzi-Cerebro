/**
 * File System Operations and Session Export Routes
 * Handles file operations and session documentation
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { FileService } from '../services/FileService.js';

const router = express.Router();
const fileService = new FileService();

// List files and directories
router.get('/list', asyncHandler(async (req, res) => {
  const { path = '.', includeHidden = false, recursive = false } = req.query;
  
  const files = await fileService.listFiles({
    path,
    includeHidden: includeHidden === 'true',
    recursive: recursive === 'true'
  });
  
  res.json({
    success: true,
    data: {
      path,
      files: files.items.map(item => ({
        name: item.name,
        type: item.type,
        size: item.size,
        permissions: item.permissions,
        lastModified: item.lastModified,
        isDirectory: item.isDirectory,
        isFile: item.isFile,
        extension: item.extension
      })),
      count: files.items.length,
      totalSize: files.totalSize
    },
    timestamp: new Date().toISOString()
  });
}));

// Read file content
router.get('/read', asyncHandler(async (req, res) => {
  const { path, encoding = 'utf8' } = req.query;
  
  if (!path) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'File path is required',
        timestamp: new Date().toISOString()
      }
    });
  }

  const content = await fileService.readFile(path, encoding);
  
  res.json({
    success: true,
    data: {
      path,
      content: content.data,
      size: content.size,
      encoding,
      lastModified: content.lastModified,
      mimeType: content.mimeType
    },
    timestamp: new Date().toISOString()
  });
}));

// Write file content
router.post('/write', asyncHandler(async (req, res) => {
  const { path, content, encoding = 'utf8', createDirectories = true } = req.body;
  
  if (!path || content === undefined) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'File path and content are required',
        timestamp: new Date().toISOString()
      }
    });
  }

  const result = await fileService.writeFile({
    path,
    content,
    encoding,
    createDirectories
  });
  
  res.json({
    success: result.success,
    message: result.message,
    data: {
      path,
      size: result.size,
      created: result.created
    },
    timestamp: new Date().toISOString()
  });
}));

// Create directory
router.post('/mkdir', asyncHandler(async (req, res) => {
  const { path, recursive = true } = req.body;
  
  if (!path) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Directory path is required',
        timestamp: new Date().toISOString()
      }
    });
  }

  const result = await fileService.createDirectory(path, recursive);
  
  res.json({
    success: result.success,
    message: result.message,
    data: {
      path,
      created: result.created
    },
    timestamp: new Date().toISOString()
  });
}));

// Delete file or directory
router.delete('/delete', asyncHandler(async (req, res) => {
  const { path, recursive = false } = req.body;
  
  if (!path) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Path is required for deletion',
        timestamp: new Date().toISOString()
      }
    });
  }

  const result = await fileService.delete(path, recursive);
  
  res.json({
    success: result.success,
    message: result.message,
    data: {
      path,
      deleted: result.success
    },
    timestamp: new Date().toISOString()
  });
}));

// Copy file or directory
router.post('/copy', asyncHandler(async (req, res) => {
  const { source, destination, overwrite = false } = req.body;
  
  if (!source || !destination) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Source and destination paths are required',
        timestamp: new Date().toISOString()
      }
    });
  }

  const result = await fileService.copy(source, destination, overwrite);
  
  res.json({
    success: result.success,
    message: result.message,
    data: {
      source,
      destination,
      size: result.size
    },
    timestamp: new Date().toISOString()
  });
}));

// Move/rename file or directory
router.post('/move', asyncHandler(async (req, res) => {
  const { source, destination, overwrite = false } = req.body;
  
  if (!source || !destination) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Source and destination paths are required',
        timestamp: new Date().toISOString()
      }
    });
  }

  const result = await fileService.move(source, destination, overwrite);
  
  res.json({
    success: result.success,
    message: result.message,
    data: {
      source,
      destination
    },
    timestamp: new Date().toISOString()
  });
}));

// Export Warp Terminal session
router.post('/export/warp-session', asyncHandler(async (req, res) => {
  const { 
    sessionId, 
    format = 'json', 
    includeCommands = true, 
    includeOutput = true,
    dateRange 
  } = req.body;
  
  const exportData = await fileService.exportWarpSession({
    sessionId,
    format,
    includeCommands,
    includeOutput,
    dateRange
  });
  
  // Set headers for file download
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `warp-terminal-export-${sessionId || 'current'}-${timestamp}.${format}`;
  
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/plain');
  
  res.json({
    success: true,
    data: exportData,
    metadata: {
      sessionId: sessionId || 'current',
      format,
      exportedAt: new Date().toISOString(),
      filename,
      size: JSON.stringify(exportData).length
    }
  });
}));

// Export Agent conversations
router.post('/export/agent-conversations', asyncHandler(async (req, res) => {
  const { 
    agentId = 'sunzi-cerebro', 
    format = 'json', 
    includeMetadata = true,
    dateRange 
  } = req.body;
  
  const exportData = await fileService.exportAgentConversations({
    agentId,
    format,
    includeMetadata,
    dateRange
  });
  
  // Set headers for file download
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `warp-agent-export-${agentId}-${timestamp}.${format}`;
  
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/plain');
  
  res.json({
    success: true,
    data: exportData,
    metadata: {
      agentId,
      format,
      exportedAt: new Date().toISOString(),
      filename,
      size: JSON.stringify(exportData).length
    }
  });
}));

// Get file information/stats
router.get('/stat', asyncHandler(async (req, res) => {
  const { path } = req.query;
  
  if (!path) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'File path is required',
        timestamp: new Date().toISOString()
      }
    });
  }

  const stats = await fileService.getFileStats(path);
  
  res.json({
    success: true,
    data: {
      path,
      exists: stats.exists,
      type: stats.type,
      size: stats.size,
      permissions: stats.permissions,
      created: stats.created,
      modified: stats.modified,
      accessed: stats.accessed,
      isDirectory: stats.isDirectory,
      isFile: stats.isFile
    },
    timestamp: new Date().toISOString()
  });
}));

// Search files
router.get('/search', asyncHandler(async (req, res) => {
  const { 
    path = '.', 
    pattern, 
    type = 'all', 
    caseSensitive = false,
    limit = 100 
  } = req.query;
  
  if (!pattern) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Search pattern is required',
        timestamp: new Date().toISOString()
      }
    });
  }

  const results = await fileService.searchFiles({
    path,
    pattern,
    type,
    caseSensitive: caseSensitive === 'true',
    limit: parseInt(limit)
  });
  
  res.json({
    success: true,
    data: {
      query: { pattern, path, type },
      results: results.files,
      count: results.count,
      hasMore: results.hasMore
    },
    timestamp: new Date().toISOString()
  });
}));

// Watch directory for changes
router.get('/watch', asyncHandler(async (req, res) => {
  const { path = '.', recursive = false } = req.query;
  
  // Set up server-sent events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const cleanup = fileService.watchDirectory(path, recursive === 'true', (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });
  
  // Handle client disconnect
  req.on('close', () => {
    cleanup();
  });
}));

// Get directory size
router.get('/size', asyncHandler(async (req, res) => {
  const { path } = req.query;
  
  if (!path) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Directory path is required',
        timestamp: new Date().toISOString()
      }
    });
  }

  const sizeInfo = await fileService.getDirectorySize(path);
  
  res.json({
    success: true,
    data: {
      path,
      totalSize: sizeInfo.totalSize,
      fileCount: sizeInfo.fileCount,
      directoryCount: sizeInfo.directoryCount,
      breakdown: sizeInfo.breakdown
    },
    timestamp: new Date().toISOString()
  });
}));

// Get backup configuration and status
router.get('/backup/status', asyncHandler(async (req, res) => {
  const backupStatus = await fileService.getBackupStatus();
  
  res.json({
    success: true,
    data: backupStatus,
    timestamp: new Date().toISOString()
  });
}));

// Configure automatic documentation backup
router.post('/backup/configure', asyncHandler(async (req, res) => {
  const config = req.body;
  const result = await fileService.configureBackup(config);
  
  res.json({
    success: result.success,
    message: result.message,
    data: result.configuration,
    timestamp: new Date().toISOString()
  });
}));

export default router;