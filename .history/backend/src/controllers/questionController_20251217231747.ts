import { Request, Response } from 'express';
import { Types } from 'mongoose'; // Thêm để validate ObjectId
import { Question } from '../models/Question';
import { Subject } from '../models/Subject';

// @desc    Fetch questions by subject
// @route   GET /api/questions/:subjectSlug
// @access  Public (can be protected later)
export const getQuestionsBySubject = async (req: Request, res: Response) => {
    console.log('\n\x1b[35m--- [DEBUG Backend] Entering getQuestionsBySubject ---\x1b[0m');
    try {
        const { subjectId } = req.params;  // may be slug or ObjectId
        console.log(`\x1b[35m[DEBUG Backend] 1. Received subject identifier: '${subjectId}'\x1b[0m`);

        // Try to resolve subject by ObjectId first, then fallback to slug
        let subject = null;
        if (subjectId && Types.ObjectId.isValid(subjectId)) {
            subject = await Subject.findById(new Types.ObjectId(subjectId));
        }
        if (!subject) {
            subject = await Subject.findOne({ slug: subjectId });
        }

        if (!subject) {
            console.log(`\x1b[35m[DEBUG Backend] 2. Subject NOT FOUND for identifier '${subjectId}'. Returning empty.\x1b[0m`);
            return res.json({ success: true, data: [], message: 'Subject not found' });
        }
        console.log(`\x1b[35m[DEBUG Backend] 2. Subject FOUND: '${subject.name}' (id: ${subject._id})\x1b[0m`);

        // Query questions
        console.log(`\x1b[35m[DEBUG Backend] 3. Querying questions for subjectId: '${subjectId}'\x1b[0m`);
        const questions = await Question.find({ subjectId: subject._id })
            .populate('subjectId', 'name')
            .sort({ _id: 1 }); // Sort by ObjectId (insertion time) ascending so order is stable (oldest first)
        console.log(`\x1b[35m[DEBUG Backend] 4. Found ${questions.length} questions: ${questions.map(q => q.questionText.substring(0, 20) + '...').join(', ')}\x1b[0m`);  // Log preview

        // Fix response: Luôn trả data là mảng, ngay cả empty
        res.json({ success: true, data: questions || [] });
        console.log(`\x1b[35m--- [DEBUG Backend] Exiting ---\x1b[0m\n`);
    } catch (error) {
        console.error("\x1b[35m[DEBUG Backend] Error:\x1b[0m", error);
        res.status(500).json({ success: false, data: [], message: "Lỗi tải câu hỏi" });
    }
};

// @desc    Create a new question
// @route   POST /api/questions
// @access  Admin
export const createQuestion = async (req: Request, res: Response) => {
    try {
        // Lấy tất cả các trường dữ liệu mới từ req.body
        const { 
            subjectId, 
            type, // <--- Mới
            questionText, 
            imageUrl, 
            explanation,
            // Các field riêng biệt
            options, correctAnswer,       // Phần I
            trueFalseOptions,             // Phần II
            shortAnswerCorrect            // Phần III
        } = req.body;

        if (!Types.ObjectId.isValid(subjectId as string)) {
            return res.status(400).json({ message: 'Invalid subject ID' });
        }

        // Tạo câu hỏi mới
        const question = await Question.create({ 
            subjectId: new Types.ObjectId(subjectId as string), 
            type: type || 'multiple_choice',
            questionText, 
            imageUrl,
            explanation,
            options, 
            correctAnswer, 
            trueFalseOptions, 
            shortAnswerCorrect 
        });

        // Cập nhật số lượng câu hỏi cho môn học
        await Subject.findByIdAndUpdate(subjectId, { $inc: { questionCount: 1 } });

        res.status(201).json(question);
    } catch (error: any) {
        console.error("❌ Error creating question:", error);
        res.status(500).json({ message: 'Lỗi khi tạo câu hỏi', error: error.message });
    }
};

// @desc    Update an existing question
// @route   PUT /api/questions/:id
// @access  Admin
export const updateQuestion = async (req: Request, res: Response) => {
    try {
        const question = await Question.findById(req.params.id);
        if (!question) return res.status(404).json({ message: 'Không tìm thấy câu hỏi' });
        const { questionText, options, correctAnswer, explanation,imageUrl, trueFalseOptions, shortAnswerCorrect } = req.body;
        if (questionText) question.questionText = questionText;
        if (options) question.options = options;
        if (correctAnswer) question.correctAnswer = correctAnswer;
        if (explanation) question.explanation = explanation;
        if (imageUrl !== undefined) {question.imageUrl = imageUrl;}
        if (trueFalseOptions !== undefined) question.trueFalseOptions = trueFalseOptions;
        if (shortAnswerCorrect !== undefined) question.shortAnswerCorrect = shortAnswerCorrect;
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

// @desc    Batch upload questions
// @route   POST /api/questions/batch
// @access  Admin
export const batchUploadQuestions = async (req: Request, res: Response) => {
    try {
        const { questions } = req.body; // Expecting an array of questions

        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: 'Invalid or empty questions array' });
        }

        const createdQuestions = [];
        for (const questionData of questions) {
            const { subjectId, type, questionText, imageUrl, explanation, options, correctAnswer, trueFalseOptions, shortAnswerCorrect } = questionData;

            if (!Types.ObjectId.isValid(subjectId)) {
                return res.status(400).json({ message: `Invalid subject ID for question: ${questionText}` });
            }

            const question = await Question.create({
                subjectId: new Types.ObjectId(subjectId),
                type: type || 'multiple_choice',
                questionText,
                imageUrl,
                explanation,
                options,
                correctAnswer,
                trueFalseOptions,
                shortAnswerCorrect
            });

            createdQuestions.push(question);
        }

        res.status(201).json({ success: true, data: createdQuestions, message: 'Batch upload successful' });
    } catch (error) {
        console.error("[DEBUG Backend] Error in batch upload:", error);
        res.status(500).json({ success: false, message: 'Batch upload failed', error });
    }
};
// @desc    Delete multiple questions
// @route   POST /api/questions/batch-delete
// @access  Admin
export const deleteQuestionsBulk = async (req: Request, res: Response) => {
    try {
        const { ids } = req.body; // ids là mảng các string ['id1', 'id2']

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Danh sách ID không hợp lệ' });
        }

        // Thực hiện xóa
        const result = await Question.deleteMany({ 
            _id: { $in: ids.map((id: string) => new Types.ObjectId(id)) } 
        });

        // (Tùy chọn) Cần tính toán lại questionCount của các Subject liên quan
        // Nhưng để tối ưu hiệu năng, ta có thể bỏ qua hoặc chạy background job sau.

        res.json({ 
            message: `Đã xóa thành công ${result.deletedCount} câu hỏi`, 
            deletedCount: result.deletedCount 
        });

    } catch (error: any) {
        console.error("Batch delete error:", error);
        res.status(500).json({ message: 'Lỗi khi xóa danh sách câu hỏi', error: error.message });
    }
};
// @desc    Clone questions from other subjects to current subject
// @route   POST /api/questions/clone
// @access  Admin
export const cloneQuestions = async (req: Request, res: Response) => {
    try {
        const { targetSubjectId, sourceQuestionIds } = req.body;

        if (!targetSubjectId || !Array.isArray(sourceQuestionIds) || sourceQuestionIds.length === 0) {
            return res.status(400).json({ message: 'Dữ liệu không hợp lệ' });
        }

        // Tìm các câu hỏi gốc
        const questionsToClone = await Question.find({ _id: { $in: sourceQuestionIds } }).lean();

        if (questionsToClone.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy câu hỏi nguồn' });
        }

        // Chuẩn bị dữ liệu mới (đổi subjectId)
        // 👇 SỬA TẠI ĐÂY: Thêm (q: any) để tránh lỗi TypeScript
        const newQuestions = questionsToClone.map((q: any) => {
            // Lấy ra các trường hệ thống để loại bỏ, giữ lại nội dung (rest)
            const { _id, createdAt, updatedAt, __v, ...rest } = q; 
            
            return {
                ...rest,
                subjectId: new Types.ObjectId(targetSubjectId) // Gán sang môn mới
            };
        });

        // Insert hàng loạt
        await Question.insertMany(newQuestions);

        // Update count
        await Subject.findByIdAndUpdate(targetSubjectId, { $inc: { questionCount: newQuestions.length } });

        res.status(201).json({ message: `Đã sao chép thành công ${newQuestions.length} câu hỏi` });

    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi sao chép câu hỏi' });
    }
};