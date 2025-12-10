import express from 'express';
import {
    generateRandomExam,
    getExamById,
    getExamsBySubject
} from '../controllers/examController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// 1. Lấy danh sách đề thi cố định của một môn (kèm config ma trận)
// GET /api/exams/subject/:subjectId
router.get('/subject/:subjectId', protect, getExamsBySubject);

// 2. Tạo đề thi ngẫu nhiên theo ma trận
// POST /api/exams/random
router.post('/random', protect, generateRandomExam);

// 3. Lấy chi tiết một đề thi cố định (theo ID đề)
// GET /api/exams/:id
router.get('/:id', protect, getExamById);

export default router;