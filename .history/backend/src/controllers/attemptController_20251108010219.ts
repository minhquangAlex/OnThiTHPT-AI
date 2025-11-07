import { Request, Response } from 'express';
import { Attempt } from '../models/Attempt';
import { User } from '../models/User';
import { Question } from '../models/Question';
import { Subject } from '../models/Subject';
import { Types } from 'mongoose';  // Thêm cho ObjectId validate

// @desc    Create attempt (private, calc score)
// @route   POST /api/attempts
// @access  Private
export const createAttempt = async (req: Request, res: Response) => {  // req có req.user từ protect
  console.log('\x1b[35m--- [DEBUG Backend] createAttempt - body:\x1b[0m', req.body);
  try {
    const { subjectId, answers } = req.body;  // answers: [{questionId, selectedAnswer}]
    const userId = req.user._id;  // Từ token

    if (!Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ message: 'Invalid subject ID' });
    }

    // Validate subject tồn tại
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Môn học không tồn tại' });
    }

    // Calc score/isCorrect bằng query questions
    let score = 0;
    const total = answers.length;
    const processedAnswers = await Promise.all(answers.map(async (ans: any) => {
      const question = await Question.findById(ans.questionId);
      const isCorrect = question ? ans.selectedAnswer === question.correctAnswer : false;
      if (isCorrect) score++;
      return {
        questionId: ans.questionId,
        selectedAnswer: ans.selectedAnswer,
        isCorrect,
      };
    }));

    const attempt = await Attempt.create({
      userId,
      subjectId: new Types.ObjectId(subjectId),
      score,
      total,
      answers: processedAnswers,
    });

    console.log(`\x1b[35m[DEBUG Backend] Attempt saved: ID ${attempt._id}, score ${score}/${total} for user ${userId}\x1b[0m`);
    res.status(201).json({ success: true, data: attempt });  // Wrap cho consistent
  } catch (error) {
    console.error('\x1b[35m[DEBUG Backend] createAttempt error:\x1b[0m', error);
    res.status(500).json({ message: 'Lỗi khi lưu lượt làm bài' });
  }
};

// getAllAttempts: Simplify populate (giả sử schema Attempt ref subjectId)
export const getAllAttempts = async (req: Request, res: Response) => {
  try {
    const attempts = await Attempt.find()
      .populate('userId', 'name')
      .populate('subjectId', 'name slug')  // Direct populate nếu ref đúng
      .sort({ createdAt: -1 });
    console.log(`\x1b[35m[DEBUG Backend] getAllAttempts: ${attempts.length} records\x1b[0m`);
    res.json({ success: true, data: attempts });
  } catch (error) {
    console.error('Error fetching attempts:', error);
    res.status(500).json({ message: 'Lỗi tải lượt làm bài' });
  }
};

// getAttemptById: Simplify
export const getAttemptById = async (req: Request, res: Response) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('userId', 'name')
      .populate('subjectId', 'name slug')
      .populate('answers.questionId', 'questionText correctAnswer');  // Populate question details
    if (!attempt) {
      return res.status(404).json({ message: 'Không tìm thấy lượt làm bài' });
    }

    // Auth check (admin or owner)
    if (req.user.role !== 'admin' && attempt.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }

    console.log(`\x1b[35m[DEBUG Backend] getAttemptById: ${attempt._id}\x1b[0m`);
    res.json({ success: true, data: attempt });
  } catch (error) {
    console.error('Error fetching attempt by ID:', error);
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết lượt làm bài' });
  }
};

// deleteAttempt và deleteAllAttempts giữ nguyên
export const deleteAttempt = async (req: Request, res: Response) => {
  try {
    const attempt = await Attempt.findById(req.params.id);
    if (attempt) {
      await attempt.deleteOne();
      res.json({ message: 'Lượt làm bài đã được xóa' });
    } else {
      res.status(404).json({ message: 'Không tìm thấy lượt làm bài' });
    }
  } catch (error) {
    console.error('Error deleting attempt:', error);
    res.status(500).json({ message: 'Lỗi khi xóa lượt làm bài' });
  }
};

export const deleteAllAttempts = async (req: Request, res: Response) => {
  try {
    await Attempt.deleteMany({});
    res.json({ message: 'Tất cả các lượt làm bài đã được xóa' });
  } catch (error) {
    console.error('Error deleting all attempts:', error);
    res.status(500).json({ message: 'Lỗi khi xóa tất cả các lượt làm bài' });
  }
};