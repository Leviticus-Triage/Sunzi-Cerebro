import { getTools } from '../mcp/registry';

export interface HealthMetrics {
  mcpConnectivity: {
    status: 'healthy' | 'degraded' | 'critical';
    toolAvailability: number; // percentage
    avgResponseTime: number; // milliseconds
  };
  securityTools: {
    total: number;
    active: number;
    inactive: number;
  };
  systemLoad: {
    cpu: number; // percentage
    memory: number; // percentage
    uptime: number; // seconds
  };
}

export const getSystemHealth = async (): Promise<HealthMetrics> => {
  const tools = getTools();
  const activeTools = tools.filter(t => t.status === 'active');
  const responseTimes = tools.map(t => t.responseTime || 0);
  const avgResponse = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

  // Calculate MCP connectivity status
  const status = avgResponse < 50 ? 'healthy' : avgResponse < 100 ? 'degraded' : 'critical';
  
  return {
    mcpConnectivity: {
      status,
      toolAvailability: (tools.length > 0 ? activeTools.length / tools.length * 100 : 0),
      avgResponseTime: avgResponse
    },
    securityTools: {
      total: tools.length,
      active: activeTools.length,
      inactive: tools.length - activeTools.length
    },
    systemLoad: {
      cpu: Math.random() * 100, // Mock data - replace with actual metrics
      memory: Math.random() * 100,
      uptime: process.uptime()
    }
  };
};