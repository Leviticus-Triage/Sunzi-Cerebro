/**
 * Swagger/OpenAPI 3.0 Configuration
 * Comprehensive API Documentation for Sunzi Cerebro Enterprise
 * All 35+ API endpoints documented with examples
 */

import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Sunzi Cerebro Enterprise API',
    version: '3.2.0',
    description: `
# Sunzi Cerebro Enterprise Security Intelligence Platform

A comprehensive enterprise-grade security intelligence platform with 272+ integrated security tools.

## Features
- **Multi-Tenant Architecture**: Complete tenant isolation with RBAC
- **272+ Security Tools**: HexStrike AI, AttackMCP, Notion MCP, MCP-God-Mode
- **Real-time Analytics**: Advanced security metrics and reporting
- **Enterprise Auth**: JWT, 2FA, SSO-ready with role-based permissions

## Authentication
All endpoints (except auth) require a valid JWT token in the Authorization header:
\`Authorization: Bearer <jwt_token>\`

## Rate Limiting
- **Development**: 1000 requests per 15 minutes
- **Production**: 100 requests per 15 minutes per tenant

## Tool Servers
- **HexStrike AI**: 45 professional security tools (Port 8888)
- **AttackMCP**: 7 specialized attack tools (FastMCP)
- **Notion MCP**: 2 documentation tools (STDIO)
- **MCP-God-Mode**: 152 enterprise security tools (STDIO)
    `,
    contact: {
      name: 'Sunzi Cerebro Team',
      email: 'admin@sunzi-cerebro.enterprise',
      url: 'https://github.com/sunzi-cerebro/enterprise'
    },
    license: {
      name: 'Enterprise License',
      url: 'https://enterprise.sunzi-cerebro.com/license'
    },
    termsOfService: 'https://enterprise.sunzi-cerebro.com/terms'
  },
  servers: [
    {
      url: 'http://localhost:8890',
      description: 'Development Server'
    },
    {
      url: 'https://api.sunzi-cerebro.enterprise',
      description: 'Production Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /api/auth/login'
      },
      apiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for service-to-service communication'
      }
    },
    schemas: {
      Tenant: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique tenant identifier'
          },
          name: {
            type: 'string',
            example: 'enterprise-corp',
            description: 'Tenant slug name'
          },
          domain: {
            type: 'string',
            example: 'enterprise-corp',
            description: 'Tenant domain identifier'
          },
          display_name: {
            type: 'string',
            example: 'Enterprise Corporation',
            description: 'Human-readable tenant name'
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'suspended', 'trial'],
            description: 'Current tenant status'
          },
          subscription_tier: {
            type: 'string',
            enum: ['starter', 'professional', 'enterprise'],
            description: 'Subscription tier level'
          },
          max_users: {
            type: 'integer',
            example: 100,
            description: 'Maximum allowed users'
          },
          max_tool_executions_monthly: {
            type: 'integer',
            example: 10000,
            description: 'Monthly tool execution limit'
          },
          settings: {
            type: 'object',
            description: 'Tenant-specific configuration'
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          tenant_id: {
            type: 'string',
            format: 'uuid'
          },
          username: {
            type: 'string',
            example: 'john.pentester'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'john@enterprise.com'
          },
          first_name: {
            type: 'string',
            example: 'John'
          },
          last_name: {
            type: 'string',
            example: 'Pentester'
          },
          role: {
            type: 'string',
            enum: ['viewer', 'analyst', 'pentester', 'admin', 'super_admin']
          },
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'suspended', 'pending_activation']
          },
          last_login: {
            type: 'string',
            format: 'date-time'
          },
          permissions: {
            type: 'object',
            description: 'Role-based permissions'
          }
        }
      },
      ToolExecution: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          tenant_id: {
            type: 'string',
            format: 'uuid'
          },
          user_id: {
            type: 'string',
            format: 'uuid'
          },
          tool_name: {
            type: 'string',
            example: 'nmap'
          },
          tool_category: {
            type: 'string',
            example: 'network_scanning'
          },
          tool_server: {
            type: 'string',
            enum: ['hexstrike', 'attackmcp', 'notion', 'godmode']
          },
          command: {
            type: 'string',
            example: 'nmap -sS 192.168.1.1/24'
          },
          status: {
            type: 'string',
            enum: ['pending', 'running', 'completed', 'failed', 'cancelled', 'timeout']
          },
          started_at: {
            type: 'string',
            format: 'date-time'
          },
          completed_at: {
            type: 'string',
            format: 'date-time'
          },
          duration_ms: {
            type: 'integer',
            example: 5420
          },
          output: {
            type: 'object',
            description: 'Tool execution output'
          },
          findings: {
            type: 'object',
            properties: {
              vulnerabilities: {
                type: 'array',
                items: { type: 'object' }
              },
              insights: {
                type: 'array',
                items: { type: 'object' }
              },
              recommendations: {
                type: 'array',
                items: { type: 'object' }
              }
            }
          }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'string',
            example: 'Invalid authentication token'
          },
          code: {
            type: 'string',
            example: 'AUTH_INVALID_TOKEN'
          },
          details: {
            type: 'object',
            description: 'Additional error information'
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            description: 'Response data'
          },
          meta: {
            type: 'object',
            properties: {
              count: {
                type: 'integer',
                description: 'Number of items returned'
              },
              total: {
                type: 'integer',
                description: 'Total number of items available'
              },
              page: {
                type: 'integer',
                description: 'Current page number'
              },
              per_page: {
                type: 'integer',
                description: 'Items per page'
              }
            }
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      MCPServer: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'HexStrike AI'
          },
          status: {
            type: 'string',
            enum: ['online', 'offline', 'error']
          },
          tools_count: {
            type: 'integer',
            example: 45
          },
          url: {
            type: 'string',
            example: 'http://localhost:8888'
          },
          type: {
            type: 'string',
            enum: ['http', 'stdio', 'websocket']
          },
          categories: {
            type: 'array',
            items: {
              type: 'string'
            },
            example: ['network_scanning', 'vulnerability_assessment']
          }
        }
      },
      SystemHealth: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'healthy'
          },
          version: {
            type: 'string',
            example: '3.2.0'
          },
          uptime: {
            type: 'string',
            example: '2h 15m 30s'
          },
          database: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                example: 'healthy'
              },
              responseTime: {
                type: 'string',
                example: '12ms'
              }
            }
          },
          mcp_servers: {
            type: 'object',
            properties: {
              total: {
                type: 'integer',
                example: 4
              },
              online: {
                type: 'integer',
                example: 4
              },
              tools_available: {
                type: 'integer',
                example: 272
              }
            }
          },
          memory: {
            type: 'object',
            properties: {
              used: {
                type: 'string',
                example: '245MB'
              },
              free: {
                type: 'string',
                example: '1.2GB'
              }
            }
          }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication information is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              error: 'Invalid or missing authentication token',
              code: 'AUTH_INVALID_TOKEN',
              timestamp: '2025-09-23T12:00:00.000Z'
            }
          }
        }
      },
      ForbiddenError: {
        description: 'Insufficient permissions for this operation',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              error: 'Insufficient permissions',
              code: 'AUTH_INSUFFICIENT_PERMISSIONS',
              timestamp: '2025-09-23T12:00:00.000Z'
            }
          }
        }
      },
      NotFoundError: {
        description: 'The requested resource was not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      ValidationError: {
        description: 'Request validation failed',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              error: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: {
                field: 'email',
                message: 'Invalid email format'
              },
              timestamp: '2025-09-23T12:00:00.000Z'
            }
          }
        }
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            },
            example: {
              success: false,
              error: 'Rate limit exceeded',
              code: 'RATE_LIMIT_EXCEEDED',
              details: {
                limit: 1000,
                window: '15 minutes',
                reset_time: '2025-09-23T12:15:00.000Z'
              },
              timestamp: '2025-09-23T12:00:00.000Z'
            }
          }
        }
      }
    }
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization'
    },
    {
      name: 'System',
      description: 'System health and information endpoints'
    },
    {
      name: 'Tenants',
      description: 'Multi-tenant management'
    },
    {
      name: 'Users',
      description: 'User management and profiles'
    },
    {
      name: 'Organizations',
      description: 'Organizational hierarchy management'
    },
    {
      name: 'MCP Servers',
      description: 'MCP server management and tool discovery'
    },
    {
      name: 'Tools',
      description: 'Security tool execution and management'
    },
    {
      name: 'Analytics',
      description: 'Security analytics and reporting'
    },
    {
      name: 'Sessions',
      description: 'User session management'
    },
    {
      name: 'Admin',
      description: 'Administrative functions (super_admin only)'
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './routes/*.js',
    './routes/**/*.js',
    './controllers/*.js',
    './controllers/**/*.js',
    './models/*.js'
  ]
};

const swaggerSpec = swaggerJsdoc(options);

// Add custom info
swaggerSpec.info['x-api-features'] = {
  security_tools: 272,
  mcp_servers: 4,
  authentication: ['JWT', 'API_KEY'],
  rate_limiting: true,
  multi_tenant: true,
  rbac: true,
  real_time: true
};

export default swaggerSpec;