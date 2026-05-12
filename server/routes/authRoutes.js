import express from 'express';
import { register, login } from '../controllers/authController.js';
import { protect, admin } from '../middleware/authGuard.js';

const router = express.Router();

router.post('/register', protect, admin, register);
router.post('/login', login);

export default router;
