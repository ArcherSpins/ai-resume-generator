import { Router } from 'express';
import { getCurrentUser } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, getCurrentUser);

export default router;
