// backend/src/controllers/attemptController.ts

import { Request, Response } from 'express';
import { Attempt } from '../models/Attempt';
import { Subject } from '../models/Subject';
import { Question } from '../models/Question';

// --- HÀM TÍNH ĐIỂM ĐÃ CẬP NHẬT (QUY ĐỔI THANG 10) ---
const calculateScore = async (answers: any[]) => {
    let userRawScore = 0;      // Điểm thô người dùng đạt được
    let maxPossibleScore = 0;  // Điểm tối đa có thể đạt được của đề này
    
    // Lấy danh sách câu hỏi từ DB
    const questionIds = answers.map(a => a.questionId);
    const dbQuestions = await Question.find({ _id: { $in: questionIds } });
    
    // Map để tra cứu
    const questionMap = new Map(dbQuestions.map((q: any) => [q._id.toString(), q]));

    for (const ans of answers) {
        const question: any = questionMap.get(ans.questionId.toString());
        if (!question) continue;

        let isCorrect = false; // Trạng thái hiển thị (Đúng/Sai) của câu hỏi
        const qType = question.type || 'multiple_choice';

        // --- 1. TRẮC NGHIỆM ---
        if (qType === 'multiple_choice') {
            maxPossibleScore += 0.25; // Cộng điểm tối đa vào tổng
            if (ans.selectedAnswer === question.correctAnswer) {
                userRawScore += 0.25;
                isCorrect = true;
            }
        } 
        
        // --- 2. TRẢ LỜI NGẮN ---
        else if (qType === 'short_answer') {
            maxPossibleScore += 0.5; // Cộng điểm tối đa vào tổng
            
            const userAnswer = String(ans.selectedAnswer).trim().replace(',', '.');
            const correctAnswer = String(question.shortAnswerCorrect).trim().replace(',', '.');
            
            // So sánh
            const isNumberEqual = !isNaN(Number(userAnswer)) && !isNaN(Number(correctAnswer)) && Number(userAnswer) === Number(correctAnswer);
            
            if (userAnswer.toLowerCase() === correctAnswer.toLowerCase() || isNumberEqual) {
                userRawScore += 0.5;
                isCorrect = true;
            }
        }

        // --- 3. ĐÚNG / SAI ---
        else if (qType === 'true_false') {
            maxPossibleScore += 1.0; // Cộng điểm tối đa vào tổng (nếu đúng cả 4 ý)
            
            let userTF: any = {}; 
            try { userTF = JSON.parse(ans.selectedAnswer); } catch {}
            
            let correctCount = 0;
            const tfOptions = question.trueFalseOptions || [];

            tfOptions.forEach((opt: any) => {
                if (userTF[opt.id] === opt.isCorrect) {
                    correctCount++;
                }
            });

            // Cộng điểm theo thang lũy tiến
            if (correctCount === 1) userRawScore += 0.1;
            if (correctCount === 2) userRawScore += 0.25;
            if (correctCount === 3) userRawScore += 0.5;
            if (correctCount === 4) {
                userRawScore += 1.0;
                isCorrect = true; // Chỉ tính là Đúng (xanh) nếu đúng cả 4 ý
            }
        }

        ans.isCorrect = isCorrect; 
    }

    // --- QUY ĐỔI VỀ THANG 10 ---
    // Nếu đề thi rỗng hoặc lỗi, mặc định là 0
    let finalScore = 0;
    if (maxPossibleScore > 0) {
        finalScore = (userRawScore / maxPossibleScore) * 10;
    }

    // Làm tròn 2 chữ số thập phân (VD: 9.75)
    finalScore = Math.round(finalScore * 100) / 100;

    return { totalScore: finalScore, updatedAnswers: answers };
};

// ... (Giữ nguyên các hàm createAttempt và phần còn lại)
export const createAttempt = async (req: Request, res: Response) => {
  try {
    const { userId, subjectId, total, answers } = req.body;
    
    // Gọi hàm tính điểm mới
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
        score: totalScore, // Lưu điểm đã quy đổi (Thang 10)
        total, 
        answers: updatedAnswers 
    });
    
    res.status(201).json(attempt);
  } catch (error) {
    console.error('Error creating attempt:', error);
    res.status(500).json({ message: 'Lỗi khi lưu lượt làm bài' });
  }
};

// ... (Giữ nguyên các hàm export khác: getAllAttempts, getAttemptById...)