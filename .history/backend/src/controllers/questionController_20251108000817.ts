import { Request, Response } from 'express';
import { Question } from '../models/Question';
import { Types } from 'mongoose';  // Thêm để validate ObjectId
import { Subject } from '../models/Subject';

// @desc    Fetch questions by subject
// @route   GET /api/questions/:subjectSlug
// @access  Public (can be protected later)
export const getQuestionsBySubject = async (req: Request, res: Response) => {
    console.log('\n\x1b[35m--- [DEBUG Backend] Entering getQuestionsBySubject ---\x1b[0m');
    try {
        const { idOrSlug } = req.params;  // Param generic
        console.log(`\x1b[35m[DEBUG Backend] 1. Received param: '${idOrSlug}' (length: ${idOrSlug.length})\x1b[0m`);

        let subjectId: Types.ObjectId;

        // Detect nếu là ObjectId (24 hex chars)
        if (Types.ObjectId.isValid(idOrSlug)) {
            console.log(`\x1b[35m[DEBUG Backend] 2a. Valid ObjectId – query direct.\x1b[0m`);
            subjectId = new Types.ObjectId(idOrSlug);
        } else {
            // Giả sử là slug – find subject
            console.log(`\x1b[35m[DEBUG Backend] 2b. Assuming slug – finding subject.\x1b[0m`);
            const subject = await Subject.findOne({ slug: idOrSlug });
            if (!subject) {
                console.log(`\x1b[35m[DEBUG Backend] 3. Subject NOT FOUND by slug '${idOrSlug}'. Returning empty.\x1b[0m`);
                return res.json({ success: true, data: [], message: 'No subject found' });
            }
            subjectId = subject._id;
            console.log(`\x1b[35m[DEBUG Backend] 3. Subject FOUND by slug: '${subject.name}', ID: '${subjectId}'\x1b[0m`);
        }

        // Query questions
        console.log(`\x1b[35m[DEBUG Backend] 4. Querying questions for subjectId: '${subjectId}'\x1b[0m`);
        const questions = await Question.find({ subjectId })
            .populate('subjectId', 'name slug');  // Populate để frontend dùng nếu cần
        console.log(`\x1b[35m[DEBUG Backend] 5. Found ${questions.length} questions.\x1b[0m`);

        res.json({ success: true, data: questions });
        console.log(`\x1b[35m--- [DEBUG Backend] Exiting ---\x1b[0m\n`);
    } catch (error) {
        console.error("\x1b[35m[DEBUG Backend] Error:\x1b[0m", error);
        res.status(500).json({ success: false, message: "Lỗi tải câu hỏi" });
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