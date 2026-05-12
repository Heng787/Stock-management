import {
  getProducts,
  getProduct,
  addProduct,
  addProductsBulk,
  updateProduct,
  removeProduct,
  getProductHistory,
} from '../controllers/productController.js'
import { protect, admin } from '../middleware/authGuard.js'
import { productValidation } from '../middleware/validator.js'
import express from 'express'
const router = express.Router()

router.use(protect)

router.route('/').get(getProducts).post(admin, productValidation, addProduct)
router.post('/bulk', admin, addProductsBulk)

router.route('/:id').get(getProduct).put(admin, updateProduct).delete(admin, removeProduct)
router.get('/:id/history', getProductHistory)

export default router
