import { Router } from 'express';
import { loginUser, registerUser, lookupUser, publicResetPassword } from '../controllers/authController';

const router = Router();

router.post('/login', loginUser);
router.post('/register', registerUser); // Add register route
router.get('/lookup', lookupUser);
router.post('/reset-password', publicResetPassword);

export default router;
