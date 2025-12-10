import { Request, Response } from 'express';
import { Attempt } from '../models/Attempt';
import { Subject } from '../models/Subject';
import { Question } from '../models/Question'; // Import Question model

// --- HÀM TÍNH ĐIỂM (LOGIC QUAN TRỌNG) ---
const calculateScore = async (answers: any[]) => {
    let totalScore = 0;
    
    // Lấy danh sách ID câu hỏi từ bài làm
    const questionIds = answers.map(a => a.questionId);
    
    // Tìm tất cả câu hỏi trong DB để lấy đáp án đúng
    const dbQuestions = await Question.find({ _id: { $in: questionIds } });
    
    // Tạo map để tra cứu nhanh: { "questionId": QuestionDoc }
    const questionMap = new Map(dbQuestions.map(q => [q._id.toString(), q]));

    for (const ans of answers) {
        const question = questionMap.get(ans.questionId.toString());
        if (!question) continue;

        let isCorrect = false;

        // 1. TRẮC NGHIỆM (0.25đ)
        if (question.type === 'multiple_choice' || !question.type) {
            if (ans.selectedAnswer === question.correctAnswer) {
                totalScore += 0.25;
                isCorrect = true;
            }
        } 
        
        // 2. TRẢ LỜI NGẮN (0.5đ) - CHUẨN HÓA DỮ LIỆU
        else if (question.type === 'short_answer') {
            // Chuyển về string, cắt khoảng trắng, đổi dấu phẩy thành chấm
            const userAnswer = String(ans.selectedAnswer).trim().replace(',', '.');
            const correctAnswer = String(question.shortAnswerCorrect).trim().replace(',', '.');
            
            // So sánh số học nếu là số, hoặc so sánh chuỗi
            const isNumberEqual = !isNaN(Number(userAnswer)) && !isNaN(Number(correctAnswer)) && Number(userAnswer) === Number(correctAnswer);
            
            if (userAnswer.toLowerCase() === correctAnswer.toLowerCase() || isNumberEqual) {
                totalScore += 0.5;
                isCorrect = true;
            }
        }

        // 3. ĐÚNG / SAI (Điểm lũy tiến: 0.1 -> 0.25 -> 0.5 -> 1.0)
        else if (question.type === 'true_false') {
            let userTF = {};
            try { userTF = JSON.parse(ans.selectedAnswer); } catch {}
            
            let correctCount = 0;
            question.trueFalseOptions?.forEach((opt: any) => {
                // So sánh true/false
                if (userTF[opt.id] === opt.isCorrect) {
                    correctCount++;
                }
            });

            // Quy tắc cộng điểm
            if (correctCount === 1) totalScore += 0.1;
            if (correctCount === 2) totalScore += 0.25;
            if (correctCount === 3) totalScore += 0.5;
            if (correctCount === 4) {
                totalScore += 1.0;
                isCorrect = true; // Chỉ coi là đúng hoàn toàn nếu đúng cả 4 ý
            }
        }

        // Cập nhật trạng thái đúng/sai vào answer để lưu DB (dùng cho Frontend hiển thị xanh/đỏ)
        ans.isCorrect = isCorrect; 
    }

    return { totalScore, updatedAnswers: answers };
};


export const createAttempt = async (req: Request, res: Response) => {
  try {
    const { userId, subjectId, total, answers } = req.body; // Bỏ score từ frontend gửi lên
    
    // --- TÍNH ĐIỂM TẠI SERVER (BẢO MẬT HƠN) ---
    const { totalScore, updatedAnswers } = await calculateScore(answers);
    
    // ... (Phần tìm Subject giữ nguyên)
    let subject = null;
    try {
      if (subjectId.match(/^[0-9a-fA-F]{24}$/)) subject = await Subject.findById(subjectId);
    } catch (e) { subject = null; }
    if (!subject) subject = await Subject.findOne({ slug: subjectId });
    if (!subject) return res.status(404).json({ message: 'Môn học không tồn tại' });

    // Tạo attempt với điểm số đã tính
    const attempt = await Attempt.create({ 
        userId, 
        subjectId: subject._id, 
        score: totalScore, // Dùng điểm server tính
        total, 
        answers: updatedAnswers 
    });
    
    res.status(201).json(attempt);
  } catch (error) {
    console.error('Error creating attempt:', error);
    res.status(500).json({ message: 'Lỗi khi lưu lượt làm bài' });
  }
};

// ... (Giữ nguyên các hàm getAllAttempts, getAttemptById, deleteAttempt, getMyAttempts, deleteAllAttempts)
// Lưu ý: Không cần sửa các hàm GET/DELETE, chỉ cần sửa logic createAttempt để tính điểm đúng.
export const getAllAttempts = async (req: Request, res: Response) => {
    // ... (Giữ nguyên code cũ) ...
    // Để tiết kiệm không gian, tôi không paste lại đoạn code cũ không thay đổi.
    // Bạn hãy giữ nguyên phần get/delete như file gốc.
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