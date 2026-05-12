import express from 'express';
import { getActivity } from '../controllers/activityController.js';
import { protect } from '../middleware/authGuard.js';

const router = express.Router();

router.use(protect);

// GET /api/activity?limit=10
router.get('/', getActivity);

export default router;
