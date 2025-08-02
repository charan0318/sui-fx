/**
 * SUI-FX Memory Cache & Rate Control System
 * Original Redis-based caching with custom algorithms
 */

import { createClient, RedisClientType } from 'redis';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// SUI-FX Cache Data Types
export interface CacheEntry {
  key: string;
  value: any;
  ttl?: number;
  createdAt: number;
}

export interface RateLimitInfo {
  identifier: string;
  hits: number;
  resetTime: number;
  windowDuration: number;
  maxHits: number;
}

export interface CacheMetrics {
  totalKeys: number;
  memoryUsage: string;
  hitRate: number;
  operations: {
    gets: number;
    sets: number;
    deletes: number;
    expires: number;
  };
}

class MemoryCacheService {
  private redisClient: RedisClientType;
  private connectionEstablished = false;
  private operationMetrics = {
    gets: 0,
    sets: 0,
    deletes: 0,
    expires: 0,
    hits: 0,
    misses: 0
  };

  constructor() {
    this.establishRedisConnection();
  }

  private establishRedisConnection(): void {
    this.redisClient = createClient({
      url: config.redis.url,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
      }
    });

    // Enhanced connection event handling
    this.redisClient.on('connect', () => {
      logger.info('[SUI-FX] Redis cache connection established');
      this.connectionEstablished = true;
    });

    this.redisClient.on('ready', () => {
      logger.info('[SUI-FX] Redis cache ready for operations');
    });

    this.redisClient.on('error', (error) => {
      logger.error('[SUI-FX] Redis cache error', { error: error.message });
      this.connectionEstablished = false;
    });

    this.redisClient.on('end', () => {
      logger.warn('[SUI-FX] Redis cache connection closed');
      this.connectionEstablished = false;
    });

    this.redisClient.on('reconnecting', () => {
      logger.info('[SUI-FX] Redis cache reconnecting...');
    });
  }

  async initializeConnection(): Promise<void> {
    try {
      await this.redisClient.connect();
      
      // Test connection with ping
      const pong = await this.redisClient.ping();
      if (pong === 'PONG') {
        logger.info('[SUI-FX] ✅ Redis cache connection verified');
        this.connectionEstablished = true;
      }
    } catch (error) {
      logger.error('[SUI-FX] Redis cache connection failed', { error });
      throw error;
    }
  }

  async terminateConnection(): Promise<void> {
    try {
      await this.redisClient.quit();
      this.connectionEstablished = false;
      logger.info('[SUI-FX] Redis cache connection terminated');
    } catch (error) {
      logger.error('[SUI-FX] Error terminating Redis cache', { error });
    }
  }

  // Custom method: Advanced cache storage with metadata
  async storeWithMetadata(
    key: string, 
    value: any, 
    ttlSeconds?: number,
    metadata?: object
  ): Promise<boolean> {
    try {
      const cacheEntry: CacheEntry = {
        key,
        value,
        ttl: ttlSeconds,
        createdAt: Date.now()
      };

      // Add metadata if provided
      if (metadata) {
        (cacheEntry as any).metadata = metadata;
      }

      const serializedData = JSON.stringify(cacheEntry);
      
      if (ttlSeconds) {
        await this.redisClient.setEx(`suifx:${key}`, ttlSeconds, serializedData);
      } else {
        await this.redisClient.set(`suifx:${key}`, serializedData);
      }

      this.operationMetrics.sets++;
      
      logger.debug('[SUI-FX] Cache entry stored', {
        key,
        ttl: ttlSeconds,
        hasMetadata: !!metadata
      });

      return true;
    } catch (error) {
      logger.error('[SUI-FX] Failed to store cache entry', {
        error,
        key
      });
      return false;
    }
  }

  // Custom method: Retrieve cache with metadata and hit tracking
  async retrieveWithMetadata(key: string): Promise<{
    found: boolean;
    value?: any;
    metadata?: object;
    age?: number;
  }> {
    try {
      const cachedData = await this.redisClient.get(`suifx:${key}`);
      
      if (!cachedData) {
        this.operationMetrics.gets++;
        this.operationMetrics.misses++;
        
        logger.debug('[SUI-FX] Cache miss', { key });
        return { found: false };
      }

      const parsedEntry: CacheEntry = JSON.parse(cachedData);
      const age = Date.now() - parsedEntry.createdAt;

      this.operationMetrics.gets++;
      this.operationMetrics.hits++;

      logger.debug('[SUI-FX] Cache hit', {
        key,
        age: `${Math.round(age / 1000)}s`
      });

      return {
        found: true,
        value: parsedEntry.value,
        metadata: (parsedEntry as any).metadata,
        age
      };
    } catch (error) {
      logger.error('[SUI-FX] Failed to retrieve cache entry', {
        error,
        key
      });
      return { found: false };
    }
  }

  // Custom method: Advanced rate limiting with sliding window
  async checkRateLimit(
    identifier: string,
    maxRequests: number,
    windowSeconds: number,
    keyPrefix = 'rate'
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  }> {
    const rateLimitKey = `suifx:${keyPrefix}:${identifier}`;
    const currentTime = Date.now();
    const windowStart = currentTime - (windowSeconds * 1000);

    try {
      // Use Redis MULTI for atomic operations
      const multi = this.redisClient.multi();
      
      // Remove expired entries (sliding window)
      multi.zRemRangeByScore(rateLimitKey, 0, windowStart);
      
      // Count current requests in window
      multi.zCard(rateLimitKey);
      
      // Add current request timestamp
      multi.zAdd(rateLimitKey, {score: currentTime, value: `${currentTime}-${Math.random()}`});
      
      // Set TTL for cleanup
      multi.expire(rateLimitKey, windowSeconds + 60);
      
      const results = await multi.exec();
      
      if (!results) {
        throw new Error('Redis multi-exec failed');
      }

      const currentCount = (results[1][1] as number) || 0;
      const totalHits = currentCount + 1; // Including current request
      
      const allowed = totalHits <= maxRequests;
      const remaining = Math.max(0, maxRequests - totalHits);
      const resetTime = currentTime + (windowSeconds * 1000);

      if (!allowed) {
        // Remove the request we just added since it's not allowed
        await this.redisClient.zRem(rateLimitKey, `${currentTime}-${Math.random()}`);
      }

      logger.debug('[SUI-FX] Rate limit check', {
        identifier,
        allowed,
        totalHits,
        remaining,
        maxRequests
      });

      return {
        allowed,
        remaining,
        resetTime,
        totalHits
      };
    } catch (error) {
      logger.error('[SUI-FX] Rate limit check failed', {
        error,
        identifier
      });
      
      // Fail open - allow the request if Redis is down
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: currentTime + (windowSeconds * 1000),
        totalHits: 1
      };
    }
  }

  // Custom method: Bulk cache operations with transaction support
  async bulkStoreOperation(entries: Array<{
    key: string;
    value: any;
    ttl?: number;
  }>): Promise<{
    success: boolean;
    stored: number;
    failed: string[];
  }> {
    const multi = this.redisClient.multi();
    const failedKeys: string[] = [];

    try {
      for (const entry of entries) {
        const cacheEntry: CacheEntry = {
          key: entry.key,
          value: entry.value,
          ttl: entry.ttl,
          createdAt: Date.now()
        };

        const serializedData = JSON.stringify(cacheEntry);
        const prefixedKey = `suifx:${entry.key}`;

        if (entry.ttl) {
          multi.setEx(prefixedKey, entry.ttl, serializedData);
        } else {
          multi.set(prefixedKey, serializedData);
        }
      }

      const results = await multi.exec();
      
      if (!results) {
        throw new Error('Bulk operation failed');
      }

      // Count successes and failures
      let stored = 0;
      results.forEach((result, index) => {
        if (result[0]) {
          // Error occurred
          failedKeys.push(entries[index].key);
        } else {
          stored++;
        }
      });

      this.operationMetrics.sets += stored;

      logger.info('[SUI-FX] Bulk cache operation completed', {
        total: entries.length,
        stored,
        failed: failedKeys.length
      });

      return {
        success: failedKeys.length === 0,
        stored,
        failed: failedKeys
      };
    } catch (error) {
      logger.error('[SUI-FX] Bulk cache operation failed', { error });
      
      return {
        success: false,
        stored: 0,
        failed: entries.map(e => e.key)
      };
    }
  }

  // Custom method: Advanced pattern-based key management
  async manageCacheByPattern(
    pattern: string,
    operation: 'delete' | 'list' | 'extend',
    params?: {
      ttlExtension?: number;
      limit?: number;
    }
  ): Promise<{
    success: boolean;
    keysProcessed: number;
    keys?: string[];
  }> {
    try {
      const scanPattern = `suifx:${pattern}`;
      const foundKeys: string[] = [];
      let cursor = '0';

      // Scan for matching keys
      do {
        const scanResult = await this.redisClient.scan(parseInt(cursor), {
          MATCH: scanPattern,
          COUNT: params?.limit || 100
        });
        
        cursor = scanResult.cursor.toString();
        foundKeys.push(...scanResult.keys);
        
        // Respect limit if provided
        if (params?.limit && foundKeys.length >= params.limit) {
          foundKeys.splice(params.limit);
          break;
        }
      } while (cursor !== '0');

      if (foundKeys.length === 0) {
        return {
          success: true,
          keysProcessed: 0,
          keys: operation === 'list' ? [] : undefined
        };
      }

      let keysProcessed = 0;

      switch (operation) {
        case 'delete':
          if (foundKeys.length > 0) {
            keysProcessed = await this.redisClient.del(foundKeys);
            this.operationMetrics.deletes += keysProcessed;
          }
          break;

        case 'extend':
          if (params?.ttlExtension) {
            const multi = this.redisClient.multi();
            foundKeys.forEach(key => {
              multi.expire(key, params.ttlExtension!);
            });
            await multi.exec();
            keysProcessed = foundKeys.length;
          }
          break;

        case 'list':
          keysProcessed = foundKeys.length;
          break;
      }

      logger.info('[SUI-FX] Pattern-based cache management', {
        pattern,
        operation,
        keysProcessed
      });

      return {
        success: true,
        keysProcessed,
        keys: operation === 'list' ? foundKeys.map(k => k.replace('suifx:', '')) : undefined
      };
    } catch (error) {
      logger.error('[SUI-FX] Pattern-based cache management failed', {
        error,
        pattern,
        operation
      });
      
      return {
        success: false,
        keysProcessed: 0
      };
    }
  }

  // Custom method: Cache analytics and metrics
  async generateCacheMetrics(): Promise<CacheMetrics> {
    try {
      const info = await this.redisClient.info('memory');
      const dbSize = await this.redisClient.dbSize();

      // Parse memory info
      const memoryLines = info.split('\r\n');
      const usedMemory = memoryLines
        .find(line => line.startsWith('used_memory_human:'))
        ?.split(':')[1] || 'unknown';

      // Calculate hit rate
      const totalOperations = this.operationMetrics.hits + this.operationMetrics.misses;
      const hitRate = totalOperations > 0 
        ? (this.operationMetrics.hits / totalOperations) * 100 
        : 0;

      const metrics: CacheMetrics = {
        totalKeys: dbSize,
        memoryUsage: usedMemory,
        hitRate: Math.round(hitRate * 100) / 100,
        operations: {
          gets: this.operationMetrics.gets,
          sets: this.operationMetrics.sets,
          deletes: this.operationMetrics.deletes,
          expires: this.operationMetrics.expires
        }
      };

      logger.debug('[SUI-FX] Cache metrics generated', {
        totalKeys: metrics.totalKeys,
        hitRate: `${metrics.hitRate}%`,
        memoryUsage: metrics.memoryUsage
      });

      return metrics;
    } catch (error) {
      logger.error('[SUI-FX] Failed to generate cache metrics', { error });
      
      return {
        totalKeys: 0,
        memoryUsage: '0B',
        hitRate: 0,
        operations: {
          gets: this.operationMetrics.gets,
          sets: this.operationMetrics.sets,
          deletes: this.operationMetrics.deletes,
          expires: this.operationMetrics.expires
        }
      };
    }
  }

  // Custom method: Health check with connection validation
  async performHealthCheck(): Promise<{
    healthy: boolean;
    connected: boolean;
    responseTime: number;
    details: {
      version?: string;
      mode?: string;
      uptime?: number;
    };
  }> {
    const startTime = Date.now();

    try {
      // Test basic connectivity
      const pong = await this.redisClient.ping();
      const responseTime = Date.now() - startTime;

      if (pong !== 'PONG') {
        throw new Error('Invalid ping response');
      }

      // Get additional details
      const info = await this.redisClient.info('server');
      const infoLines = info.split('\r\n');
      
      const version = infoLines
        .find(line => line.startsWith('redis_version:'))
        ?.split(':')[1];
      
      const mode = infoLines
        .find(line => line.startsWith('redis_mode:'))
        ?.split(':')[1];
      
      const uptimeSeconds = infoLines
        .find(line => line.startsWith('uptime_in_seconds:'))
        ?.split(':')[1];

      const healthStatus = {
        healthy: true,
        connected: this.connectionEstablished,
        responseTime,
        details: {
          version,
          mode,
          uptime: uptimeSeconds ? parseInt(uptimeSeconds, 10) : undefined
        }
      };

      logger.debug('[SUI-FX] Cache health check passed', {
        responseTime: `${responseTime}ms`,
        version
      });

      return healthStatus;
    } catch (error) {
      logger.error('[SUI-FX] Cache health check failed', { error });
      
      return {
        healthy: false,
        connected: false,
        responseTime: Date.now() - startTime,
        details: {}
      };
    }
  }

  // Utility method: Clear all SUI-FX prefixed keys
  async clearAllSuiFxCache(): Promise<number> {
    try {
      const result = await this.manageCacheByPattern('*', 'delete');
      
      logger.info('[SUI-FX] All cache entries cleared', {
        keysDeleted: result.keysProcessed
      });

      return result.keysProcessed;
    } catch (error) {
      logger.error('[SUI-FX] Failed to clear cache', { error });
      return 0;
    }
  }
}

// Export singleton instance
export const memoryCacheService = new MemoryCacheService();

// Backward compatibility
export const redisService = memoryCacheService;
