import { Router } from 'express';
import { suiService } from '../services/sui.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * @swagger
 * /api/v1/network:
 *   get:
 *     summary: Get SUI network status
 *     description: Returns real-time SUI network information including block height and network health
 *     tags: [Network]
 *     responses:
 *       200:
 *         description: Network status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     network:
 *                       type: string
 *                     blockHeight:
 *                       type: string
 *                     latency:
 *                       type: string
 *                     status:
 *                       type: string
 *                     lastUpdated:
 *                       type: string
 */
router.get('/', async (req, res) => {
  const requestId = req.headers['x-request-id'] as string;
  
  try {
    // Get network status from SUI service
    const networkStatus = await suiService.getNetworkStatus();
    
    const response = {
      success: true,
      data: {
        network: networkStatus.network,
        blockHeight: networkStatus.blockHeight,
        latency: `${networkStatus.latency}ms`,
        status: networkStatus.status,
        lastUpdated: new Date().toISOString()
      }
    };

    logger.info('Network status retrieved', { 
      requestId, 
      latency: networkStatus.latency,
      blockHeight: networkStatus.blockHeight
    });

    res.json(response);

  } catch (error: any) {
    logger.error('Failed to get network status', {
      requestId,
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      error: {
        code: 'NETWORK_STATUS_ERROR',
        message: '❌ Failed to retrieve network status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
});

export default router;
export { router as networkRoutes };
