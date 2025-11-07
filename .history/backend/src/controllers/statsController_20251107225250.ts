import { Request, Response } from 'express';
import { Attempt } from '../models/Attempt';
import { Subject } from '../models/Subject'; // Import Subject model
import { PipelineStage } from 'mongoose';import mongoose from 'mongoose';

// Return statistics. Currently we compute today's attempts by counting
// Attempt documents with createdAt between start and end of today.
export const getStats = async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const todayAttempts = await Attempt.countDocuments({ createdAt: { $gte: start, $lt: end } });

    res.json({ todayAttempts });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Lỗi khi lấy số liệu thống kê' });
  }
};

// Get average score for each subject
export const getSubjectStats = async (req: Request, res: Response) => {
  try {
    // 1. Fetch all necessary data
    const attempts = await Attempt.find({}).lean();
    const subjects = await Subject.find({}).lean();

    // 2. Create lookup maps for subjects
    const subjectMapById = new Map(subjects.map(s => [s._id.toString(), s]));
    const subjectMapBySlug = new Map(subjects.map(s => [s.slug, s]));

    // 3. Process stats in JavaScript
    const statsBySubjectId: { [key: string]: { totalScore: number; count: number; name: string; slug: string } } = {};

    for (const attempt of attempts) {
      if (!attempt.subjectId) continue;

      let subjectDoc = null;
      if (subjectMapById.has(attempt.subjectId.toString())) {
        subjectDoc = subjectMapById.get(attempt.subjectId.toString());
      } else if (subjectMapBySlug.has(attempt.subjectId.toString())) {
        subjectDoc = subjectMapBySlug.get(attempt.subjectId.toString());
      }

      if (subjectDoc) {
        const subjectKey = subjectDoc._id.toString();
        if (!statsBySubjectId[subjectKey]) {
          statsBySubjectId[subjectKey] = { totalScore: 0, count: 0, name: subjectDoc.name, slug: subjectDoc.slug };
        }

        const score = attempt.score ?? 0;
        const total = attempt.total ?? 0;
        const scaledScore = total > 0 ? (score / total) * 10 : 0;
        statsBySubjectId[subjectKey].totalScore += scaledScore;
        statsBySubjectId[subjectKey].count++;
      }
    }

    // 4. Format the final result
    const finalStats = Object.entries(statsBySubjectId).map(([subjectId, data]) => ({
      subjectId: data.slug, // Use slug for consistency in the frontend
      subjectName: data.name,
      averageScore: data.count > 0 ? data.totalScore / data.count : 0,
    }));

    res.json(finalStats);
  } catch (error) {
    console.error('Error fetching subject stats:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê môn học' });
  }
};

// Get statistics for each question (sửa để hỗ trợ per subject)
export const getQuestionStats = async (req: Request, res: Response) => {
  try {
    const { subjectId } = req.params;  // Optional: slug hoặc _id của subject
    let matchStage = [{ $unwind: '$answers' }];
    if (subjectId) {
      const subject = await Subject.findOne({ $or: [{ slug: subjectId }, { _id: subjectId }] });  // Tìm bằng slug hoặc _id
      if (!subject) {
        return res.json({ message: 'Không có dữ liệu thống kê cho môn học này.', data: [] });
      }
      matchStage.push({ $match: { subjectId: subject._id } });  // Filter attempts by subject ObjectId
    }

    const stats = await Attempt.aggregate([
      ...matchStage,
      {
        $group: {
          _id: '$answers.questionId',
          totalAttempts: { $sum: 1 },
          correctAttempts: { $sum: { $cond: [{ $eq: ['$answers.isCorrect', true] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'questions',
          localField: '_id',
          foreignField: '_id',
          as: 'question',
        },
      },
      { $unwind: { path: '$question', preserveNullAndEmptyArrays: true } },
      {
        $match: { 'question._id': { $exists: true } }  // Chỉ giữ nếu lookup success
      },
      {
        $project: {
          _id: 0,
          questionId: '$_id',
          questionText: '$question.questionText',
          subjectId: '$question.subjectId',
          totalAttempts: 1,
          correctAttempts: 1,
          correctPercentage: {
            $cond: [{ $eq: ['$totalAttempts', 0] }, 0, { $multiply: [{ $divide: ['$correctAttempts', '$totalAttempts'] }, 100] }],  // % thay vì fraction
          },
        },
      },
      { $sort: { correctPercentage: 1 } },
    ]);

    if (stats.length === 0) {
      return res.json({ message: 'Không có dữ liệu thống kê cho môn học này.', data: [] });
    }
    res.json(stats);
  } catch (error) {
    console.error('Error fetching question stats:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê câu hỏi' });
  }
};