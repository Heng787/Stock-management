import { supplierValidation } from '../middleware/validator.js';
import express from 'express';
import { getSuppliers, addSupplier, updateSupplier, removeSupplier } from '../controllers/supplierController.js';
import { protect, admin } from '../middleware/authGuard.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getSuppliers)
  .post(admin, supplierValidation, addSupplier);

router.route('/:id')
  .put(admin, supplierValidation, updateSupplier)
  .delete(admin, removeSupplier);

export default router;
