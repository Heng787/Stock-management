import express from 'express';
import { protect, admin } from '../middleware/authGuard.js';
import { customerValidation } from '../middleware/validator.js';
import { getCustomers, getCustomer, addCustomer, updateCustomer, removeCustomer } from '../controllers/customerController.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCustomers)
  .post(admin, customerValidation, addCustomer);

router.route('/:id')
  .get(getCustomer)
  .put(admin, customerValidation, updateCustomer)
  .delete(admin, removeCustomer);

export default router;
