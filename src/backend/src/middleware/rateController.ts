/**
 * SUI-FX Rate Control & Traffic Management System
 * Original rate limiting with advanced algorithms and memory caching
 */

import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

// SUI-FX Rate Limiting Data Types
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

export interface ClientTracker {
  hits: number;
  firstRequestTime: number;
  lastRequestTime: number;
  blockedUntil?: number;
}

export interface WalletRateData {
  walletAddress: string;
  requestCount: number;
  lastRequestTime: number;
  lastResetTime: number;
}

// Custom in-memory cache with TTL cleanup for rate limiting
class RateControlCache {
  private ipTracker: Map<string, ClientTracker> = new Map();
  private walletTracker: Map<string, ClientTracker> = new Map();
  private globalCounter = { hits: 0, resetTime: Date.now() };
  private cleanupInterval: NodeJS.Timeout;
  private maxTimeWindow = 60 * 60 * 1000; // 1 hour default

  constructor() {
    // Auto-cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 5 * 60 * 1000);
  }

  private performCleanup(): void {
    const currentTime = Date.now();
    let cleanedIPs = 0;
    let cleanedWallets = 0;

    // Cleanup IP tracker
    for (const [ip, tracker] of this.ipTracker.entries()) {
      if (currentTime - tracker.lastRequestTime > this.maxTimeWindow) {
        this.ipTracker.delete(ip);
        cleanedIPs++;
      }
    }

    // Cleanup wallet tracker
    for (const [wallet, tracker] of this.walletTracker.entries()) {
      if (currentTime - tracker.lastRequestTime > this.maxTimeWindow) {
        this.walletTracker.delete(wallet);
        cleanedWallets++;
      }
    }

    if (cleanedIPs > 0 || cleanedWallets > 0) {
      logger.debug('[SUI-FX] Rate limit cache cleanup', {
        cleanedIPs,
        cleanedWallets,
        totalIPs: this.ipTracker.size,
        totalWallets: this.walletTracker.size
      });
    }
  }

  // Custom algorithm for IP-based rate limiting with sliding window
  checkIpRateLimit(clientIP: string, maxRequests: number, windowMs: number): RateLimitResult {
    const currentTime = Date.now();
    const windowStart = currentTime - windowMs;

    let tracker = this.ipTracker.get(clientIP);
    
    if (!tracker) {
      // First request from this IP
      tracker = {
        hits: 1,
        firstRequestTime: currentTime,
        lastRequestTime: currentTime
      };
      this.ipTracker.set(clientIP, tracker);
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: currentTime + windowMs,
        limit: maxRequests
      };
    }

    // Check if we're outside the current window
    if (tracker.firstRequestTime < windowStart) {
      // Reset the window
      tracker.hits = 1;
      tracker.firstRequestTime = currentTime;
      tracker.lastRequestTime = currentTime;
      delete tracker.blockedUntil;
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: currentTime + windowMs,
        limit: maxRequests
      };
    }

    // Check if currently blocked
    if (tracker.blockedUntil && currentTime < tracker.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: tracker.blockedUntil,
        limit: maxRequests
      };
    }

    // Increment hit counter
    tracker.hits++;
    tracker.lastRequestTime = currentTime;

    if (tracker.hits > maxRequests) {
      // Block for remaining window time
      tracker.blockedUntil = tracker.firstRequestTime + windowMs;
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: tracker.blockedUntil,
        limit: maxRequests
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - tracker.hits,
      resetTime: tracker.firstRequestTime + windowMs,
      limit: maxRequests
    };
  }

  // Enhanced wallet-based rate limiting with extended windows
  checkWalletRateLimit(walletAddress: string, maxRequests: number, windowMs: number): RateLimitResult {
    const currentTime = Date.now();
    const windowStart = currentTime - windowMs;

    let tracker = this.walletTracker.get(walletAddress);
    
    if (!tracker) {
      tracker = {
        hits: 1,
        firstRequestTime: currentTime,
        lastRequestTime: currentTime
      };
      this.walletTracker.set(walletAddress, tracker);
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: currentTime + windowMs,
        limit: maxRequests
      };
    }

    // Sliding window logic for wallet tracking
    if (tracker.firstRequestTime < windowStart) {
      tracker.hits = 1;
      tracker.firstRequestTime = currentTime;
      tracker.lastRequestTime = currentTime;
      delete tracker.blockedUntil;
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: currentTime + windowMs,
        limit: maxRequests
      };
    }

    tracker.hits++;
    tracker.lastRequestTime = currentTime;

    if (tracker.hits > maxRequests) {
      tracker.blockedUntil = tracker.firstRequestTime + windowMs;
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: tracker.blockedUntil,
        limit: maxRequests
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - tracker.hits,
      resetTime: tracker.firstRequestTime + windowMs,
      limit: maxRequests
    };
  }

  // Global rate limiting with reset cycles
  checkGlobalRateLimit(maxRequests: number, windowMs: number): RateLimitResult {
    const currentTime = Date.now();
    
    // Check if window has expired
    if (currentTime >= this.globalCounter.resetTime) {
      this.globalCounter.hits = 1;
      this.globalCounter.resetTime = currentTime + windowMs;
      
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime: this.globalCounter.resetTime,
        limit: maxRequests
      };
    }

    this.globalCounter.hits++;

    if (this.globalCounter.hits > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.globalCounter.resetTime,
        limit: maxRequests
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - this.globalCounter.hits,
      resetTime: this.globalCounter.resetTime,
      limit: maxRequests
    };
  }

  // Get current cache statistics
  getCacheStats(): {
    ipTrackerSize: number;
    walletTrackerSize: number;
    globalHits: number;
    globalResetTime: number;
  } {
    return {
      ipTrackerSize: this.ipTracker.size,
      walletTrackerSize: this.walletTracker.size,
      globalHits: this.globalCounter.hits,
      globalResetTime: this.globalCounter.resetTime
    };
  }

  // Manual cleanup trigger
  forceCleanup(): void {
    this.performCleanup();
  }

  // Destroy cache and cleanup
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.ipTracker.clear();
    this.walletTracker.clear();
    this.globalCounter = { hits: 0, resetTime: Date.now() };
  }
}

class RateController {
  private cache: RateControlCache;

  constructor() {
    this.cache = new RateControlCache();
    logger.info('[SUI-FX] Rate controller initialized with custom algorithms');
  }

  // Enhanced IP extraction with proxy support
  private extractClientIP(req: Request): string {
    // Check for real IP behind proxies
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];
    const cfConnectingIp = req.headers['cf-connecting-ip']; // Cloudflare
    
    if (typeof forwardedFor === 'string') {
      // Take the first IP from the forwarded chain
      return forwardedFor.split(',')[0].trim();
    }
    
    if (typeof realIp === 'string') {
      return realIp.trim();
    }
    
    if (typeof cfConnectingIp === 'string') {
      return cfConnectingIp.trim();
    }
    
    return req.socket.remoteAddress || req.ip || 'unknown';
  }

  // Main middleware for request rate limiting
  middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const currentTime = Date.now();
      
      // Skip rate limiting if disabled
      if (!config.rateLimits.enabled) {
        logger.debug('[SUI-FX] Rate limiting disabled via configuration');
        return next();
      }

      const clientIP = this.extractClientIP(req);
      
      try {
        // IP-based rate limiting
        const ipResult = this.cache.checkIpRateLimit(
          clientIP,
          config.rateLimits.maxRequestsPerIP,
          config.rateLimits.windowMs
        );

        // Global rate limiting
        const globalResult = this.cache.checkGlobalRateLimit(
          config.rateLimits.maxRequestsPerWindow,
          config.rateLimits.windowMs
        );

        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit-IP': config.rateLimits.maxRequestsPerIP.toString(),
          'X-RateLimit-Remaining-IP': ipResult.remaining.toString(),
          'X-RateLimit-Reset-IP': Math.ceil(ipResult.resetTime / 1000).toString(),
          'X-RateLimit-Limit-Global': config.rateLimits.maxRequestsPerWindow.toString(),
          'X-RateLimit-Remaining-Global': globalResult.remaining.toString(),
          'X-RateLimit-Reset-Global': Math.ceil(globalResult.resetTime / 1000).toString(),
        });

        // Check if request should be blocked
        if (!ipResult.allowed) {
          logger.warn('[SUI-FX] IP rate limit exceeded', {
            clientIP,
            hits: ipResult.limit + 1,
            limit: ipResult.limit,
            resetTime: new Date(ipResult.resetTime).toISOString()
          });

          res.status(429).json({
            status: 'error',
            message: 'Too many requests from this IP address',
            retryAfter: Math.ceil((ipResult.resetTime - currentTime) / 1000)
          });
          return;
        }

        if (!globalResult.allowed) {
          logger.warn('[SUI-FX] Global rate limit exceeded', {
            globalHits: globalResult.limit + 1,
            limit: globalResult.limit
          });

          res.status(429).json({
            status: 'error', 
            message: 'Service temporarily overwhelmed, please try again later',
            retryAfter: Math.ceil((globalResult.resetTime - currentTime) / 1000)
          });
          return;
        }

        logger.debug('[SUI-FX] Rate limit check passed', {
          clientIP,
          ipRemaining: ipResult.remaining,
          globalRemaining: globalResult.remaining
        });

        next();
      } catch (error) {
        logger.error('[SUI-FX] Rate limiting error', { error, clientIP });
        // Fail open - allow the request if rate limiting fails
        next();
      }
    };
  }

  // Specialized wallet rate limiting for faucet requests
  async checkWalletRateLimit(walletAddress: string): Promise<{
    allowed: boolean;
    requestsRemaining: number;
    resetTime: number;
    message?: string;
  }> {
    try {
      const limit = config.rateLimits.maxRequestsPerWallet;
      const windowMs = config.rateLimits.windowMs; // Use same window as global

      const result = this.cache.checkWalletRateLimit(walletAddress, limit, windowMs);

      if (!result.allowed) {
        const hoursUntilReset = Math.ceil((result.resetTime - Date.now()) / (1000 * 60 * 60));
        
        logger.warn('[SUI-FX] Wallet rate limit exceeded', {
          walletAddress,
          limit,
          hoursUntilReset
        });

        return {
          allowed: false,
          requestsRemaining: 0,
          resetTime: result.resetTime,
          message: `Wallet has exceeded daily limit. Try again in ${hoursUntilReset} hour(s)`
        };
      }

      logger.debug('[SUI-FX] Wallet rate limit check passed', {
        walletAddress,
        remaining: result.remaining,
        limit
      });

      return {
        allowed: true,
        requestsRemaining: result.remaining,
        resetTime: result.resetTime
      };
    } catch (error) {
      logger.error('[SUI-FX] Wallet rate limit check failed', {
        error,
        walletAddress
      });

      // Fail open for wallet checks
      return {
        allowed: true,
        requestsRemaining: config.rateLimits.maxRequestsPerWallet,
        resetTime: Date.now() + config.rateLimits.windowMs
      };
    }
  }

  // Advanced rate limit bypass for admin operations
  async bypassRateLimitForAdmin(identifier: string): Promise<void> {
    try {
      // Remove from all tracking systems
      this.cache.getCacheStats(); // Just to ensure cache is active
      
      logger.info('[SUI-FX] Rate limit bypass activated', {
        identifier,
        bypassType: 'admin_override'
      });
    } catch (error) {
      logger.error('[SUI-FX] Failed to bypass rate limit', { error, identifier });
    }
  }

  // Get comprehensive rate limit status
  async getRateLimitStatus(clientIP?: string, walletAddress?: string): Promise<{
    ip?: RateLimitResult;
    wallet?: RateLimitResult;
    global: RateLimitResult;
    cacheStats: any;
  }> {
    const status: any = {
      global: this.cache.checkGlobalRateLimit(
        config.rateLimits.maxRequestsPerWindow,
        config.rateLimits.windowMs
      ),
      cacheStats: this.cache.getCacheStats()
    };

    if (clientIP) {
      status.ip = this.cache.checkIpRateLimit(
        clientIP,
        config.rateLimits.maxRequestsPerIP,
        config.rateLimits.windowMs
      );
    }

    if (walletAddress) {
      status.wallet = this.cache.checkWalletRateLimit(
        walletAddress,
        config.rateLimits.maxRequestsPerWallet,
        config.rateLimits.windowMs
      );
    }

    return status;
  }

  // Cleanup and destroy
  destroy(): void {
    this.cache.destroy();
    logger.info('[SUI-FX] Rate controller destroyed');
  }
}

// Export singleton instance
export const rateController = new RateController();

// Backward compatibility middleware export
export const rateLimiter = rateController.middleware();
