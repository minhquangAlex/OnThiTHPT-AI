import { Router } from 'express';
import { createUser, deleteUser, getUserById, getUsers, resetPassword, updateUser } from '../controllers/userController';
import { admin, protect } from '../middleware/authMiddleware';

const router = Router();

// Require authentication for all user routes, but only admins can access some
router.use(protect);

router.get('/', admin, getUsers);
router.post('/', admin, createUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', admin, deleteUser);
router.post('/:id/reset-password', resetPassword);

export default router;
