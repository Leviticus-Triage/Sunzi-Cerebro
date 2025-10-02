/**
 * LLM Configuration and Management Routes
 * Handles Ollama integration and LLM model management
 */

import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { OllamaService } from '../services/OllamaService.js';

const router = express.Router();
const ollamaService = new OllamaService();

// Get current LLM configuration
router.get('/config', asyncHandler(async (req, res) => {
  const config = await ollamaService.getConfiguration();
  
  res.json({
    success: true,
    data: config,
    timestamp: new Date().toISOString()
  });
}));

// Update LLM configuration
router.put('/config', asyncHandler(async (req, res) => {
  const { endpoint, model, temperature, maxTokens, systemPrompt } = req.body;
  
  // Validate required fields
  if (!endpoint || !model) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Endpoint and model are required fields',
        timestamp: new Date().toISOString()
      }
    });
  }

  const updatedConfig = await ollamaService.updateConfiguration({
    endpoint,
    model,
    temperature: temperature || 0.7,
    maxTokens: maxTokens || 2048,
    systemPrompt: systemPrompt || ''
  });

  res.json({
    success: true,
    message: 'LLM configuration updated successfully',
    data: updatedConfig,
    timestamp: new Date().toISOString()
  });
}));

// Test connection to LLM service
router.post('/test-connection', asyncHandler(async (req, res) => {
  const { endpoint } = req.body;
  
  if (!endpoint) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Endpoint is required for connection test',
        timestamp: new Date().toISOString()
      }
    });
  }

  const testResult = await ollamaService.testConnection(endpoint);
  
  res.json({
    success: testResult.success,
    message: testResult.message,
    data: {
      connected: testResult.success,
      responseTime: testResult.responseTime,
      version: testResult.version,
      availableModels: testResult.models || []
    },
    timestamp: new Date().toISOString()
  });
}));

// Get available models from Ollama
router.get('/models', asyncHandler(async (req, res) => {
  const models = await ollamaService.getAvailableModels();
  
  res.json({
    success: true,
    data: {
      models: models.map(model => ({
        name: model.name,
        size: model.size,
        digest: model.digest,
        modifiedAt: model.modified_at,
        details: model.details
      }))
    },
    timestamp: new Date().toISOString()
  });
}));

// Download/Pull a model
router.post('/models/:modelName/pull', asyncHandler(async (req, res) => {
  const { modelName } = req.params;
  
  if (!modelName) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Model name is required',
        timestamp: new Date().toISOString()
      }
    });
  }

  // Start the model pull process (this can take a while)
  const pullResult = await ollamaService.pullModel(modelName);
  
  res.json({
    success: pullResult.success,
    message: pullResult.message,
    data: {
      model: modelName,
      status: pullResult.status,
      ...(pullResult.progress && { progress: pullResult.progress })
    },
    timestamp: new Date().toISOString()
  });
}));

// Delete a model
router.delete('/models/:modelName', asyncHandler(async (req, res) => {
  const { modelName } = req.params;
  
  const deleteResult = await ollamaService.deleteModel(modelName);
  
  res.json({
    success: deleteResult.success,
    message: deleteResult.message,
    data: {
      model: modelName,
      deleted: deleteResult.success
    },
    timestamp: new Date().toISOString()
  });
}));

// Chat with the configured LLM
router.post('/chat', asyncHandler(async (req, res) => {
  const { message, context, stream = false } = req.body;
  
  if (!message) {
    return res.status(400).json({
      error: {
        status: 400,
        message: 'Message is required for chat',
        timestamp: new Date().toISOString()
      }
    });
  }

  if (stream) {
    // Set up server-sent events for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    await ollamaService.streamChat(message, context, (chunk) => {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    });
    
    res.write(`data: {"type": "done"}\n\n`);
    res.end();
  } else {
    const response = await ollamaService.chat(message, context);
    
    res.json({
      success: true,
      data: {
        response: response.message,
        model: response.model,
        totalDuration: response.total_duration,
        loadDuration: response.load_duration,
        promptEvalCount: response.prompt_eval_count,
        evalCount: response.eval_count
      },
      timestamp: new Date().toISOString()
    });
  }
}));

// Get model information
router.get('/models/:modelName/info', asyncHandler(async (req, res) => {
  const { modelName } = req.params;
  
  const modelInfo = await ollamaService.getModelInfo(modelName);
  
  res.json({
    success: true,
    data: modelInfo,
    timestamp: new Date().toISOString()
  });
}));

// Get LLM service status
router.get('/status', asyncHandler(async (req, res) => {
  const status = await ollamaService.getStatus();
  
  res.json({
    success: true,
    data: {
      service: 'Ollama',
      running: status.running,
      version: status.version,
      endpoint: status.endpoint,
      modelCount: status.modelCount,
      currentModel: status.currentModel,
      lastCheck: status.lastCheck
    },
    timestamp: new Date().toISOString()
  });
}));

// Export router
export default router;