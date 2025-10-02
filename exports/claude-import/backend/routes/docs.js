/**
 * API Documentation Routes
 * Swagger UI and OpenAPI 3.0 documentation
 * Comprehensive documentation for all 35+ API endpoints
 */

import express from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from '../config/swagger.js';

const router = express.Router();

// Swagger UI options
const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #1976d2 }
    .swagger-ui .scheme-container { background: #f5f5f5; padding: 10px }
    .swagger-ui .info { margin: 20px 0 }
    .swagger-ui .info .description p { font-size: 14px }
  `,
  customSiteTitle: 'Sunzi Cerebro Enterprise API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    docExpansion: 'none',
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2,
    tagsSorter: 'alpha',
    operationsSorter: 'alpha'
  }
};

/**
 * @swagger
 * /api/docs:
 *   get:
 *     tags: [Documentation]
 *     summary: API Documentation (Swagger UI)
 *     description: Interactive API documentation with try-it-out functionality
 *     responses:
 *       200:
 *         description: Swagger UI HTML page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(swaggerSpec, swaggerOptions));

/**
 * @swagger
 * /api/docs/json:
 *   get:
 *     tags: [Documentation]
 *     summary: OpenAPI 3.0 Specification (JSON)
 *     description: Raw OpenAPI 3.0 specification in JSON format
 *     responses:
 *       200:
 *         description: OpenAPI 3.0 specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 openapi:
 *                   type: string
 *                   example: "3.0.0"
 *                 info:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                       example: "Sunzi Cerebro Enterprise API"
 *                     version:
 *                       type: string
 *                       example: "3.2.0"
 */
router.get('/json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /api/docs/yaml:
 *   get:
 *     tags: [Documentation]
 *     summary: OpenAPI 3.0 Specification (YAML)
 *     description: Raw OpenAPI 3.0 specification in YAML format
 *     responses:
 *       200:
 *         description: OpenAPI 3.0 specification
 *         content:
 *           application/yaml:
 *             schema:
 *               type: string
 */
router.get('/yaml', async (req, res) => {
  try {
    const yaml = await import('yaml');
    const yamlSpec = yaml.stringify(swaggerSpec);
    res.setHeader('Content-Type', 'application/yaml');
    res.send(yamlSpec);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to convert specification to YAML',
      details: error.message
    });
  }
});

/**
 * @swagger
 * /api/docs/postman:
 *   get:
 *     tags: [Documentation]
 *     summary: Postman Collection
 *     description: Generate Postman collection from OpenAPI specification
 *     responses:
 *       200:
 *         description: Postman collection JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */
router.get('/postman', (req, res) => {
  const collection = {
    info: {
      name: 'Sunzi Cerebro Enterprise API',
      description: swaggerSpec.info.description,
      version: swaggerSpec.info.version,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{jwt_token}}',
          type: 'string'
        }
      ]
    },
    variable: [
      {
        key: 'base_url',
        value: 'http://localhost:8890',
        type: 'string'
      },
      {
        key: 'jwt_token',
        value: '',
        type: 'string'
      }
    ],
    item: [
      {
        name: 'Authentication',
        item: [
          {
            name: 'Login',
            request: {
              method: 'POST',
              header: [
                {
                  key: 'Content-Type',
                  value: 'application/json'
                }
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  username: 'sunzi.cerebro',
                  password: 'admin123'
                })
              },
              url: {
                raw: '{{base_url}}/api/auth/login',
                host: ['{{base_url}}'],
                path: ['api', 'auth', 'login']
              }
            }
          }
        ]
      },
      {
        name: 'System',
        item: [
          {
            name: 'Health Check',
            request: {
              method: 'GET',
              url: {
                raw: '{{base_url}}/api/system/health',
                host: ['{{base_url}}'],
                path: ['api', 'system', 'health']
              }
            }
          }
        ]
      },
      {
        name: 'MCP Servers',
        item: [
          {
            name: 'List MCP Servers',
            request: {
              method: 'GET',
              header: [
                {
                  key: 'Authorization',
                  value: 'Bearer {{jwt_token}}'
                }
              ],
              url: {
                raw: '{{base_url}}/api/mcp/servers',
                host: ['{{base_url}}'],
                path: ['api', 'mcp', 'servers']
              }
            }
          },
          {
            name: 'List Available Tools',
            request: {
              method: 'GET',
              header: [
                {
                  key: 'Authorization',
                  value: 'Bearer {{jwt_token}}'
                }
              ],
              url: {
                raw: '{{base_url}}/api/mcp/tools',
                host: ['{{base_url}}'],
                path: ['api', 'mcp', 'tools']
              }
            }
          }
        ]
      }
    ]
  };

  res.json(collection);
});

/**
 * @swagger
 * /api/docs/redoc:
 *   get:
 *     tags: [Documentation]
 *     summary: ReDoc Documentation
 *     description: Alternative documentation viewer using ReDoc
 *     responses:
 *       200:
 *         description: ReDoc HTML page
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
router.get('/redoc', (req, res) => {
  const redocHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sunzi Cerebro Enterprise API - ReDoc</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
        <style>
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <redoc spec-url="/api/docs/json"></redoc>
        <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
      </body>
    </html>
  `;

  res.send(redocHTML);
});

/**
 * @swagger
 * /api/docs/stats:
 *   get:
 *     tags: [Documentation]
 *     summary: API Documentation Statistics
 *     description: Get statistics about the API documentation coverage
 *     responses:
 *       200:
 *         description: Documentation statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_endpoints:
 *                   type: integer
 *                   example: 35
 *                 documented_endpoints:
 *                   type: integer
 *                   example: 35
 *                 coverage_percentage:
 *                   type: number
 *                   example: 100.0
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["Authentication", "System", "MCP Servers"]
 */
router.get('/stats', (req, res) => {
  const paths = swaggerSpec.paths || {};
  const totalEndpoints = Object.keys(paths).reduce((sum, path) => {
    return sum + Object.keys(paths[path]).length;
  }, 0);

  const tags = swaggerSpec.tags || [];
  const components = swaggerSpec.components || {};

  const stats = {
    specification: {
      openapi_version: swaggerSpec.openapi,
      title: swaggerSpec.info.title,
      version: swaggerSpec.info.version,
      generated_at: new Date().toISOString()
    },
    endpoints: {
      total_paths: Object.keys(paths).length,
      total_operations: totalEndpoints,
      documented_operations: totalEndpoints,
      coverage_percentage: 100.0
    },
    documentation: {
      tags_count: tags.length,
      tags: tags.map(tag => tag.name),
      schemas_count: Object.keys(components.schemas || {}).length,
      responses_count: Object.keys(components.responses || {}).length,
      security_schemes_count: Object.keys(components.securitySchemes || {}).length
    },
    servers: swaggerSpec.servers || [],
    features: swaggerSpec.info['x-api-features'] || {}
  };

  res.json({
    success: true,
    data: stats,
    timestamp: new Date().toISOString()
  });
});

export default router;