import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger.js';

const router = Router();

// Public API documentation endpoint
router.get('/', (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  const apiDocs = {
    name: "SUI-FX Public API",
    version: "1.0.0",
    description: "High-performance Sui testnet faucet with comprehensive monitoring",
    base_url: baseUrl,
    authentication: {
      type: "API Key",
      header: "x-api-key",
      note: "Contact admin for API key access"
    },
    endpoints: {
      public: {
        health: {
          method: "GET",
          path: "/api/v1/health",
          description: "System health and service status",
          auth_required: false,
          response_example: {
            status: "healthy",
            timestamp: "2025-07-25T18:00:00.000Z",
            uptime: 3600,
            services: {
              database: { status: "healthy" },
              blockchain: { status: "healthy", network: "sui-testnet" },
              cache: { status: "healthy" }
            }
          }
        },
        metrics: {
          method: "GET", 
          path: "/api/v1/metrics",
          description: "Infrastructure-grade metrics in JSON or Prometheus format",
          auth_required: false,
          parameters: {
            format: "optional, 'json' (default) or 'prometheus'"
          },
          response_example: {
            metrics: {
              faucet: {
                drops_total: 1247,
                drops_today: 89,
                drops_success_rate: 98.5,
                active_wallets: 156
              },
              system: {
                uptime_seconds: 86400,
                memory_usage_mb: 128
              }
            }
          }
        },
        root: {
          method: "GET",
          path: "/",
          description: "API information and available endpoints",
          auth_required: false
        }
      },
      authenticated: {
        faucet_drop: {
          method: "POST",
          path: "/api/v1/faucet/drop",
          description: "Request SUI testnet tokens",
          auth_required: true,
          rate_limit: "5 requests per wallet per hour",
          request_body: {
            address: "0x742d35cc6db8cf53b65c94594847b4a7b6a8a9b8a29c3d8f8c2f2b1e7f5b9c6d",
            network: "sui-testnet"
          },
          response_example: {
            status: "ok",
            tx: "0x1234567890abcdef...",
            network: "sui-testnet", 
            drop: "0.1 SUI"
          }
        },
        faucet_status: {
          method: "GET",
          path: "/api/v1/faucet/status", 
          description: "Faucet operational status and wallet balance",
          auth_required: true,
          response_example: {
            operational: true,
            balance: "1000.5 SUI",
            network: "sui-testnet"
          }
        },
        admin_status: {
          method: "GET",
          path: "/api/v1/admin/status",
          description: "Admin dashboard with comprehensive metrics",
          auth_required: true,
          response_example: {
            status: "active",
            metrics: {
              faucet: { drops_total: 1247 },
              system: { uptime: 86400, memory_usage: {} }
            }
          }
        }
      }
    },
    rate_limits: {
      global: "1000 requests per hour",
      per_wallet: "5 faucet requests per hour", 
      per_ip: "50 requests per hour"
    },
    error_codes: {
      400: "Bad Request - Invalid parameters",
      401: "Unauthorized - Invalid or missing API key",
      429: "Too Many Requests - Rate limit exceeded", 
      500: "Internal Server Error - Service unavailable",
      503: "Service Unavailable - Temporary maintenance"
    },
    examples: {
      curl_faucet: `curl -X POST ${baseUrl}/api/v1/faucet/drop \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"address": "0x742d35cc6db8cf53b65c94594847b4a7b6a8a9b8a29c3d8f8c2f2b1e7f5b9c6d", "network": "sui-testnet"}'`,
      curl_metrics: `curl ${baseUrl}/api/v1/metrics`,
      curl_prometheus: `curl "${baseUrl}/api/v1/metrics?format=prometheus"`,
      javascript: `
const response = await fetch('${baseUrl}/api/v1/faucet/drop', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'YOUR_API_KEY'
  },
  body: JSON.stringify({
    address: '0x742d35cc6db8cf53b65c94594847b4a7b6a8a9b8a29c3d8f8c2f2b1e7f5b9c6d',
    network: 'sui-testnet'
  })
});
const result = await response.json();`
    },
    integrations: {
      telegram_bot: "Use @suifx_bot on Telegram for instant token drops",
      prometheus: "Monitor with /api/v1/metrics?format=prometheus",
      grafana: "Import dashboards from our metrics endpoint",
      ci_cd: "Integrate health checks in deployment pipelines"
    },
    network_info: {
      name: "Sui Testnet",
      rpc_url: "https://fullnode.testnet.sui.io/",
      explorer: "https://suiexplorer.com/",
      token_amount: "0.1 SUI per request",
      token_decimal: 9
    },
    support: {
      documentation: `${baseUrl}/docs`,
      swagger: `${baseUrl}/api-docs`,
      issues: "https://github.com/0xBoji/sui-faucet-core/issues",
      telegram: "@suifx_support"
    }
  };

  res.json(apiDocs);
});

// Swagger/OpenAPI spec endpoint
router.get('/openapi', (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  const openApiSpec = {
    openapi: "3.0.0",
    info: {
      title: "SUI-FX Faucet API",
      version: "1.0.0",
      description: "High-performance Sui testnet faucet with comprehensive monitoring",
      contact: {
        name: "SUI-FX Support",
        url: "https://github.com/0xBoji/sui-faucet-core"
      }
    },
    servers: [
      {
        url: baseUrl,
        description: "SUI-FX API Server"
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key"
        }
      },
      schemas: {
        FaucetRequest: {
          type: "object",
          required: ["address", "network"],
          properties: {
            address: {
              type: "string",
              pattern: "^0x[a-fA-F0-9]{64}$",
              description: "Sui wallet address"
            },
            network: {
              type: "string",
              enum: ["sui-testnet"],
              description: "Target network"
            }
          }
        },
        FaucetResponse: {
          type: "object", 
          properties: {
            status: { type: "string", enum: ["ok", "error"] },
            tx: { type: "string", description: "Transaction hash" },
            network: { type: "string" },
            drop: { type: "string", description: "Amount dropped" }
          }
        },
        HealthResponse: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["healthy", "degraded", "error"] },
            timestamp: { type: "string", format: "date-time" },
            uptime: { type: "number" },
            services: {
              type: "object",
              properties: {
                database: { type: "object" },
                blockchain: { type: "object" },
                cache: { type: "object" }
              }
            }
          }
        }
      }
    },
    paths: {
      "/api/v1/health": {
        get: {
          summary: "Health Check",
          description: "Get system health and service status",
          responses: {
            200: {
              description: "System is healthy",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" }
                }
              }
            }
          }
        }
      },
      "/api/v1/metrics": {
        get: {
          summary: "System Metrics", 
          description: "Get comprehensive system metrics",
          parameters: [
            {
              name: "format",
              in: "query",
              schema: { type: "string", enum: ["json", "prometheus"] },
              description: "Response format"
            }
          ],
          responses: {
            200: { description: "Metrics retrieved successfully" }
          }
        }
      },
      "/api/v1/faucet/drop": {
        post: {
          summary: "Request SUI Tokens",
          description: "Request testnet SUI tokens for development",
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/FaucetRequest" }
              }
            }
          },
          responses: {
            200: {
              description: "Tokens sent successfully",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/FaucetResponse" }
                }
              }
            },
            401: { description: "Unauthorized - Invalid API key" },
            429: { description: "Rate limit exceeded" }
          }
        }
      }
    }
  };

  res.json(openApiSpec);
});

export { router as docsRoutes };
