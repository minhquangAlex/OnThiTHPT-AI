import { Router } from 'express';
import { protect, admin } from '../middleware/authMiddleware';
import * as attemptController from '../controllers/attemptController';

const router = Router();

router.post('/', protect, attemptController.createAttempt);  // Private
router.get('/', protect, admin, attemptController.getAllAttempts);
router.get('/:id', protect, attemptController.getAttemptById);  // Thêm route nếu chưa
router.delete('/:id', protect, admin, attemptController.deleteAttempt);
router.delete('/all', protect, admin, attemptController.deleteAllAttempts);

export default router;