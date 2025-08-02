import { Router, Request, Response } from 'express';

const router = Router();

router.get('/status', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'active',
    message: 'Admin API operational',
    timestamp: new Date().toISOString()
  });
});

export { router as adminRoutes };
