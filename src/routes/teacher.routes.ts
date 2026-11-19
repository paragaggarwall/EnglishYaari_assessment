import { Router } from 'express';
import { createTeacher } from '../controllers/user.controller';

const router = Router();

// Helper endpoint (not part of the assignment's 6 APIs) so teachers can be created for testing.
router.post('/', createTeacher);

export default router;
