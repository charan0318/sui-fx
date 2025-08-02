/**
 * SUI-FX Original Faucet Routes
 * Sui testnet token distribution endpoints with original implementation
 */

import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validate, dropRequestSchema, normalizeSuiAddress } from '../validation/schemas.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { requireApiKey } from '../middleware/apiKeyAuth.js';
import { suiBlockchainService } from '../services/suiBlockchain.js';
import { memoryCacheService } from '../services/memoryCache.js';
import { dataPersistenceService } from '../services/dataPersistence.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /api/v2/sui/drop:
 *   post:
 *     summary: Request SUI testnet tokens from SUI-FX faucet
 *     tags: [SUI Faucet]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - walletAddress
 *             properties:
 *               walletAddress:
 *                 type: string
 *                 description: Sui wallet address (0x format)
 *                 example: "0x742d35cc6db2b0c34e1b7b8e0b1a6a4b3c9d8e7f..."
 *               amount:
 *                 type: string
 *                 description: Amount in MIST (optional, defaults to 0.1 SUI)
 *                 example: "100000000"
 */
router.post('/drop', requireApiKey, rateLimiter, validate(dropRequestSchema), asyncHandler(async (req, res) => {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  try {
    logger.info('[SUI-FX] Drop request initiated', {
      requestId,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    const { walletAddress, amount } = req.body;
    const validAddress = normalizeSuiAddress(walletAddress);
    const amountToSend = amount || config.sui.defaultAmount;

    // Check if blockchain service is ready
    const isServiceReady = await suiBlockchainService.validateFaucetOperationalStatus();
    if (!isServiceReady) {
      const response = {
        status: 'error',
        message: 'SUI-FX service temporarily unavailable. Please try again later.',
        requestId
      };
      return res.status(500).json(response);
    }

    // Execute token transfer using our transformed blockchain service
    const transferResult = await suiBlockchainService.executeTokenTransfer(
      validAddress,
      BigInt(amountToSend)
    );

    if (transferResult.completed) {
      // Log successful transaction to database
      try {
        await dataPersistenceService.recordTokenDrop({
          request_id: requestId,
          wallet_address: validAddress,
          drop_amount: amountToSend,
          tx: transferResult.tx || 'unknown',
          network: config.sui.network,
          status: 'success',
          ip_address: req.ip || 'unknown',
          user_agent: req.get('User-Agent'),
          logged_at: new Date().toISOString()
        });
      } catch (dbError) {
        logger.error('[SUI-FX] Failed to record successful transaction', {
          requestId,
          error: dbError
        });
      }

      logger.info('[SUI-FX] ✅ Drop completed successfully', {
        requestId,
        walletAddress: validAddress,
        tx: transferResult.tx,
        amount: amountToSend,
        executionTime: Date.now() - startTime
      });

      const response = {
        status: 'ok',
        tx: transferResult.tx,
        network: `sui-${config.sui.network}`,
        drop: `${Number(amountToSend) / 1_000_000_000} SUI`,
        requestId
      };

      return res.status(200).json(response);
    } else {
      logger.error('[SUI-FX] Token transfer failed', {
        requestId,
        walletAddress: validAddress,
        error: transferResult.errorMessage,
        executionTime: Date.now() - startTime
      });

      const response = {
        status: 'error',
        message: transferResult.errorMessage || 'Failed to send SUI tokens. Please try again later.',
        requestId
      };

      return res.status(500).json(response);
    }

  } catch (error) {
    logger.error('[SUI-FX] Drop request failed with unexpected error', {
      requestId,
      error,
      executionTime: Date.now() - startTime
    });

    const response = {
      status: 'error',
      message: 'Internal server error. Please try again later.',
      requestId
    };

    return res.status(500).json(response);
  }
}));

/**
 * @swagger
 * /api/v2/sui/status:
 *   get:
 *     summary: Get SUI-FX faucet status and statistics
 *     tags: [SUI Faucet]
 *     security:
 *       - ApiKeyAuth: []
 */
router.get('/status', requireApiKey, asyncHandler(async (req, res) => {
  try {
    // Get wallet information using the correct method name
    const walletInfo = await suiBlockchainService.assessWalletStatus();
    
    // Get system metrics (last 24 hours)
    const metrics = await dataPersistenceService.generateSystemMetrics(24);
    
    const response = {
      status: 'ok',
      faucet: {
        address: walletInfo.address,
        balance: `${Number(walletInfo.balance || '0') / 1_000_000_000} SUI`,
        network: config.sui.network,
        isActive: true // walletInfo has balance info
      },
      metrics: {
        totalDrops: metrics.totalDrops,
        successfulDrops: metrics.successfulDrops,
        failedDrops: metrics.failedDrops,
        uniqueWallets: metrics.uniqueWallets,
        totalDistributed: `${Number(metrics.totalSuiDistributed) / 1_000_000_000} SUI`
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
  } catch (error) {
    logger.error('[SUI-FX] Status check failed', { error });
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve faucet status'
    });
  }
}));

// Export the router
export const faucetRoutes = router;
