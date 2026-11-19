import { Router } from 'express';
import {
  bookSession,
  completeSession,
  createSession,
  getAvailableSessions,
} from '../controllers/session.controller';

const router = Router();

router.post('/', createSession);
// must be declared before any "/:id" routes
router.get('/available', getAvailableSessions);
router.post('/:id/book', bookSession);
router.patch('/:id/complete', completeSession);

export default router;
