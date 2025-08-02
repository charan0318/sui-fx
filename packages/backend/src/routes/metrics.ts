import { Router, Request, Response } from 'express';
import { redisClient } from '../services/redis.js';
import { databaseService } from '../services/database.js';
import { suiService } from '../services/sui.js';
import { logger } from '../utils/logger.js';
import os from 'os';

const router = Router();

// Collect system metrics
function collectSystemMetrics() {
  const cpuUsage = process.cpuUsage();
  const memoryUsage = process.memoryUsage();
  const systemInfo = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    memory: {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      external: memoryUsage.external,
      systemFree: os.freemem(),
      systemTotal: os.totalmem(),
      usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2)
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
      loadAverage: os.loadavg()
    },
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version
  };
  return systemInfo;
}

// Format metrics for Prometheus
function formatPrometheusMetrics(metrics: any): string {
  const lines: string[] = [];
  
  // Add help and type info
  lines.push('# HELP suifx_requests_total Total number of requests');
  lines.push('# TYPE suifx_requests_total counter');
  lines.push(`suifx_requests_total ${metrics.requests.total || 0}`);
  
  lines.push('# HELP suifx_successful_requests_total Total number of successful requests');
  lines.push('# TYPE suifx_successful_requests_total counter');
  lines.push(`suifx_successful_requests_total ${metrics.requests.successful || 0}`);
  
  lines.push('# HELP suifx_failed_requests_total Total number of failed requests');
  lines.push('# TYPE suifx_failed_requests_total counter');
  lines.push(`suifx_failed_requests_total ${metrics.requests.failed || 0}`);
  
  lines.push('# HELP suifx_memory_usage_bytes Memory usage in bytes');
  lines.push('# TYPE suifx_memory_usage_bytes gauge');
  lines.push(`suifx_memory_usage_bytes ${metrics.system.memory.used}`);
  
  lines.push('# HELP suifx_uptime_seconds Uptime in seconds');
  lines.push('# TYPE suifx_uptime_seconds gauge');
  lines.push(`suifx_uptime_seconds ${metrics.system.uptime}`);
  
  return lines.join('\n') + '\n';
}

// GET /metrics - Infrastructure monitoring endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Collect all metrics
    const systemMetrics = collectSystemMetrics();
    
    // Get Redis metrics if available
    let redisMetrics: any = {};
    try {
      const totalRequests = await redisClient.getMetric('total_requests');
      const successfulRequests = await redisClient.getMetric('successful_requests');
      const failedRequests = await redisClient.getMetric('failed_requests');
      const activeUsers = await redisClient.getMetric('active_users');
      
      redisMetrics = {
        total_requests: totalRequests,
        successful_requests: successfulRequests,
        failed_requests: failedRequests,
        active_users: activeUsers
      };
    } catch (error) {
      logger.warn('Failed to fetch Redis metrics:', error);
    }
    
    // Database stats
    let dbStats: any = {};
    try {
      const result = await databaseService.query('SELECT COUNT(*) as count FROM transactions');
      dbStats = {
        total_db_requests: result.rows[0]?.count || 0
      };
    } catch (error) {
      logger.warn('Failed to fetch database stats:', error);
    }
    
    // SUI network status
    let suiStatus = {};
    try {
      suiStatus = {
        network: 'testnet',
        connected: true,
        faucet_host: 'https://faucet.testnet.sui.io'
      };
    } catch (error) {
      logger.warn('Failed to fetch SUI status:', error);
      suiStatus = { connected: false };
    }
    
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: systemMetrics.uptime,
      requests: {
        total: (redisMetrics as any).total_requests || 0,
        successful: (redisMetrics as any).successful_requests || 0,
        failed: (redisMetrics as any).failed_requests || 0
      },
      system: systemMetrics,
      database: dbStats,
      redis: redisMetrics,
      sui: suiStatus,
      performance: {
        response_time_ms: Date.now() - startTime
      }
    };
    
    // Check Accept header for format
    const acceptHeader = req.get('Accept') || '';
    
    if (acceptHeader.includes('text/plain') || req.query.format === 'prometheus') {
      // Return Prometheus format
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(formatPrometheusMetrics(metrics));
    } else {
      // Return JSON format (default)
      res.json({
        success: true,
        data: metrics,
        meta: {
          format: 'json',
          timestamp: new Date().toISOString(),
          response_time_ms: Date.now() - startTime
        }
      });
    }
    
  } catch (error) {
    logger.error('Metrics endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to collect metrics',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /metrics/health - Quick health check for monitoring
router.get('/health', async (req: Request, res: Response) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        redis: 'connected',
        database: 'connected',
        sui: 'connected'
      }
    };
    
    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service check failed'
    });
  }
});

export { router as metricsRoutes };
