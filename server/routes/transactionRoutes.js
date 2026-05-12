import express from 'express';
import { protect } from '../middleware/authGuard.js';
import { createTransaction } from '../services/transactionService.js';
import Transaction from '../models/Transaction.js';

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('items.product', 'name sku')
      .populate('warehouse', 'name')
      .populate('customer', 'name')
      .populate('supplier', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await createTransaction(req.body, req.user._id);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
