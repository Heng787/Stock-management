import express from 'express';
import { protect } from '../middleware/authGuard.js';
import Warehouse from '../models/Warehouse.js';

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const warehouses = await Warehouse.find().sort({ name: 1 });
    res.json({ success: true, data: warehouses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    res.status(201).json({ success: true, data: warehouse });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Warehouse.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: null });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
