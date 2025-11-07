import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser, resetPassword } from '../controllers/userController';
import { protect, admin } from '../middleware/authMiddleware';

const router = Router();

// All routes below require admin privileges
router.use(protect, admin);

router.get('/', getUsers);
router.post('/', createUser);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.post('/:id/reset-password', resetPassword);

export default router;
