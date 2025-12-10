import { Request, Response } from 'express';
import { Subject } from '../models/Subject';
import { Question } from '../models/Question';
import { Exam } from '../models/Exam';
import { Types } from 'mongoose';

// --- CẤU HÌNH MA TRẬN ĐỀ THI (Số lượng câu hỏi) ---
const EXAM_CONFIG: Record<string, any> = {
    'math': { // Toán: 90 phút
        duration: 90,
        structure: { multiple_choice: 12, true_false: 4, short_answer: 6 }
    },
    'physics': { duration: 50, structure: { multiple_choice: 18, true_false: 4, short_answer: 6 } },
    'chemistry': { duration: 50, structure: { multiple_choice: 18, true_false: 4, short_answer: 6 } },
    'biology': { duration: 50, structure: { multiple_choice: 18, true_false: 4, short_answer: 6 } },
    'history': { duration: 50, structure: { multiple_choice: 24, true_false: 4, short_answer: 0 } },
    'english': { duration: 50, structure: { multiple_choice: 40, true_false: 0, short_answer: 0 } },
    // Cấu hình mặc định cho các môn khác
    'default': { duration: 45, structure: { multiple_choice: 20, true_false: 0, short_answer: 0 } }
};

// --- ĐỊNH NGHĨA THỜI GIAN ƯỚC LƯỢNG CHO TỪNG CÂU (Để tính lại giờ khi thiếu câu) ---
// Đơn vị: Phút
const TIME_PER_QUESTION: Record<string, any> = {
    'math': { multiple_choice: 2, true_false: 7, short_answer: 6 }, // Toán cần nhiều thời gian
    'default': { multiple_choice: 1.5, true_false: 5, short_answer: 3 } // Các môn khác nhanh hơn
};

// 1. Lấy danh sách đề thi cố định của môn
export const getExamsBySubject = async (req: Request, res: Response) => {
    try {
        const { subjectId } = req.params;
        let subject = await Subject.findOne({ 
            $or: [{ slug: subjectId }, { _id: Types.ObjectId.isValid(subjectId) ? subjectId : null }] 
        });
        
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        // Lấy danh sách đề cố định
        const exams = await Exam.find({ subjectId: subject._id, type: 'fixed' })
            .select('title duration createdAt')
            .sort({ createdAt: -1 });
        
        // Lấy config ma trận của môn này
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

// 2. Lấy chi tiết đề thi cố định
export const getExamById = async (req: Request, res: Response) => {
    try {
        const exam = await Exam.findById(req.params.id).populate('questions');
        if (!exam) return res.status(404).json({ message: 'Exam not found' });
        res.json(exam);
    } catch (error) {
        res.status(500).json({ message: 'Error' });
    }
};

// 3. TẠO ĐỀ NGẪU NHIÊN (Logic quan trọng)
export const generateRandomExam = async (req: Request, res: Response) => {
    try {
        const { subjectId } = req.body;
        
        let subject = await Subject.findOne({ 
            $or: [{ slug: subjectId }, { _id: Types.ObjectId.isValid(subjectId) ? subjectId : null }] 
        });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        const config = EXAM_CONFIG[subject.slug] || EXAM_CONFIG['default'];
        
        // --- BƯỚC 1: Lấy câu hỏi ngẫu nhiên từ DB ---
        // (Nếu DB không đủ, MongoDB sẽ chỉ trả về số lượng tối đa đang có)
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

        const allQuestions = [...p1, ...p2, ...p3];

        if (allQuestions.length === 0) {
            return res.status(400).json({ message: 'Ngân hàng câu hỏi cho môn này hiện đang trống!' });
        }

        // --- BƯỚC 2: Tính toán lại thời gian (Dynamic Duration) ---
        
        const requiredTotal = config.structure.multiple_choice + config.structure.true_false + config.structure.short_answer;
        let finalDuration = config.duration; // Mặc định là thời gian chuẩn (vd: 90p)
        let isFullExam = true;

        // Nếu số câu lấy được ít hơn yêu cầu -> Tính lại giờ
        if (allQuestions.length < requiredTotal) {
            isFullExam = false;
            const timeConfig = TIME_PER_QUESTION[subject.slug] || TIME_PER_QUESTION['default'];
            
            // Công thức: Tổng thời gian = (Số câu P1 * tgian P1) + ... + 2 phút soát bài
            const timeP1 = p1.length * timeConfig.multiple_choice;
            const timeP2 = p2.length * timeConfig.true_false;
            const timeP3 = p3.length * timeConfig.short_answer;
            
            // Làm tròn lên
            finalDuration = Math.ceil(timeP1 + timeP2 + timeP3 + 2);
        }

        // --- BƯỚC 3: Trả về kết quả ---
        res.json({
            title: isFullExam 
                ? `Đề thi ngẫu nhiên - ${subject.name}`
                : `Đề luyện tập rút gọn (${allQuestions.length} câu)`,
            duration: finalDuration, // Thời gian đã được co giãn
            totalQuestions: allQuestions.length,
            isFullExam: isFullExam, // Cờ báo hiệu để Frontend hiển thị cảnh báo
            questions: allQuestions
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi tạo đề' });
    }
};