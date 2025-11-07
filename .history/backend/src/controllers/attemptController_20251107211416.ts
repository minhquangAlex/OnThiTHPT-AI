import { Request, Response } from 'express';
import { Attempt } from '../models/Attempt';
import { User } from '../models/User';
import { Question } from '../models/Question';
import { Subject } from '../models/Subject';

// Create an attempt record.
export const createAttempt = async (req: Request, res: Response) => {
  try {
    const { userId, subjectId, score, total, answers } = req.body;
    // console.log('--- [DEBUG] Backend - createAttempt - answers from req.body:', answers);

    const subject = await Subject.findOne({ slug: subjectId });
    if (!subject) {
      return res.status(404).json({ message: 'Môn học không tồn tại' });
    }

    const attempt = await Attempt.create({ userId, subjectId: subject._id, score, total, answers });
    res.status(201).json(attempt);
  } catch (error) {
    console.error('Error creating attempt:', error);
    res.status(500).json({ message: 'Lỗi khi lưu lượt làm bài' });
  }
};

// Get all attempts (for admin)
export const getAllAttempts = async (req: Request, res: Response) => {
  try {
    const attempts = await Attempt.find().sort({ createdAt: -1 }).populate('userId', 'name').lean();
    const subjects = await Subject.find({}).lean();

    const subjectMapById = new Map(subjects.map(s => [s._id.toString(), s]));
    const subjectMapBySlug = new Map(subjects.map(s => [s.slug, s]));

    const populatedAttempts = attempts.map(attempt => {
      let subjectDoc = null;
      if (attempt.subjectId) {
          if (subjectMapById.has(attempt.subjectId.toString())) {
              subjectDoc = subjectMapById.get(attempt.subjectId.toString());
          } else {
              subjectDoc = subjectMapBySlug.get(attempt.subjectId.toString());
          }
      }
      return { ...attempt, subjectId: subjectDoc };
    });

    res.json(populatedAttempts);
  } catch (error) {
    console.error('Error fetching attempts:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách lượt làm bài' });
  }
};

// Get a single attempt by ID (for admin & user view result)
export const getAttemptById = async (req: Request, res: Response) => {
  try {
    // SỬA LỖI 1: Populate kỹ hơn để đảm bảo lấy được toàn bộ thông tin câu hỏi
    const attempt = await Attempt.findById(req.params.id)
      .populate('userId', 'name')
      .populate({
        path: 'answers.questionId',
        model: 'Question',
        select: 'questionText options correctAnswer explanation' // Chỉ lấy các trường cần thiết
      })
      .lean();

    if (!attempt) {
      return res.status(404).json({ message: 'Không tìm thấy lượt làm bài' });
    }

    // Manual population for subjectId
    let subjectDoc = null;
    if (attempt.subjectId) {
      subjectDoc = await Subject.findById(attempt.subjectId).lean() || await Subject.findOne({ slug: attempt.subjectId.toString() }).lean();
    }

    // @ts-ignore
    if (req.user.role !== 'admin' && attempt.userId?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không được phép xem kết quả này' });
    }

    const finalAttempt = { ...attempt, subjectId: subjectDoc };
    // console.log('--- [DEBUG] Backend - getAttemptById - final:', JSON.stringify(finalAttempt, null, 2));
    res.json(finalAttempt);
  } catch (error) {
    console.error('Error fetching attempt by ID:', error);
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết lượt làm bài' });
  }
};

// Delete an attempt
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

// Delete all attempts
export const deleteAllAttempts = async (req: Request, res: Response) => {
  try {
    await Attempt.deleteMany({});
    res.json({ message: 'Tất cả các lượt làm bài đã được xóa' });
  } catch (error) {
    console.error('Error deleting all attempts:', error);
    res.status(500).json({ message: 'Lỗi khi xóa tất cả các lượt làm bài' });
  }
};