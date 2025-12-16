import { Router } from 'express';
import { batchUploadQuestions, createQuestion, deleteQuestion, getQuestionsBySubject, updateQuestion,deleteQuestionsBulk } from '../controllers/questionController';
import { admin, protect } from '../middleware/authMiddleware';

const router = Router();

// Public: get questions for a specific subject
router.get('/:subjectId', getQuestionsBySubject);

// Admin routes for managing questions
router.post('/', protect, admin, createQuestion);
router.put('/:id', protect, admin, updateQuestion);
router.delete('/:id', protect, admin, deleteQuestion);

// Admin route for batch uploading questions
router.post('/batch', protect, admin, batchUploadQuestions);

export default router;
