import { Router } from 'express';
import { getSubjects, updateSubject } from '../controllers/subjectController';
import { protect, admin } from '../middleware/authMiddleware';

const router = Router();

router.get('/', getSubjects);
// Protected update route - admin only
router.put('/:id', protect, admin, updateSubject);

export default router;
