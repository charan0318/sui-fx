/**
 * ███████╗██╗   ██╗██╗    ███████╗ █████╗ ██╗   ██╗ ██████╗███████╗████████╗
 * ██╔════╝██║   ██║██║    ██╔════╝██╔══██╗██║   ██║██╔════╝██╔════╝╚══██╔══╝
 * ███████╗██║   ██║██║    █████╗  ███████║██║   ██║██║     █████╗     ██║   
 * ╚════██║██║   ██║██║    ██╔══╝  ██╔══██║██║   ██║██║     ██╔══╝     ██║   
 * ███████║╚██████╔╝██║    ██║     ██║  ██║╚██████╔╝╚██████╗███████╗   ██║   
 * ╚══════╝ ╚═════╝ ╚═╝    ╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚═════╝╚══════╝   ╚═╝   
 * 
 * SUI-FX Bootstrap Server
 * Original Sui testnet token distribution system
 * 
 * @author SUI-FX Team
 * @version 1.0.0
 * @license MIT
 

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { createServer } from 'http';
import { logger } from './utils/logger.js';
import { config } from './config/index.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';
import { faucetRoutes } from './routes/suiFaucet.js';
import { authRoutes } from './routes/auth.js';
import { adminRoutes } from './routes/admin.js';
import { healthRoutes } from './routes/health.js';
import { metricsRoutes } from './routes/metrics.js';
import { docsRoutes } from './routes/docs.js';
import { memoryCacheService } from './services/memoryCache.js';
import { suiBlockchainService } from './services/suiBlockchain.js';
import { dataPersistenceService } from './services/dataPersistence.js';
import { simpleDataStore } from './services/simpleDataStore.js';

// [SUI-FAUCET] Initialize environment configuration
dotenv.config();

const app = express();
const httpServer = createServer(app);

// [SUI-FAUCET] Security hardening middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.server.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic request logging
app.use((req, _res, next) => {
  const requestId = Math.random().toString(36).substring(2, 15);
  req.requestId = requestId;
  logger.info(`Request received`, {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Rate limiting (with Redis fallback to in-memory)
app.use(rateLimiter);

// Swagger UI
const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #1976d2 }
    .swagger-ui .scheme-container { background: #fafafa; padding: 10px; border-radius: 4px; margin: 10px 0; }
  `,
  customSiteTitle: 'Sui Faucet API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    requestInterceptor: (req: any) => {
      // Auto-add API key if not present
      if (!req.headers.Authorization && req.url.includes('/api/v1/faucet/')) {
        req.headers.Authorization = `Bearer ${config.auth.apiKey}`;
      }
      return req;
    }
  }
};

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// Test endpoint (simple, no middleware)
app.get('/test', (_req, res) => {
  res.json({ message: 'Test endpoint working!' });
});

// Root endpoint (must be before API routes)
app.get('/', (_req, res) => {
  try {
    res.json({
      name: 'Sui Testnet Faucet API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        faucet: '/api/v1/faucet/drop',
        health: '/api/v1/health',
        metrics: '/api/v1/metrics',
        docs: '/api/v1/docs',
        auth: '/api/v1/auth/verify',
        admin: '/api/v1/admin/status',
        swagger: '/api-docs',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Root endpoint error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API routes
app.use('/api/v1/faucet', faucetRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/metrics', metricsRoutes);
app.use('/api/v1/docs', docsRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API information
 *     description: Get basic information about the Sui Faucet API
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   example: "Sui Testnet Faucet API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 status:
 *                   type: string
 *                   example: "running"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     faucet:
 *                       type: string
 *                       example: "/api/v1/faucet/request"
 *                     health:
 *                       type: string
 *                       example: "/api/v1/health"
 *                     auth:
 *                       type: string
 *                       example: "/api/v1/auth/verify"
 *                     admin:
 *                       type: string
 *                       example: "/api/v1/admin/login"
 *                     docs:
 *                       type: string
 *                       example: "/docs"
 *                     swagger:
 *                       type: string
 *                       example: "/api-docs"
 */

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: Health check
 *     description: Check the health status of the API and its dependencies
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-07-18T06:00:00.000Z"
 *                 uptime:
 *                   type: string
 *                   example: "2h 30m 45s"
 *                 services:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: string
 *                       example: "connected"
 *                     redis:
 *                       type: string
 *                       example: "connected"
 *                     sui:
 *                       type: string
 *                       example: "connected"
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "unhealthy"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */



// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  httpServer.close(async () => {
    logger.info('HTTP server closed');

    try {
      await memoryCacheService.performHealthCheck();
      logger.info('Redis connection closed');

      await suiBlockchainService.deactivateService();
      logger.info('Sui service disconnected');

      await dataPersistenceService.checkDatabaseHealth();
      logger.info('Database disconnected');

      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Initialize services and start server
async function startServer() {
  try {
    // Initialize Redis connection
    await memoryCacheService.performHealthCheck();
    logger.info('Redis connected successfully');

    // Initialize Sui service
    await suiBlockchainService.activateService();
    logger.info('Sui service initialized successfully');

    // Initialize Database (TEMPORARILY BYPASSED FOR TESTING)
    try {
      await dataPersistenceService.checkDatabaseHealth();
      logger.info('Database initialized successfully');
    } catch (error) {
      logger.warn('Database connection failed, continuing without database', { error: (error as Error).message });
    }

    // Start HTTP server
    httpServer.listen(config.server.port, () => {
      logger.info(`🚀 Sui Faucet API server running on port ${config.server.port}`);
      logger.info(`📊 Health check: http://localhost:${config.server.port}/api/v1/health`);
      logger.info(`💧 Faucet endpoint: http://localhost:${config.server.port}/api/v1/faucet/request`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();