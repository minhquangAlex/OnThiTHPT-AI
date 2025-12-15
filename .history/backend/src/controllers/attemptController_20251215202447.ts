import { Request, Response } from 'express';
import { Attempt } from '../models/Attempt';
import { Subject } from '../models/Subject';
import { Question } from '../models/Question';

// --- HÀM TÍNH ĐIỂM & QUY ĐỔI THANG 10 ---
const calculateScore = async (answers: any[]) => {
    let userRawScore = 0;      // Điểm thô người dùng đạt được
    let maxPossibleScore = 0;  // Điểm thô tối đa của đề thi này
    
    // Lấy danh sách ID câu hỏi từ bài làm
    const questionIds = answers.map(a => a.questionId);
    
    // Tìm tất cả câu hỏi trong DB để lấy đáp án đúng
    const dbQuestions = await Question.find({ _id: { $in: questionIds } });
    
    // Tạo map để tra cứu nhanh: { "questionId": QuestionDoc }
    // Sử dụng (q: any) để tránh lỗi TypeScript 'unknown'
    const questionMap = new Map(dbQuestions.map((q: any) => [q._id.toString(), q]));

    for (const ans of answers) {
        const question: any = questionMap.get(ans.questionId.toString());
        if (!question) continue;

        let isCorrect = false; // Trạng thái hiển thị màu sắc (Xanh/Đỏ) cho câu hỏi này
        const qType = question.type || 'multiple_choice';

        // 1. TRẮC NGHIỆM (Phần I)
        if (qType === 'multiple_choice') {
            maxPossibleScore += 0.25; // Cộng max điểm
            
            if (ans.selectedAnswer === question.correctAnswer) {
                userRawScore += 0.25;
                isCorrect = true;
            }
        } 
        
        // 2. TRẢ LỜI NGẮN (Phần III)
        else if (qType === 'short_answer') {
            maxPossibleScore += 0.5; // Cộng max điểm
            
            // Chuẩn hóa: về chuỗi, cắt khoảng trắng, đổi dấu phẩy thành chấm
            const userAnswer = String(ans.selectedAnswer || '').trim().replace(',', '.');
            const correctAnswer = String(question.shortAnswerCorrect || '').trim().replace(',', '.');
            
            // So sánh số học hoặc chuỗi
            const isNumberEqual = !isNaN(Number(userAnswer)) && !isNaN(Number(correctAnswer)) && Number(userAnswer) === Number(correctAnswer);
            
            if (userAnswer.toLowerCase() === correctAnswer.toLowerCase() || isNumberEqual) {
                userRawScore += 0.5;
                isCorrect = true;
            }
        }

        // 3. ĐÚNG / SAI (Phần II)
        else if (qType === 'true_false') {
            maxPossibleScore += 1.0; // Cộng max điểm (nếu đúng cả 4 ý)
            
            let userTF: any = {}; 
            try { userTF = JSON.parse(ans.selectedAnswer); } catch {}
            
            let correctCount = 0;
            const tfOptions = question.trueFalseOptions || [];

            // Đếm số ý đúng
            tfOptions.forEach((opt: any) => {
                if (userTF[opt.id] === opt.isCorrect) {
                    correctCount++;
                }
            });

            // Cộng điểm theo thang lũy tiến của Bộ GD
            if (correctCount === 1) userRawScore += 0.1;
            if (correctCount === 2) userRawScore += 0.25;
            if (correctCount === 3) userRawScore += 0.5;
            if (correctCount === 4) {
                userRawScore += 1.0;
                isCorrect = true; // Chỉ coi là "Đúng hoàn toàn" nếu đúng cả 4 ý
            }
        }

        // Cập nhật trạng thái vào câu trả lời để lưu DB
        ans.isCorrect = isCorrect; 
    }

    // --- QUY ĐỔI VỀ THANG 10 ---
    let finalScore = 0;
    if (maxPossibleScore > 0) {
        finalScore = (userRawScore / maxPossibleScore) * 10;
    }

    // Làm tròn 2 chữ số thập phân (VD: 9.75)
    finalScore = Math.round(finalScore * 100) / 100;

    return { totalScore: finalScore, updatedAnswers: answers };
};


// @desc    Create a new attempt
// @route   POST /api/attempts
export const createAttempt = async (req: Request, res: Response) => {
  try {
    const { userId, subjectId, total, answers } = req.body;
    
    // Tính toán điểm số tại Server
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
        score: totalScore, // Điểm thang 10
        total, 
        answers: updatedAnswers 
    });
    
    res.status(201).json(attempt);
  } catch (error) {
    console.error('Error creating attempt:', error);
    res.status(500).json({ message: 'Lỗi khi lưu lượt làm bài' });
  }
};

// @desc    Get all attempts (Admin)
// @route   GET /api/attempts
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
        res.status(500).json({ message: 'Lỗi khi lấy danh sách' });
      }
};

// @desc    Get attempt by ID
// @route   GET /api/attempts/:id
export const getAttemptById = async (req: Request, res: Response) => {
    try {
        const attempt = await Attempt.findById(req.params.id)
          .populate('userId', 'name')
          .populate('answers.questionId')
          .lean();
        if (!attempt) return res.status(404).json({ message: 'Không tìm thấy lượt làm bài' });
    
        let subjectDoc = null;
        if (attempt.subjectId) {
          subjectDoc = await Subject.findById(attempt.subjectId).lean() || await Subject.findOne({ slug: attempt.subjectId.toString() }).lean();
        }
        
        // Check quyền truy cập (Admin hoặc chính chủ)
        // @ts-ignore
        if (req.user && req.user.role !== 'admin' && attempt.userId?._id.toString() !== req.user._id.toString()) {
          return res.status(403).json({ message: 'Bạn không có quyền xem bài làm này' });
        }

        res.json({ ...attempt, subjectId: subjectDoc });
      } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy chi tiết' });
      }
};

// @desc    Delete attempt
// @route   DELETE /api/attempts/:id
export const deleteAttempt = async (req: Request, res: Response) => {
    try {
        const attempt = await Attempt.findById(req.params.id);
        if (attempt) {
          await attempt.deleteOne();
          res.json({ message: 'Đã xóa lượt làm bài' });
        } else {
          res.status(404).json({ message: 'Không tìm thấy' });
        }
      } catch (error) {
        res.status(500).json({ message: 'Lỗi khi xóa' });
      }
};

// @desc    Get current user attempts
// @route   GET /api/attempts/my-attempts
export const getMyAttempts = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id || (req as any).userId;
        if (!userId) return res.status(401).json({ message: 'Chưa đăng nhập' });

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
        res.status(500).json({ message: 'Lỗi khi lấy lịch sử' });
      }
};

// @desc    Delete all attempts (Admin)
// @route   DELETE /api/attempts/all
export const deleteAllAttempts = async (req: Request, res: Response) => {
    try {
        await Attempt.deleteMany({});
        res.json({ message: 'Đã xóa tất cả dữ liệu làm bài' });
      } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
      }
};

// @desc    Recalculate scores for ALL attempts (Dùng để sửa lỗi điểm cũ)
// @route   POST /api/attempts/recalculate
// @access  Admin
export const recalculateAllScores = async (req: Request, res: Response) => {
    try {
        console.log('🔄 Bắt đầu tính lại điểm...');
        // Lấy tất cả lượt làm bài, populate answers.questionId để lấy thông tin câu hỏi (đáp án đúng)
        // Lưu ý: Cần populate sâu để lấy thông tin câu hỏi từ bảng Question
        // Tuy nhiên logic calculateScore đã tự query Question, nên chỉ cần lấy attempts là đủ.
        const attempts = await Attempt.find({});
        let updatedCount = 0;

        for (const attempt of attempts) {
            if (!attempt.answers || attempt.answers.length === 0) continue;

            // Gọi hàm tính điểm chuẩn (đã viết ở đầu file)
            const { totalScore } = await calculateScore(attempt.answers);
            
            // Chỉ update nếu điểm thay đổi (ví dụ từ 7.79 -> 5.45)
            // Hoặc nếu điểm hiện tại > 10 (lỗi cũ)
            if (attempt.score !== totalScore) {
                console.log(`Update ID ${attempt._id}: ${attempt.score} -> ${totalScore}`);
                attempt.score = totalScore;
                await attempt.save();
                updatedCount++;
            }
        }

        res.json({ 
            message: 'Đã tính lại điểm thành công!', 
            updated: updatedCount, 
            total: attempts.length 
        });
    } catch (error: any) {
        console.error('Lỗi khi tính lại điểm:', error);
        res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
};