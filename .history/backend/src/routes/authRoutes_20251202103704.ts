import { Router } from 'express';
import { findUserPublic, loginUser, registerUser, resetPasswordPublic } from '../controllers/authController';

const router = Router();

router.post('/login', loginUser);
router.post('/register', registerUser); // Add register route
router.post('/reset-password', resetPasswordPublic);
router.get('/find-user', findUserPublic);

export default router;
