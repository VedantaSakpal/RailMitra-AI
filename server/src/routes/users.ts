import { Router } from 'express';
import { getMe } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/users/me  — already handled by /api/auth/me, but also available here
router.get('/me', authenticate as any, getMe);

export default router;
