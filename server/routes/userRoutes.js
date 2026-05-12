import express from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { protect, admin } from '../middleware/authGuard.js';

const router = express.Router();

router.use(protect); // All routes need auth

router.get('/', admin, getUsers); // Only admin can list users
router.post('/', admin, createUser); // Only admin can create users
router.put('/:id', admin, updateUser); // Only admin can update users
router.delete('/:id', admin, deleteUser); // Only admin can delete users

export default router;
