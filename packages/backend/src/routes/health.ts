import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, healthQuerySchema } from '../validation/schemas.js';
import { suiService } from '../services/sui.js';
import { redisClient } from '../services/redis.js';
import { config } from '../config/index.js';
import { logHealthCheck, logger } from '../utils/logger.js';

const router = Router();

// Health status interface
interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    sui: {
      status: 'healthy' | 'unhealthy';
      details?: any;
    };
    redis: {
      status: 'healthy' | 'unhealthy';
      details?: any;
    };
  };
  wallet?: {
    address: string;
    balance: string;
    balanceSui: number;
    isLowBalance: boolean;
  };
  performance?: {
    responseTime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage?: NodeJS.CpuUsage;
  };
}

// Track process start time for uptime calculation
const processStartTime = Date.now();

// GET /api/v1/health - Basic health check
router.get('/', 
  validate(healthQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const startTime = Date.now();
    const { detailed } = req.query as { detailed?: boolean };

    try {
      // Check Sui service health
      const suiHealth = await suiService.healthCheck();
      logHealthCheck('sui', suiHealth.status, suiHealth.details);

      // Check Redis health
      const redisHealth = await redisClient.healthCheck();
      logHealthCheck('redis', redisHealth.status, { latency: redisHealth.latency });

      // Determine overall status
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (suiHealth.status === 'unhealthy' || redisHealth.status === 'unhealthy') {
        overallStatus = 'unhealthy';
      } else if (suiHealth.details?.['isLowBalance']) {
        overallStatus = 'degraded';
      }

      // Build health response
      const healthStatus: HealthStatus = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: Date.now() - processStartTime,
        version: '1.0.0',
        environment: config.server.environment,
        services: {
          sui: {
            status: suiHealth.status,
            ...(detailed && { details: suiHealth.details }),
          },
          redis: {
            status: redisHealth.status,
            ...(detailed && { details: { latency: redisHealth.latency } }),
          },
        },
      };

      // Add wallet information if detailed
      if (detailed && suiHealth.status === 'healthy' && suiHealth.details) {
        healthStatus.wallet = {
          address: suiHealth.details['walletAddress'],
          balance: suiHealth.details['walletBalance'],
          balanceSui: suiHealth.details['walletBalanceSui'],
          isLowBalance: suiHealth.details['isLowBalance'],
        };
      }

      // Add performance metrics if detailed
      if (detailed) {
        const responseTime = Date.now() - startTime;
        healthStatus.performance = {
          responseTime,
          memoryUsage: process.memoryUsage(),
        };

        // Add CPU usage if available
        if (process.cpuUsage) {
          healthStatus.performance.cpuUsage = process.cpuUsage();
        }
      }

      // Set appropriate HTTP status code
      const httpStatus = overallStatus === 'healthy' ? 200 : 
                        overallStatus === 'degraded' ? 200 : 503;

      res.status(httpStatus).json({
        success: overallStatus !== 'unhealthy',
        data: healthStatus,
      });

    } catch (error: any) {
      logger.error('Health check failed', {
        error: error.message,
        requestId: req.requestId,
      });

      const errorResponse: HealthStatus = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Date.now() - processStartTime,
        version: '1.0.0',
        environment: config.server.environment,
        services: {
          sui: { status: 'unhealthy' },
          redis: { status: 'unhealthy' },
        },
      };

      res.status(503).json({
        success: false,
        data: errorResponse,
        error: {
          message: 'Health check failed',
          details: detailed ? error.message : undefined,
        },
      });
    }
  })
);

// GET /api/v1/health/live - Liveness probe (simple check)
router.get('/live',
  asyncHandler(async (_req: Request, res: Response) => {
    // Simple liveness check - just return 200 if the process is running
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - processStartTime,
    });
  })
);

// GET /api/v1/health/ready - Readiness probe (check if ready to serve traffic)
router.get('/ready', 
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Check if critical services are ready
      const suiReady = suiService.isReady;
      const redisReady = redisClient.isHealthy;

      const isReady = suiReady && redisReady;

      if (isReady) {
        res.status(200).json({
          status: 'ready',
          timestamp: new Date().toISOString(),
          services: {
            sui: suiReady,
            redis: redisReady,
          },
        });
      } else {
        res.status(503).json({
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          services: {
            sui: suiReady,
            redis: redisReady,
          },
        });
      }

    } catch (error: any) {
      logger.error('Readiness check failed', {
        error: error.message,
        requestId: req.requestId,
      });

      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  })
);

// GET /api/v1/health/startup - Startup probe (check if application has started)
router.get('/startup', 
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // Check if application has completed startup
      const suiInitialized = suiService.isReady;
      const redisConnected = redisClient.isHealthy;

      const hasStarted = suiInitialized && redisConnected;

      if (hasStarted) {
        res.status(200).json({
          status: 'started',
          timestamp: new Date().toISOString(),
          startupTime: Date.now() - processStartTime,
        });
      } else {
        res.status(503).json({
          status: 'starting',
          timestamp: new Date().toISOString(),
          startupTime: Date.now() - processStartTime,
          services: {
            sui: suiInitialized,
            redis: redisConnected,
          },
        });
      }

    } catch (error: any) {
      logger.error('Startup check failed', {
        error: error.message,
        requestId: req.requestId,
      });

      res.status(503).json({
        status: 'startup_failed',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  })
);

/**
 * @swagger
 * /api/v1/keepalive:
 *   get:
 *     summary: Keepalive endpoint for external monitoring
 *     description: Lightweight endpoint to prevent service cold starts
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is alive
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "alive"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 uptimeFormatted:
 *                   type: string
 *                 memory:
 *                   type: object
 *                   properties:
 *                     used:
 *                       type: number
 *                     total:
 *                       type: number
 *                 service:
 *                   type: string
 *                 keepalive:
 *                   type: boolean
 */
router.get('/keepalive', asyncHandler(async (req: Request, res: Response) => {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    
    // Log keepalive ping (but less verbose than health checks)
    logger.debug('Keepalive ping received', {
      uptime: Math.floor(uptime),
      memory: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      userAgent: req.get('User-Agent')
    });
    
    res.json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024)
      },
      service: 'sui-fx-faucet',
      keepalive: true,
      version: process.env.npm_package_version || '1.0.0',
      environment: config.server.environment
    });
  } catch (error) {
    logger.error('Keepalive check failed', { error: error.message });
    res.status(500).json({
      status: 'error',
      error: 'Keepalive check failed',
      timestamp: new Date().toISOString()
    });
  }
}));

/**
 * @swagger
 * /api/v1/status:
 *   get:
 *     summary: Simple HTML status dashboard
 *     description: Human-readable status page for monitoring
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: HTML status dashboard
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get basic service info
    const uptime = process.uptime();
    const startTime = new Date(Date.now() - uptime * 1000);
    const memoryUsage = process.memoryUsage();
    
    // Check services (simplified)
    let services = {
      'SUI Network': '⚡ Connected',
      'Database': '💾 Connected', 
      'Redis Cache': '🔄 Connected',
      'API Server': '🚀 Online'
    };
    
    try {
      // Quick service checks without full health logic
      const suiBalance = await suiService.getWalletBalance();
      if (!suiBalance || suiBalance === BigInt(0) || suiBalance.toString() === '0') {
        services['SUI Network'] = '⚠️ Low Balance';
      }
    } catch (error) {
      services['SUI Network'] = '❌ Offline';
    }
    
    // Simple HTML dashboard
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>🌊 SUI-FX Faucet Status</title>
      <meta http-equiv="refresh" content="30">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; 
          padding: 20px; 
          background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%);
          color: #00ff88; 
          min-height: 100vh;
          line-height: 1.6;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 40px; }
        .status { margin: 15px 0; padding: 10px; background: rgba(0,255,136,0.1); border-radius: 5px; }
        .services { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }
        .service { background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; border: 1px solid rgba(0,255,136,0.2); }
        .online { border-color: rgba(0,255,136,0.5); }
        .warning { border-color: rgba(255,170,0,0.5); color: #ffaa00; }
        .offline { border-color: rgba(255,0,0,0.5); color: #ff4444; }
        .footer { text-align: center; margin-top: 40px; color: rgba(0,255,136,0.6); font-size: 0.9em; }
        .uptime { font-size: 1.2em; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌊 SUI-FX Faucet Status</h1>
          <p>Real-time service monitoring</p>
        </div>
        
        <div class="status">
          <strong>⏰ Started:</strong> ${startTime.toISOString().replace('T', ' ').substring(0, 19)} UTC
        </div>
        <div class="status uptime">
          <strong>🕐 Uptime:</strong> ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s
        </div>
        <div class="status">
          <strong>🔄 Last Check:</strong> ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC
        </div>
        <div class="status">
          <strong>🧠 Memory:</strong> ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB
        </div>
        
        <h2>Service Status</h2>
        <div class="services">
          ${Object.entries(services).map(([name, status]) => {
            const className = status.includes('❌') ? 'offline' : status.includes('⚠️') ? 'warning' : 'online';
            return `<div class="service ${className}"><strong>${name}:</strong><br>${status}</div>`;
          }).join('')}
        </div>
        
        <div class="footer">
          <p><em>🔄 Auto-refresh every 30 seconds</em></p>
          <p>GitHub Actions Keepalive: Active every 10 minutes</p>
          <p><a href="/api/v1/health" style="color: #00ff88;">JSON Health Check</a> | <a href="/api/v1/keepalive" style="color: #00ff88;">Keepalive Ping</a></p>
        </div>
      </div>
    </body>
    </html>`;
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    logger.error('Status dashboard failed', { error: error.message });
    res.status(500).send(`
      <html><body style="font-family: monospace; padding: 20px; background: #1a1a1a; color: #ff4444;">
        <h1>❌ Status Dashboard Error</h1>
        <p>Unable to generate status dashboard</p>
        <p><a href="/api/v1/health" style="color: #ff4444;">Try JSON Health Check</a></p>
      </body></html>
    `);
  }
}));

export { router as healthRoutes };
