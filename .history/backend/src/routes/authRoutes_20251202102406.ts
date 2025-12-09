import { Router } from 'express';
import { loginUser, registerUser } from '../controllers/authController';
import { resetPasswordPublic } from '../controllers/authController';

const router = Router();

router.post('/login', loginUser);
router.post('/register', registerUser); // Add register route
router.post('/reset-password', resetPasswordPublic);

export default router;
