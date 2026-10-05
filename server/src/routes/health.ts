import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/health
 * Health check endpoint — verifies server and database connectivity
 */
router.get('/', async (_req: Request, res: Response) => {
  const start = Date.now();

  let dbStatus = 'disconnected';
  let dbLatency = -1;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  const responseTime = Date.now() - start;

  res.status(200).json({
    success: true,
    message: '🚂 RailMitra API is running',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      responseTime: `${responseTime}ms`,
      services: {
        api: { status: 'online' },
        database: {
          status: dbStatus,
          latency: dbLatency >= 0 ? `${dbLatency}ms` : 'N/A',
        },
      },
    },
  });
});

export default router;
