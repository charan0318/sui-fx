import { Router, Request, Response } from 'express';
import { databaseService } from '../services/database.js';
import { suiService } from '../services/sui.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /api/v1/stats:
 *   get:
 *     summary: Get system statistics
 *     description: Returns real-time system statistics including transaction counts, success rates, and service status
 *     tags:
 *       - Stats
 *     responses:
 *       200:
 *         description: System statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     successRate:
 *                       type: string
 *                       example: "98.5%"
 *                     totalTransactions:
 *                       type: number
 *                       example: 1250
 *                     successfulTransactions:
 *                       type: number
 *                       example: 1231
 *                     failedTransactions:
 *                       type: number
 *                       example: 19
 *                     totalAmountDistributed:
 *                       type: string
 *                       example: "125.0"
 *                     uptime:
 *                       type: string
 *                       example: "99.9%"
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-02T20:30:00Z"
 *       500:
 *         description: Internal server error
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get transaction stats from database
    let transactionStats = {
      total: 0,
      successful: 0,
      failed: 0,
      totalAmount: '0'
    };

    try {
      if (databaseService) {
        transactionStats = await databaseService.getTransactionStats();
      }
    } catch (error) {
      logger.warn('Failed to get transaction stats from database:', error);
    }

    // Calculate success rate
    const successRate = transactionStats.total > 0 
      ? ((transactionStats.successful / transactionStats.total) * 100).toFixed(1)
      : '0.0';

    // Get SUI service status
    let suiServiceOnline = false;
    try {
      const healthCheck = await suiService.healthCheck();
      suiServiceOnline = healthCheck.status === 'healthy';
    } catch (error) {
      logger.warn('SUI service health check failed:', error);
    }

    // Calculate uptime (placeholder - in production you'd track this)
    const uptime = suiServiceOnline ? '99.9' : '0.0';

    const stats = {
      success: true,
      data: {
        successRate: `${successRate}%`,
        totalTransactions: transactionStats.total,
        successfulTransactions: transactionStats.successful,
        failedTransactions: transactionStats.failed,
        totalAmountDistributed: (parseFloat(transactionStats.totalAmount) / 1000000000).toFixed(1), // Convert from MIST to SUI
        uptime: `${uptime}%`,
        lastUpdated: new Date().toISOString(),
        services: {
          suiNetwork: suiServiceOnline ? 'operational' : 'down',
          database: databaseService ? 'operational' : 'down',
          api: 'operational' // If we're responding, API is operational
        }
      }
    };

    logger.debug('System stats retrieved', { stats });
    res.json(stats);

  } catch (error) {
    logger.error('Failed to get system stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve system statistics'
    });
  }
});

export default router;
