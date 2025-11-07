import { Request, Response } from 'express';
import { Question } from '../models/Question';
import { Types } from 'mongoose';  // Thêm để validate ObjectId
import { Subject } from '../models/Subject';

// @desc    Fetch questions by subject
// @route   GET /api/questions/:subjectSlug
// @access  Public (can be protected later)
export const getQuestionsBySubject = async (req: Request, res: Response) => {
    console.log('\n\x1b[35m--- [DEBUG Backend] Entering getQuestionsBySubject ---\x1b[0m');  // Tím cho backend
    try {
        const { subjectId } = req.params;  // Đổi từ subjectSlug sang subjectId
        console.log(`\x1b[35m[DEBUG Backend] 1. Received subjectId: '${subjectId}'\x1b[0m`);

        // Validate ObjectId (thêm để tránh lỗi)
        if (!Types.ObjectId.isValid(subjectId)) {
            console.log(`\x1b[35m[DEBUG Backend] 2. Invalid subjectId format. Returning empty array.\x1b[0m`);
            return res.json({ success: false, message: 'Invalid subject ID', data: [] });
        }

        // Optional: Validate subject tồn tại (nếu cần, uncomment)
        // const subject = await Subject.findById(subjectId);
        // if (!subject) {
        //     console.log(`\x1b[35m[DEBUG Backend] 2. Subject NOT FOUND for ID: '${subjectId}'. Returning empty array.\x1b[0m`);
        //     return res.json({ success: false, message: 'Subject not found', data: [] });
        // }
        // console.log(`\x1b[35m[DEBUG Backend] 2. Subject FOUND: '${subject.name}'\x1b[0m`);

        // Query trực tiếp questions bằng subjectId
        console.log(`\x1b[35m[DEBUG Backend] 3. Querying questions for subjectId: '${subjectId}'\x1b[0m`);
        const questions = await Question.find({ subjectId: new Types.ObjectId(subjectId) })
            .populate('subjectId', 'name');  // Optional: Populate tên subject nếu cần ở frontend
        console.log(`\x1b[35m[DEBUG Backend] 4. Found ${questions.length} questions.\x1b[0m`);

        if (questions.length === 0) {
            console.log(`\x1b[35m[DEBUG Backend] 5. No questions – check if data seeded for this subjectId.\x1b[0m`);
        }

        res.json({ success: true, data: questions });  // Wrap để frontend dễ handle
        console.log(`\x1b[35m--- [DEBUG Backend] Exiting getQuestionsBySubject ---\x1b[0m\n`);
    } catch (error) {
        console.error("\x1b[35m[DEBUG Backend] Error in getQuestionsBySubject:\x1b[0m", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ khi tải câu hỏi" });
    }
};

// @desc    Create a new question
// @route   POST /api/questions
// @access  Admin
export const createQuestion = async (req: Request, res: Response) => {
    try {
        const { subjectId, questionText, options, correctAnswer, explanation, imageUrl } = req.body;
        const question = await Question.create({ subjectId, questionText, options, correctAnswer, explanation, imageUrl });
        res.status(201).json(question);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo câu hỏi' });
    }
};

// @desc    Update an existing question
// @route   PUT /api/questions/:id
// @access  Admin
export const updateQuestion = async (req: Request, res: Response) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: 'Không tìm thấy câu hỏi' });
        const { questionText, options, correctAnswer, explanation } = req.body;
        if (questionText) question.questionText = questionText;
        if (options) question.options = options;
        if (correctAnswer) question.correctAnswer = correctAnswer;
        if (explanation) question.explanation = explanation;
        await question.save();
        res.json(question);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi cập nhật câu hỏi' });
    }
};

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Admin
export const deleteQuestion = async (req: Request, res: Response) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: 'Không tìm thấy câu hỏi' });
        await question.deleteOne();
        res.json({ message: 'Xóa câu hỏi thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa câu hỏi' });
    }
};