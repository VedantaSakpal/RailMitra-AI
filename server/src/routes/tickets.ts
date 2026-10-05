import { Router } from 'express';
import { estimateTicket, bookTicket, getUserTickets } from '../controllers/ticketController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Route: POST /api/tickets/estimate
// Description: Get distance + fare estimate (no auth needed for preview)
// Access: Public
router.post('/estimate', estimateTicket);

// Route: POST /api/tickets/book
// Description: Book a new train ticket (requires auth)
// Access: Private
router.post('/book', authenticate, bookTicket);

// Route: GET /api/tickets/my-tickets
// Description: Get all tickets for the logged in user
// Access: Private
router.get('/my-tickets', authenticate, getUserTickets);

export default router;
