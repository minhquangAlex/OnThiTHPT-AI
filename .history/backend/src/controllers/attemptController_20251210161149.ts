import { Request, Response } from 'express';
import { Attempt } from '../models/Attempt';
import { Subject } from '../models/Subject';
import { Question } from '../models/Question';

// --- HÀM TÍNH ĐIỂM (LOGIC QUAN TRỌNG) ---
const calculateScore = async (answers: any[]) => {
    let totalScore = 0;
    
    // Lấy danh sách ID câu hỏi từ bài làm
    const questionIds = answers.map(a => a.questionId);
    
    // Tìm tất cả câu hỏi trong DB để lấy đáp án đúng
    const dbQuestions = await Question.find({ _id: { $in: questionIds } });
    
    // SỬA LỖI 1: Thêm (q: any) để TypeScript không báo lỗi 'unknown'
    const questionMap = new Map(dbQuestions.map((q: any) => [q._id.toString(), q]));

    for (const ans of answers) {
        const question = questionMap.get(ans.questionId.toString());
        if (!question) continue;

        let isCorrect = false;

        // 1. TRẮC NGHIỆM (0.25đ)
        // Dùng (question as any).type để tránh lỗi nếu interface chưa cập nhật kịp
        const qType = (question as any).type || 'multiple_choice';

        if (qType === 'multiple_choice') {
            if (ans.selectedAnswer === (question as any).correctAnswer) {
                totalScore += 0.25;
                isCorrect = true;
            }
        } 
        
        // 2. TRẢ LỜI NGẮN (0.5đ)
        else if (qType === 'short_answer') {
            const userAnswer = String(ans.selectedAnswer).trim().replace(',', '.');
            const correctAnswer = String((question as any).shortAnswerCorrect).trim().replace(',', '.');
            
            const isNumberEqual = !isNaN(Number(userAnswer)) && !isNaN(Number(correctAnswer)) && Number(userAnswer) === Number(correctAnswer);
            
            if (userAnswer.toLowerCase() === correctAnswer.toLowerCase() || isNumberEqual) {
                totalScore += 0.5;
                isCorrect = true;
            }
        }

        // 3. ĐÚNG / SAI (Điểm lũy tiến)
        else if (qType === 'true_false') {
            // SỬA LỖI 2: Khai báo là any để tránh lỗi index type
            let userTF: any = {}; 
            try { userTF = JSON.parse(ans.selectedAnswer); } catch {}
            
            let correctCount = 0;
            const tfOptions = (question as any).trueFalseOptions || [];

            tfOptions.forEach((opt: any) => {
                // So sánh true/false
                if (userTF[opt.id] === opt.isCorrect) {
                    correctCount++;
                }
            });

            if (correctCount === 1) totalScore += 0.1;
            if (correctCount === 2) totalScore += 0.25;
            if (correctCount === 3) totalScore += 0.5;
            if (correctCount === 4) {
                totalScore += 1.0;
                isCorrect = true;
            }
        }

        ans.isCorrect = isCorrect; 
    }

    return { totalScore, updatedAnswers: answers };
};


export const createAttempt = async (req: Request, res: Response) => {
  try {
    const { userId, subjectId, total, answers } = req.body;
    
    // Tính điểm tại server
    const { totalScore, updatedAnswers } = await calculateScore(answers);
    
    let subject = null;
    try {
      if (subjectId.match(/^[0-9a-fA-F]{24}$/)) subject = await Subject.findById(subjectId);
    } catch (e) { subject = null; }
    if (!subject) subject = await Subject.findOne({ slug: subjectId });
    if (!subject) return res.status(404).json({ message: 'Môn học không tồn tại' });

    const attempt = await Attempt.create({ 
        userId, 
        subjectId: subject._id, 
        score: totalScore, 
        total, 
        answers: updatedAnswers 
    });
    
    res.status(201).json(attempt);
  } catch (error) {
    console.error('Error creating attempt:', error);
    res.status(500).json({ message: 'Lỗi khi lưu lượt làm bài' });
  }
};

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
        res.status(500).json({ message: 'Lỗi' });
      }
};

export const getAttemptById = async (req: Request, res: Response) => {
    try {
        const attempt = await Attempt.findById(req.params.id)
          .populate('userId', 'name')
          .populate('answers.questionId')
          .lean();
        if (!attempt) return res.status(404).json({ message: 'Not found' });
    
        let subjectDoc = null;
        if (attempt.subjectId) {
          subjectDoc = await Subject.findById(attempt.subjectId).lean() || await Subject.findOne({ slug: attempt.subjectId.toString() }).lean();
        }
        // @ts-ignore
        if (req.user.role !== 'admin' && attempt.userId?._id.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'Forbidden' });
        }
        res.json({ ...attempt, subjectId: subjectDoc });
      } catch (error) {
        res.status(500).json({ message: 'Error' });
      }
};

export const deleteAttempt = async (req: Request, res: Response) => {
    try {
        const attempt = await Attempt.findById(req.params.id);
        if (attempt) {
          await attempt.deleteOne();
          res.json({ message: 'Deleted' });
        } else {
          res.status(404).json({ message: 'Not found' });
        }
      } catch (error) {
        res.status(500).json({ message: 'Error' });
      }
};

export const getMyAttempts = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || (req as any).userId;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const attempts = await Attempt.find({ userId }).sort({ createdAt: -1 }).populate('userId', 'name').lean();
        const subjects = await Subject.find({}).lean();
        const subjectMapById = new Map(subjects.map(s => [s._id.toString(), s]));

        const formattedAttempts = attempts.map((attempt: any) => {
          const subject = subjectMapById.get(attempt.subjectId?.toString() || '');
          return {
            ...attempt,
            subjectId: subject?._id || attempt.subjectId,
            subjectName: subject?.name || 'Unknown',
          };
        });
        res.json(formattedAttempts);
      } catch (error) {
        res.status(500).json({ message: 'Error' });
      }
};

export const deleteAllAttempts = async (req: Request, res: Response) => {
    try {
        await Attempt.deleteMany({});
        res.json({ message: 'All deleted' });
      } catch (error) {
        res.status(500).json({ message: 'Error' });
      }
};