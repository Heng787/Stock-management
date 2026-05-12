import express from 'express';
import * as reportController from '../controllers/reportController.js';
import { protect } from '../middleware/authGuard.js';

const router = express.Router();

router.get('/summary', protect, reportController.getDashboardSummary);
router.get('/movers', protect, reportController.getInventoryMovers);

export default router;
