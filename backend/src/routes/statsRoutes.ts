import { Router } from 'express';
import { getStats, getSubjectStats, getQuestionStats } from '../controllers/statsController';
import { admin, protect } from '../middleware/authMiddleware';

const router = Router();

// Public stats endpoint (can be protected later if needed)
router.get('/', getStats);

// Admin endpoint to get subject stats
router.route('/subjects').get(protect, admin, getSubjectStats);

// Admin endpoint to get question stats
router.route('/questions').get(protect, admin, getQuestionStats);

export default router;
