export type ToolEntry = {
  id: string;
  name: string;
  vendor?: string;
  description?: string;
  status?: 'active' | 'inactive';
  type?: 'attackmcp' | 'godmode' | 'notion' | 'hexstrike';
  responseTime?: number;
  toolCount?: number;
};

const tools: ToolEntry[] = [
  {
    id: 'attackmcp-fastmcp',
    name: 'AttackMCP FastMCP',
    vendor: 'AttackMCP',
    description: 'High-performance MCP tools for rapid security assessment',
    status: 'inactive',
    type: 'attackmcp',
    responseTime: 46,
    toolCount: 162
  },
  {
    id: 'mcp-god-mode',
    name: 'MCP-God-Mode',
    vendor: 'MCP Security',
    description: 'Advanced security toolkit with comprehensive scanning capabilities',
    status: 'inactive',
    type: 'godmode',
    responseTime: 52,
    toolCount: 152
  },
  {
    id: 'notion-mcp',
    name: 'Notion MCP',
    vendor: 'Notion Security',
    description: 'Integrated security assessment and documentation platform',
    status: 'inactive',
    type: 'notion',
    responseTime: 38,
    toolCount: 2
  },
  {
    id: 'hexstrike-ai',
    name: 'HexStrike AI',
    vendor: 'HexStrike',
    description: 'AI-powered security analysis and threat detection',
    status: 'inactive',
    type: 'hexstrike',
    responseTime: 41,
    toolCount: 113
  }
  ,
  {
    id: 'tool-1',
    name: 'Test Tool 1',
    vendor: 'TestVendor',
    description: 'Placeholder tool for integration tests',
    status: 'inactive',
    type: 'attackmcp',
    responseTime: 10,
    toolCount: 1
  }
];

export const getTools = () => tools;

export const activateTool = (id: string) => {
  const t = tools.find((x) => x.id === id);
  if (t) t.status = 'active';
  return t;
};
