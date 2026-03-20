import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getHistory, getHistoryById, updateHistoryById } from '../controllers/historyController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getHistory);
router.get('/:id', getHistoryById);
router.put('/:id', updateHistoryById);

export default router;
