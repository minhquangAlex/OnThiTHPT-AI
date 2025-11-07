import { Router } from 'express';
import { getQuestionsBySubject, createQuestion, updateQuestion, deleteQuestion } from '../controllers/questionController';
import { protect, admin } from '../middleware/authMiddleware';

const router = Router();

// Public: get questions for a specific subject
router.get('/:subjectSlug', getQuestionsBySubject);

// Admin routes for managing questions
router.post('/', protect, admin, createQuestion);
router.put('/:id', protect, admin, updateQuestion);
router.delete('/:id', protect, admin, deleteQuestion);

export default router;
