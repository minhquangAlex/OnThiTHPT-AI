import { Router } from 'express';
import { loginUser, registerUser, resetPasswordPublic, findUserPublic } from '../controllers/authController';

const router = Router();

router.post('/login', loginUser);
router.post('/register', registerUser); // Add register route
router.post('/reset-password', resetPasswordPublic);
router.get('/find-user', findUserPublic);

export default router;
