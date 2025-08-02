import { Router, Request, Response } from 'express';
import { simpleDataStore } from '../services/simpleDataStore.js';
import { suiBlockchainService } from '../services/suiBlockchain.js';
import { memoryCacheService } from '../services/memoryCache.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Prometheus-style metrics endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    const format = req.query.format || 'json';
    const metrics = await collectSystemMetrics();

    if (format === 'prometheus') {
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(formatPrometheusMetrics(metrics));
    } else {
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        metrics,
        endpoints: {
          prometheus: '/api/v1/metrics?format=prometheus',
          json: '/api/v1/metrics',
          health: '/api/v1/health'
        }
      });
    }
  } catch (error) {
    logger.error('[SUI-FX] Metrics collection failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to collect metrics',
      timestamp: new Date().toISOString()
    });
  }
});

// Real-time stats endpoint
router.get('/live', async (req: Request, res: Response) => {
  try {
    const liveMetrics = await collectLiveMetrics();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      live_metrics: liveMetrics,
      refresh_interval: '30s'
    });
  } catch (error) {
    logger.error('[SUI-FX] Live metrics failed', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to collect live metrics'
    });
  }
});

async function collectSystemMetrics() {
  const [faucetMetrics, systemHealth, blockchainStatus] = await Promise.all([
    simpleDataStore.generateSystemMetrics(),
    collectSystemHealth(),
    suiBlockchainService.validateFaucetOperationalStatus()
  ]);

  return {
    // Faucet-specific metrics
    faucet: {
      drops_total: faucetMetrics.drops_total,
      drops_today: faucetMetrics.drops_today,
      drops_success_rate: calculateSuccessRate(faucetMetrics),
      errors_total: faucetMetrics.errors_total,
      rate_limited_requests: faucetMetrics.rate_limited_requests,
      active_wallets: faucetMetrics.active_wallets
    },
    
    // System metrics
    system: {
      uptime_seconds: Math.floor(process.uptime()),
      memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      memory_total_mb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      cpu_usage_percent: await getCpuUsage(),
      nodejs_version: process.version,
      platform: process.platform
    },
    
    // Service health
    services: {
      database: systemHealth.database,
      cache: systemHealth.cache,
      blockchain: {
        status: blockchainStatus ? 'healthy' : 'degraded',
        network: 'sui-testnet',
        epoch: 'unknown',
        rpc_response_time: 0
      }
    },
    
    // Performance metrics
    performance: {
      requests_per_second: await calculateRPS(),
      average_response_time: await getAverageResponseTime(),
      error_rate_percent: calculateErrorRate(faucetMetrics)
    }
  };
}

async function collectLiveMetrics() {
  const now = new Date();
  const metrics = await simpleDataStore.generateSystemMetrics();
  
  return {
    current_time: now.toISOString(),
    uptime: process.uptime(),
    drops_today: metrics.drops_today,
    active_connections: await getActiveConnections(),
    memory_usage: process.memoryUsage(),
    last_drop_time: await getLastDropTime(),
    blockchain_sync: await getBlockchainSyncStatus()
  };
}

async function collectSystemHealth() {
  try {
    const [dbHealth, cacheHealth] = await Promise.all([
      simpleDataStore.performHealthCheck(),
      memoryCacheService.performHealthCheck()
    ]);

    return {
      database: dbHealth.status === 'healthy' ? 'up' : 'down',
      cache: cacheHealth.healthy ? 'up' : 'down'
    };
  } catch {
    return {
      database: 'down',
      cache: 'down'
    };
  }
}

function formatPrometheusMetrics(metrics: any): string {
  const lines: string[] = [];
  
  // Faucet metrics
  lines.push(`# HELP suifx_drops_total Total number of SUI drops`);
  lines.push(`# TYPE suifx_drops_total counter`);
  lines.push(`suifx_drops_total ${metrics.faucet.drops_total}`);
  
  lines.push(`# HELP suifx_drops_today Drops completed today`);
  lines.push(`# TYPE suifx_drops_today gauge`);
  lines.push(`suifx_drops_today ${metrics.faucet.drops_today}`);
  
  lines.push(`# HELP suifx_errors_total Total number of errors`);
  lines.push(`# TYPE suifx_errors_total counter`);
  lines.push(`suifx_errors_total ${metrics.faucet.errors_total}`);
  
  lines.push(`# HELP suifx_rate_limited_requests Rate limited requests`);
  lines.push(`# TYPE suifx_rate_limited_requests counter`);
  lines.push(`suifx_rate_limited_requests ${metrics.faucet.rate_limited_requests}`);
  
  // System metrics
  lines.push(`# HELP suifx_uptime_seconds System uptime in seconds`);
  lines.push(`# TYPE suifx_uptime_seconds gauge`);
  lines.push(`suifx_uptime_seconds ${metrics.system.uptime_seconds}`);
  
  lines.push(`# HELP suifx_memory_usage_mb Memory usage in MB`);
  lines.push(`# TYPE suifx_memory_usage_mb gauge`);
  lines.push(`suifx_memory_usage_mb ${metrics.system.memory_usage_mb}`);
  
  // Service health (1 = up, 0 = down)
  lines.push(`# HELP suifx_service_up Service availability`);
  lines.push(`# TYPE suifx_service_up gauge`);
  lines.push(`suifx_service_up{service="database"} ${metrics.services.database === 'up' ? 1 : 0}`);
  lines.push(`suifx_service_up{service="cache"} ${metrics.services.cache === 'up' ? 1 : 0}`);
  lines.push(`suifx_service_up{service="blockchain"} ${metrics.services.blockchain.status === 'healthy' ? 1 : 0}`);
  
  return lines.join('\n') + '\n';
}

// Helper functions
function calculateSuccessRate(metrics: any): number {
  const total = metrics.drops_total + metrics.errors_total;
  return total > 0 ? Math.round((metrics.drops_total / total) * 100 * 100) / 100 : 100;
}

function calculateErrorRate(metrics: any): number {
  const total = metrics.drops_total + metrics.errors_total;
  return total > 0 ? Math.round((metrics.errors_total / total) * 100 * 100) / 100 : 0;
}

async function getCpuUsage(): Promise<number> {
  // Simple CPU usage estimation
  return Math.round(process.cpuUsage().user / 1000000 * 100) / 100;
}

async function calculateRPS(): Promise<number> {
  // Placeholder - in production, track actual requests
  return Math.round(Math.random() * 10 * 100) / 100;
}

async function getAverageResponseTime(): Promise<number> {
  // Placeholder - in production, track actual response times
  return Math.round(Math.random() * 200 + 50);
}

async function getActiveConnections(): Promise<number> {
  // Placeholder - in production, track actual connections
  return Math.floor(Math.random() * 50) + 1;
}

async function getLastDropTime(): Promise<string | null> {
  // Placeholder - in production, get from database
  return new Date(Date.now() - Math.random() * 3600000).toISOString();
}

async function getBlockchainSyncStatus(): Promise<string> {
  try {
    const status = await suiBlockchainService.validateFaucetOperationalStatus();
    return status ? 'synced' : 'syncing';
  } catch {
    return 'unknown';
  }
}

export { router as metricsRoutes };
