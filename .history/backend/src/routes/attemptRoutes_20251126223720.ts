import { Router } from 'express';
import { createAttempt, deleteAllAttempts, deleteAttempt, getAllAttempts, getAttemptById, getMyAttempts } from '../controllers/attemptController';
import { admin, protect } from '../middleware/authMiddleware';

const router = Router();

// Admin endpoint to delete all attempts
router.route('/all').delete(protect, admin, deleteAllAttempts);

// User endpoint to get own attempts (cho trang cá nhân)
router.route('/my-attempts').get(protect, getMyAttempts);

// Public endpoint for recording attempts
router.post('/', createAttempt);

// Admin endpoint to get all attempts
router.route('/').get(protect, admin, getAllAttempts);

// Admin endpoint to get/delete a single attempt by ID
router.route('/:id').get(protect, getAttemptById).delete(protect, admin, deleteAttempt);

export default router;
