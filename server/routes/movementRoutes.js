import express from 'express';
import { addMovement, getHistory } from '../controllers/movementController.js';
import { protect } from '../middleware/authGuard.js';

const router = express.Router();

router.use(protect);

router.post('/', addMovement);
router.get('/:productId', getHistory);

export default router;
