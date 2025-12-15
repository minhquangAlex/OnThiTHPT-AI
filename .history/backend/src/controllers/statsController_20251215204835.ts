import { Request, Response } from 'express';
import { Attempt } from '../models/Attempt';
import { Subject } from '../models/Subject';

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
    const attempts = await Attempt.find({}).lean();
    const subjects = await Subject.find({}).lean();

    const subjectMapById = new Map(subjects.map(s => [s._id.toString(), s]));
    const subjectMapBySlug = new Map(subjects.map(s => [s.slug, s]));

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

        // --- SỬA ĐOẠN NÀY ---
        // Lấy trực tiếp điểm số (vì attempt.score giờ đã là thang 10 chuẩn)
        // Nếu điểm cũ bị lỗi > 10, ta chặn trần ở 10 để không làm hỏng thống kê
        let score = Number(attempt.score) || 0;
        if (score > 10) score = 10; // Fallback an toàn cho data rác cũ

        statsBySubjectId[subjectKey].totalScore += score;
        statsBySubjectId[subjectKey].count++;
        // --------------------
      }
    }

    const finalStats = Object.entries(statsBySubjectId).map(([subjectId, data]) => ({
      subjectId: data.slug,
      subjectName: data.name,
      averageScore: data.count > 0 ? data.totalScore / data.count : 0,
    }));

    res.json(finalStats);
  } catch (error) {
    console.error('Error fetching subject stats:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê môn học' });
  }
};

export const getQuestionStats = async (req: Request, res: Response) => {
  try {
    const stats = await Attempt.aggregate([
      { $unwind: '$answers' },
      {
        $group: {
          _id: '$answers.questionId',
          totalAttempts: { $sum: 1 },
          correctAttempts: { $sum: { $cond: ['$answers.isCorrect', 1, 0] } },
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
      { $unwind: '$question' },
      {
        $lookup: {
          from: 'subjects',
          localField: 'question.subjectId',
          foreignField: '_id',
          as: 'subject',
        },
      },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          questionId: '$_id',
          questionText: '$question.questionText',
          subjectId: '$subject.slug',
          questionCreatedAt: { $toDate: '$question._id' },
          totalAttempts: 1,
          correctAttempts: 1,
          correctPercentage: {
            $cond: [{ $eq: ['$totalAttempts', 0] }, 0, { $divide: ['$correctAttempts', '$totalAttempts'] }],
          },
        },
      },
      { $sort: { subjectId: 1, questionCreatedAt: 1 } },
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching question stats:', error);
    res.status(500).json({ message: 'Lỗi khi lấy thống kê câu hỏi' });
  }
};