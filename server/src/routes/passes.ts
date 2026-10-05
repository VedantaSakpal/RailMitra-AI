import { Router } from 'express';
import { buyPass, getUserPasses } from '../controllers/passController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Route: POST /api/passes/buy
// Description: Purchase a new railway pass
// Access: Private
router.post('/buy', authenticate, buyPass);

// Route: GET /api/passes/my-passes
// Description: Get all passes for the logged-in user
// Access: Private
router.get('/my-passes', authenticate, getUserPasses);

export default router;
