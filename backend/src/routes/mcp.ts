import express from 'express';
import { getTools, activateTool } from '../mcp/registry';
import { requireAuth } from '../middleware/auth';

export const router = express.Router();

// Get all tools with health status
router.get('/tools', (_req, res) => {
  const tools = getTools();
  const health = tools.map(tool => ({
    ...tool,
    health: {
      status: tool.status,
      responseTime: tool.responseTime,
      toolCount: tool.toolCount,
      lastCheck: new Date().toISOString()
    }
  }));
  return res.json({ tools: health });
});

// Get specific tool details
router.get('/tools/:id', requireAuth, (req, res) => {
  const tool = getTools().find(t => t.id === req.params.id);
  if (!tool) return res.status(404).json({ message: 'Tool not found' });
  return res.json({ tool });
});

// Activate/deactivate tool
router.post('/tools/:id/activate', requireAuth, (req, res) => {
  const toolId = req.params.id;
  if (!toolId) return res.status(400).json({ message: 'Tool ID is required' });
  const t = activateTool(toolId);
  if (!t) return res.status(404).json({ message: 'Tool not found' });
  
  // Add health metrics
  const health = {
    ...t,
    health: {
      status: t.status,
      responseTime: t.responseTime,
      toolCount: t.toolCount,
      lastCheck: new Date().toISOString()
    }
  };
  return res.json({ tool: health });
});
