import { Request, Response } from 'express';
import { Attempt } from '../models/Attempt';
import { User } from '../models/User';
import { Question } from '../models/Question';
import { Subject } from '../models/Subject';

// Create an attempt record. This endpoint is intentionally public so the
// frontend quiz flow can POST attempts after a user finishes. If you
// prefer to require authentication, add `protect` middleware on the route.
export const createAttempt = async (req: Request, res: Response) => {
  try {
    const { userId, subjectId, score, total, answers } = req.body;
    console.log('--- [DEBUG] Backend - createAttempt - answers from req.body:', answers);

    // Find the subject by its slug (which is what subjectId is from the frontend)
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
    // Fetch all attempts and all subjects
    const attempts = await Attempt.find().sort({ createdAt: -1 }).populate('userId', 'name').lean();
    const subjects = await Subject.find({}).lean();

    // Create maps for efficient lookup by both ObjectId and slug
    const subjectMapById = new Map(subjects.map(s => [s._id.toString(), s]));
    const subjectMapBySlug = new Map(subjects.map(s => [s.slug, s]));

    // Manually populate subject information for each attempt
    const populatedAttempts = attempts.map(attempt => {
      let subjectDoc = null;
      // Check if subjectId is a valid ObjectId string or an ObjectId itself
      if (attempt.subjectId) {
          if (subjectMapById.has(attempt.subjectId.toString())) {
              subjectDoc = subjectMapById.get(attempt.subjectId.toString());
          } else {
              // Fallback to treating it as a slug
              subjectDoc = subjectMapBySlug.get(attempt.subjectId.toString());
          }
      }

      return {
        ...attempt,
        subjectId: subjectDoc, // Replace subjectId with the full subject document
      };
    });

    res.json(populatedAttempts);
  } catch (error) {
    console.error('Error fetching attempts:', error);
    res.status(500).json({ message: 'Lỗi khi lấy danh sách lượt làm bài' });
  }
};

// Get a single attempt by ID (for admin)
export const getAttemptById = async (req: Request, res: Response) => {
  try {
    const attempt = await Attempt.findById(req.params.id)
      .populate('userId', 'name')
      .populate({
        path: 'answers',
        populate: {
          path: 'questionId',
          model: 'Question'
        }
      })
      .lean(); // Use .lean() for a plain JS object

    if (!attempt) {
      return res.status(404).json({ message: 'Không tìm thấy lượt làm bài với ID đã cung cấp' });
    }

    // Manual population for subjectId to handle old (slug) and new (ObjectId) data
    let subjectDoc = null;
    if (attempt.subjectId) {
      // Attempt to find subject by ObjectId first, then by slug as a fallback
      subjectDoc = await Subject.findById(attempt.subjectId).lean() || await Subject.findOne({ slug: attempt.subjectId.toString() }).lean();
    }

    // @ts-ignore - Check authorization after finding the attempt
    if (req.user.role !== 'admin' && attempt.userId?._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền truy cập vào lượt làm bài này' });
    }

    // Replace subjectId with the populated document
        const finalAttempt = { ...attempt, subjectId: subjectDoc };
        console.log('--- [DEBUG] Backend - getAttemptById - finalAttempt:', finalAttempt);
        res.json(finalAttempt);
  } catch (error) {
    console.error('Error fetching attempt by ID:', error);
    res.status(500).json({ message: 'Lỗi khi lấy chi tiết lượt làm bài' });
  }
};

// @desc    Delete an attempt
// @route   DELETE /api/attempts/:id
// @access  Admin
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
    
    // @desc    Delete all attempts
    // @route   DELETE /api/attempts/all
    // @access  Admin
    export const deleteAllAttempts = async (req: Request, res: Response) => {
      try {
        await Attempt.deleteMany({});
        res.json({ message: 'Tất cả các lượt làm bài đã được xóa' });
      } catch (error) {
        console.error('Error deleting all attempts:', error);
        res.status(500).json({ message: 'Lỗi khi xóa tất cả các lượt làm bài' });
      }
    };