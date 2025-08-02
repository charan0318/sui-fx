import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';
import { apiClientService } from '../services/apiClient.js';

// API Key authentication middleware
export const apiKeyAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const requestId = req.requestId;
  const clientIP = req.ip || 'unknown';
  const startTime = Date.now();

  // Try to get API key from multiple sources
  let apiKey: string | undefined;

  // 1. Check X-API-Key header (most common for API keys)
  const xApiKey = req.headers['x-api-key'] as string;
  if (xApiKey) {
    apiKey = xApiKey;
  }

  // 2. Check Authorization Bearer header (fallback)
  const authHeader = req.headers.authorization;
  if (!apiKey && authHeader && authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  // 3. Check Authorization header without Bearer (simple format)
  if (!apiKey && authHeader && !authHeader.startsWith('Bearer ')) {
    apiKey = authHeader;
  }

  if (!apiKey) {
    logger.warn('🚫 Missing API key', {
      requestId,
      ip: clientIP,
      path: req.path,
    });

    res.status(401).json({
      success: false,
      message: '🚫 Missing API key. Please provide API key.',
      error: {
        code: 'MISSING_API_KEY',
        details: 'API key required',
      },
    });
    return;
  }
  
  // First check if it's the legacy/admin API key
  if (apiKey === config.auth.apiKey) {
    logger.info('✅ Legacy API key validated', {
      requestId,
      ip: clientIP,
      path: req.path,
    });
    next();
    return;
  }

  // Check if it's a registered client API key
  try {
    const client = await apiClientService.getClientByApiKey(apiKey);
    
    if (!client) {
      logger.warn('🚫 Invalid API key', {
        requestId,
        ip: clientIP,
        path: req.path,
        providedKey: apiKey.substring(0, 8) + '***',
      });
      
      res.status(401).json({
        success: false,
        message: '🚫 Invalid API key. Access denied.',
        error: {
          code: 'INVALID_API_KEY',
          details: 'The provided API key is incorrect',
        },
      });
      return;
    }

    if (!client.is_active) {
      logger.warn('🚫 Inactive API client', {
        requestId,
        ip: clientIP,
        path: req.path,
        clientId: client.client_id,
      });
      
      res.status(401).json({
        success: false,
        message: '🚫 API client is inactive. Access denied.',
        error: {
          code: 'INACTIVE_CLIENT',
          details: 'This API client has been deactivated',
        },
      });
      return;
    }

    // Record usage for the client
    const responseTime = Date.now() - startTime;
    const userAgent = req.get('User-Agent');
    const method = req.method;
    const endpoint = req.path;

    // Record usage asynchronously (don't block the request)
    apiClientService.recordUsage(
      apiKey,
      endpoint,
      method,
      200, // We'll update this in a response middleware if needed
      responseTime,
      clientIP,
      userAgent
    ).catch((error) => {
      logger.error('Failed to record API usage', { error: error.message });
    });

    // Add client info to request for downstream middleware
    (req as any).apiClient = {
      id: client.client_id,
      name: client.name,
      rateLimitOverride: client.rate_limit_override
    };

    logger.info('✅ Client API key validated', {
      requestId,
      ip: clientIP,
      path: req.path,
      clientId: client.client_id,
      clientName: client.name,
    });
    
    next();
  } catch (error: any) {
    logger.error('API key validation error', {
      requestId,
      ip: clientIP,
      error: error.message,
    });
    
    res.status(500).json({
      success: false,
      message: '🚫 API key validation failed.',
      error: {
        code: 'VALIDATION_ERROR',
        details: 'Unable to validate API key',
      },
    });
  }
};

// Optional: API key auth for specific endpoints
export const requireApiKey = apiKeyAuth;
