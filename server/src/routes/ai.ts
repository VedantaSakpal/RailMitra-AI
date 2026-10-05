import { Router } from 'express';
import { chatWithAI } from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Route: POST /api/ai/chat
// Description: Chat with RailMitra AI assistant
// Access: Private (Requires Authentication)
router.post('/chat', authenticate, chatWithAI);

export default router;
