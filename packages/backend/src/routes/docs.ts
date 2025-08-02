import { Router, Request, Response } from 'express';

const router = Router();

// GET /docs - API Documentation Landing Page
router.get('/', (req: Request, res: Response) => {
  const docs = {
    title: 'SUI-FX API Documentation',
    version: '1.0.0',
    description: 'Complete API reference for SUI-FX faucet service',
    baseUrl: `${req.protocol}://${req.get('host')}/api/v1`,
    endpoints: {
      faucet: {
        path: '/faucet/request',
        method: 'POST',
        description: 'Request SUI testnet tokens',
        authentication: 'API Key required',
        rateLimit: '1 request per hour per wallet, 50 per hour per IP',
        example: {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'your-api-key'
          },
          body: {
            address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
          },
          response: {
            success: true,
            message: '✅ Tokens sent successfully!',
            transactionHash: '0x...',
            amount: '1000000000'
          }
        }
      },
      health: {
        path: '/health',
        method: 'GET',
        description: 'Service health check',
        authentication: 'None',
        example: {
          response: {
            status: 'healthy',
            timestamp: '2025-07-26T00:00:00.000Z',
            uptime: '1h 23m 45s',
            services: {
              database: 'connected',
              redis: 'connected',
              sui: 'connected'
            }
          }
        }
      },
      metrics: {
        path: '/metrics',
        method: 'GET',
        description: 'System metrics and monitoring data',
        authentication: 'None',
        formats: ['JSON (default)', 'Prometheus (Accept: text/plain)'],
        example: {
          response: {
            success: true,
            data: {
              timestamp: '2025-07-26T00:00:00.000Z',
              uptime: 5234.123,
              requests: { total: 1250, successful: 1200, failed: 50 },
              system: { memory: {}, cpu: {} }
            }
          }
        }
      },
      admin: {
        path: '/admin/*',
        methods: ['GET', 'POST'],
        description: 'Administrative endpoints',
        authentication: 'Admin token required',
        endpoints: [
          'POST /admin/login - Admin authentication',
          'GET /admin/dashboard - Admin dashboard data',
          'GET /admin/transactions - Transaction history',
          'GET /admin/faucet/stats - Faucet statistics'
        ]
      }
    },
    authentication: {
      apiKey: {
        type: 'API Key',
        header: 'x-api-key',
        description: 'Required for faucet requests',
        howToGet: 'Contact system administrator'
      },
      adminToken: {
        type: 'Bearer Token',
        header: 'Authorization',
        description: 'Required for admin endpoints',
        howToGet: 'Login via POST /admin/login'
      }
    },
    rateLimits: {
      faucet: {
        perWallet: '1 request per hour',
        perIP: '50 requests per hour',
        amount: '1 SUI (1,000,000,000 mist) per request'
      },
      general: {
        perIP: '1000 requests per hour'
      }
    },
    examples: {
      curl: {
        faucet: `curl -X POST "${req.protocol}://${req.get('host')}/api/v1/faucet/request" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: your-api-key" \\
  -d '{"address":"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"}'`,
        health: `curl "${req.protocol}://${req.get('host')}/api/v1/health"`,
        metrics: `curl "${req.protocol}://${req.get('host')}/api/v1/metrics"`
      },
      javascript: {
        faucet: `fetch('${req.protocol}://${req.get('host')}/api/v1/faucet/request', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'your-api-key'
  },
  body: JSON.stringify({
    address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  })
})`
      }
    },
    swagger: {
      url: `${req.protocol}://${req.get('host')}/docs`,
      description: 'Interactive OpenAPI documentation'
    }
  };

  res.json(docs);
});

// GET /docs/openapi - OpenAPI Specification
router.get('/openapi', (req: Request, res: Response) => {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'SUI-FX Faucet API',
      version: '1.0.0',
      description: 'SUI testnet token faucet service'
    },
    servers: [
      {
        url: `${req.protocol}://${req.get('host')}/api/v1`,
        description: 'API Server'
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key'
        }
      }
    },
    paths: {
      '/faucet/request': {
        post: {
          summary: 'Request SUI tokens',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    address: {
                      type: 'string',
                      pattern: '^0x[a-fA-F0-9]{64}$',
                      description: '64-character Sui wallet address'
                    }
                  },
                  required: ['address']
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Success',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      transactionHash: { type: 'string' },
                      amount: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/health': {
        get: {
          summary: 'Health check',
          responses: {
            '200': {
              description: 'Service status',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      timestamp: { type: 'string' },
                      uptime: { type: 'string' },
                      services: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  res.json(openApiSpec);
});

export { router as docsRoutes };
