import { Request, Response } from 'express';
import { Subject } from '../models/Subject';
import { Question } from '../models/Question';
import { Exam } from '../models/Exam';
import { Types } from 'mongoose';

// --- CẤU HÌNH MA TRẬN ĐỀ THI ---
const EXAM_CONFIG: Record<string, any> = {
    'math': { duration: 90, structure: { multiple_choice: 12, true_false: 4, short_answer: 6 } },
    'physics': { duration: 50, structure: { multiple_choice: 18, true_false: 4, short_answer: 6 } },
    'chemistry': { duration: 50, structure: { multiple_choice: 18, true_false: 4, short_answer: 6 } },
    'biology': { duration: 50, structure: { multiple_choice: 18, true_false: 4, short_answer: 6 } },
    'history': { duration: 50, structure: { multiple_choice: 24, true_false: 4, short_answer: 0 } },
    'english': { duration: 50, structure: { multiple_choice: 40, true_false: 0, short_answer: 0 } },
    
    'default': { duration: 45, structure: { multiple_choice: 20, true_false: 0, short_answer: 0 } }
};

// --- CẤU HÌNH THỜI GIAN (Phút/Câu) ĐỂ TÍNH LẠI KHI THIẾU CÂU ---
const TIME_PER_QUESTION: Record<string, any> = {
    'math': { multiple_choice: 2, true_false: 7, short_answer: 6 },
    'default': { multiple_choice: 1.5, true_false: 5, short_answer: 3 }
};

// 1. Lấy danh sách đề cố định + Config môn học
export const getExamsBySubject = async (req: Request, res: Response) => {
    try {
        const { subjectId } = req.params;
        let subject = await Subject.findOne({ 
            $or: [{ slug: subjectId }, { _id: Types.ObjectId.isValid(subjectId) ? subjectId : null }] 
        });
        
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        const exams = await Exam.find({ subjectId: subject._id, type: 'fixed' })
            .select('title duration createdAt')
            .sort({ createdAt: -1 });
        
        const config = EXAM_CONFIG[subject.slug] || EXAM_CONFIG['default'];

        res.json({
            fixedExams: exams,
            config: config,
            subjectName: subject.name
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching exams' });
    }
};

// 2. Lấy chi tiết đề cố định
export const getExamById = async (req: Request, res: Response) => {
    try {
        const exam = await Exam.findById(req.params.id).populate('questions');
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
};

// 3. Tạo đề ngẫu nhiên (Có co giãn thời gian)
export const generateRandomExam = async (req: Request, res: Response) => {
    try {
        const { subjectId } = req.body;
        
        let subject = await Subject.findOne({ 
            $or: [{ slug: subjectId }, { _id: Types.ObjectId.isValid(subjectId) ? subjectId : null }] 
        });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        const config = EXAM_CONFIG[subject.slug] || EXAM_CONFIG['default'];
        
        // Lấy câu hỏi ngẫu nhiên từ DB
        const p1 = await Question.aggregate([
            { 
        $match: { 
            subjectId: subject._id, 
            $or: [
                { type: 'multiple_choice' }, // Câu mới
                { type: { $exists: false } }, // Câu cũ (Legacy data)
                { type: null }                // Câu cũ
            ]
        } 
    },
            { $sample: { size: config.structure.multiple_choice } }
        ]);
        const p2 = await Question.aggregate([
            { $match: { subjectId: subject._id, type: 'true_false' } },
            { $sample: { size: config.structure.true_false } }
        ]);
        const p3 = await Question.aggregate([
            { $match: { subjectId: subject._id, type: 'short_answer' } },
            { $sample: { size: config.structure.short_answer } }
        ]);

        const allQuestions = [...p1, ...p2, ...p3];

        if (allQuestions.length === 0) {
            return res.status(400).json({ message: 'Ngân hàng câu hỏi trống!' });
        }

        // Tính toán lại thời gian nếu thiếu câu hỏi
        const requiredTotal = config.structure.multiple_choice + config.structure.true_false + config.structure.short_answer;
        let finalDuration = config.duration;
        let isFullExam = true;

        if (allQuestions.length < requiredTotal) {
            isFullExam = false;
            const timeConfig = TIME_PER_QUESTION[subject.slug] || TIME_PER_QUESTION['default'];
            const timeP1 = p1.length * timeConfig.multiple_choice;
            const timeP2 = p2.length * timeConfig.true_false;
            const timeP3 = p3.length * timeConfig.short_answer;
            finalDuration = Math.ceil(timeP1 + timeP2 + timeP3 + 2); // +2 phút soát bài
        }

        res.json({
            title: isFullExam ? `Đề thi ngẫu nhiên` : `Đề luyện tập (${allQuestions.length} câu)`,
            duration: finalDuration,
            totalQuestions: allQuestions.length,
            isFullExam: isFullExam,
            questions: allQuestions
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi tạo đề' });
    }
};

export const createFixedExam = async (req: Request, res: Response) => {
    try {
        const { subjectId, title, duration, questions } = req.body;

        // 1. Tìm môn học
        let subject = await Subject.findOne({ 
            $or: [{ slug: subjectId }, { _id: Types.ObjectId.isValid(subjectId) ? subjectId : null }] 
        });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        let finalQuestionIds: any[] = [];

        // 2. PHÂN LOẠI: THỦ CÔNG HAY NGẪU NHIÊN?
        if (questions && Array.isArray(questions) && questions.length > 0) {
            // --- CÁCH A: THỦ CÔNG (Frontend gửi ID câu hỏi lên) ---
            finalQuestionIds = questions;
            console.log(`[Exam] Creating MANUAL exam with ${finalQuestionIds.length} questions`);
        } else {
            // --- CÁCH B: NGẪU NHIÊN (Server tự bốc) ---
            console.log(`[Exam] Creating RANDOM exam`);
            const config = EXAM_CONFIG[subject.slug] || EXAM_CONFIG['default'];

            const p1 = await Question.aggregate([
                { $match: { subjectId: subject._id, type: 'multiple_choice' } },
                { $sample: { size: config.structure.multiple_choice } }
            ]);
            const p2 = await Question.aggregate([
                { $match: { subjectId: subject._id, type: 'true_false' } },
                { $sample: { size: config.structure.true_false } }
            ]);
            const p3 = await Question.aggregate([
                { $match: { subjectId: subject._id, type: 'short_answer' } },
                { $sample: { size: config.structure.short_answer } }
            ]);

            finalQuestionIds = [...p1, ...p2, ...p3].map(q => q._id);
        }

        if (finalQuestionIds.length === 0) {
            return res.status(400).json({ message: 'Không đủ câu hỏi để tạo đề!' });
        }

        // 3. Lưu vào bảng Exam
        const newExam = await Exam.create({
            title: title || `Đề thi ${subject.name} - ${new Date().toLocaleDateString()}`,
            subjectId: subject._id,
            questions: finalQuestionIds,
            duration: duration || 45,
            type: 'fixed'
        });

        res.status(201).json(newExam);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi tạo đề cố định' });
    }
};

export const removeQuestionFromExam = async (req: Request, res: Response) => {
    try {
        const { id, questionId } = req.params; // id là examId

        // Sử dụng $pull để rút questionId ra khỏi mảng questions
        const updatedExam = await Exam.findByIdAndUpdate(
            id,
            { $pull: { questions: questionId } },
            { new: true }
        );

        if (!updatedExam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        res.json({ message: 'Đã gỡ câu hỏi khỏi đề thi', exam: updatedExam });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi gỡ câu hỏi' });
    }
};