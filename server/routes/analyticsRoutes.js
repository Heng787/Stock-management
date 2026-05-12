import express from 'express';
import { getTrends, getTopProducts, getValuation, getStats } from '../controllers/analyticsController.js';
import { protect, admin } from '../middleware/authGuard.js';

const router = express.Router();

router.use(protect);

router.get('/trends', getTrends);
router.get('/top-products', getTopProducts);
router.get('/valuation', admin, getValuation);
router.get('/stats', admin, getStats);

export default router;
