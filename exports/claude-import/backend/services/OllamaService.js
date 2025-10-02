/**
 * Ollama Service
 * Handles integration with Ollama LLM service
 */

import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { logSystemEvent, logError } from '../middleware/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class OllamaService {
  constructor() {
    this.configPath = path.join(__dirname, '../config/ollama-config.json');
    this.defaultConfig = {
      endpoint: 'http://localhost:11434',
      model: 'llama2',
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: 'You are a helpful AI assistant for cybersecurity tasks.',
      timeout: 120000
    };
    this.config = null;
    this.initializeConfig();
  }

  async initializeConfig() {
    try {
      await fs.ensureDir(path.dirname(this.configPath));
      
      if (await fs.pathExists(this.configPath)) {
        const configData = await fs.readJSON(this.configPath);
        this.config = { ...this.defaultConfig, ...configData };
      } else {
        this.config = { ...this.defaultConfig };
        await this.saveConfig();
      }
      
      logSystemEvent('OllamaService initialized', { endpoint: this.config.endpoint });
    } catch (error) {
      logError(error, { context: 'OllamaService initialization' });
      this.config = { ...this.defaultConfig };
    }
  }

  async saveConfig() {
    try {
      await fs.writeJSON(this.configPath, this.config, { spaces: 2 });
      logSystemEvent('Ollama configuration saved');
    } catch (error) {
      logError(error, { context: 'Saving Ollama configuration' });
    }
  }

  async getConfiguration() {
    return {
      ...this.config,
      status: await this.getConnectionStatus()
    };
  }

  async updateConfiguration(newConfig) {
    this.config = { ...this.config, ...newConfig };
    await this.saveConfig();
    
    logSystemEvent('Ollama configuration updated', { 
      endpoint: this.config.endpoint, 
      model: this.config.model 
    });
    
    return this.config;
  }

  async testConnection(endpoint = null) {
    const testEndpoint = endpoint || this.config.endpoint;
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${testEndpoint}/api/version`, {
        timeout: 10000
      });
      
      const responseTime = Date.now() - startTime;
      
      // Also try to get available models
      let models = [];
      try {
        const modelsResponse = await axios.get(`${testEndpoint}/api/tags`);
        models = modelsResponse.data.models || [];
      } catch (modelsError) {
        console.warn('Could not fetch models list:', modelsError.message);
      }
      
      return {
        success: true,
        message: 'Connection successful',
        version: response.data.version || 'unknown',
        responseTime,
        models: models.map(m => m.name)
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        success: false,
        message: error.message,
        responseTime,
        error: error.code || 'CONNECTION_ERROR'
      };
    }
  }

  async getConnectionStatus() {
    const result = await this.testConnection();
    return {
      connected: result.success,
      lastCheck: new Date().toISOString(),
      version: result.version,
      responseTime: result.responseTime,
      error: result.success ? null : result.error
    };
  }

  async getAvailableModels() {
    try {
      const response = await axios.get(`${this.config.endpoint}/api/tags`, {
        timeout: 10000
      });
      
      return response.data.models || [];
    } catch (error) {
      logError(error, { context: 'Getting available models' });
      throw new Error(`Failed to get available models: ${error.message}`);
    }
  }

  async pullModel(modelName) {
    try {
      logSystemEvent('Starting model pull', { model: modelName });
      
      const response = await axios.post(`${this.config.endpoint}/api/pull`, {
        name: modelName
      }, {
        timeout: 300000 // 5 minutes timeout for pulling models
      });
      
      logSystemEvent('Model pull completed', { model: modelName });
      
      return {
        success: true,
        message: `Model ${modelName} pulled successfully`,
        status: 'completed',
        data: response.data
      };
    } catch (error) {
      logError(error, { context: 'Pulling model', model: modelName });
      
      return {
        success: false,
        message: `Failed to pull model ${modelName}: ${error.message}`,
        status: 'failed',
        error: error.code
      };
    }
  }

  async deleteModel(modelName) {
    try {
      await axios.delete(`${this.config.endpoint}/api/delete`, {
        data: { name: modelName },
        timeout: 30000
      });
      
      logSystemEvent('Model deleted', { model: modelName });
      
      return {
        success: true,
        message: `Model ${modelName} deleted successfully`
      };
    } catch (error) {
      logError(error, { context: 'Deleting model', model: modelName });
      
      return {
        success: false,
        message: `Failed to delete model ${modelName}: ${error.message}`
      };
    }
  }

  async chat(message, context = []) {
    try {
      const messages = [
        { role: 'system', content: this.config.systemPrompt },
        ...context,
        { role: 'user', content: message }
      ];

      const response = await axios.post(`${this.config.endpoint}/api/chat`, {
        model: this.config.model,
        messages: messages,
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens
        }
      }, {
        timeout: this.config.timeout
      });
      
      return response.data;
    } catch (error) {
      logError(error, { context: 'Chat request' });
      throw new Error(`Chat request failed: ${error.message}`);
    }
  }

  async streamChat(message, context = [], onChunk) {
    try {
      const messages = [
        { role: 'system', content: this.config.systemPrompt },
        ...context,
        { role: 'user', content: message }
      ];

      const response = await axios.post(`${this.config.endpoint}/api/chat`, {
        model: this.config.model,
        messages: messages,
        stream: true,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens
        }
      }, {
        timeout: this.config.timeout,
        responseType: 'stream'
      });
      
      return new Promise((resolve, reject) => {
        let buffer = '';
        
        response.data.on('data', (chunk) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop(); // Keep incomplete line in buffer
          
          lines.forEach(line => {
            if (line.trim()) {
              try {
                const data = JSON.parse(line);
                onChunk(data);
              } catch (parseError) {
                console.warn('Failed to parse streaming chunk:', parseError);
              }
            }
          });
        });
        
        response.data.on('end', () => {
          resolve();
        });
        
        response.data.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      logError(error, { context: 'Streaming chat request' });
      throw new Error(`Streaming chat request failed: ${error.message}`);
    }
  }

  async getModelInfo(modelName) {
    try {
      const response = await axios.post(`${this.config.endpoint}/api/show`, {
        name: modelName
      }, {
        timeout: 10000
      });
      
      return response.data;
    } catch (error) {
      logError(error, { context: 'Getting model info', model: modelName });
      throw new Error(`Failed to get model info: ${error.message}`);
    }
  }

  async getStatus() {
    const connectionStatus = await this.getConnectionStatus();
    let modelCount = 0;
    let currentModel = this.config.model;
    
    if (connectionStatus.connected) {
      try {
        const models = await this.getAvailableModels();
        modelCount = models.length;
      } catch (error) {
        console.warn('Could not get model count:', error.message);
      }
    }
    
    return {
      running: connectionStatus.connected,
      version: connectionStatus.version,
      endpoint: this.config.endpoint,
      modelCount,
      currentModel,
      lastCheck: connectionStatus.lastCheck,
      responseTime: connectionStatus.responseTime
    };
  }

  async generateEmbedding(text) {
    try {
      const response = await axios.post(`${this.config.endpoint}/api/embeddings`, {
        model: this.config.model,
        prompt: text
      }, {
        timeout: 30000
      });
      
      return response.data.embedding;
    } catch (error) {
      logError(error, { context: 'Generating embedding' });
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  // Health check method for monitoring
  async healthCheck() {
    try {
      const status = await this.getStatus();
      return {
        service: 'Ollama',
        healthy: status.running,
        details: status
      };
    } catch (error) {
      return {
        service: 'Ollama',
        healthy: false,
        error: error.message
      };
    }
  }
}