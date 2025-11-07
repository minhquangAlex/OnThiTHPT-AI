import { Request, Response } from 'express';
import { Question } from '../models/Question';
import { Types } from 'mongoose';  // Thêm để validate ObjectId
import { Subject } from '../models/Subject';

// @desc    Fetch questions by subject
// @route   GET /api/questions/:subjectSlug
// @access  Public (can be protected later)
export const getQuestionsBySubject = async (req: Request, res: Response) => {
    console.log('\n--- [DEBUG] Entering getQuestionsBySubject ---');
    try {
        const { subjectSlug } = req.params;
        console.log(`[DEBUG] 1. Received subjectSlug: '${subjectSlug}'`);

        // Find the subject by its slug to get its _id
        console.log(`[DEBUG] 2. Searching for subject with slug: '${subjectSlug}'`);
        const subject = await Subject.findOne({ slug: subjectSlug });

        // If no subject is found, return an empty array
        if (!subject) {
            console.log('[DEBUG] 3. Subject NOT FOUND. Returning empty array.');
            console.log('--- [DEBUG] Exiting getQuestionsBySubject ---\n');
            return res.json([]);
        }

        console.log(`[DEBUG] 3. Subject FOUND. Name: '${subject.name}', _id: '${subject._id}'`);

        // Find questions using the found subject's _id
        console.log(`[DEBUG] 4. Searching for questions with subjectId: '${subject._id}'`);
        const questions = await Question.find({ subjectId: subject._id });
        
        console.log(`[DEBUG] 5. Found ${questions.length} questions.`);
        if (questions.length === 0) {
            console.log('[DEBUG] 6. No questions found for this subject. This might indicate a data seeding issue or a mismatch in subjectId.');
        }

        res.json(questions);
        console.log('--- [DEBUG] Exiting getQuestionsBySubject ---\n');
    } catch (error) {
        console.error("Error in getQuestionsBySubject:", error);
        res.status(500).json({ message: "Lỗi máy chủ khi tải câu hỏi" });
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