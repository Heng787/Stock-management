import express from 'express';
import { getCategories, addCategory, updateCategory, removeCategory } from '../controllers/categoryController.js';
import { protect, admin } from '../middleware/authGuard.js';
import { categoryValidation } from '../middleware/validator.js';

const router = express.Router();

router.use(protect); // All category routes require login

router.route('/')
  .get(getCategories)
  .post(admin, categoryValidation, addCategory);

router.route('/:id')
  .put(admin, updateCategory)
  .delete(admin, removeCategory);

export default router;
